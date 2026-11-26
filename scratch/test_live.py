import urllib.request, re

url = 'https://wobleedesigns.com'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8')

p = html.find('class="price__sale"')
if p != -1:
    print("Found price__sale on live site:")
    print(html[p:p+500])
else:
    print("Not found")
