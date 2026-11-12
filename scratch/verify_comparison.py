from PIL import Image

render = Image.open(r"C:\Users\abala\OneDrive\Desktop\Woblee\Woblee\scratch\test_drawer_render.png")
ref = Image.open(r"C:\Users\abala\.gemini\antigravity\brain\6c59f088-25ed-47ba-8b1a-0a501e4196c3\.user_uploaded\media_1794314594322_7e63fd17.jpg")

print(f"Render size: {render.size}, Ref size: {ref.size}")

# Crop render to 375x918 if needed
w = min(render.width, 375)
h = min(render.height, ref.height)

render_cropped = render.crop((0, 0, w, h))
ref_cropped = ref.crop((0, 0, ref.width, h))

canvas = Image.new('RGB', (w + ref.width + 10, h), (230, 230, 230))
canvas.paste(ref_cropped, (0, 0))
canvas.paste(render_cropped, (ref.width + 10, 0))

canvas.save(r"C:\Users\abala\.gemini\antigravity\brain\6c59f088-25ed-47ba-8b1a-0a501e4196c3\cart_drawer_uniformity_verified.png")
print("Saved cart_drawer_uniformity_verified.png")

