from PIL import Image

ref_img = Image.open(r"C:\Users\abala\.gemini\antigravity\brain\6c59f088-25ed-47ba-8b1a-0a501e4196c3\.user_uploaded\media_1794314594322_7e63fd17.jpg")
w, h = ref_img.size

# Let's save slices to inspect
header = ref_img.crop((0, 0, w, 65))
header.save(r"C:\Users\abala\OneDrive\Desktop\Woblee\Woblee\scratch\ref_header.png")

banner = ref_img.crop((0, 60, w, 220))
banner.save(r"C:\Users\abala\OneDrive\Desktop\Woblee\Woblee\scratch\ref_banner.png")

item = ref_img.crop((0, 220, w, 360))
item.save(r"C:\Users\abala\OneDrive\Desktop\Woblee\Woblee\scratch\ref_item.png")

rec = ref_img.crop((0, 355, w, 690))
rec.save(r"C:\Users\abala\OneDrive\Desktop\Woblee\Woblee\scratch\ref_rec.png")

summary = ref_img.crop((0, 690, w, h))
summary.save(r"C:\Users\abala\OneDrive\Desktop\Woblee\Woblee\scratch\ref_summary.png")

print("Saved slices.")
