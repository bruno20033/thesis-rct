import sys, os, glob
from PIL import Image, ImageDraw, ImageFont

indir, outpath = sys.argv[1], sys.argv[2]
cols   = int(sys.argv[3]) if len(sys.argv) > 3 else 2
thumbw = int(sys.argv[4]) if len(sys.argv) > 4 else 760
pad, labelh = 12, 24

files = sorted(glob.glob(os.path.join(indir, "*.png")))
thumbs = []
for f in files:
    im = Image.open(f).convert("RGB")
    w, h = im.size
    nh = max(1, int(h * thumbw / w))
    thumbs.append((os.path.basename(f), im.resize((thumbw, nh))))

rows = (len(thumbs) + cols - 1) // cols
cellw = thumbw + 2 * pad
rowh = []
for r in range(rows):
    hs = [thumbs[r*cols+c][1].size[1] for c in range(cols) if r*cols+c < len(thumbs)]
    rowh.append((max(hs) if hs else 0) + labelh + 2*pad)

canvas = Image.new("RGB", (cols*cellw, sum(rowh)), "white")
draw = ImageDraw.Draw(canvas)
try:
    font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 18)
except Exception:
    font = ImageFont.load_default()

y = 0
for r in range(rows):
    for c in range(cols):
        i = r*cols + c
        if i >= len(thumbs):
            continue
        name, im = thumbs[i]
        x = c*cellw
        draw.rectangle([x+2, y+2, x+cellw-2, y+rowh[r]-2], outline="red", width=3)
        draw.text((x+pad, y+4), f"[{i}] {name}", fill="red", font=font)
        canvas.paste(im, (x+pad, y+labelh+pad))
    y += rowh[r]
canvas.save(outpath)
print("saved", outpath, canvas.size)
