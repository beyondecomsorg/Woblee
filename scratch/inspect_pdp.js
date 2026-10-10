const http = require('http');

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
    const html1 = await fetchUrl('http://127.0.0.1:9298/products/ekdum-kadak-mens-tee?variant=48010825564311');
    const html2 = await fetchUrl('http://127.0.0.1:9298/products/base-camp-boys-tee?variant=68024818499735');
    
    console.log("=== EKDUM KADAK (OLD WORKING PRODUCT) ===");
    const match1 = html1.match(/data-meta-title="Fabric"[\s\S]*?<div class="meta-card-content"[^>]*>([\s\S]*?)<\/div>/);
    if (match1) {
      console.log(match1[1]);
    } else {
      console.log("Not found in html1");
    }

    console.log("\n=== BASE CAMP BOYS TEE (NEW PRODUCT) ===");
    const match2 = html2.match(/data-meta-title="Fabric"[\s\S]*?<div class="meta-card-content"[^>]*>([\s\S]*?)<\/div>/);
    if (match2) {
      console.log(match2[1]);
    } else {
      console.log("Not found in html2");
    }
  } catch (err) {
    console.error(err);
  }
}

run();
