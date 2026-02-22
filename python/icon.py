from PIL import Image, ImageDraw, ImageFont

sizes = [16, 32, 48, 64, 128, 256]
bg = (20, 20, 24, 255)          # dark background
fg = (240, 232, 213, 255)       # light "M"

imgs = []
for s in sizes:
    img = Image.new("RGBA", (s, s), bg)
    d = ImageDraw.Draw(img)

    # Try a common bold font; fall back to Pillow's default if missing.
    try:
        font = ImageFont.truetype("DejaVuSans-Bold.ttf", int(s * 0.72))
    except OSError:
        font = ImageFont.load_default()

    text = "M"
    bbox = d.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (s - tw) // 2
    y = (s - th) // 2 - int(s * 0.04)  # slight optical centering tweak
    d.text((x, y), text, font=font, fill=fg)

    imgs.append(img)

# Save multi-size .ico
imgs[0].save("favicon.ico", format="ICO", sizes=[(s, s) for s in sizes])
print("Wrote favicon.ico")