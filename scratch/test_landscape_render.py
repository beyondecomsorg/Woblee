import subprocess
import os
from PIL import Image

edge_paths = [
    r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
    r'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
]
edge_exe = next(p for p in edge_paths if os.path.exists(p))

html_content = '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>3:2 Landscape 2x2 Grid - Single Screen Fit</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 10px;
    }
    .lifestyle-grid-section {
      width: 100%;
      max-width: 1080px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .lifestyle-grid-container {
      width: 100%;
    }
    .lifestyle-grid__grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      width: 100%;
    }
    .lifestyle-grid__card {
      width: 100%;
      aspect-ratio: 3 / 2; /* Exact landscape ratio from Image 1 */
      overflow: hidden;
      border-radius: 0px;
      position: relative;
    }
    /* Simulation of Image 1 colors */
    .card-1 { background-color: #E50914; }
    .card-2 { background-color: #0038FF; }
    .card-3 { background-color: #E2E8F0; }
    .card-4 { background-color: #E50914; }

    .card-label {
      position: absolute;
      bottom: 16px;
      left: 16px;
      color: #FFFFFF;
      font-weight: 700;
      font-size: 15px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .card-3 .card-label { color: #0C4168; }
  </style>
</head>
<body>
  <section class="lifestyle-grid-section">
    <div class="lifestyle-grid-container">
      <div class="lifestyle-grid__grid">
        <div class="lifestyle-grid__card card-1">
          <span class="card-label">600 × 400 px (3:2)</span>
        </div>
        <div class="lifestyle-grid__card card-2">
          <span class="card-label">600 × 400 px (3:2)</span>
        </div>
        <div class="lifestyle-grid__card card-3">
          <span class="card-label">600 × 400 px (3:2)</span>
        </div>
        <div class="lifestyle-grid__card card-4">
          <span class="card-label">600 × 400 px (3:2)</span>
        </div>
      </div>
    </div>
  </section>
</body>
</html>'''

scratch_dir = r'C:\Users\abala\OneDrive\Desktop\Woblee\Woblee\scratch'
os.makedirs(scratch_dir, exist_ok=True)
html_path = os.path.join(scratch_dir, 'test_landscape_grid.html')
out_png = os.path.join(scratch_dir, 'test_landscape_grid.png')
artifact_png = r'C:\Users\abala\.gemini\antigravity\brain\6c59f088-25ed-47ba-8b1a-0a501e4196c3\grid_landscape_single_screen.png'

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html_content)

cmd = [
    edge_exe,
    '--headless',
    '--disable-gpu',
    f'--screenshot={out_png}',
    '--window-size=1200,850',
    f'file:///{html_path.replace(os.sep, "/")}'
]
subprocess.run(cmd, check=True)

import shutil
shutil.copy2(out_png, artifact_png)
print('Screenshot generated and copied to artifact_png:', os.path.exists(artifact_png))

