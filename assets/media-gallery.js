import { Component } from '@theme/component';
import { ThemeEvents } from '@theme/events';

/**
 * A custom element that renders a media gallery with dynamic variant-specific image filtering.
 *
 * @typedef {object} Refs
 * @property {import('./zoom-dialog').ZoomDialog} [zoomDialogComponent] - The zoom dialog component.
 * @property {import('./slideshow').Slideshow} [slideshow] - The slideshow component.
 * @property {HTMLElement[]} [media] - The media elements.
 *
 * @extends Component<Refs>
 */
export class MediaGallery extends Component {
  #controller = new AbortController();

  connectedCallback() {
    super.connectedCallback();

    const { signal } = this.#controller;
    const target = this.closest('.shopify-section, dialog') || document;

    target.addEventListener(ThemeEvents.variantUpdate, this.#handleVariantUpdate, { signal });
    target.addEventListener(ThemeEvents.variantSelected, this.#handleVariantSelected, { signal });

    // Listen to input changes directly on variant picker for zero-delay response
    const variantPicker = this.closest('.shopify-section, dialog')?.querySelector('variant-picker') || document.querySelector('variant-picker');
    if (variantPicker) {
      variantPicker.addEventListener('change', this.#handleVariantPickerChange, { signal });
    }

    this.refs.zoomDialogComponent?.addEventListener(ThemeEvents.zoomMediaSelected, this.#handleZoomMediaSelected, {
      signal,
    });

    // Run initial variant image filtering on load
    queueMicrotask(() => {
      this.filterGalleryForCurrentVariant();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#controller.abort();
  }

  #handleVariantUpdate = (event) => {
    const variant = event.detail?.resource || null;
    this.filterGalleryForCurrentVariant(variant);
  };

  #handleVariantSelected = () => {
    this.filterGalleryForCurrentVariant();
  };

  #handleVariantPickerChange = () => {
    setTimeout(() => {
      this.filterGalleryForCurrentVariant();
    }, 10);
  };

  #handleZoomMediaSelected = async (event) => {
    this.slideshow?.select(event.detail.index, undefined, { animate: false });
  };

  /**
   * Filters the media gallery for the selected variant options using image ALT text logic.
   * @param {Object} [variant] - Optional Shopify variant resource object
   */
  filterGalleryForCurrentVariant(variant = null) {
    const galleryData = this.#getGalleryData();
    if (!galleryData || !galleryData.media || !galleryData.media.length) {
      this.#fallbackFeaturedMediaScroll(variant);
      return;
    }

    const selectedOptions = this.#getSelectedOptions(galleryData, variant);
    const filteredMedia = this.#computeFilteredMedia(galleryData, selectedOptions);

    this.#applyFilteredMedia(filteredMedia, variant);
  }

  #getGalleryData() {
    const script = this.querySelector('script[data-media-gallery-json]');
    if (!script) return null;
    try {
      return JSON.parse(script.textContent);
    } catch (e) {
      console.error('Error parsing media gallery JSON:', e);
      return null;
    }
  }

  #getSelectedOptions(galleryData) {
    const selectedOptions = {};

    // Read selected options directly from DOM variant picker
    const variantPicker = this.closest('.shopify-section, dialog')?.querySelector('variant-picker') || document.querySelector('variant-picker');
    if (!variantPicker) return selectedOptions;

    // 1. Radio button fieldsets (only if an input is explicitly checked and active)
    const fieldsets = variantPicker.querySelectorAll('fieldset.variant-option');
    fieldsets.forEach((fieldset, idx) => {
      let optionName = fieldset.getAttribute('data-option-name');
      if (!optionName) {
        const legendTitle = fieldset.querySelector('.variant-option__legend-title');
        optionName = legendTitle ? legendTitle.childNodes[0]?.textContent?.trim() : null;
      }
      if (!optionName && galleryData.options && galleryData.options[idx]) {
        optionName = galleryData.options[idx];
      }
      const checkedRadio = fieldset.querySelector('input[type="radio"]:checked');
      if (optionName && checkedRadio && checkedRadio.value && checkedRadio.dataset.currentChecked !== 'false') {
        selectedOptions[optionName] = checkedRadio.value.trim();
      }
    });

    // 2. Select dropdowns (only if a valid option is selected)
    const dropdownContainers = variantPicker.querySelectorAll('.variant-option--dropdowns');
    dropdownContainers.forEach((container, idx) => {
      let optionName = container.getAttribute('data-option-name');
      if (!optionName) {
        const label = container.querySelector('label');
        optionName = label ? label.textContent.trim() : null;
      }
      if (!optionName && galleryData.options && galleryData.options[idx]) {
        optionName = galleryData.options[idx];
      }
      const select = container.querySelector('select');
      if (optionName && select && select.value && select.value !== '') {
        const selectedOpt = select.options[select.selectedIndex];
        if (selectedOpt && !selectedOpt.disabled) {
          selectedOptions[optionName] = select.value.trim();
        }
      }
    });

    return selectedOptions;
  }

  #computeFilteredMedia(galleryData, selectedOptions) {
    const normalize = (str) => {
      if (!str) return '';
      return String(str)
        .toLowerCase()
        .trim()
        .replace(/[-_]/g, ' ')
        .replace(/\s+/g, ' ');
    };

    const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const containsOptionValue = (normAlt, normVal) => {
      if (!normAlt || !normVal) return false;
      const escaped = escapeRegExp(normVal);
      const regex = new RegExp(`(?:^|[\\s_\\-,.;:/])${escaped}(?:$|[\\s_\\-,.;:/])`, 'i');
      return regex.test(normAlt);
    };

    const optionsWithValues = galleryData.options_with_values || [];
    const allMedia = galleryData.media || [];

    // Collect all possible option values across all options for this product
    const allOptionValues = [];
    optionsWithValues.forEach((opt) => {
      opt.values.forEach((val) => {
        allOptionValues.push({
          optionName: opt.name,
          normValue: normalize(val),
        });
      });
    });

    // Check if the product has ANY variant-specific ALT text across all media
    let productHasVariantAltText = false;
    allMedia.forEach((m) => {
      const normAlt = normalize(m.alt);
      if (!normAlt) return;
      for (const item of allOptionValues) {
        if (containsOptionValue(normAlt, item.normValue)) {
          productHasVariantAltText = true;
          break;
        }
      }
    });

    // Fallback: If product has no variant-specific ALT text, keep all images unchanged
    if (!productHasVariantAltText) {
      return [...allMedia];
    }

    const scoredMedia = [];

    allMedia.forEach((media, originalIndex) => {
      const normAlt = normalize(media.alt);
      let isExcluded = false;
      let matchedSelectedCount = 0;
      let totalOptionsInAltCount = 0;

      if (normAlt) {
        optionsWithValues.forEach((opt) => {
          const selectedVal = selectedOptions[opt.name];
          if (!selectedVal) return; // If this option is not currently selected by user, skip checking

          const normSelectedVal = normalize(selectedVal);

          // Find which values of this option are present in ALT text
          const foundValuesForOption = [];
          opt.values.forEach((val) => {
            const normVal = normalize(val);
            if (containsOptionValue(normAlt, normVal)) {
              foundValuesForOption.push(normVal);
            }
          });

          if (foundValuesForOption.length > 0) {
            totalOptionsInAltCount++;

            // Does any found value match the selected value for this option?
            const matchesSelected = normSelectedVal && foundValuesForOption.includes(normSelectedVal);

            if (matchesSelected) {
              matchedSelectedCount++;
            } else {
              // ALT text contains a value for this option that DOES NOT match currently selected value -> EXCLUSION
              isExcluded = true;
            }
          }
        });
      }

      let score = -1;
      if (!isExcluded) {
        if (matchedSelectedCount > 0) {
          score = matchedSelectedCount === totalOptionsInAltCount ? 2 : 1;
        } else if (totalOptionsInAltCount === 0) {
          score = 0; // General image (no variant info in ALT)
        }
      }

      if (score >= 0) {
        scoredMedia.push({ media, score, originalIndex });
      }
    });

    // Sort matching media: Score 2 (Exact match) -> Score 1 (Option match) -> Score 0 (General image)
    // Preserve relative original order within each score tier
    scoredMedia.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.originalIndex - b.originalIndex;
    });

    const filtered = scoredMedia.map((item) => item.media);

    // Fallback: If no matching images found for selected variant, use all product images
    return filtered.length > 0 ? filtered : [...allMedia];
  }

  #applyFilteredMedia(filteredMedia, variant) {
    // Limit top gallery to maximum 4 matching images, remaining go to extended gallery
    const topMedia = filteredMedia.slice(0, 4);
    const extendedMedia = filteredMedia.slice(4);

    const topMatchingIds = topMedia.map((m) => String(m.id));
    const topMatchingSet = new Set(topMatchingIds);

    const extendedMatchingIds = extendedMedia.map((m) => String(m.id));
    const extendedMatchingSet = new Set(extendedMatchingIds);

    const allMatchingIds = filteredMedia.map((m) => String(m.id));
    const allMatchingSet = new Set(allMatchingIds);

    // 1. Filter and reorder Slideshow Slides (Top gallery: max 4 images)
    const slides = Array.from(this.querySelectorAll('slideshow-slide'));
    const slidesMap = new Map();
    slides.forEach((slide) => {
      const slideId = String(slide.getAttribute('slide-id') || '');
      if (slideId) slidesMap.set(slideId, slide);
    });

    const scroller = this.querySelector('slideshow [ref="scroller"], slideshow .slideshow__scroller, .slideshow');

    slides.forEach((slide) => {
      const slideId = String(slide.getAttribute('slide-id') || '');
      if (topMatchingSet.has(slideId)) {
        slide.removeAttribute('hidden');
        slide.style.setProperty('display', '', '');
      } else {
        slide.setAttribute('hidden', '');
        slide.style.setProperty('display', 'none', 'important');
      }
    });

    if (scroller) {
      topMatchingIds.forEach((id) => {
        const slideEl = slidesMap.get(id);
        if (slideEl) scroller.appendChild(slideEl);
      });
    }

    // 2. Filter and reorder Slideshow Controls / Thumbnails (Top gallery: max 4 images)
    const thumbnailButtons = Array.from(this.querySelectorAll('.slideshow-controls__thumbnail'));
    const thumbnailMap = new Map();
    thumbnailButtons.forEach((btn) => {
      const mediaId = String(btn.getAttribute('data-media-id') || '');
      if (mediaId) thumbnailMap.set(mediaId, btn);
    });

    const thumbnailsContainer = this.querySelector('.slideshow-controls__thumbnails');

    thumbnailButtons.forEach((btn) => {
      const mediaId = String(btn.getAttribute('data-media-id') || '');
      if (topMatchingSet.has(mediaId)) {
        btn.removeAttribute('hidden');
        btn.style.setProperty('display', '', '');
      } else {
        btn.setAttribute('hidden', '');
        btn.style.setProperty('display', 'none', 'important');
      }
    });

    if (thumbnailsContainer) {
      topMatchingIds.forEach((id, newIndex) => {
        const btn = thumbnailMap.get(id);
        if (btn) {
          btn.setAttribute('on:click', `/select/${newIndex}`);
          thumbnailsContainer.appendChild(btn);
        }
      });
    }

    // 3. Filter and reorder Grid Items (Top gallery: max 4 images)
    const gridContainer = this.querySelector('ul.media-gallery__grid');
    if (gridContainer) {
      const gridItems = Array.from(gridContainer.querySelectorAll('li[data-media-id]'));
      const gridMap = new Map();
      gridItems.forEach((li) => {
        const mediaId = String(li.getAttribute('data-media-id') || '');
        if (mediaId) gridMap.set(mediaId, li);
      });

      gridItems.forEach((li) => {
        const mediaId = String(li.getAttribute('data-media-id') || '');
        if (topMatchingSet.has(mediaId)) {
          li.removeAttribute('hidden');
          li.style.setProperty('display', '', '');
        } else {
          li.setAttribute('hidden', '');
          li.style.setProperty('display', 'none', 'important');
        }
      });

      topMatchingIds.forEach((id) => {
        const li = gridMap.get(id);
        if (li) gridContainer.appendChild(li);
      });
    }

    // 4. Filter and reorder Extended Gallery Items (5th matching image onward)
    const extendedGalleryWrapper = document.querySelector('.product-extended-gallery-wrapper');
    if (extendedGalleryWrapper) {
      const extendedContainer = extendedGalleryWrapper.querySelector('.product-extended-gallery__grid');
      const extendedItems = Array.from(extendedGalleryWrapper.querySelectorAll('.product-extended-gallery__item[data-media-id]'));
      const extendedMap = new Map();
      extendedItems.forEach((item) => {
        const mediaId = String(item.getAttribute('data-media-id') || '');
        if (mediaId) extendedMap.set(mediaId, item);
      });

      extendedItems.forEach((item) => {
        const mediaId = String(item.getAttribute('data-media-id') || '');
        if (extendedMatchingSet.has(mediaId)) {
          item.removeAttribute('hidden');
          item.style.setProperty('display', '', '');
        } else {
          item.setAttribute('hidden', '');
          item.style.setProperty('display', 'none', 'important');
        }
      });

      if (extendedContainer) {
        extendedMatchingIds.forEach((id) => {
          const item = extendedMap.get(id);
          if (item) extendedContainer.appendChild(item);
        });
      }

      if (extendedMatchingIds.length > 0) {
        extendedGalleryWrapper.style.setProperty('display', 'block', 'important');
      } else {
        extendedGalleryWrapper.style.setProperty('display', 'none', 'important');
      }
    }

    // 5. Filter and reorder Zoom Dialog Media and Thumbnails (all matching images)
    const zoomDialog = this.refs.zoomDialogComponent || this.querySelector('zoom-dialog');
    if (zoomDialog) {
      const zoomItems = Array.from(zoomDialog.querySelectorAll('dialog .dialog-zoomed-gallery li[data-media-id], dialog li[data-media-id]'));
      const zoomItemMap = new Map();
      zoomItems.forEach((item) => {
        const mediaId = String(item.getAttribute('data-media-id') || '');
        if (mediaId) zoomItemMap.set(mediaId, item);
      });

      const zoomGalleryList = zoomDialog.querySelector('.dialog-zoomed-gallery');
      zoomItems.forEach((item) => {
        const mediaId = String(item.getAttribute('data-media-id') || '');
        if (allMatchingSet.has(mediaId)) {
          item.removeAttribute('hidden');
          item.style.setProperty('display', '', '');
        } else {
          item.setAttribute('hidden', '');
          item.style.setProperty('display', 'none', 'important');
        }
      });
      if (zoomGalleryList) {
        allMatchingIds.forEach((id) => {
          const item = zoomItemMap.get(id);
          if (item) zoomGalleryList.appendChild(item);
        });
      }

      // Zoom thumbnails
      const zoomThumbnailsContainer = zoomDialog.querySelector('.dialog-thumbnails-list');
      const zoomThumbnails = Array.from(zoomDialog.querySelectorAll('.dialog-thumbnails-list__thumbnail'));
      const zoomThumbnailMap = new Map();
      zoomThumbnails.forEach((btn) => {
        const mediaId = String(btn.getAttribute('data-media-id') || '');
        if (mediaId) zoomThumbnailMap.set(mediaId, btn);
      });

      zoomThumbnails.forEach((btn) => {
        const mediaId = String(btn.getAttribute('data-media-id') || '');
        if (allMatchingSet.has(mediaId)) {
          btn.removeAttribute('hidden');
          btn.style.setProperty('display', '', '');
        } else {
          btn.setAttribute('hidden', '');
          btn.style.setProperty('display', 'none', 'important');
        }
      });

      if (zoomThumbnailsContainer) {
        allMatchingIds.forEach((id, newIndex) => {
          const btn = zoomThumbnailMap.get(id);
          if (btn) {
            btn.setAttribute('on:click', `/handleThumbnailClick/${newIndex}`);
            zoomThumbnailsContainer.appendChild(btn);
          }
        });
      }
    }

    // 6. Reset slideshow selection to target featured image or first visible slide
    const targetMediaId = variant?.featured_media?.id ? String(variant.featured_media.id) : null;
    let targetIndex = 0;
    if (targetMediaId && topMatchingIds.includes(targetMediaId)) {
      targetIndex = topMatchingIds.indexOf(targetMediaId);
    }

    if (this.slideshow) {
      this.slideshow.select(targetIndex, undefined, { animate: false });
    }

    // Update thumbnail selection styling
    const visibleThumbnails = Array.from(this.querySelectorAll('.slideshow-controls__thumbnail:not([hidden])'));
    visibleThumbnails.forEach((btn, index) => {
      btn.setAttribute('aria-selected', String(index === targetIndex));
    });
  }

  #fallbackFeaturedMediaScroll(variant) {
    if (!variant) return;
    const mediaId = variant.featured_media?.id;
    if (!mediaId) return;

    if (this.slideshow) {
      this.slideshow.select({ id: mediaId.toString() });
    }

    const targetMedia = this.refs.media?.find(
      (el) => el.getAttribute('data-media-id') == mediaId
    );
    if (targetMedia) {
      targetMedia.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  /**
   * Zooms the media gallery.
   * @param {number} index - The index of the media to zoom.
   * @param {PointerEvent} event - The pointer event.
   */
  zoom(index, event) {
    this.refs.zoomDialogComponent?.open(index, event);
  }

  /**
   * Preloads an image.
   * @param {number} index - The index of the media to preload.
   */
  preloadImage(index) {
    const zoomDialogMedia = this.refs.zoomDialogComponent?.refs.media?.[index];
    if (!zoomDialogMedia) return;

    this.refs.zoomDialogComponent?.loadHighResolutionImage(zoomDialogMedia);
  }

  get slideshow() {
    return this.refs.slideshow;
  }

  get media() {
    return this.refs.media;
  }

  get presentation() {
    return this.dataset.presentation;
  }
}

if (!customElements.get('media-gallery')) {
  customElements.define('media-gallery', MediaGallery);
}

