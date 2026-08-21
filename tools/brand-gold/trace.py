"""Build the Bime Gold logo and icon set from the approved reference render.

Reads brand/bime-gold/reference/bime-gold-type-10-compact.png (wordmark on white),
knocks the white background out to real alpha, trims the empty margin, traces the
shapes to vector, and assembles every lockup and icon from those outlines. Every PNG
is rendered from the SVG, so raster and vector can never drift apart.

Flat colour only -- the identity uses no gradients.

    tools/brand-gold/.venv/bin/python tools/brand-gold/trace.py

Needs potrace and rsvg-convert on PATH; ImageMagick for the .ico.
"""
import os
import re
import subprocess
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC = os.path.join(ROOT, "brand", "bime-gold", "reference", "bime-gold-type-10-compact.png")
OUT = os.path.join(ROOT, "brand", "bime-gold", "traced")
PNG = os.path.join(OUT, "png")
SVG = os.path.join(OUT, "svg")
TMP = os.path.join(OUT, ".tmp")

CHARCOAL = "#2B2B2B"
ON_DARK = "#F0F0F0"
GOLD = "#D4AF37"
NAVY = "#0F172A"
UPSCALE = 4             # supersample the mask before tracing


# ---------------------------------------------------------------- raster helpers
def box_blur(a, r):
    """Separable box blur over a float array, edge-clamped. a: (H,W) or (H,W,C)."""
    def blur1(x):
        pad = np.pad(x, ((r + 1, r), (0, 0), (0, 0)), mode="edge")
        c = np.cumsum(pad, axis=0)
        return (c[2 * r + 1:] - c[:-(2 * r + 1)]) / (2 * r + 1)
    sq = a[..., None] if a.ndim == 2 else a
    out = blur1(blur1(sq).transpose(1, 0, 2)).transpose(1, 0, 2)
    return out[..., 0] if a.ndim == 2 else out


def erode(mask, size):
    img = Image.fromarray((mask * 255).astype(np.uint8), "L")
    return np.asarray(img.filter(ImageFilter.MinFilter(size))) > 127


def dilate(mask, size):
    img = Image.fromarray((mask * 255).astype(np.uint8), "L")
    return np.asarray(img.filter(ImageFilter.MaxFilter(size))) > 127


def components(mask):
    """Label 4-connected components with an iterative flood fill (no scipy)."""
    h, w = mask.shape
    lab = np.zeros((h, w), np.int32)
    cur = 0
    for sy, sx in np.argwhere(mask):
        if lab[sy, sx]:
            continue
        cur += 1
        lab[sy, sx] = cur
        stack = [(sy, sx)]
        while stack:
            y, x = stack.pop()
            for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not lab[ny, nx]:
                    lab[ny, nx] = cur
                    stack.append((ny, nx))
    return lab, cur


def dematte(src):
    """White background -> alpha. Returns (alpha, ink_colour_field, gold_mask)."""
    rgb = np.asarray(Image.open(src).convert("RGB")).astype(np.float64)
    ink = (255.0 - rgb.min(axis=2)) > 8

    # Local ink colour: average the colours of deeply-interior pixels and spread them
    # outward, so the render's shading is followed instead of flattened to one guess.
    interior = erode(ink, 9)
    m = interior[..., None].astype(np.float64)
    den = box_blur(m, 24)
    ink_col = np.where(den > 1e-6, box_blur(rgb * m, 24) / np.maximum(den, 1e-6), rgb)

    # pixel = a*C + (1-a)*white  ->  least-squares a along the C->white line
    d_ink = 255.0 - ink_col
    alpha = ((255.0 - rgb) * d_ink).sum(axis=2) / np.maximum((d_ink * d_ink).sum(axis=2), 1e-6)
    alpha = np.clip(alpha, 0.0, 1.0)
    alpha[~dilate(ink, 5)] = 0.0
    alpha[alpha < 0.02] = 0.0

    # Gold vs charcoal, decided per connected glyph so antialiased rims never split.
    lab, n = components(alpha > 0.5)
    gold = np.zeros(alpha.shape, bool)
    for i in range(1, n + 1):
        sel = lab == i
        if sel.sum() >= 30 and (ink_col[sel].mean(axis=0)[0] - ink_col[sel].mean(axis=0)[2]) > 40:
            gold |= sel
    return alpha, ink_col, dilate(gold, 11) & (alpha > 0)


# ---------------------------------------------------------------- vector layer
class Layer:
    """One traced colour layer, plus its bounding box in trimmed-source pixels."""

    def __init__(self, mask, name):
        ys, xs = np.nonzero(mask)
        self.box = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
        h, w = mask.shape
        img = Image.fromarray((mask * 255).astype(np.uint8), "L").resize(
            (w * UPSCALE, h * UPSCALE), Image.LANCZOS
        )
        pbm = os.path.join(TMP, name + ".pbm")
        img.point(lambda v: 0 if v > 127 else 255).convert("1").save(pbm)
        out = os.path.join(TMP, name + ".svg")
        subprocess.run(["potrace", "-b", "svg", "-a", "1.0", "-O", "0.2", "-u", "10",
                        "--flat", pbm, "-o", out], check=True)
        body = open(out).read()
        # potrace works in the upscaled bitmap's pixel space -> bring it back to 1:1
        inner = re.search(r'<g transform="([^"]+)"', body).group(1)
        self.transform = f"scale({1.0 / UPSCALE:g}) {inner}"
        self.paths = re.findall(r'\bd="([^"]+)"', body)

    def draw(self, fill):
        body = "".join(f'<path fill="{fill}" fill-rule="evenodd" d="{d}"/>' for d in self.paths)
        return f'<g transform="{self.transform}">{body}</g>'


def union_box(*boxes):
    return (min(b[0] for b in boxes), min(b[1] for b in boxes),
            max(b[2] for b in boxes), max(b[3] for b in boxes))


def g(n):
    return f"{n:.2f}".rstrip("0").rstrip(".")


def place(body, box, cw, ch, scale=1.0, dy=0.0):
    """Centre `body` (whose content sits at `box`) on a cw x ch canvas."""
    x0, y0, x1, y1 = box
    dx = (cw - (x1 - x0) * scale) / 2 - x0 * scale
    dyy = (ch - (y1 - y0) * scale) / 2 - y0 * scale + dy
    return f'<g transform="translate({g(dx)} {g(dyy)}) scale({g(scale)})">{body}</g>'


def svg(w, h, body, label):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {g(w)} {g(h)}" '
            f'width="{g(w)}" height="{g(h)}" role="img" aria-label="{label}">{body}</svg>\n')


# ---------------------------------------------------------------- build
def main():
    for d in (PNG, SVG, TMP):
        os.makedirs(d, exist_ok=True)
    alpha, ink_col, gold = dematte(SRC)

    trim = np.zeros(alpha.shape + (4,), np.uint8)
    trim[..., 3] = (alpha * 255).round().astype(np.uint8)
    x0, y0, x1, y1 = Image.fromarray(trim, "RGBA").getbbox()
    A = (alpha > 0.5)[y0:y1, x0:x1]
    G = gold[y0:y1, x0:x1]
    W, H = x1 - x0, y1 - y0
    print(f"source {alpha.shape[1]}x{alpha.shape[0]} -> trimmed {W}x{H}")

    # The gold ink is two things: the tittle over the i, and the word "gold".
    # The tittle is the only gold component that sits above the x-height.
    lab, n = components(A & G)
    dot_mask = np.zeros(A.shape, bool)
    word_mask = np.zeros(A.shape, bool)
    for i in range(1, n + 1):
        sel = lab == i
        ys, xs = np.nonzero(sel)
        (dot_mask if ys.max() < H * 0.3 else word_mask)[sel] = True

    bime = Layer(A & ~G, "bime")       # b i m e
    dot = Layer(dot_mask, "dot")       # the gold tittle
    word = Layer(word_mask, "word")    # g o l d
    print(f"layers: bime {bime.box}  dot {dot.box}  word {word.box}")

    # 'b' plus the dotted i stem -- the monogram used for icons and the favicon.
    lab_d, nd = components(A & ~G)
    mono_mask = np.zeros(A.shape, bool)
    for i in range(1, nd + 1):
        sel = lab_d == i
        if np.nonzero(sel)[1].max() <= dot.box[2]:      # left of the tittle's right edge
            mono_mask |= sel
    mono = Layer(mono_mask, "mono")
    print(f"monogram box {mono.box}")

    files = {}

    # ---- horizontal wordmark ------------------------------------------------
    def lockup(dark=CHARCOAL, gold_fill=GOLD, pad=0):
        body = bime.draw(dark) + dot.draw(gold_fill) + word.draw(gold_fill)
        if pad:
            body = f'<g transform="translate({pad} {pad})">{body}</g>'
        return svg(W + 2 * pad, H + 2 * pad, body, "bime gold")

    clear = round(H * 0.22)
    files["logo.svg"] = lockup()
    files["logo-clearspace.svg"] = lockup(pad=clear)
    files["logo-on-dark.svg"] = lockup(dark=ON_DARK)
    files["logo-mono-dark.svg"] = lockup(dark=CHARCOAL, gold_fill=CHARCOAL)
    files["logo-mono-light.svg"] = lockup(dark="#FFFFFF", gold_fill="#FFFFFF")

    # ---- stacked lockup: "bime" over "gold" ---------------------------------
    line1 = union_box(bime.box, dot.box)
    gap = round(H * 0.10)
    sw = max(line1[2] - line1[0], word.box[2] - word.box[0])
    dx1 = (sw - (line1[2] - line1[0])) / 2 - line1[0]
    dx2 = (sw - (word.box[2] - word.box[0])) / 2 - word.box[0]
    dy2 = line1[3] - line1[1] + gap - word.box[1]
    sh = dy2 + word.box[3]

    def stacked(dark=CHARCOAL):
        return svg(sw, sh,
                   f'<g transform="translate({g(dx1)} {g(-line1[1])})">'
                   f"{bime.draw(dark)}{dot.draw(GOLD)}</g>"
                   f'<g transform="translate({g(dx2)} {g(dy2)})">{word.draw(GOLD)}</g>',
                   "bime gold")

    files["logo-stacked.svg"] = stacked()
    files["logo-stacked-on-dark.svg"] = stacked(dark=ON_DARK)

    # ---- monogram + icons ---------------------------------------------------
    mono_box = union_box(mono.box, dot.box)

    def monogram(dark):
        return mono.draw(dark) + dot.draw(GOLD)

    mw, mh = mono_box[2] - mono_box[0], mono_box[3] - mono_box[1]
    files["mark.svg"] = svg(mw, mh,
                            f'<g transform="translate({g(-mono_box[0])} {g(-mono_box[1])})">'
                            f"{monogram(CHARCOAL)}</g>", "Bime Gold mark")
    files["mark-on-dark.svg"] = svg(mw, mh,
                                    f'<g transform="translate({g(-mono_box[0])} {g(-mono_box[1])})">'
                                    f"{monogram(ON_DARK)}</g>", "Bime Gold mark")

    def tile(size, cover, radius=None, bg=NAVY):
        """Monogram on a brand field. `cover` is the fraction of the tile it fills."""
        scale = size * cover / mh
        rect = (f'<rect width="{size}" height="{size}" fill="{bg}"'
                + (f' rx="{g(radius)}"' if radius else "") + "/>")
        return svg(size, size, rect + place(monogram(ON_DARK), mono_box, size, size, scale),
                   "Bime Gold")

    files["icon-tile.svg"] = tile(512, 0.52, radius=96)
    files["icon-maskable.svg"] = tile(512, 0.40)          # 40% keeps it inside the safe zone
    files["icon-apple.svg"] = tile(180, 0.52)
    files["favicon.svg"] = tile(64, 0.62, radius=12)

    for name, body in files.items():
        open(os.path.join(SVG, name), "w").write(body)

    # ---- raster, all rendered from the vectors above ------------------------
    def png(src_svg, dst, **kw):
        args = sum((["-" + k, str(v)] for k, v in kw.items()), [])
        subprocess.run(["rsvg-convert", *args, os.path.join(SVG, src_svg),
                        "-o", os.path.join(PNG, dst)], check=True)

    for stem in ("logo", "logo-on-dark", "logo-stacked", "logo-clearspace"):
        for ph in (128, 256, 512, 1024):
            png(stem + ".svg", f"{stem}-{ph}.png", h=ph)
    for ph in (64, 128, 256):
        png("mark.svg", f"mark-{ph}.png", h=ph)
    png("icon-tile.svg", "icon-192.png", w=192, h=192)
    png("icon-tile.svg", "icon-512.png", w=512, h=512)
    png("icon-maskable.svg", "icon-maskable-512.png", w=512, h=512)
    png("icon-apple.svg", "apple-touch-icon-180.png", w=180, h=180)

    ico = []
    for s in (16, 32, 48):
        png("favicon.svg", f".ico-{s}.png", w=s, h=s)
        ico.append(os.path.join(PNG, f".ico-{s}.png"))
    subprocess.run(["magick", *ico, os.path.join(OUT, "favicon.ico")], check=True)
    for f in ico:
        os.remove(f)

    print("wrote", OUT)


if __name__ == "__main__":
    main()
