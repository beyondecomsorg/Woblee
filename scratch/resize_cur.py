from PIL import Image

img = Image.open(r"C:\Users\abala\.gemini\antigravity\brain\6c59f088-25ed-47ba-8b1a-0a501e4196c3\.user_uploaded\media_1794314589542_065e2ebb.jpg").convert('RGB')
w, h = img.size
# resize current image to 375 width proportionally
new_h = int(h * 375 / w)
cur_resized = img.resize((375, new_h), Image.Resampling.LANCZOS)
cur_resized.save(r"C:\Users\abala\OneDrive\Desktop\Woblee\Woblee\scratch\cur_375.png")

ref_img = Image.open(r"C:\Users\abala\.gemini\antigravity\brain\6c59f088-25ed-47ba-8b1a-0a501e4196c3\.user_uploaded\media_1794314594322_7e63fd17.jpg")
print(f"Cur resized: 375x{new_h}, Ref: {ref_img.size}")

