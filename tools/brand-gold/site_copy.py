"""Every string on the brand book site, in Persian and English.

Persian is primary. Keep the two in step: if you change one, change the other, or the
toggle starts telling two different stories.
"""

# fa, en
T = {
    "site_title": ("برندبوک بیمه گلد", "Bime Gold — Brand Book"),
    "site_desc": (
        "راهنمای استفاده از هویت بصری بیمه گلد: لوگو، رنگ، تایپوگرافی و آیکون‌ها.",
        "How to use the Bime Gold identity: logo, colour, typography and icons.",
    ),
    "lang_switch": ("English", "فارسی"),
    "hero_kicker": ("برندبوک", "Brand book"),
    "hero_line": (
        "هویت بیمه گلد تایپوگرافیک است. نماد جداگانه‌ای وجود ندارد — خودِ لوگوتایپ برند است و "
        "نقطه‌ی طلایی روی «i» تنها عنصر تزئینی آن.",
        "The Bime Gold identity is typographic. There is no separate symbol: the lockup is "
        "the brand, and the gold tittle over the i is its only ornament.",
    ),
    "hero_flat": (
        "همه‌جا رنگ تخت. بدون گرادیانت.",
        "Flat colour throughout. No gradients.",
    ),
    "meta_name": ("نام لاتین", "Name (Latin)"),
    "meta_name_fa": ("نام فارسی", "Name (Persian)"),
    "meta_domain": ("دامنه", "Domain"),

    # --- logo
    "logo_h": ("لوگو", "Logo"),
    "logo_intro": (
        "لوگوی اصلی، افقی است. هرجا رسانه اجازه می‌دهد فایل SVG را استفاده کنید؛ نسخه‌های "
        "PNG فقط برای جایی است که SVG ممکن نیست.",
        "The primary lockup is horizontal. Ship SVG wherever the medium allows; the PNGs "
        "are only for places that cannot take one.",
    ),
    "logo_primary": ("لوگوی اصلی", "Primary"),
    "logo_primary_d": ("زمینه‌های روشن", "Light backgrounds"),
    "logo_dark": ("روی زمینه تیره", "On dark"),
    "logo_dark_d": ("«bime» به ‎#F0F0F0 روشن می‌شود؛ طلایی تغییر نمی‌کند", "`bime` lightens to #F0F0F0; the gold is unchanged"),
    "logo_stacked": ("لوگوی عمودی", "Stacked"),
    "logo_stacked_d": ("قاب‌های مربع، آواتار، فضاهای بلند", "Square slots, avatars, tall spaces"),
    "logo_mono": ("تک‌رنگ", "One ink"),
    "logo_mono_d": ("چاپ تک‌رنگ، حکاکی، روی عکس", "Single-ink print, engraving, over a photo"),
    "download": ("دانلود", "Download"),

    # --- clear space / size
    "space_h": ("فضای آزاد و حداقل اندازه", "Clear space and minimum size"),
    "space_body": (
        "در هر چهار طرف لوگو دست‌کم به اندازه‌ی <strong>۲۲٪ ارتفاع</strong> آن فضای خالی "
        "بگذارید — تقریباً به اندازه‌ی نقطه‌ی طلایی. هیچ‌چیز وارد این نوار نمی‌شود.",
        "Keep free space equal to <strong>22 % of the lockup height</strong> on all four "
        "sides — roughly the height of the gold tittle. Nothing else enters that band.",
    ),
    "size_body": (
        "لوگوی افقی تا ارتفاع <strong>۱۶ پیکسل</strong> خوانا می‌ماند، چون در آن ارتفاع "
        "۵۳ پیکسل عرض می‌گیرد. در قاب مربع محدودیت عرض است نه ارتفاع: آنجا لوگوی عمودی تا "
        "حدود ۴۸ پیکسل دوام می‌آورد و پایین‌تر باید سراغ نشان رفت.",
        "The horizontal lockup stays legible down to <strong>16 px tall</strong>, because at "
        "that height it is still 53 px wide. A square slot constrains width instead: there "
        "the stacked lockup holds to about 48 px, and below that you need the mark.",
    ),
    "size_demo": ("همین لوگو در ارتفاع‌های ۳۲، ۲۴ و ۱۶ پیکسل:", "The same lockup at 32, 24 and 16 px tall:"),

    # --- mark
    "mark_h": ("نشان", "The mark"),
    "mark_body": (
        "«bi» — دو حرف اول لوگوتایپ به‌همراه نقطه‌ی طلایی — شکل کوچک‌شده‌ی برند است. "
        "<strong>فقط جایی از آن استفاده کنید که لوگوی کامل خوانا نیست</strong>؛ در عمل یعنی "
        "آیکون ۱۶ و ۳۲ پیکسلیِ تب مرورگر. هرجا جا برای نام هست، لوگوی کامل می‌آید.",
        "`bi` — the first two letters plus the gold tittle — is the reduced form. "
        "<strong>Use it only where the full lockup cannot be read</strong>, which in practice "
        "means the 16 and 32 px browser-tab icon. Anywhere with room for the name takes the "
        "full lockup.",
    ),
    "mark_colour": (
        "حروف رنگ متن اطرافشان را می‌گیرند؛ <strong>نقطه همیشه ‎#D4AF37 است</strong>.",
        "The letterforms take the surrounding text colour; <strong>the tittle is always "
        "#D4AF37</strong>.",
    ),

    # --- colour
    "colour_h": ("رنگ", "Colour"),
    "colour_charcoal": ("زغالی — «bime» روی زمینه روشن", "Charcoal — `bime` on light"),
    "colour_on_dark": ("روی زمینه تیره", "On dark — `bime` on dark"),
    "colour_gold": ("طلایی — نقطه و «gold»", "Gold — the tittle and `gold`"),
    "colour_navy": ("سرمه‌ای — زمینه‌ی برند، آیکون‌ها", "Navy — brand field, icons"),
    "colour_warn_h": ("طلایی رنگِ متن نیست", "Gold is not a text colour"),
    "colour_warn": (
        "‏‎#D4AF37 روی سفید نسبت کنتراست ۲٫۱ دارد و استاندارد WCAG AA را رد می‌کند. هرجا طلایی "
        "باید متن یا وضعیت رابط را حمل کند، از پله‌ی تیره‌ترِ همان رنگ استفاده کنید:",
        "#D4AF37 on white is 2.1:1 and fails WCAG AA. Where gold has to carry text or a UI "
        "state, use a darkened step of the same hue:",
    ),
    "th_where": ("کجا", "Surface"),
    "th_token": ("توکن", "Token"),
    "th_contrast": ("کنتراست", "Contrast"),
    "c_docs_light": ("لینک‌های سایت مستندات، روشن", "Docs site links, light"),
    "c_docs_dark": ("لینک‌های سایت مستندات، تیره", "Docs site links, dark"),
    "c_app_solid": ("اپ، متن سفید روی رنگ", "App, white on solid"),
    "c_app_text": ("اپ، متن برند روی صفحه", "App, brand text on page"),
    "colour_ramp": (
        "پله‌ی کامل رنگ در <code>apps/web/src/styles.css</code> است: فام لوگو ثابت روی ۹۰ و "
        "روشنایی متغیر، تا هر ترکیبی خوانا بماند.",
        "The full ramp is in <code>apps/web/src/styles.css</code>: the logo's hue held at 90 "
        "while lightness walks, so every pairing stays legible.",
    ),

    # --- type
    "type_h": ("تایپوگرافی", "Typography"),
    "type_body": (
        "لوگو یک اثر ترسیمی است، نه متن زنده — برای نمایش آن به هیچ فونتی نیاز نیست.",
        "The wordmark is drawn artwork, not live text — nothing needs a font to render it.",
    ),
    "type_jakarta": (
        "لوگوتایپ بر پایه‌ی <strong>Plus Jakarta Sans Bold</strong> است. همین متن لاتین با "
        "همان فونت چیده شده.",
        "The wordmark is built on <strong>Plus Jakarta Sans Bold</strong>. The Latin text you "
        "are reading is set in it.",
    ),
    "type_vazir": (
        "برای متن فارسی محصولات از <strong>Vazirmatn Variable</strong> استفاده می‌شود، "
        "خودمیزبان و بدون CDN — باید از داخل ایران کار کند.",
        "Persian running text uses <strong>Vazirmatn Variable</strong>, self-hosted with no "
        "CDN — it has to work from inside Iran.",
    ),

    # --- icons
    "icons_h": ("آیکون‌ها", "Icons"),
    "icons_body": (
        "همه روی زمینه‌ی سرمه‌ای. لوگوی کامل هرجا خوانا باشد استفاده می‌شود؛ فایل ‎.ico "
        "تنها قالبی است که می‌تواند در هر اندازه تصویر متفاوتی داشته باشد و همین کار را می‌کند.",
        "All on the navy field. The full lockup is used wherever it can be read; the .ico is "
        "the one format that can hold different artwork per size, and it does.",
    ),

    # --- misuse
    "misuse_h": ("آنچه نباید کرد", "Misuse"),
    "misuse_body": (
        "لوگو را رنگ نکنید، گرادیانت ندهید، دور آن خط نکشید، با فونت دیگری بازنویسی نکنید، "
        "فاصله‌ی «bime» و «gold» را تغییر ندهید، سایه نیندازید، نچرخانید، و نسخه‌ی زمینه‌روشن "
        "را روی زمینه‌ی تیره نگذارید. برای هر زمینه فایل خودش هست.",
        "Do not recolour the wordmark, add a gradient, outline it, set it in another typeface, "
        "change the spacing between `bime` and `gold`, add a shadow, rotate it, or place the "
        "light-background version on a dark field. Use the file for the background you have.",
    ),
    "m_recolour": ("رنگ عوض‌شده", "Recoloured"),
    "m_gradient": ("گرادیانت", "Gradient"),
    "m_stretch": ("کشیده‌شده", "Stretched"),
    "m_rotate": ("چرخانده‌شده", "Rotated"),
    "m_shadow": ("سایه", "Drop shadow"),
    "m_contrast": ("زمینه‌ی نامناسب", "Wrong background"),

    # --- downloads
    "dl_h": ("دانلود", "Downloads"),
    "dl_body": (
        "بسته‌ی کامل شامل همه‌ی نسخه‌های SVG و PNG، آیکون‌ها و فایل رنگ‌هاست.",
        "The full package: every SVG and PNG variant, the icons, and the colour tokens file.",
    ),
    "dl_all": ("بسته‌ی کامل برند", "Full brand package"),
    "dl_tokens": ("توکن‌های رنگ", "Colour tokens"),

    "footer": (
        "این صفحه از خودِ بسته‌ی برند ساخته می‌شود؛ هر لوگویی که اینجا می‌بینید همان فایلی "
        "است که دانلود می‌کنید.",
        "This page is generated from the brand package itself — every logo you see here is "
        "the file you download.",
    ),
}
