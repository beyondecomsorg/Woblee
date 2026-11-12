from PIL import Image

cur = Image.open(r"C:\Users\abala\OneDrive\Desktop\Woblee\Woblee\scratch\cur_375.png")
ref = Image.open(r"C:\Users\abala\.gemini\antigravity\brain\6c59f088-25ed-47ba-8b1a-0a501e4196c3\.user_uploaded\media_1794314594322_7e63fd17.jpg")

# In cur (375x755):
# Header: 0 to ~55
# Banner: 55 to ~225 (170px high!!)
# In ref (375x918):
# Header: 0 to ~65
# Banner: 65 to ~195 (130px high!)

# Let's crop the banners side by side
cur_banner = cur.crop((10, 50, 365, 230))
ref_banner = ref.crop((10, 60, 365, 205))

# Let's crop the product rows
cur_prod = cur.crop((10, 230, 365, 370))
ref_prod = ref.crop((10, 205, 365, 335))

# Let's crop the recommendations
cur_rec = cur.crop((10, 370, 365, 530))
ref_rec = ref.crop((10, 335, 365, 630))

# Let's crop the footers
cur_footer = cur.crop((10, 520, 365, 755))
ref_footer = ref.crop((10, 680, 365, 918))

# Save comparison
canvas = Image.new('RGB', (760, 950), (240, 240, 240))
canvas.paste(cur, (0, 0))
canvas.paste(ref, (385, 0))
canvas.save(r"C:\Users\abala\OneDrive\Desktop\Woblee\Woblee\scratch\side_by_side_comparison.png")
print("Saved side by side comparison.")

