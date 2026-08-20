"""Outline a shaped text run to an SVG path. Used by build.py; not needed at runtime."""
import io, json, sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen
from fontTools.misc.transform import Transform
import uharfbuzz as hb


def outline(src, text, weight=700, size=100.0, direction="ltr", script="Latn", lang="en"):
    f = TTFont(src)
    f = instancer.instantiateVariableFont(f, {"wght": weight})
    f.flavor = None
    buf = io.BytesIO()
    f.save(buf)
    data = buf.getvalue()

    face = hb.Face(data)
    font = hb.Font(face)
    b = hb.Buffer()
    b.add_str(text)
    b.direction = direction
    b.script = script
    b.language = lang
    hb.shape(font, b, {"kern": True, "liga": True})

    glyphs = f.getGlyphSet()
    order = f.getGlyphOrder()
    scale = size / face.upem
    x = y = 0.0
    parts, bounds = [], BoundsPen(glyphs)
    for info, pos in zip(b.glyph_infos, b.glyph_positions):
        name = order[info.codepoint]
        t = Transform(scale, 0, 0, -scale,
                      (x + pos.x_offset) * scale, (y + pos.y_offset) * -scale)
        pen = SVGPathPen(glyphs, ntos=lambda v: f"{v:.2f}")
        glyphs[name].draw(TransformPen(pen, t))
        d = pen.getCommands()
        if d:
            parts.append(d)
        glyphs[name].draw(TransformPen(bounds, t))
        x += pos.x_advance
        y += pos.y_advance

    xmin, ymin, xmax, ymax = bounds.bounds
    return {
        "path": " ".join(parts),
        "advance": round(x * scale, 3),
        "bbox": [round(v, 3) for v in (xmin, ymin, xmax, ymax)],
    }


if __name__ == "__main__":
    print(json.dumps(outline(*sys.argv[1:2], sys.argv[2], 700, 100.0, *sys.argv[3:])))
