import re

theme_content = open('Woblee/layout/theme.liquid', 'r', encoding='utf-8').read()
m = re.search(r'{% style %}(.*?){% endstyle %}', theme_content, re.DOTALL)
theme_css = m.group(1) if m else ''

col_content = open('Woblee/sections/main-collection.liquid', 'r', encoding='utf-8').read()
m = re.search(r'{% style %}(.*?){% endstyle %}', col_content, re.DOTALL)
col_css = m.group(1) if m else ''
col_css = col_css.replace("{{ section.id }}", "template--20344750145687__main-collection")
col_css = col_css.replace("{{ section.settings.columns_gap_vertical }}", "16")
col_css = col_css.replace("{{ section.settings.columns_gap_vertical | at_most: 12 }}", "12")
col_css = col_css.replace("{{ section.settings.collection_card_title_font_size_desktop }}", "14")
col_css = col_css.replace("{{ section.settings.collection_card_title_font_size_mobile }}", "15")
col_css = col_css.replace("{{ section.settings.collection_card_title_font_weight }}", "700")
col_css = col_css.replace("{{ section.settings.collection_card_price_font_size_desktop }}", "14")
col_css = col_css.replace("{{ section.settings.collection_card_price_font_size_mobile }}", "14")
col_css = col_css.replace("{{ section.settings.collection_card_price_font_weight }}", "400")

base_css = open('Woblee/assets/base.css', 'r', encoding='utf-8').read()

html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
{base_css}
</style>
<style>
{theme_css}
</style>
<style>
{col_css}
</style>
</head>
<body class="template-collection">
<results-list section-id="template--20344750145687__main-collection">
  <div class="product-grid" product-grid-view="default">
    <div class="product-grid__item">
      <product-card class="product-card size-style">
        <div class="product-card__content layout-panel-flex layout-panel-flex--column product-grid__card spacing-style border-style gap-style" style="--product-card-gap: 5px;">
          <div class="card-gallery card-gallery--badge-null" style="--gallery-aspect-ratio: 4 / 5;">
            <div class="product-media-container media-fit product-media-container--image">
              <div id="test-img" style="width:100%;height:100%;background:#dcdfe2;"></div>
            </div>
          </div>
          <div class="group-block group-block--height-fit group-block--width-fill border-style spacing-style size-style" style="--padding-block-start: 0px; --padding-block-end: 0px; --padding-inline-start: 0px; --padding-inline-end: 0px;">
            <div class="group-block-content layout-panel-flex layout-panel-flex--column mobile-column">
              <a class="contents user-select-text" ref="productTitleLink">
                <div class="text-block text-block--align-left">
                  <p role="heading" aria-level="3">Nocturnal Life Men's Regular Fit Graphic Tee</p>
                </div>
              </a>
              <product-price class="text-block text-left h6 spacing-style">
                <div class="price">Rs. 899</div>
              </product-price>
            </div>
          </div>
        </div>
      </product-card>
    </div>
  </div>
</results-list>
<script>
window.addEventListener('load', () => {{
  const img = document.querySelector('#test-img').getBoundingClientRect();
  const gallery = document.querySelector('.card-gallery').getBoundingClientRect();
  const group = document.querySelector('.group-block').getBoundingClientRect();
  const groupContent = document.querySelector('.group-block-content').getBoundingClientRect();
  const titleA = document.querySelector('a[ref="productTitleLink"]').getBoundingClientRect();
  const p = document.querySelector('a[ref="productTitleLink"] p').getBoundingClientRect();
  
  const report = {{
    img: {{ top: img.top, bottom: img.bottom, height: img.height }},
    gallery: {{ top: gallery.top, bottom: gallery.bottom, height: gallery.height }},
    group: {{ top: group.top, bottom: group.bottom, height: group.height, marginTop: getComputedStyle(document.querySelector('.group-block')).marginTop }},
    groupContent: {{ top: groupContent.top, bottom: groupContent.bottom, height: groupContent.height, marginTop: getComputedStyle(document.querySelector('.group-block-content')).marginTop }},
    titleA: {{ top: titleA.top, bottom: titleA.bottom, height: titleA.height, marginTop: getComputedStyle(document.querySelector('a[ref="productTitleLink"]')).marginTop }},
    p: {{ top: p.top, bottom: p.bottom, height: p.height, marginTop: getComputedStyle(document.querySelector('a[ref="productTitleLink"] p')).marginTop }},
    gap_gallery_to_p: p.top - gallery.bottom,
    gap_img_to_p: p.top - img.bottom
  }};
  
  const div = document.createElement('div');
  div.id = 'report';
  div.innerText = JSON.stringify(report, null, 2);
  document.body.appendChild(div);
}});
</script>
</body>
</html>
'''

with open('Woblee/scratch/actual_test.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('Wrote actual_test.html')

