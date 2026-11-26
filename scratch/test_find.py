import urllib.request, re

url = 'https://wobleedesigns.myshopify.com?preview_theme_id=189940301975'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8')

p = html.find('class="price__sale"')
if p != -1:
    print(html[p:p+800])
