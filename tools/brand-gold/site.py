"""Build the public brand book at brand.bimegold.com.

    tools/brand-gold/.venv/bin/python tools/brand-gold/site.py

Writes apps/brand/dist/ — page, assets, fonts and the downloadable archive — entirely
from brand/bime-gold/, so the site cannot show a logo the package does not contain.
Persian is primary; English is a toggle. Copy lives in site_copy.py.
"""
import json
import os
import re
import shutil
import subprocess
import sys
import zipfile

sys.path.insert(0, os.path.dirname(__file__))
from site_copy import T

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
PKG = os.path.join(ROOT, "brand", "bime-gold")
TRACED = os.path.join(PKG, "traced")
DIST = os.path.join(ROOT, "apps", "brand", "dist")
JAKARTA = os.path.join(os.path.dirname(__file__), "fonts", "PlusJakartaSans.ttf")
VAZIR = os.path.join(
    ROOT, "node_modules", ".pnpm", "@fontsource-variable+vazirmatn@5.3.0",
    "node_modules", "@fontsource-variable", "vazirmatn", "files",
)

COLOURS = json.load(open(os.path.join(PKG, "colors.json")))["colors"]


def _md(text):
    """`x` -> <code>x</code>. The copy is written README-style; the page renders it."""
    return re.sub(r"`([^`]+)`", r"<code>\1</code>", text)


def fa(key):
    return _md(T[key][0])


def en(key):
    return _md(T[key][1])


def bi(key, tag="span", cls=""):
    """Both languages, one hidden by the <html> lang class."""
    c = (cls + " ").lstrip()
    return (f'<{tag} class="{c}l-fa">{fa(key)}</{tag}>'
            f'<{tag} class="{c}l-en">{en(key)}</{tag}>')


SYMBOLS = {          # id -> source file
    "lg": "logo.svg",
    "lg-mono": "logo-mono-dark.svg",
    "stk": "logo-stacked.svg",
    "mk": "mark.svg",
}
_VIEWBOX = {}


def build_symbols():
    """One copy of each outline, reused with <use>.

    Inlining the wordmark at every call site cost 300 KB of HTML. It also has to be
    recoloured: `bime` becomes currentColor so the lockup follows the surrounding text
    (and the page's light/dark scheme), while the tittle and `gold` stay brand gold.
    """
    out = []
    for sid, name in SYMBOLS.items():
        raw = open(os.path.join(TRACED, "svg", name)).read()
        _VIEWBOX[sid] = re.search(r'viewBox="([^"]+)"', raw).group(1)
        body = re.sub(r"^.*?<svg[^>]*>|</svg>\s*$", "", raw, flags=re.S)
        body = body.replace('fill="#2B2B2B"', 'fill="currentColor"')
        out.append(f'<symbol id="{sid}" viewBox="{_VIEWBOX[sid]}">{body}</symbol>')
    return ('<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" '
            'style="position:absolute;width:0;height:0;overflow:hidden">'
            + "".join(out) + "</svg>")


def use(sid="lg", cls="", style="", label=None):
    a = f' class="{cls}"' if cls else ""
    a += f' style="{style}"' if style else ""
    a += (f' role="img" aria-label="{label}"' if label else ' aria-hidden="true"')
    return f'<svg viewBox="{_VIEWBOX[sid]}"{a}><use href="#{sid}"/></svg>'


# ---------------------------------------------------------------- assets
def build_assets():
    shutil.rmtree(DIST, ignore_errors=True)
    a = os.path.join(DIST, "assets")
    os.makedirs(os.path.join(a, "brand"))
    os.makedirs(os.path.join(a, "fonts"))

    shutil.copytree(os.path.join(TRACED, "svg"), os.path.join(a, "brand", "svg"))
    shutil.copytree(os.path.join(TRACED, "png"), os.path.join(a, "brand", "png"))
    shutil.copy(os.path.join(TRACED, "favicon.ico"), os.path.join(a, "brand"))
    shutil.copy(os.path.join(PKG, "colors.json"), os.path.join(a, "brand"))
    shutil.copy(os.path.join(TRACED, "svg", "favicon.svg"), os.path.join(DIST, "favicon.svg"))
    shutil.copy(os.path.join(TRACED, "favicon.ico"), os.path.join(DIST, "favicon.ico"))
    shutil.copy(os.path.join(TRACED, "png", "apple-touch-icon-180.png"),
                os.path.join(DIST, "apple-touch-icon.png"))

    # Persian: the two ranges the page actually uses.
    for f in ("vazirmatn-arabic-wght-normal.woff2", "vazirmatn-latin-wght-normal.woff2"):
        shutil.copy(os.path.join(VAZIR, f), os.path.join(a, "fonts", f))

    # Latin: the wordmark's own typeface, subset to Latin + punctuation.
    subprocess.run([
        os.path.join(os.path.dirname(__file__), ".venv", "bin", "pyftsubset"), JAKARTA,
        "--flavor=woff2", "--unicodes=U+0000-00FF,U+2000-206F,U+2212,U+FEFF",
        "--layout-features=*", "--output-file=" + os.path.join(a, "fonts", "jakarta.woff2"),
    ], check=True)

    # One archive of the whole package, minus generated scratch.
    zpath = os.path.join(a, "bime-gold-brand.zip")
    with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
        for dirpath, dirnames, files in os.walk(PKG):
            dirnames[:] = [d for d in dirnames if d not in (".tmp", ".probe")]
            for f in files:
                if f == ".DS_Store":
                    continue
                full = os.path.join(dirpath, f)
                z.write(full, os.path.join("bime-gold", os.path.relpath(full, PKG)))
    return round(os.path.getsize(zpath) / 1024 / 1024, 1)


# ---------------------------------------------------------------- page
CSS = """
@font-face{font-family:Vazirmatn;src:url(/assets/fonts/vazirmatn-arabic-wght-normal.woff2) format('woff2-variations');font-weight:200 900;font-display:swap;unicode-range:U+0600-06FF,U+0750-077F,U+FB50-FDFF,U+FE70-FEFF,U+200C}
@font-face{font-family:Vazirmatn;src:url(/assets/fonts/vazirmatn-latin-wght-normal.woff2) format('woff2-variations');font-weight:200 900;font-display:swap;unicode-range:U+0000-00FF,U+2000-206F}
@font-face{font-family:Jakarta;src:url(/assets/fonts/jakarta.woff2) format('woff2-variations');font-weight:200 800;font-display:swap}

:root{
  --gold:#d4af37; --navy:#0f172a; --charcoal:#2b2b2b;
  --bg:#fbfaf8; --panel:#fff; --line:#e8e3d9; --text:#1c1a17; --soft:#5d574d;
  --accent:#8a6d1f; --accent-soft:#f7f0dc;
  --maxw:64rem; --r:14px;
}
@media (prefers-color-scheme:dark){:root{
  --bg:#14161a; --panel:#1b1e24; --line:#2c313a; --text:#eceef2; --soft:#a3aab6;
  --accent:#e5c158; --accent-soft:#2a2413;
}}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--text);
  font-family:Vazirmatn,system-ui,sans-serif;font-size:16px;line-height:1.85;
  font-feature-settings:'ss02'}
html.en body{font-family:Jakarta,system-ui,sans-serif;line-height:1.7;font-feature-settings:normal}
html.fa .l-en,html.en .l-fa{display:none}
.wrap{max-width:var(--maxw);margin-inline:auto;padding-inline:1.5rem}
a{color:var(--accent)}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.88em;
  background:var(--accent-soft);color:var(--accent);padding:.1em .4em;border-radius:5px}
/* Hex codes, tokens and ratios are Latin technical strings. Left in an RTL paragraph the
   bidi algorithm reorders them — #D4AF37 renders as D4AF37#, 4.9 : 1 as 1 : 4.9. */
code,.sw b,.sizes figcaption,.dl a small,td:last-child,.icons figcaption{
  direction:ltr;unicode-bidi:isolate}
html.fa td:last-child,html.fa .sw b{text-align:start}

/* header */
.top{position:sticky;top:0;z-index:10;background:color-mix(in srgb,var(--bg) 88%,transparent);
  backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
.top .wrap{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding-block:.85rem}
.top .logo{height:20px;width:auto;display:block;color:var(--text)}
.lang{font:inherit;font-size:.85rem;font-weight:700;cursor:pointer;color:var(--text);
  background:transparent;border:1px solid var(--line);border-radius:99px;padding:.3rem 1rem}
.lang:hover{border-color:var(--accent);color:var(--accent)}

/* hero */
.hero{padding-block:4.5rem 3rem;border-bottom:1px solid var(--line)}
.hero .logo{height:clamp(44px,9vw,86px);width:auto;color:var(--text);display:block}
.kicker{font-size:.8rem;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);
  font-weight:700;margin:0 0 1.2rem}
.hero p{max-width:42rem;font-size:1.08rem;color:var(--soft);margin:1.8rem 0 0}
.flat{display:inline-block;margin-top:1.2rem;font-weight:700;color:var(--text);
  border-inline-start:3px solid var(--gold);padding-inline-start:.8rem}
.meta{display:flex;flex-wrap:wrap;gap:.5rem 2.5rem;margin-top:2.2rem;
  font-size:.9rem;color:var(--soft)}
.meta b{display:block;font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;
  color:var(--soft);opacity:.75;font-weight:700}
.meta span{color:var(--text);font-weight:600}

section{padding-block:3.5rem;border-bottom:1px solid var(--line)}
h2{font-size:1.55rem;margin:0 0 .4rem;letter-spacing:-.01em}
.lede{color:var(--soft);max-width:44rem;margin:0 0 2rem}
h3{font-size:.95rem;margin:0 0 .25rem}
.note{font-size:.85rem;color:var(--soft);margin:0}

/* logo grid */
.grid{display:grid;gap:1rem;align-items:start;
  grid-template-columns:repeat(auto-fit,minmax(13rem,1fr))}
.card{border:1px solid var(--line);border-radius:var(--r);background:var(--panel);overflow:hidden}
.stage{display:grid;place-items:center;padding:2.4rem 1.5rem;background:#fff;min-height:9.5rem}
.stage.dark{background:var(--navy)}
.stage.mono{background:#f2efe9}
.stage svg{max-width:78%;max-height:5.5rem;height:auto;display:block}
.stage.light svg{color:var(--charcoal)}
.stage.dark svg{color:#f0f0f0}
.stage.mono svg{color:var(--charcoal)}
.cap{padding:.9rem 1.1rem;border-top:1px solid var(--line);
  display:flex;align-items:baseline;justify-content:space-between;gap:.5rem 1rem;flex-wrap:wrap}
.cap>div{min-width:0;flex:1 1 8rem}
.cap a{font-size:.8rem;font-weight:700;text-decoration:none;white-space:nowrap}
.cap a:hover{text-decoration:underline}

/* clear space */
.two{display:grid;gap:2.5rem;grid-template-columns:repeat(auto-fit,minmax(19rem,1fr))}
.cs{position:relative;background:var(--panel);border:1px solid var(--line);
  border-radius:var(--r);padding:2.6rem;display:grid;place-items:center}
.cs .band{position:absolute;inset:1.1rem;border:1px dashed var(--gold);border-radius:6px}
.cs svg{width:min(80%,20rem);height:auto;color:var(--charcoal);position:relative}
.sizes{display:flex;align-items:flex-end;gap:2rem;flex-wrap:wrap;margin-top:1rem;
  background:var(--panel);border:1px solid var(--line);border-radius:var(--r);padding:1.6rem}
.sizes figure{margin:0;text-align:center}
.sizes svg{width:auto;color:var(--charcoal);display:block;margin-inline:auto}
.sizes figcaption{font-size:.72rem;color:var(--soft);margin-top:.6rem;font-variant-numeric:tabular-nums}

/* colour */
.sw{display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr))}
.sw div{border:1px solid var(--line);border-radius:var(--r);overflow:hidden;background:var(--panel)}
.sw i{display:block;height:5.5rem}
.sw p{margin:0;padding:.8rem 1rem;font-size:.85rem;line-height:1.6}
.sw b{display:block;font-family:ui-monospace,Menlo,monospace;font-size:.95rem;
  letter-spacing:.02em;color:var(--text)}
.sw span{color:var(--soft);font-size:.8rem}
.warn{margin-top:2rem;border:1px solid var(--line);border-inline-start:3px solid var(--gold);
  border-radius:var(--r);background:var(--panel);padding:1.4rem 1.6rem}
.warn h3{font-size:1rem;margin-bottom:.5rem}
table{width:100%;border-collapse:collapse;margin-top:1rem;font-size:.87rem}
th,td{text-align:start;padding:.55rem .6rem;border-bottom:1px solid var(--line)}
th{font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:var(--soft)}
td:last-child{font-variant-numeric:tabular-nums;white-space:nowrap}

/* type */
.spec{background:var(--panel);border:1px solid var(--line);border-radius:var(--r);
  padding:1.6rem 1.8rem;margin-bottom:1rem}
.spec .sample{font-family:Jakarta,sans-serif;font-weight:700;font-size:2.4rem;
  line-height:1.15;letter-spacing:-.02em;margin-bottom:.6rem;direction:ltr;text-align:start}
.spec .sample.fa{font-family:Vazirmatn,sans-serif;direction:rtl}

/* icons */
.icons{display:flex;flex-wrap:wrap;gap:1.6rem;align-items:flex-end}
.icons figure{margin:0;text-align:center}
.icons img{display:block;border-radius:18%;margin-inline:auto}
.icons figcaption{font-size:.72rem;color:var(--soft);margin-top:.55rem}

/* the mark tiles */
.stage.dark svg{color:#f0f0f0}

/* misuse */
.dont{display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(12rem,1fr));margin-top:1.5rem}
.dont figure{margin:0;border:1px solid var(--line);border-radius:var(--r);overflow:hidden;
  background:var(--panel)}
.dont .stage{background:#fff;padding:1.8rem 1.2rem;min-height:7rem}
.dont svg{width:88%;color:var(--charcoal)}
.dont figcaption{padding:.7rem 1rem;border-top:1px solid var(--line);font-size:.82rem;
  color:var(--soft);display:flex;align-items:center;gap:.45rem}
.dont figcaption::before{content:"✕";color:#c0392b;font-weight:700;flex:none}
.x-recolour svg{color:#2f6fb0}
.x-recolour svg [fill="#D4AF37"]{fill:#c0392b}
.x-gradient{position:relative}
.x-gradient svg{color:#8a6f18}
.x-gradient::after{content:"";position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(115deg,#fbe9a7 5%,#d4af37 40%,#7a5f10 95%);
  mix-blend-mode:screen;opacity:.72}
.x-stretch svg{transform:scaleX(1.45)}
.x-rotate svg{transform:rotate(-9deg)}
.x-shadow svg{filter:drop-shadow(3px 4px 2px rgba(0,0,0,.45))}
.x-contrast{background:#8a7f5e !important}
.x-contrast svg{color:#6f6748}

/* downloads */
.dl{display:flex;flex-wrap:wrap;gap:.8rem;margin-top:1.5rem}
.dl a{display:inline-flex;align-items:center;gap:.5rem;text-decoration:none;font-weight:700;
  font-size:.9rem;border:1px solid var(--line);border-radius:99px;padding:.6rem 1.3rem;
  background:var(--panel);color:var(--text)}
.dl a:hover{border-color:var(--accent);color:var(--accent)}
.dl a small{font-weight:400;color:var(--soft)}
footer{padding-block:2.5rem 4rem;color:var(--soft);font-size:.87rem}
"""

JS = """
(function(){
  var h=document.documentElement;
  function set(l){h.className=l;h.lang=l==='fa'?'fa':'en';h.dir=l==='fa'?'rtl':'ltr';
    try{localStorage.setItem('bg-lang',l)}catch(e){}}
  var saved;try{saved=localStorage.getItem('bg-lang')}catch(e){}
  if(saved)set(saved);
  document.getElementById('lang').addEventListener('click',function(){
    set(h.className==='fa'?'en':'fa')});
})();
"""


def swatch(hexv, key):
    return (f'<div><i style="background:{hexv}"></i><p><b>{hexv}</b>'
            f'<span class="l-fa">{fa(key)}</span><span class="l-en">{en(key)}</span></p></div>')


def dont(cls, key):
    return (f'<figure><div class="stage {cls}">{use("lg")}</div>'
            f'{bi(key, "figcaption")}</figure>')


def build_page(zip_mb):
    # populates _VIEWBOX, which use() needs -- must run before any use() call
    symbols = build_symbols()

    logo_card = lambda stage, sid, tkey, dkey, dl: (
        f'<div class="card"><div class="stage {stage}">{use(sid)}</div>'
        f'<div class="cap"><div>{bi(tkey, "h3")}{bi(dkey, "p", "note")}</div>'
        f'<a href="/assets/brand/svg/{dl}" download>SVG ↓</a></div></div>')

    rows = [
        ("c_docs_light", "<code>#8A6D1F</code>", "4.9 : 1"),
        ("c_docs_dark", "<code>#E5C158</code>", "10.5 : 1"),
        ("c_app_solid", "<code>--color-brand-600</code>", "4.87 : 1"),
        ("c_app_text", "<code>--color-brand-600</code>", "4.55 : 1"),
    ]
    table = "".join(
        f"<tr><td>{bi(k)}</td><td>{tok}</td><td>{c}</td></tr>" for k, tok, c in rows)

    icons = "".join(
        f'<figure><img src="/assets/brand/png/{f}" width="{w}" height="{w}" alt="">'
        f"<figcaption>{lbl}</figcaption></figure>"
        for f, w, lbl in (
            ("icon-512.png", 96, "192 / 512 · PWA"),
            ("apple-touch-icon-180.png", 72, "180 · iOS"),
            ("icon-maskable-512.png", 72, "512 · maskable"),
        )
    ) + ('<figure><img src="/assets/brand/favicon.ico" width="48" height="48" alt="">'
         "<figcaption>16 / 32 / 48 · .ico</figcaption></figure>")

    sizes = "".join(
        f'<figure>{use("lg", style=f"height:{n}px")}<figcaption>{n} px</figcaption></figure>'
        for n in (32, 24, 16)
    )

    return f"""<!doctype html>
<html lang="fa" dir="rtl" class="fa">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{fa('site_title')} · {en('site_title')}</title>
<meta name="description" content="{fa('site_desc')}">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#fbfaf8" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#14161a" media="(prefers-color-scheme: dark)">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<style>{CSS}</style>
</head>
<body>
{symbols}

<header class="top"><div class="wrap">
  {use("lg", "logo", label="Bime Gold")}
  <button id="lang" class="lang">{bi('lang_switch')}</button>
</div></header>

<div class="wrap">

<div class="hero">
  <p class="kicker">{bi('hero_kicker')}</p>
  {use("lg", "logo", label="Bime Gold")}
  {bi('hero_line', 'p')}
  <div>{bi('hero_flat', 'span', 'flat')}</div>
  <div class="meta">
    <div>{bi('meta_name', 'b')}<span>Bime Gold</span></div>
    <div>{bi('meta_name_fa', 'b')}<span>بیمه گلد</span></div>
    <div>{bi('meta_domain', 'b')}<span>bimegold.com</span></div>
  </div>
</div>

<section>
  {bi('logo_h', 'h2')}{bi('logo_intro', 'p', 'lede')}
  <div class="grid">
    {logo_card("light", "lg", "logo_primary", "logo_primary_d", "logo.svg")}
    {logo_card("dark", "lg", "logo_dark", "logo_dark_d", "logo-on-dark.svg")}
    {logo_card("light", "stk", "logo_stacked", "logo_stacked_d", "logo-stacked.svg")}
    {logo_card("mono", "lg-mono", "logo_mono", "logo_mono_d", "logo-mono-dark.svg")}
  </div>
</section>

<section>
  {bi('space_h', 'h2')}
  <div class="two">
    <div>
      {bi('space_body', 'p', 'lede')}
      <div class="cs"><div class="band"></div>{use("lg")}</div>
    </div>
    <div>
      {bi('size_body', 'p', 'lede')}
      {bi('size_demo', 'p', 'note')}
      <div class="sizes">{sizes}</div>
    </div>
  </div>
</section>

<section>
  {bi('mark_h', 'h2')}{bi('mark_body', 'p', 'lede')}
  <div class="grid">
    <div class="card"><div class="stage light">{use("mk")}</div>
      <div class="cap"><div>{bi('mark_colour', 'p', 'note')}</div>
      <a href="/assets/brand/svg/mark.svg" download>SVG ↓</a></div></div>
    <div class="card"><div class="stage dark">{use("mk")}</div>
      <div class="cap"><div><h3>bi · on dark</h3></div>
      <a href="/assets/brand/svg/mark-on-dark.svg" download>SVG ↓</a></div></div>
  </div>
</section>

<section>
  {bi('colour_h', 'h2')}
  <div class="sw">
    {swatch(COLOURS['charcoal'], 'colour_charcoal')}
    {swatch(COLOURS['charcoal_on_dark'], 'colour_on_dark')}
    {swatch(COLOURS['gold'], 'colour_gold')}
    {swatch(COLOURS['navy'], 'colour_navy')}
  </div>
  <div class="warn">
    {bi('colour_warn_h', 'h3')}{bi('colour_warn', 'p', 'note')}
    <table><thead><tr><th>{bi('th_where')}</th><th>{bi('th_token')}</th>
      <th>{bi('th_contrast')}</th></tr></thead><tbody>{table}</tbody></table>
    <p class="note" style="margin-top:1rem">{bi('colour_ramp')}</p>
  </div>
</section>

<section>
  {bi('type_h', 'h2')}{bi('type_body', 'p', 'lede')}
  <div class="spec"><div class="sample">bimegold — Plus Jakarta Sans</div>
    {bi('type_jakarta', 'p', 'note')}</div>
  <div class="spec"><div class="sample fa">بیمه گلد — وزیرمتن</div>
    {bi('type_vazir', 'p', 'note')}</div>
</section>

<section>
  {bi('icons_h', 'h2')}{bi('icons_body', 'p', 'lede')}
  <div class="icons">{icons}</div>
</section>

<section>
  {bi('misuse_h', 'h2')}{bi('misuse_body', 'p', 'lede')}
  <div class="dont">
    {dont("x-recolour", "m_recolour")}
    {dont("x-gradient", "m_gradient")}
    {dont("x-stretch", "m_stretch")}
    {dont("x-rotate", "m_rotate")}
    {dont("x-shadow", "m_shadow")}
    {dont("x-contrast", "m_contrast")}
  </div>
</section>

<section style="border-bottom:none">
  {bi('dl_h', 'h2')}{bi('dl_body', 'p', 'lede')}
  <div class="dl">
    <a href="/assets/bime-gold-brand.zip" download>{bi('dl_all')} <small>ZIP · {zip_mb} MB</small></a>
    <a href="/assets/brand/colors.json" download>{bi('dl_tokens')} <small>JSON</small></a>
  </div>
</section>

<footer>{bi('footer', 'p')}</footer>
</div>
<script>{JS}</script>
</body></html>
"""


def main():
    zip_mb = build_assets()
    html = build_page(zip_mb)
    open(os.path.join(DIST, "index.html"), "w").write(html)
    print(f"brand book -> {DIST}  ({len(html) // 1024} KB html, {zip_mb} MB zip)")


if __name__ == "__main__":
    main()
