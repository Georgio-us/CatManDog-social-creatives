"""Render the six fixed 1080 x 1350 CatManDog social creatives."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parent
OUT = ROOT / "collection"
ASSETS = ROOT / "assets/reference"
FONT = ROOT / "assets/fonts/GolosText.ttf"
LOGO = ROOT / "assets/brand/CatManDog-wordmark-black-transparent.png"

S = 2
W, H = 1080, 1350
INK = "#20221E"
WHITE = "#FFFFFF"
SURFACE = "#F3F3F0"
LIME = "#D8F36A"
MUTED = "#75766F"


def q(value: int | float) -> int:
    return round(value * S)


@lru_cache(maxsize=None)
def face(size: int, weight: int = 500) -> ImageFont.FreeTypeFont:
    font = ImageFont.truetype(str(FONT), q(size))
    font.set_variation_by_axes([weight])
    return font


def canvas(bg: str) -> Image.Image:
    return Image.new("RGB", (q(W), q(H)), bg)


def draw_line(draw: ImageDraw.ImageDraw, points, color=INK, width=5, joint="curve"):
    draw.line([(q(x), q(y)) for x, y in points], fill=color, width=q(width), joint=joint)


def label(draw: ImageDraw.ImageDraw, x, y, value, size, color=INK, weight=500, anchor="lt"):
    # The variable font's 800-900 outlines develop visible cuts in large Cyrillic.
    # A bold 700 outline with a small stroke keeps the intended density clean.
    rendered_weight = min(weight, 700)
    stroke = q(1.5) if weight >= 800 else 0
    draw.text((q(x), q(y)), value, font=face(size, rendered_weight), fill=color,
              anchor=anchor, stroke_width=stroke, stroke_fill=color)


def block(draw: ImageDraw.ImageDraw, x, y, lines, size, leading, color=INK, weight=900):
    for index, line in enumerate(lines):
        label(draw, x, y + index * leading, line, size, color, weight)


def paste_contain(dst: Image.Image, source: Path, box, crop_alpha=True, stretch=None):
    img = Image.open(source).convert("RGBA")
    if crop_alpha:
        bbox = img.getchannel("A").getbbox()
        if bbox:
            img = img.crop(bbox)
    x, y, w, h = box
    if stretch:
        size = (q(stretch[0]), q(stretch[1]))
    else:
        scale = min(q(w) / img.width, q(h) / img.height)
        size = (round(img.width * scale), round(img.height * scale))
    img = img.resize(size, Image.Resampling.LANCZOS)
    px = q(x) + (q(w) - size[0]) // 2
    py = q(y) + (q(h) - size[1]) // 2
    dst.paste(img, (px, py), img)


def paste_cover(dst: Image.Image, source: Path, box, centering=(0.5, 0.5)):
    x, y, w, h = box
    img = Image.open(source).convert("RGB")
    img = ImageOps.fit(img, (q(w), q(h)), method=Image.Resampling.LANCZOS, centering=centering)
    dst.paste(img, (q(x), q(y)))


def logo(dst: Image.Image, x, y, width=205, color=INK):
    img = Image.open(LOGO).convert("RGBA")
    height = round(img.height * q(width) / img.width)
    img = img.resize((q(width), height), Image.Resampling.LANCZOS)
    fill = Image.new("RGBA", img.size, color)
    fill.putalpha(img.getchannel("A"))
    dst.paste(fill, (q(x), q(y)), fill)


def save(dst: Image.Image, name: str):
    OUT.mkdir(exist_ok=True)
    dst.resize((W, H), Image.Resampling.LANCZOS).save(OUT / name, optimize=True)


def creative_01():
    im = canvas(WHITE)
    d = ImageDraw.Draw(im)
    logo(im, 58, 58, 210)
    block(d, 57, 166, ["Почему", "кошки", "так делают"], 145, 138)

    # Empty speech becomes a coded, unanswered cat question.
    d.ellipse((q(208), q(591), q(1016), q(1050)), fill=WHITE, outline=INK, width=q(8))
    d.polygon([(q(723), q(1014)), (q(688), q(1136)), (q(815), q(1018))], fill=WHITE)
    draw_line(d, [(723, 1013), (688, 1136), (815, 1018)], INK, 8)
    label(d, 580, 754, "#?!", 134, INK, 900, "mm")
    draw_line(d, [(94, 750), (169, 785)], LIME, 13)
    draw_line(d, [(82, 851), (164, 842)], LIME, 13)
    draw_line(d, [(999, 668), (1050, 611)], LIME, 13)
    draw_line(d, [(1021, 741), (1072, 710)], LIME, 13)
    paste_contain(im, ASSETS / "cat-looking-up.png", (-57, 795, 835, 725), crop_alpha=False)
    d = ImageDraw.Draw(im)
    block(d, 809, 1122, ["Разбираем", "кошачьи", "привычки", "вместе"], 39, 45, INK, 500)
    save(im, "01-cat-questions.png")


def creative_02():
    im = canvas(INK)
    d = ImageDraw.Draw(im)
    logo(im, 60, 59, 210, WHITE)
    draw_line(d, [(540, 0), (540, 1162)], MUTED, 2)
    block(d, 61, 251, ["Готовый", "корм"], 77, 76, WHITE, 850)
    block(d, 590, 251, ["Натуральное", "питание"], 64, 70, WHITE, 850)
    paste_contain(im, ASSETS / "food-compare.png", (0, 480, 1080, 600), crop_alpha=False)
    d = ImageDraw.Draw(im)
    d.ellipse((q(468), q(792), q(612), q(936)), fill=LIME)
    label(d, 540, 817, "VS", 57, INK, 700, "mt")
    block(d, 62, 1042, ["Удобство", "и сбалансированный", "состав"], 36, 43, WHITE, 500)
    block(d, 591, 1042, ["Больше контроля", "над ингредиентами"], 36, 43, WHITE, 500)
    d.rounded_rectangle((q(66), q(1200), q(1014), q(1303)), radius=q(55), outline=WHITE, width=q(3))
    label(d, 105, 1230, "Что подходит вашему питомцу?", 36, WHITE, 500)
    draw_line(d, [(929, 1252), (974, 1252)], WHITE, 3)
    draw_line(d, [(957, 1235), (974, 1252), (957, 1268)], WHITE, 3)
    save(im, "02-food-comparison.png")


def creative_03():
    im = canvas(LIME)
    d = ImageDraw.Draw(im)
    block(d, 64, 128, ["Игры", "делают", "жизнь"], 145, 143, INK, 850)

    # The cat and feather are a full-resolution transparent cutout based on the
    # supplied visual. Type and geometry are drawn sharply at output resolution.
    cat = Image.open(ASSETS / "cat-playing-cutout-hd.png").convert("RGBA")
    cat = cat.resize((q(1162), q(1353)), Image.Resampling.LANCZOS)
    im.paste(cat, (q(0), q(75)), cat)
    d = ImageDraw.Draw(im)
    draw_line(d, [(731, 0), (775, 84)], INK, 4)
    draw_line(d, [(724, 247), (785, 282)], INK, 10)
    draw_line(d, [(707, 337), (779, 334)], INK, 10)
    draw_line(d, [(737, 421), (788, 366)], INK, 10)

    # Tilt the white callout and its word as one compositional element.
    callout = Image.new("RGBA", (q(520), q(215)), (0, 0, 0, 0))
    cd = ImageDraw.Draw(callout)
    cd.ellipse((q(4), q(14), q(516), q(201)), fill=WHITE)
    cd.text((q(67), q(38)), "ярче", font=face(127, 700), fill=INK,
            anchor="lt", stroke_width=q(1.5), stroke_fill=INK)
    callout = callout.rotate(9, resample=Image.Resampling.BICUBIC, expand=True)
    im.paste(callout, (q(51), q(525)), callout)

    d = ImageDraw.Draw(im)
    block(d, 66, 805, ["Активные", "кошки -", "счастливые", "кошки"],
          39, 50, INK, 500)
    # Motion arcs cross in front of the cat, as in the reference.
    d.arc((q(102), q(1043), q(1030), q(1700)), start=192, end=351,
          fill=WHITE, width=q(12))
    d.arc((q(397), q(1085), q(1390), q(1700)), start=195, end=348,
          fill=WHITE, width=q(12))
    d.arc((q(55), q(1110), q(565), q(1570)), start=205, end=260,
          fill=WHITE, width=q(11))
    logo(im, 65, 1259, 235)
    save(im, "03-play.png")


def creative_04():
    im = canvas(WHITE)
    paste_cover(im, ASSETS / "cat-care.png", (534, 0, 546, 1350), centering=(0.53, 0.5))
    d = ImageDraw.Draw(im)
    logo(im, 57, 59, 210)
    block(d, 59, 205, ["Здоровье", "начинается", "с внимания"], 100, 100)
    draw_line(d, [(63, 724), (191, 711)], LIME, 13)
    block(d, 59, 1010, ["Регулярные осмотры,", "сбалансированное", "питание и активность", "помогают кошкам", "оставаться в хорошей", "форме"], 34, 43, INK, 500)
    save(im, "04-health.png")


def creative_05():
    im = canvas(WHITE)
    d = ImageDraw.Draw(im)
    logo(im, 58, 59, 210)
    block(d, 59, 195, ["Больше", "поводов", "для игр"], 106, 107)
    d.ellipse((q(520), q(534), q(1290), q(1304)), fill=LIME)
    draw_line(d, [(687, 148), (731, 214)], INK, 10)
    draw_line(d, [(748, 119), (779, 202)], INK, 10)
    draw_line(d, [(90, 805), (195, 776)], LIME, 13)
    draw_line(d, [(90, 860), (204, 832)], LIME, 13)
    paste_contain(im, ASSETS / "toys.png", (404, 517, 720, 670), crop_alpha=False)
    d = ImageDraw.Draw(im)
    block(d, 60, 1090, ["Игрушки,", "которые", "развивают", "и увлекают"], 37, 45, INK, 500)
    save(im, "05-toys.png")


def creative_06():
    im = canvas(INK)
    d = ImageDraw.Draw(im)
    logo(im, 58, 59, 210, WHITE)
    label(d, 61, 151, "Добро", 94, WHITE, 850)
    label(d, 61, 245, "пожаловать", 92, WHITE, 850)
    label(d, 61, 338, "в", 92, WHITE, 850)
    label(d, 143, 338, "CatManDog", 84, LIME, 850)
    block(d, 777, 140, ["Забота", "о питомцах", "начинается", "здесь"], 35, 43, WHITE, 500)
    # The reference uses a wide cropped 1 with a sloped shoulder.
    d.polygon([(q(0), q(585)), (q(205), q(455)), (q(365), q(455)),
               (q(365), q(1350)), (q(0), q(1350))], fill=WHITE)
    # Its 0 is larger than the visible canvas and continues past the right edge.
    numeral_font = ImageFont.truetype(str(ROOT / "assets/fonts/Manrope.ttf"), q(1240))
    numeral_font.set_variation_by_axes([800])
    d.text((q(410), q(455)), "0", font=numeral_font, fill=WHITE, anchor="lt")

    # The large cat rises through the zero and is intentionally cropped at the bottom.
    cat = Image.open(ASSETS / "cat-looking-up.png").convert("RGBA")
    cat = cat.crop(cat.getchannel("A").getbbox())
    cat = cat.resize((q(680), q(1020)), Image.Resampling.LANCZOS)
    im.paste(cat, (q(380), q(445)), cat)
    d = ImageDraw.Draw(im)
    draw_line(d, [(971, 493), (1001, 428)], LIME, 10)
    draw_line(d, [(1008, 528), (1050, 483)], LIME, 10)
    save(im, "06-welcome.png")


def contact_sheet(names: list[str]):
    thumb_w = 324
    thumb_h = round(thumb_w * H / W)
    gutter = 30
    sheet = Image.new("RGB", (thumb_w * 3 + gutter * 4, thumb_h * 2 + gutter * 3), SURFACE)
    for index, name in enumerate(names):
        img = Image.open(OUT / name).convert("RGB")
        img = img.resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        x = gutter + index % 3 * (thumb_w + gutter)
        y = gutter + index // 3 * (thumb_h + gutter)
        sheet.paste(img, (x, y))
    sheet.save(OUT / "contact-sheet.png", optimize=True)


def main():
    creative_01()
    creative_02()
    creative_03()
    creative_04()
    creative_05()
    creative_06()
    names = [
        "01-cat-questions.png", "02-food-comparison.png", "03-play.png",
        "04-health.png", "05-toys.png", "06-welcome.png",
    ]
    contact_sheet(names)
    with ZipFile(OUT / "catmandog-six-creatives.zip", "w", ZIP_DEFLATED) as archive:
        for name in names:
            archive.write(OUT / name, arcname=name)
    print("Rendered", len(names), "creatives to", OUT)


if __name__ == "__main__":
    main()
