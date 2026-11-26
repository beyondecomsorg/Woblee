import urllib.request, json
req = urllib.request.Request("https://wobleedesigns.com/products.json?limit=50", headers={"User-Agent": "Mozilla/5.0"})
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        for p in data["products"]:
            for v in p["variants"]:
                if v.get("compare_at_price"):
                    print(f"{p['title']} [{v['title']}] -> Price: {v['price']}, CompareAt: {v['compare_at_price']}")
except Exception as e:
    print("Error:", e)
