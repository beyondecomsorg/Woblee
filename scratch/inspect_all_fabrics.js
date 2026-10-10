const http = require('http');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch(e) {
          resolve(null);
        }
      });
    }).on('error', err => reject(err));
  });
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', err => reject(err));
  });
}

async function run() {
  try {
    const productsData = await fetchJson('http://127.0.0.1:9298/products.json?limit=250');
    if (!productsData || !productsData.products) {
      console.log("Could not fetch products.json");
      return;
    }

    console.log(`Found ${productsData.products.length} products`);

    for (const p of productsData.products) {
      const html = await fetchUrl(`http://127.0.0.1:9298/products/${p.handle}`);
      const match = html.match(/data-meta-title="Fabric"[\s\S]*?<div class="meta-card-content"[^>]*>([\s\S]*?)<\/div>/);
      if (match) {
        console.log(`\n==================== ${p.handle} ====================`);
        // clean out images tag
        const content = match[1].replace(/<div class="fabric-popup-images-container"[\s\S]*?<\/div>/, '');
        console.log(content.trim());
      }
    }
  } catch (err) {
    console.error(err);
  }
}

run();
