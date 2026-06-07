import sys, os, glob
import numpy as np
from PIL import Image

def row_ink(gray, white=235):
    return (gray < white).sum(axis=1)

def col_ink(gray, white=235):
    return (gray < white).sum(axis=0)

def runs(mask, gap):
    """Contiguous True-runs in mask, merging runs separated by < gap False rows."""
    H = len(mask); out = []; i = 0
    while i < H:
        if mask[i]:
            j = i; last = i; white = 0
            while j < H:
                if mask[j]:
                    last = j; white = 0
                else:
                    white += 1
                    if white >= gap: break
                j += 1
            out.append((i, last)); i = last + 1
        else:
            i += 1
    return out

def crop_box(path):
    im = Image.open(path).convert("RGB")
    g = np.asarray(im.convert("L"))
    H, W = g.shape
    rink = row_ink(g)
    rmask = rink > max(3, int(0.006 * W))
    blocks = runs(rmask, gap=max(10, int(0.012 * H)))
    if not blocks:
        return im, (0, 0, W, H)
    # chart blocks = tall blocks; text lines (prompt/options) are short
    tall = [(a, b) for (a, b) in blocks if (b - a) > 0.11 * H]
    chosen = tall if tall else blocks
    y0 = chosen[0][0]
    y1 = chosen[-1][1]
    # vertical padding
    y0 = max(0, y0 - 10); y1 = min(H, y1 + 12)
    # trim left/right whitespace within [y0,y1]
    sub = g[y0:y1]
    cink = col_ink(sub)
    cmask = np.where(cink > max(2, int(0.004 * (y1 - y0))))[0]
    if len(cmask):
        x0 = max(0, cmask[0] - 10); x1 = min(W, cmask[-1] + 11)
    else:
        x0, x1 = 0, W
    return im, (x0, y0, x1, y1)

def process(path, outpath):
    im, box = crop_box(path)
    im.crop(box).save(outpath)
    return box

if __name__ == "__main__":
    mode = sys.argv[1]
    if mode == "batch":
        for d in sys.argv[2:]:
            od = d + "_crop"; os.makedirs(od, exist_ok=True)
            for f in sorted(glob.glob(os.path.join(d, "img-*.png"))):
                box = process(f, os.path.join(od, os.path.basename(f)))
            print("cropped", d)
    else:
        print(process(sys.argv[1], sys.argv[2]))
