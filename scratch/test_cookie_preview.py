import urllib.request, http.cookiejar

cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

url = 'https://wobleedesigns.myshopify.com?preview_theme_id=189940301975'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
resp = opener.open(req)
resp2 = opener.open(req)
html = resp2.read().decode('utf-8')

p = html.find('class="price__sale"')
if p != -1:
    print(html[p:p+700])
