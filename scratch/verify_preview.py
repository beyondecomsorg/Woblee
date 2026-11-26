import urllib.request, re

url = 'https://wobleedesigns.myshopify.com?preview_theme_id=189940301975'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8')
        matches = re.findall(r'<div class="price__sale">.*?</div>', html, re.DOTALL)
        print(f"Found {len(matches)} price__sale elements:")
        for m in matches[:5]:
            clean = re.sub(r'\s+', ' ', m)
            print("  ", clean)
except Exception as e:
    print("Error:", e)
