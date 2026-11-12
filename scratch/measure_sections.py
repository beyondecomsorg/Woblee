from PIL import Image

img = Image.open(r"C:\Users\abala\.gemini\antigravity\brain\6c59f088-25ed-47ba-8b1a-0a501e4196c3\.user_uploaded\media_1794314594322_7e63fd17.jpg").convert('RGB')
w, h = img.size

# Let's see the banner boundaries:
for y in range(50, 250):
    px = img.getpixel((100, y))
    if px[0] < 240 and px[1] < 240 and px[2] < 245:
        # inside banner
        pass
    else:
        # white
        pass

# Print colors at x=100 from y=50 to 250
banner_start = None
banner_end = None
for y in range(50, 250):
    px = img.getpixel((100, y))
    is_grey = (px[0] < 245 and px[1] < 245 and px[2] < 245)
    if is_grey and banner_start is None:
        banner_start = y
    if not is_grey and banner_start is not None and banner_end is None:
        banner_end = y

print(f"Banner: start y={banner_start}, end y={banner_end}, height={banner_end - banner_start if banner_end else None}")

# Now let's find the product row boundaries
# Product image is on the left, around x=40, y=230..350
item_start = None
item_end = None
for y in range(200, 420):
    px = img.getpixel((40, y))
    is_prod_img = (px[0] < 245 or px[1] < 245 or px[2] < 245)
    if is_prod_img and item_start is None:
        item_start = y
    if not is_prod_img and item_start is not None and item_end is None:
        item_end = y
print(f"Product image: start y={item_start}, end y={item_end}, height={item_end - item_start if item_end else None}")

# Now let's find "YOU MAY ALSO LIKE" heading and recommendation cards
# Recommendation cards start around y=420
rec_img_start = None
rec_img_end = None
for y in range(380, 600):
    px = img.getpixel((60, y)) # inside card 1 image
    is_card_img = (px[0] < 245 or px[1] < 245 or px[2] < 245)
    if is_card_img and rec_img_start is None:
        rec_img_start = y
    if not is_card_img and rec_img_start is not None and rec_img_end is None:
        rec_img_end = y
print(f"Rec card 1 image: start y={rec_img_start}, end y={rec_img_end}, height={rec_img_end - rec_img_start if rec_img_end else None}")

# Rec card 1 "Add" button
btn_start = None
btn_end = None
for y in range(550, 750):
    px = img.getpixel((60, y)) # inside card 1 Add button: navy
    is_navy = (px[0] < 40 and px[1] > 40 and px[1] < 80 and px[2] > 70 and px[2] < 120)
    if is_navy and btn_start is None:
        btn_start = y
    if not is_navy and btn_start is not None and btn_end is None:
        btn_end = y
print(f"Rec card 1 Add button: start y={btn_start}, end y={btn_end}, height={btn_end - btn_start if btn_start and btn_end else None}")

# Checkout button
chk_start = None
chk_end = None
for y in range(750, h):
    px = img.getpixel((187, y)) # center
    is_navy = (px[0] < 40 and px[1] > 40 and px[1] < 80 and px[2] > 70 and px[2] < 120)
    if is_navy and chk_start is None:
        chk_start = y
    if not is_navy and chk_start is not None and chk_end is None:
        chk_end = y
print(f"Checkout button: start y={chk_start}, end y={chk_end}, height={chk_end - chk_start if chk_start and chk_end else None}")

