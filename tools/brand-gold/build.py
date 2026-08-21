"""Generate Bime Gold typography brand assets (SVG sources).

    tools/brand-gold/.venv/bin/python tools/brand-gold/build.py

PNG / ICO exports: tools/brand-gold/build.sh
"""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "brand"))
from outline import outline

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "brand", "bime-gold")
SVG = os.path.join(OUT, "svg")
FONT = os.path.join(os.path.dirname(__file__), "fonts", "PlusJakartaSans.ttf")

# ---------------------------------------------------------------- palette
CHARCOAL = "#2B2B2B"
CHARCOAL_DARK_BG = "#F0F0F0"
GOLD = "#D4AF37"  # flat -- the identity uses no gradient
NAVY = "#0F172A"
NAVY_SOFT = "#1E293B"

WEIGHT = 700
SIZE = 100.0
TRACKING = -12.0  # compact lockup — matches type-10 reference
DOTLESS = "b\u0131me"
SOURCE_REF = "reference/bime-gold-type-10-compact.png"


def g(v):
    return f"{v:g}"


def svg(w, h, body, title="Bime Gold", extra=""):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {g(w)} {g(h)}" '
        f'width="{g(w)}" height="{g(h)}" role="img" aria-label="{title}"{extra}>\n'
        f"{body}\n</svg>\n"
    )




def wordmark_paths():
    bime = outline(FONT, DOTLESS, WEIGHT, SIZE)
    gold = outline(FONT, "gold", WEIGHT, SIZE)
    i_glyph = outline(FONT, "\u0131", WEIGHT, SIZE)
    b_glyph = outline(FONT, "b", WEIGHT, SIZE)

    # dotless i sits immediately after b in the shaped run
    dot_x = b_glyph["advance"] + (i_glyph["bbox"][0] + i_glyph["bbox"][2]) / 2
    # sit the gold tittle where the regular "i" dot would be
    dot_y = -64.4
    dot_r = 5.6

    gold_x = bime["advance"] + TRACKING
    xmin = min(bime["bbox"][0], gold_x + gold["bbox"][0])
    ymin = min(bime["bbox"][1], gold_x + gold["bbox"][1])
    xmax = gold_x + gold["bbox"][2]
    ymax = max(bime["bbox"][3], gold["bbox"][3])

    pad_x, pad_y = 8, 10
    return {
        "bime": bime,
        "gold": gold,
        "dot": (dot_x, dot_y, dot_r),
        "gold_x": gold_x,
        "box": (xmin - pad_x, ymin - pad_y, xmax + pad_x, ymax + pad_y),
    }


def shift(body, dx, dy):
    return f'<g transform="translate({g(dx)} {g(dy)})">{body}</g>'


def wordmark_group(wm, bime_fill=CHARCOAL, gold_fill=GOLD, dot_fill=GOLD):
    dot_x, dot_y, dot_r = wm["dot"]
    return (
        f'<path fill="{bime_fill}" d="{wm["bime"]["path"]}"/>'
        f'<circle cx="{g(dot_x)}" cy="{g(dot_y)}" r="{g(dot_r)}" fill="{dot_fill}"/>'
        f'<g transform="translate({g(wm["gold_x"])} 0)">'
        f'<path fill="{gold_fill}" d="{wm["gold"]["path"]}"/>'
        f"</g>"
    )


def write(name, content):
    path = os.path.join(SVG, name)
    with open(path, "w") as fh:
        fh.write(content)
    return path


def main():
    os.makedirs(SVG, exist_ok=True)
    wm = wordmark_paths()
    x0, y0, x1, y1 = wm["box"]
    w, h = x1 - x0, y1 - y0
    ox, oy = -x0, -y0

    # --- primary wordmark (light background)
    body = (
        shift(wordmark_group(wm), ox, oy)
    )
    write("logo-en.svg", svg(w, h, body, "bime gold"))
    write("wordmark-en.svg", svg(w, h, body, "bime gold"))

    # --- dark background lockup
    dark_body = (
        f'<rect width="{g(w)}" height="{g(h)}" fill="{NAVY}"/>'
        + shift(
            wordmark_group(wm, bime_fill=CHARCOAL_DARK_BG, gold_fill=GOLD, dot_fill=GOLD),
            ox, oy,
        )
    )
    write("logo-en-dark.svg", svg(w, h, dark_body, "bime gold"))

    # --- stacked: bime / gold
    bime_only = outline(FONT, DOTLESS, WEIGHT, SIZE)
    gold_only = outline(FONT, "gold", WEIGHT, SIZE)
    dot_x, dot_y, dot_r = wm["dot"]
    # Outlines run baseline-relative with y up-negative: bbox[1] is the ascender
    # (negative), bbox[3] the descender. Stack by baselines, not by bbox[1] twice.
    gap = 10
    pad = 10
    stack_w = max(bime_only["advance"], gold_only["advance"]) + 16
    bime_y = pad - bime_only["bbox"][1]
    gold_y = bime_y + bime_only["bbox"][3] + gap - gold_only["bbox"][1]
    stack_h = gold_y + gold_only["bbox"][3] + pad
    cx = (stack_w - bime_only["advance"]) / 2
    gcx = (stack_w - gold_only["advance"]) / 2
    stack_body = (
        f'<path fill="{CHARCOAL}" d="{bime_only["path"]}" transform="translate({g(cx)} {g(bime_y)})"/>'
        + f'<circle cx="{g(cx + dot_x)}" cy="{g(bime_y + dot_y)}" r="{g(dot_r)}" fill="{GOLD}"/>'
        + f'<path fill="{GOLD}" d="{gold_only["path"]}" transform="translate({g(gcx)} {g(gold_y)})"/>'
    )
    write("logo-stacked-en.svg", svg(stack_w, stack_h, stack_body, "bime gold"))

    # --- mark: gold dot (the i tittle)
    mark_size = 64
    mark_r = 14
    mark_body = (
        f'<circle cx="32" cy="32" r="{mark_r}" fill="{GOLD}"/>'
    )
    write("mark.svg", svg(mark_size, mark_size, mark_body, "Bime Gold mark"))

    # --- favicon (scheme-aware dot)
    fav_body = (
        "<style>"
        + f"circle{{fill:{GOLD}}}"
        + f"@media(prefers-color-scheme:dark){{rect{{fill:{NAVY}}}}} "
        + f"@media(prefers-color-scheme:light){{rect{{fill:#ffffff}}}}"
        + "</style>"
        + f'<rect width="64" height="64" fill="#ffffff"/>'
        + f'<circle cx="32" cy="32" r="14" fill="{GOLD}"/>'
    )
    write("favicon.svg", svg(64, 64, fav_body, "Bime Gold"))

    # --- square app tile
    tile_body = (
        f'<rect width="512" height="512" fill="{NAVY}"/>'
        + shift(wordmark_group(wm, bime_fill=CHARCOAL_DARK_BG), (512 - w) / 2 - x0, (512 - h) / 2 - y0)
    )
    write("icon-tile.svg", svg(512, 512, tile_body, "Bime Gold"))

    # --- maskable (68% safe zone)
    scaled = (
        f'<rect width="512" height="512" fill="{NAVY}"/>'
        + f'<g transform="translate({g((512 - w * 0.68) / 2 - x0 * 0.68)} {g((512 - h * 0.68) / 2 - y0 * 0.68)}) scale(0.68)">'
        + wordmark_group(wm, bime_fill=CHARCOAL_DARK_BG)
        + "</g>"
    )
    write("icon-maskable.svg", svg(512, 512, scaled, "Bime Gold"))

    # --- apple touch (wordmark on brand field)
    apple_body = (
        f'<rect width="180" height="180" fill="{NAVY}"/>'
        + f'<g transform="translate({g((180 - w * 0.38) / 2 - x0 * 0.38)} {g((180 - h * 0.38) / 2 - y0 * 0.38)}) scale(0.38)">'
        + wordmark_group(wm, bime_fill=CHARCOAL_DARK_BG)
        + "</g>"
    )
    write("icon-apple.svg", svg(180, 180, apple_body, "Bime Gold"))

    meta = {
        "name": "Bime Gold",
        "wordmark": "bimegold",
        "source_reference": SOURCE_REF,
        "variant": "type-10-compact",
        "typography": {
            "family": "Plus Jakarta Sans",
            "weight": WEIGHT,
            "case": "lowercase",
            "feature": "gold dot on letter i",
        },
        "colors": {
            "charcoal": CHARCOAL,
            "charcoal_on_dark": CHARCOAL_DARK_BG,
            "gold": GOLD,
            "navy": NAVY,
            "navy_soft": NAVY_SOFT,
        },
        "domain": "bimegold.com",
        "wordmark_fa": "\u0628\u06cc\u0645\u0647 \u06af\u0644\u062f",
        # The logo is the traced artwork; svg/ below is the editable font-based set.
        "files": {
            "primary": "traced/svg/logo.svg",
            "dark": "traced/svg/logo-on-dark.svg",
            "stacked": "traced/svg/logo-stacked.svg",
            "mark": "traced/svg/mark.svg",
            "favicon": "traced/svg/favicon.svg",
            "typeset_alternative": "svg/logo-en.svg",
        },
    }
    with open(os.path.join(OUT, "colors.json"), "w") as fh:
        json.dump(meta, fh, indent=2)

    print(json.dumps({"width": w, "height": h, "output": OUT}, indent=2))


if __name__ == "__main__":
    main()
