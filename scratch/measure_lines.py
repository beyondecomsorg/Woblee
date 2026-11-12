from PIL import Image

def find_horizontal_lines(img_path):
    img = Image.open(img_path).convert('RGB')
    w, h = img.size
    print(f"Analyzing {img_path} ({w}x{h})")
    for y in range(0, h, 2):
        row = [img.getpixel((x, y)) for x in range(20, w-20, 10)]
        # check if row is mostly grey or separator
        r_avg = sum(p[0] for p in row) / len(row)
        g_avg = sum(p[1] for p in row) / len(row)
        b_avg = sum(p[2] for p in row) / len(row)
        if abs(r_avg - g_avg) < 5 and abs(g_avg - b_avg) < 5 and r_avg < 240 and r_avg > 180:
            print(f"y={y}: avg rgb=({r_avg:.1f}, {g_avg:.1f}, {b_avg:.1f})")

find_horizontal_lines(r"C:\Users\abala\OneDrive\Desktop\Woblee\Woblee\scratch\ref_rec.png")

