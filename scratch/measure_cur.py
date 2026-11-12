from PIL import Image

img = Image.open(r"C:\Users\abala\.gemini\antigravity\brain\6c59f088-25ed-47ba-8b1a-0a501e4196c3\.user_uploaded\media_1794314589542_065e2ebb.jpg").convert('RGB')
w, h = img.size
print(f"Current image size: {w}x{h}")

# In the current image, let's scale to 375px wide to compare apples to apples
scale = 375.0 / w
print(f"Scale factor to 375: {scale:.4f}")

# Look at banner in current image
banner_start = None
banner_end = None
for y in range(int(50/scale), int(350/scale)):
    px = img.getpixel((int(100/scale), y))
    is_grey = (px[0] < 245 and px[1] < 245 and px[2] < 245)
    if is_grey and banner_start is None:
        banner_start = y
    if not is_grey and banner_start is not None and banner_end is None:
        banner_end = y

if banner_start and banner_end:
    print(f"Current banner: start y={int(banner_start*scale)}, end y={int(banner_end*scale)}, height={int((banner_end-banner_start)*scale)}")

# Look at where recommendation card 1 is cut off by the sticky footer in current image
# In current image, sticky footer covers the bottom of rec cards!
for y in range(int(600/scale), int(950/scale)):
    # Check if there is a white background for the sticky footer
    px = img.getpixel((int(50/scale), y))
    pass

