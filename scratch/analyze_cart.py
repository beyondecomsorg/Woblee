from PIL import Image

ref_path = r"C:\Users\abala\.gemini\antigravity\brain\6c59f088-25ed-47ba-8b1a-0a501e4196c3\.user_uploaded\media_1794314594322_7e63fd17.jpg"
cur_path = r"C:\Users\abala\.gemini\antigravity\brain\6c59f088-25ed-47ba-8b1a-0a501e4196c3\.user_uploaded\media_1794314589542_065e2ebb.jpg"

ref_img = Image.open(ref_path)
cur_img = Image.open(cur_path)

print(f"Ref size: {ref_img.size}")
print(f"Cur size: {cur_img.size}")

