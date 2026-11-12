from PIL import Image

im = Image.open(r'C:\Users\abala\.gemini\antigravity\brain\6c59f088-25ed-47ba-8b1a-0a501e4196c3\.user_uploaded\media_1794311299797_3e974571.jpg')
print('Image size:', im.size)

# The red box on top left:
# Let's inspect coordinates roughly
# In im: width is ~760, height is ~500
# Top left red box is roughly around x: 50 to 360, y: 35 to 240
# width = ~310, height = ~205 -> 310 / 205 = 1.51 (which is 3:2 or 16:10 or 4:3!)

