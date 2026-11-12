from PIL import Image

img = Image.open(r"C:\Users\abala\.gemini\antigravity\brain\6c59f088-25ed-47ba-8b1a-0a501e4196c3\.user_uploaded\media_1794314594322_7e63fd17.jpg").convert('RGB')
w, h = img.size

# Let's sample along x=187 (center) and x=50 (left column)
print("Sampling center column x=187:")
prev = None
transitions = []
for y in range(0, h, 2):
    c = img.getpixel((187, y))
    # classify color: white, light-grey (banner background), navy (button/text), etc.
    if prev is not None:
        diff = abs(c[0]-prev[0]) + abs(c[1]-prev[1]) + abs(c[2]-prev[2])
        if diff > 50:
            transitions.append((y, c, diff))
    prev = c

for t in transitions[:25]:
    print(f"y={t[0]}: rgb={t[1]}")

