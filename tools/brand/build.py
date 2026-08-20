"""Regenerate every bime247 brand asset from the geometry defined here.

    python tools/brand/build.py

Everything downstream (PNG icons, favicon.ico) is produced by tools/brand/build.sh,
which calls this first. The wordmarks are Vazirmatn Bold outlined to paths, so the
finished SVGs carry no font dependency.
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(__file__))
from outline import outline

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "apps", "web", "public", "brand")
FONTS = os.path.join(
    ROOT, "node_modules", ".pnpm",
    "@fontsource-variable+vazirmatn@5.3.0", "node_modules",
    "@fontsource-variable", "vazirmatn", "files",
)

# ---------------------------------------------------------------- palette
BRAND = "#0b7c7c"   # firouzeh, light backgrounds
BRAND_DARK = "#3fd0d0"  # firouzeh, dark backgrounds
INK = "#ffffff"

# ---------------------------------------------------------------- the mark
# 64x64 grid. The ring is unbroken on purpose: 24/7 is a cycle with no start.
RING = 'cx="32" cy="32" r="24.5" fill="none" stroke-width="5.5"'
SHIELD = ("M32 15.6 46.4 20.8v10.7c0 8.1-6.1 14.2-14.4 16.9"
          "-8.3-2.7-14.4-8.8-14.4-16.9V20.8z")
# Solid counterpart for small sizes: filled disc, shield knocked out.
SOLID = ("M32 4a28 28 0 1 1 0 56 28 28 0 0 1 0-56z"
         "M32 13.4 15.7 19.3v12.1c0 9.2 6.9 16.1 16.3 19.2"
         "9.4-3.1 16.3-10 16.3-19.2V19.3z")


def mark(color="currentColor"):
    return (f'<circle {RING} stroke="{color}"/>'
            f'<path d="{SHIELD}" fill="{color}"/>')


def mark_solid(color="currentColor"):
    return f'<path fill-rule="evenodd" d="{SOLID}" fill="{color}"/>'


def svg(w, h, body, title="bime247", extra=""):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {g(w)} {g(h)}" '
            f'width="{g(w)}" height="{g(h)}" role="img" aria-label="{title}"{extra}>'
            f"{body}</svg>\n")


def g(v):
    return f"{v:g}"


def write(name, content):
    path = os.path.join(OUT, name)
    with open(path, "w") as fh:
        fh.write(content)
    return path


# ---------------------------------------------------------------- wordmarks
FA_WORD = outline(f"{FONTS}/vazirmatn-arabic-wght-normal.woff2", "بیمه", 700, 100.0, "rtl", "Arab", "fa")
FA_NUM = outline(f"{FONTS}/vazirmatn-arabic-wght-normal.woff2", "۲۴۷", 700, 100.0, "ltr", "Arab", "fa")
EN = outline(f"{FONTS}/vazirmatn-latin-wght-normal.woff2", "bime247", 700, 100.0, "ltr", "Latn", "en")

# Persian is one bidi run per script: the numerals shape LTR and sit to the left
# of the word, so they are placed at x=0 and the word after them.
FA_PATHS = f'<path d="{FA_NUM["path"]}"/><g transform="translate({g(FA_NUM["advance"])} 0)"><path d="{FA_WORD["path"]}"/></g>'
FA_BOX = (min(FA_NUM["bbox"][0], FA_NUM["advance"] + FA_WORD["bbox"][0]),
          min(FA_NUM["bbox"][1], FA_WORD["bbox"][1]),
          max(FA_NUM["bbox"][2], FA_NUM["advance"] + FA_WORD["bbox"][2]),
          max(FA_NUM["bbox"][3], FA_WORD["bbox"][3]))
EN_PATHS = f'<path d="{EN["path"]}"/>'
EN_BOX = tuple(EN["bbox"])

# Cap height per script: the Persian numerals set the cap, Latin the ascender.
FA_CAP = -FA_NUM["bbox"][1]
EN_CAP = -EN["bbox"][1]


def wordmark(paths, box, color="currentColor"):
    x0, y0, x1, y1 = box
    body = f'<g fill="{color}" transform="translate({g(-x0)} {g(-y0)})">{paths}</g>'
    return svg(round(x1 - x0, 2), round(y1 - y0, 2), body)


def lockup(paths, box, cap, rtl, color="currentColor", ratio=1.5, gap=0.30):
    """Mark beside the wordmark. Sized and centred against the wordmark's cap height,
    not its full bounds, so the two lockups carry an optically identical mark even
    though Persian hangs dots below the baseline and Latin does not.
    RTL puts the mark on the right, where an RTL reader starts."""
    x0, y0, x1, y1 = box
    wm_w = x1 - x0
    m = cap * ratio
    pad = m * gap
    total_w = m + pad + wm_w
    mark_top = -cap / 2 - m / 2                       # baseline-anchored
    top, bottom = min(y0, mark_top), max(y1, mark_top + m)
    mark_x = total_w - m if rtl else 0
    wm_x = 0 if rtl else m + pad
    body = (f'<g transform="translate({g(mark_x)} {g(mark_top - top)}) scale({g(m / 64)})">{mark(color)}</g>'
            f'<g fill="{color}" transform="translate({g(wm_x - x0)} {g(-top)})">{paths}</g>')
    return svg(round(total_w, 2), round(bottom - top, 2), body)


def stacked(paths, box, cap, color="currentColor", ratio=2.1, gap=0.26):
    x0, y0, x1, y1 = box
    wm_w, wm_h = x1 - x0, y1 - y0
    m = cap * ratio
    pad = m * gap
    total_w = max(m, wm_w)
    body = (f'<g transform="translate({g((total_w - m) / 2)} 0) scale({g(m / 64)})">{mark(color)}</g>'
            f'<g fill="{color}" transform="translate({g((total_w - wm_w) / 2 - x0)} {g(m + pad - y0)})">{paths}</g>')
    return svg(round(total_w, 2), round(m + pad + wm_h, 2), body)


os.makedirs(OUT, exist_ok=True)

write("mark.svg", svg(64, 64, mark()))
write("mark-solid.svg", svg(64, 64, mark_solid()))
write("wordmark-fa.svg", wordmark(FA_PATHS, FA_BOX))
write("wordmark-en.svg", wordmark(EN_PATHS, EN_BOX))
write("logo-fa.svg", lockup(FA_PATHS, FA_BOX, FA_CAP, rtl=True))
write("logo-en.svg", lockup(EN_PATHS, EN_BOX, EN_CAP, rtl=False))
write("logo-stacked-fa.svg", stacked(FA_PATHS, FA_BOX, FA_CAP))

# favicon.svg carries its own dark-mode swap; currentColor means nothing to a browser tab.
write("favicon.svg", svg(
    64, 64,
    f'<style>path{{fill:{BRAND}}}@media(prefers-color-scheme:dark){{path{{fill:{BRAND_DARK}}}}}</style>'
    f'<path fill-rule="evenodd" d="{SOLID}"/>'))

# Full-bleed tiles. iOS and Android crop these, so the mark sits inside a safe area.
def tile(size, inset, radius=None, bg=BRAND, fg=INK):
    s = (size - 2 * inset) / 64
    rect = (f'<rect width="{g(size)}" height="{g(size)}" fill="{bg}"'
            + (f' rx="{g(radius)}"' if radius else "") + "/>")
    return svg(size, size,
               rect + f'<g transform="translate({g(inset)} {g(inset)}) scale({g(s)})">{mark(fg)}</g>')

write("icon-tile.svg", tile(512, 96, radius=112))          # rounded app tile
write("icon-apple.svg", tile(180, 26))                      # iOS rounds it itself
write("icon-maskable.svg", tile(512, 128))                  # 80% safe zone for Android

print(json.dumps({
    "out": OUT,
    "fa_advance": FA_NUM["advance"] + FA_WORD["advance"],
    "fa_box": [round(v, 2) for v in FA_BOX],
    "en_box": [round(v, 2) for v in EN_BOX],
}, indent=2))
