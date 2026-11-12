import os
import subprocess
import base64
from PIL import Image

src_path = r'C:\Users\abala\.gemini\antigravity\brain\6c59f088-25ed-47ba-8b1a-0a501e4196c3\.user_uploaded\media_1794307252641_be9fea10.jpg'
im = Image.open(src_path)

q1 = im.crop((0, 0, 465, 435)).resize((400, 400), Image.Resampling.LANCZOS)
q2 = im.crop((485, 0, 942, 435)).resize((400, 400), Image.Resampling.LANCZOS)
q3 = im.crop((0, 448, 465, 861)).resize((400, 400), Image.Resampling.LANCZOS)
q4 = im.crop((485, 448, 942, 861)).resize((400, 400), Image.Resampling.LANCZOS)

import io
def to_b64(img):
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    return 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode('utf-8')

b1 = to_b64(q1)
b2 = to_b64(q2)
b3 = to_b64(q3)
b4 = to_b64(q4)

html_content = f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>400x400 Grid Test</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      background: #f1f5f9;
      display: flex;
      justify-content: center;
      padding: 40px 10px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }}
    .lifestyle-grid-section {{
      width: 100%;
      display: flex;
      justify-content: center;
    }}
    .lifestyle-grid-container {{
      width: 100%;
      max-width: 810px; /* 400 * 2 + 10px gap */
      margin: 0 auto;
    }}
    .lifestyle-grid__grid {{
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 400px));
      grid-template-rows: repeat(2, minmax(0, 400px));
      gap: 10px;
      width: 100%;
      max-width: 810px;
      margin: 0 auto;
    }}
    .lifestyle-grid__card {{
      width: 100%;
      max-width: 400px;
      aspect-ratio: 1/1;
      overflow: hidden;
      border-radius: 0px;
      background: #ffffff;
    }}
    .lifestyle-grid__img {{
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }}
  </style>
</head>
<body>
  <section class="lifestyle-grid-section">
    <div class="lifestyle-grid-container">
      <div class="lifestyle-grid__grid">
        <div class="lifestyle-grid__card">
          <img class="lifestyle-grid__img" src="{b1}" alt="1">
        </div>
        <div class="lifestyle-grid__card">
          <img class="lifestyle-grid__img" src="{b2}" alt="2">
        </div>
        <div class="lifestyle-grid__card">
          <img class="lifestyle-grid__img" src="{b3}" alt="3">
        </div>
        <div class="lifestyle-grid__card">
          <img class="lifestyle-grid__img" src="{b4}" alt="4">
        </div>
      </div>
    </div>
  </section>
</body>
</html>'''

edge_paths = [
    r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
    r'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
]
edge_exe = next(p for p in edge_paths if os.path.exists(p))

scratch_dir = r'C:\Users\abala\OneDrive\Desktop\Woblee\Woblee\scratch'
os.makedirs(scratch_dir, exist_ok=True)
html_path = os.path.join(scratch_dir, 'test_grid_400.html')
out_png = os.path.join(scratch_dir, 'test_grid_400.png')
artifact_png = r'C:\Users\abala\.gemini\antigravity\brain\6c59f088-25ed-47ba-8b1a-0a501e4196c3\grid_400x400_verified.png'

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html_content)

cmd = [
    edge_exe,
    '--headless',
    '--disable-gpu',
    f'--screenshot={out_png}',
    '--window-size=950,950',
    f'file:///{html_path.replace(os.sep, "/")}'
]
subprocess.run(cmd, check=True)

import shutil
shutil.copy2(out_png, artifact_png)
print('Screenshot generated and copied to artifact_png:', os.path.exists(artifact_png))

