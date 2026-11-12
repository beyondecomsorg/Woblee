from PIL import Image

img = Image.open(r"C:\Users\abala\.gemini\antigravity\brain\6c59f088-25ed-47ba-8b1a-0a501e4196c3\.user_uploaded\media_1794314594322_7e63fd17.jpg").convert('RGB')
w, h = img.size
print(f"Total reference size: {w}x{h}")

# Find "CART" header
# Find offer banner top and bottom
# The outer box has a border around x=20..355
for y in range(0, 300):
    # check border color at x=25, y
    px = img.getpixel((25, y))
    # if border is grey ~ (220-240)
    if px[0] > 200 and px[0] < 245 and px[1] > 200 and px[1] < 245 and px[2] > 200 and px[2] < 245:
        # check if it forms a horizontal line across
        line_match = sum(1 for x in range(30, 340, 10) if abs(img.getpixel((x, y))[0] - px[0]) < 15)
        if line_match > 25:
            print(f"Horizontal border line found at y={y}: rgb={px}")

# Find where checkout button is
for y in range(h-1, h-200, -1):
    px = img.getpixel((w//2, y))
    # Navy button #0C4168 -> R: 12, G: 65, B: 104
    if px[0] < 30 and px[1] > 40 and px[1] < 80 and px[2] > 80 and px[2] < 120:
        pass

