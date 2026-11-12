import subprocess
import os
import shutil
from PIL import Image

edge_paths = [
    r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
    r'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
]
edge_exe = next(p for p in edge_paths if os.path.exists(p))

scratch_dir = r'C:\Users\abala\OneDrive\Desktop\Woblee\Woblee\scratch'
html_path = os.path.join(scratch_dir, 'test_cart_drawer.html')
out_png = os.path.join(scratch_dir, 'rendered_cart_drawer.png')

cmd = [
    edge_exe,
    '--headless',
    '--disable-gpu',
    f'--screenshot={out_png}',
    '--window-size=375,844',
    f'file:///{html_path.replace(os.sep, "/")}'
]
subprocess.run(cmd, check=True)
print("Rendered:", os.path.exists(out_png))

# Now create side-by-side with reference image
ref_path = r"C:\Users\abala\.gemini\antigravity\brain\6c59f088-25ed-47ba-8b1a-0a501e4196c3\.user_uploaded\media_1794314594322_7e63fd17.jpg"
ref_img = Image.open(ref_path)
render_img = Image.open(out_png)

# Compare them side by side
# ref_img size: 375x918
# render_img size: 375x844 (or whatever viewport)
h = min(ref_img.height, render_img.height)
w = 375

ref_crop = ref_img.crop((0, 0, w, h))
render_crop = render_img.crop((0, 0, w, h))

comparison = Image.new('RGB', (w * 2 + 10, h), (240, 240, 240))
comparison.paste(ref_crop, (0, 0))
comparison.paste(render_crop, (w + 10, 0))

comp_path = r"C:\Users\abala\.gemini\antigravity\brain\6c59f088-25ed-47ba-8b1a-0a501e4196c3\cart_drawer_uniformity_verified.png"
comparison.save(comp_path)
print("Comparison saved to artifact:", comp_path)

