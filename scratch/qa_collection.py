from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    try:
        browser = p.chromium.launch(channel="chrome")
    except Exception:
        browser = p.chromium.launch(channel="msedge")
    for width in [320, 360, 375, 390]:
        page = browser.new_page(viewport={"width": width, "height": 844})
        page.goto("https://wobleedesigns.com/collections/bestsellers", wait_until="domcontentloaded", timeout=30000)
        page.wait_for_selector("product-card", timeout=15000)
        page.wait_for_timeout(1500)
        info = page.evaluate("""() => {
            const cards = Array.from(document.querySelectorAll('product-card'));
            const results = [];
            for (const card of cards.slice(0, 4)) {
                const sale = card.querySelector('.price-item--sale, .price__regular .price');
                const comp = card.querySelector('.compare-at-price');
                const disc = card.querySelector('.price-item__discount');
                const pp = card.querySelector('product-price');
                const cardRect = card.getBoundingClientRect();
                const getInfo = (el) => {
                    if (!el) return null;
                    const r = el.getBoundingClientRect();
                    const s = getComputedStyle(el);
                    return {
                        text: el.innerText.trim(),
                        fontSize: s.fontSize,
                        fontWeight: s.fontWeight,
                        color: s.color,
                        top: Math.round(r.top),
                        left: Math.round(r.left),
                        right: Math.round(r.right),
                        bottom: Math.round(r.bottom),
                        overflowsCard: r.right > cardRect.right + 1
                    };
                };
                results.push({
                    cardWidth: Math.round(cardRect.width),
                    cardRight: Math.round(cardRect.right),
                    ppMarginTop: pp ? getComputedStyle(pp).marginTop : null,
                    ppMarginBottom: pp ? getComputedStyle(pp).marginBottom : null,
                    sale: getInfo(sale),
                    comp: getInfo(comp),
                    disc: getInfo(disc)
                });
            }
            return {
                docOverflow: document.documentElement.scrollWidth > window.innerWidth,
                scrollWidth: document.documentElement.scrollWidth,
                innerWidth: window.innerWidth,
                cards: results
            };
        }""")
        print(f"=== WIDTH {width}px | docOverflow={info['docOverflow']} ({info['scrollWidth']}/{info['innerWidth']}) ===")
        for i, c in enumerate(info["cards"]):
            print(f"  Card {i+1} (w={c['cardWidth']}, mt={c['ppMarginTop']}, mb={c['ppMarginBottom']}):")
            print(f"    sale: {c['sale']}")
            print(f"    comp: {c['comp']}")
            print(f"    disc: {c['disc']}")
        if width == 375:
            page.screenshot(path="C:/Users/abala/.gemini/antigravity/brain/b5b52ff8-0428-48e4-9e0b-51a8e7b9f1d0/scratch/qa_collection_375.png")
        page.close()
    browser.close()
