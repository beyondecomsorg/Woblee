from playwright.sync_api import sync_playwright

urls = [
    ("Homepage", "https://wobleedesigns.com/"),
    ("Collection", "https://wobleedesigns.com/collections/bestsellers"),
    ("Search", "https://wobleedesigns.com/search?q=tee"),
]

with sync_playwright() as p:
    try:
        browser = p.chromium.launch(channel="chrome")
    except Exception:
        browser = p.chromium.launch(channel="msedge")

    for name, url in urls:
        page = browser.new_page(viewport={"width": 375, "height": 844})
        page.goto(url, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_selector("product-card", timeout=15000)
        page.wait_for_timeout(1500)
        info = page.evaluate("""() => {
            const cards = Array.from(document.querySelectorAll('product-card'));
            const out = [];
            for (const card of cards.slice(0, 6)) {
                const title = card.querySelector('a[ref="productTitleLink"] p');
                const sale = card.querySelector('.price-item--sale, .price__regular .price');
                const comp = card.querySelector('.compare-at-price');
                const disc = card.querySelector('.price-item__discount');
                const sw = card.querySelector('product-swatches');
                const wl = card.querySelector('.hulk-wishlist-card-btn-wrapper');
                const qa = card.querySelector('quick-add-component');
                if (!sale) continue;
                out.push({
                    cls: card.className,
                    titleSize: title ? getComputedStyle(title).fontSize : null,
                    titleMinH: title ? getComputedStyle(title).minHeight : null,
                    saleText: sale.innerText.trim(),
                    saleSize: getComputedStyle(sale).fontSize,
                    saleColor: getComputedStyle(sale).color,
                    compSize: comp ? getComputedStyle(comp).fontSize : null,
                    discText: disc ? disc.innerText.trim() : null,
                    discBg: disc ? getComputedStyle(disc).backgroundColor : null,
                    hasSwatches: !!sw,
                    hasWishlist: !!wl,
                    hasQuickAdd: !!qa
                });
            }
            return {
                totalCards: cards.length,
                docOverflow: document.documentElement.scrollWidth > window.innerWidth,
                sample: out
            };
        }""")
        print(f"=== {name} (375px) | cards={info['totalCards']} | overflow={info['docOverflow']} ===")
        for idx, c in enumerate(info["sample"]):
            print(f"  [{idx+1}] {c}")
        page.close()
    browser.close()
