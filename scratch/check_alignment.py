import re

with open('Woblee/templates/index.json', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

for m in re.finditer(r'"(product_title[^"]*|price[^"]*)":\s*\{[^}]*"alignment":\s*"([^"]+)"', text):
    print(m.group(1), m.group(2))

