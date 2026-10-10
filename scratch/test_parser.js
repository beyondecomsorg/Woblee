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

function parseFabricHtml(content) {
  let images = [];
  const imgMatches = content.match(/<img[^>]*class="fabric-popup-image"[^>]*>/g);
  if (imgMatches) {
    images = imgMatches;
  }

  // Remove hidden image container HTML from raw text content
  content = content.replace(/<div class="fabric-popup-images-container"[\s\S]*?<\/div>/g, '');

  let rawHtml = content
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '');

  let textContent = rawHtml;

  let lines = textContent.split('\n').map(l => l.trim()).filter(Boolean);

  const knownHeadings = [
    'WHY WE CHOSE IT',
    'BIO WASH',
    'CPL WASH',
    'HEAVY ENZYME WASH',
    'ENZYME WASH',
    'SINGLE JERSEY',
    'INTERLOCK',
    'LOOP KNIT',
    'TERRY',
    'PURE COTTON'
  ];

  function inferHeading(line) {
    const l = line.toLowerCase();
    if (l.includes('pure cotton') || l.includes('naturally breathable')) {
      return 'PURE COTTON';
    }
    if (l.includes('soft, flexible knit') || l.includes('single jersey') || l.includes('smooth outer surface')) {
      return 'SINGLE JERSEY - 180-190 GSM';
    }
    if (l.includes('interlock')) {
      return 'INTERLOCK - 220 GSM';
    }
    if (l.includes('loop knit') || l.includes('terry')) {
      return 'TERRY / LOOP KNIT';
    }
    if (l.includes('enzyme-based finish') || l.includes('loose surface fibres') || l.includes('bio wash')) {
      return 'BIO WASH';
    }
    if (l.includes('pre-construction washing') || l.includes('cpl wash') || l.includes('fabric shrinkage')) {
      return 'CPL WASH';
    }
    if (l.includes('specialised enzymes') || l.includes('specialized enzymes') || l.includes('enzyme wash')) {
      return 'ENZYME WASH';
    }
    if (l.includes('why we chose it')) {
      return 'WHY WE CHOSE IT';
    }
    return null;
  }

  const hasExplicitHeading = lines.some(line => {
    let lineUpper = line.toUpperCase().trim();
    return knownHeadings.some(h => {
      return lineUpper === h || 
             lineUpper.startsWith(h + ' ') || 
             lineUpper.startsWith(h + '-') || 
             lineUpper.startsWith(h + ' -') || 
             lineUpper.indexOf(h) === 0;
    });
  });

  let sections = [];
  let currentSection = null;

  if (hasExplicitHeading) {
    lines.forEach(line => {
      let lineUpper = line.toUpperCase().trim();
      let isHeading = knownHeadings.some(h => {
        return lineUpper === h || 
               lineUpper.startsWith(h + ' ') || 
               lineUpper.startsWith(h + '-') || 
               lineUpper.startsWith(h + ' -') || 
               lineUpper.indexOf(h) === 0;
      });

      if (isHeading) {
        if (currentSection) sections.push(currentSection);
        currentSection = {
          heading: line,
          descriptions: []
        };
      } else {
        if (currentSection) {
          currentSection.descriptions.push(line);
        } else {
          currentSection = {
            heading: '',
            descriptions: [line]
          };
        }
      }
    });
    if (currentSection) sections.push(currentSection);
  } else {
    lines.forEach(line => {
      const inferred = inferHeading(line);
      if (inferred) {
        if (currentSection && currentSection.heading === inferred) {
          currentSection.descriptions.push(line);
        } else {
          if (currentSection) sections.push(currentSection);
          currentSection = {
            heading: inferred,
            descriptions: [line]
          };
        }
      } else {
        if (currentSection) {
          currentSection.descriptions.push(line);
        } else {
          currentSection = {
            heading: '',
            descriptions: [line]
          };
        }
      }
    });
    if (currentSection) sections.push(currentSection);
  }

  let newHtml = '';
  let imageIdx = 0;

  sections.forEach((sec, idx) => {
    let hasImage = imageIdx < images.length;
    let isSideBySide = hasImage && idx === 1;

    if (isSideBySide) {
      newHtml += '<div class="fabric-section-side-by-side">\n';
      newHtml += '  <div class="fabric-section-side-text">\n';
      if (sec.heading) newHtml += '    <h3>' + sec.heading + '</h3>\n';
      if (sec.descriptions.length > 0) {
        sec.descriptions.forEach(desc => {
          newHtml += '    <p class="fabric-section-desc">' + desc + '</p>\n';
        });
      }
      newHtml += '  </div>\n';
      newHtml += '  <div class="fabric-section-side-image">\n';
      newHtml += '    ' + (images[imageIdx] || '') + '\n';
      newHtml += '  </div>\n';
      newHtml += '</div>\n';
      imageIdx++;
    } else {
      if (sec.heading) {
        newHtml += '<h3>' + sec.heading + '</h3>\n';
      }
      if (sec.descriptions.length > 0) {
        sec.descriptions.forEach(desc => {
          newHtml += '<p class="fabric-section-desc">' + desc + '</p>\n';
        });
      }
      if (hasImage) {
        const extraClass = imageIdx === 0 ? ' fabric-floating-first' : '';
        newHtml += '<div class="fabric-intercalated-image-container' + extraClass + '">' + (images[imageIdx] || '') + '</div>\n';
        imageIdx++;
      }
    }
  });

  while (imageIdx < images.length) {
    newHtml += '<div class="fabric-intercalated-image-container">' + (images[imageIdx] || '') + '</div>\n';
    imageIdx++;
  }

  return newHtml;
}

async function run() {
  const html1 = await fetchUrl('http://127.0.0.1:9298/products/ekdum-kadak-mens-tee?variant=48010825564311');
  const html2 = await fetchUrl('http://127.0.0.1:9298/products/base-camp-boys-tee?variant=68024818499735');

  const match1 = html1.match(/data-meta-title="Fabric"[\s\S]*?<div class="meta-card-content"[^>]*>([\s\S]*?)<\/div>/);
  const match2 = html2.match(/data-meta-title="Fabric"[\s\S]*?<div class="meta-card-content"[^>]*>([\s\S]*?)<\/div>/);

  console.log("=== OUTPUT FOR OLD PRODUCT (EKDUM KADAK) ===");
  console.log(parseFabricHtml(match1[1]));

  console.log("\n=== OUTPUT FOR NEW PRODUCT (BASE CAMP BOYS TEE) ===");
  console.log(parseFabricHtml(match2[1]));
}

run();
