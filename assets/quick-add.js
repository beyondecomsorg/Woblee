import { morph } from '@theme/morph';
import { Component } from '@theme/component';
import { CartUpdateEvent, ThemeEvents, VariantSelectedEvent } from '@theme/events';
import { DialogComponent, DialogCloseEvent } from '@theme/dialog';
import { mediaQueryLarge, isMobileBreakpoint, getIOSVersion } from '@theme/utilities';
import VariantPicker from '@theme/variant-picker';

export class QuickAddComponent extends Component {
  /** @type {AbortController | null} */
  #abortController = null;
  /** @type {Map<string, Element>} */
  #cachedContent = new Map();
  /** @type {AbortController} */
  #cartUpdateAbortController = new AbortController();

  get productPageUrl() {
    const productCard = /** @type {import('./product-card').ProductCard | null} */ (this.closest('product-card'));
    const hotspotProduct = /** @type {import('./product-hotspot').ProductHotspotComponent | null} */ (
      this.closest('product-hotspot-component')
    );
    const productLink = productCard?.getProductCardLink() || hotspotProduct?.getHotspotProductLink();

    if (!productLink?.href) return '';

    const url = new URL(productLink.href);

    if (url.searchParams.has('variant')) {
      return url.toString();
    }

    const selectedVariantId = this.#getSelectedVariantId();
    if (selectedVariantId) {
      url.searchParams.set('variant', selectedVariantId);
    }

    return url.toString();
  }

  /**
   * Gets the currently selected variant ID from the product card
   * @returns {string | null} The variant ID or null
   */
  #getSelectedVariantId() {
    const productCard = /** @type {import('./product-card').ProductCard | null} */ (this.closest('product-card'));
    return productCard?.getSelectedVariantId() || null;
  }

  connectedCallback() {
    super.connectedCallback();

    mediaQueryLarge.addEventListener('change', this.#closeQuickAddModal);
    document.addEventListener(ThemeEvents.cartUpdate, this.#handleCartUpdate, {
      signal: this.#cartUpdateAbortController.signal,
    });
    document.addEventListener(ThemeEvents.variantSelected, this.#updateQuickAddButtonState.bind(this));
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    mediaQueryLarge.removeEventListener('change', this.#closeQuickAddModal);
    this.#abortController?.abort();
    this.#cartUpdateAbortController.abort();
    document.removeEventListener(ThemeEvents.variantSelected, this.#updateQuickAddButtonState.bind(this));
  }

  /**
   * Clears the cached content when cart is updated
   */
  #handleCartUpdate = () => {
    this.#cachedContent.clear();
  };

  /**
   * Re-renders the variant picker in the quick-add modal.
   * @param {Element} newHtml - The element to re-render.
   */
  #updateVariantPicker(newHtml) {
    const modalContent = document.getElementById('quick-add-modal-content');
    if (!modalContent) return;
    const variantPicker = /** @type {VariantPicker | null} */ (modalContent.querySelector('variant-picker'));
    if (!variantPicker) return;
    variantPicker.updateVariantPicker(newHtml);
  }

  /**
   * Gets a cloned quick-view description block from product markup.
   * @param {ParentNode} root
   * @returns {HTMLElement | null}
   */
  #cloneDescription(root) {
    const template = root.querySelector('.quick-view__description-template');
    if (!(template instanceof HTMLTemplateElement)) return null;

    const description = template.content.firstElementChild?.cloneNode(true);
    return description instanceof HTMLElement ? description : null;
  }

  /**
   * Inserts the description below the price and above the variant selectors.
   * @param {ParentNode} root
   * @param {HTMLElement} description
   */
  #insertDescription(root, description) {
    const productHeader = root.querySelector('.product-header');
    const productPrice = root.querySelector('.product-details product-price, .product-header product-price');
    const variantPicker = root.querySelector('variant-picker');

    description.hidden = false;

    if (productHeader?.parentNode) {
      if (variantPicker?.parentNode === productHeader.parentNode) {
        productHeader.parentNode.insertBefore(description, variantPicker);
      } else {
        productHeader.parentNode.insertBefore(description, productHeader.nextSibling);
      }
      return;
    }

    if (productPrice?.parentNode) {
      productPrice.parentNode.insertBefore(description, productPrice.nextSibling);
      return;
    }

    if (variantPicker?.parentNode) {
      variantPicker.parentNode.insertBefore(description, variantPicker);
    }
  }

  /**
   * Handles quick add button click
   * @param {Event} event - The click event
   */
  handleClick = async (event) => {
    event.preventDefault();

    const currentUrl = this.productPageUrl;

    // Check if we have cached content for this URL
    let productGrid = this.#cachedContent.get(currentUrl);

    if (!productGrid) {
      // Fetch and cache the content
      const html = await this.fetchProductPage(currentUrl);
      if (html) {
        const gridElement = html.querySelector('[data-product-grid-content]');
        if (gridElement) {
          // Cache the cloned element to avoid modifying the original
          productGrid = /** @type {Element} */ (gridElement.cloneNode(true));
          this.#cachedContent.set(currentUrl, productGrid);
        }
      }
    }

    if (productGrid) {
      // Use a fresh clone from the cache
      const freshContent = /** @type {Element} */ (productGrid.cloneNode(true));
      await this.updateQuickAddModal(freshContent);
      this.#updateVariantPicker(productGrid);
    }

    this.#openQuickAddModal();
  };

  #resetScroll() {
    const dialogComponent = document.getElementById('quick-add-dialog');
    if (!(dialogComponent instanceof QuickAddDialog)) return;

    const productDetails = dialogComponent.querySelector('.product-details');
    const productMedia = dialogComponent.querySelector('.product-information__media');
    productDetails?.scrollTo({ top: 0, behavior: 'instant' });
    productMedia?.scrollTo({ top: 0, behavior: 'instant' });
  }

  /** @param {QuickAddDialog} dialogComponent */
  #stayVisibleUntilDialogCloses(dialogComponent) {
    this.toggleAttribute('stay-visible', true);

    dialogComponent.addEventListener(DialogCloseEvent.eventName, () => this.toggleAttribute('stay-visible', false), {
      once: true,
    });
  }

  #openQuickAddModal = () => {
    const dialogComponent = document.getElementById('quick-add-dialog');
    if (!(dialogComponent instanceof QuickAddDialog)) return;

    this.#stayVisibleUntilDialogCloses(dialogComponent);

    dialogComponent.showDialog();

    // is nondeterministic when the open attribute is set on the dialog element after .showDialog() is called.
    // Waiting until the open animation starts seemed to be the most reliable metric here.
    const dialog = dialogComponent.refs?.dialog;
    if (!dialog) return;
    dialog.addEventListener('animationstart', this.#resetScroll.bind(this), { once: true });
  };

  #closeQuickAddModal = () => {
    const dialogComponent = document.getElementById('quick-add-dialog');
    if (!(dialogComponent instanceof QuickAddDialog)) return;

    dialogComponent.closeDialog();
  };

  /**
   * Fetches the product page content
   * @param {string} productPageUrl - The URL of the product page to fetch
   * @returns {Promise<Document | null>}
   */
  async fetchProductPage(productPageUrl) {
    if (!productPageUrl) return null;

    // We use this to abort the previous fetch request if it's still pending.
    this.#abortController?.abort();
    this.#abortController = new AbortController();

    try {
      const response = await fetch(productPageUrl, {
        signal: this.#abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch product page: HTTP error ${response.status}`);
      }

      const responseText = await response.text();
      const html = new DOMParser().parseFromString(responseText, 'text/html');

      return html;
    } catch (error) {
      if (error.name === 'AbortError') {
        return null;
      } else {
        throw error;
      }
    } finally {
      this.#abortController = null;
    }
  }

  /**
   * Re-renders the variant picker.
   * @param {Element} productGrid - The product grid element
   */
  async updateQuickAddModal(productGrid) {
    const modalContent = document.getElementById('quick-add-modal-content');

    if (!productGrid || !modalContent) return;

    const description = this.#cloneDescription(productGrid);

    morph(modalContent, productGrid);

    if (isMobileBreakpoint()) {
      const modalProductDetails = modalContent.querySelector('.product-details');
      const modalProductFormComponent = modalContent.querySelector('product-form-component');
      const modalVariantPicker = modalContent.querySelector('variant-picker');
      const modalProductPrice = modalContent.querySelector('.product-details product-price, .product-header product-price');
      const quickViewAccordions = /** @type {HTMLElement | null} */ (
        modalProductDetails?.querySelector('.quick-view-pdp-accordions') || modalContent.querySelector('.quick-view-pdp-accordions')
      );

      modalContent.querySelector('.product-header')?.remove();
      modalContent.querySelectorAll('.quick-add-mobile-accordion').forEach((accordionBlock) => accordionBlock.remove());

      const productHeader = document.createElement('div');
      productHeader.classList.add('product-header');

      const productTitle = document.createElement('a');
      productTitle.textContent = this.dataset.productTitle || '';
      productTitle.href = this.productPageUrl;
      productHeader.appendChild(productTitle);

      if (modalProductPrice) {
        productHeader.appendChild(modalProductPrice);
      }

      modalContent.appendChild(productHeader);

      if (description) {
        this.#insertDescription(modalContent, description.cloneNode(true));
      }

      if (modalVariantPicker) {
        modalContent.appendChild(modalVariantPicker);
      }

      if (modalProductFormComponent) {
        modalContent.appendChild(modalProductFormComponent);
      }

      if (quickViewAccordions) {
        quickViewAccordions.hidden = false;
        quickViewAccordions.classList.add('quick-add-mobile-accordion');
        quickViewAccordions.querySelectorAll('accordion-custom').forEach((accordionCustom) => {
          accordionCustom.removeAttribute('open-by-default-on-mobile');
        });
        quickViewAccordions.querySelectorAll('details').forEach((details) => {
          details.removeAttribute('open');
        });
        const insertAfter = /** @type {HTMLElement | Element} */ (
          modalProductFormComponent || modalContent.querySelector('.buy-buttons-block') || modalVariantPicker || productHeader
        );
        insertAfter.insertAdjacentElement('afterend', quickViewAccordions);
      }

      modalProductDetails?.remove();
    } else if (description) {
      this.#insertDescription(modalContent, description);
    }

    if (!isMobileBreakpoint()) {
      const quickViewAccordions = /** @type {HTMLElement | null} */ (modalContent.querySelector('.quick-view-pdp-accordions'));
      const buyButtons = modalContent.querySelector('.buy-buttons-block');
      if (quickViewAccordions && buyButtons) {
        quickViewAccordions.hidden = false;
        quickViewAccordions.querySelectorAll('accordion-custom').forEach((accordionCustom) => {
          accordionCustom.removeAttribute('open-by-default-on-mobile');
          accordionCustom.removeAttribute('open-by-default-on-desktop');
        });
        quickViewAccordions.querySelectorAll('details').forEach((details) => {
          details.removeAttribute('open');
        });
        buyButtons.insertAdjacentElement('afterend', quickViewAccordions);
      }
    }

    // Read More button now redirects to product page - no toggle setup needed

    this.#syncVariantSelection(modalContent);
  }

  /**
   * Updates the quick-add button state based on whether a swatch is selected
   * @param {VariantSelectedEvent} event - The variant selected event
   */
  #updateQuickAddButtonState(event) {
    if (!(event.target instanceof HTMLElement)) return;
    if (event.target.closest('product-card') !== this.closest('product-card')) return;
    const productOptionsCount = this.dataset.productOptionsCount;
    const quickAddButton = productOptionsCount === '1' ? 'add' : 'choose';
    this.setAttribute('data-quick-add-button', quickAddButton);
  }

  /**
   * Syncs the variant selection from the product card to the modal
   * @param {Element} modalContent - The modal content element
   */
  #syncVariantSelection(modalContent) {
    const selectedVariantId = this.#getSelectedVariantId();
    if (!selectedVariantId) return;

    // Find and check the corresponding input in the modal
    const modalInputs = modalContent.querySelectorAll('input[type="radio"][data-variant-id]');
    for (const input of modalInputs) {
      if (input instanceof HTMLInputElement && input.dataset.variantId === selectedVariantId && !input.checked) {
        input.checked = true;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        break;
      }
    }
  }
}

if (!customElements.get('quick-add-component')) {
  customElements.define('quick-add-component', QuickAddComponent);
}

class QuickAddDialog extends DialogComponent {
  #abortController = new AbortController();

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener(ThemeEvents.cartUpdate, this.handleCartUpdate, { signal: this.#abortController.signal });
    this.addEventListener(ThemeEvents.variantUpdate, this.#updateProductTitleLink);
    this.addEventListener(ThemeEvents.variantUpdate, this.#updateQuickViewContent);

    this.addEventListener(DialogCloseEvent.eventName, this.#handleDialogClose);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.#abortController.abort();
    this.removeEventListener(DialogCloseEvent.eventName, this.#handleDialogClose);
  }

  /**
   * Closes the dialog
   * @param {CartUpdateEvent} event - The cart update event
   */
  handleCartUpdate = (event) => {
    if (event.detail.data.didError) return;
    this.closeDialog();
  };

  #updateProductTitleLink = (/** @type {CustomEvent} */ event) => {
    const anchorElement = /** @type {HTMLAnchorElement} */ (
      event.detail.data.html?.querySelector('.view-product-title a')
    );
    const viewMoreDetailsLink = /** @type {HTMLAnchorElement} */ (this.querySelector('.view-product-title a'));
    const mobileProductTitle = /** @type {HTMLAnchorElement} */ (this.querySelector('.product-header a'));

    if (!anchorElement) return;

    if (viewMoreDetailsLink) viewMoreDetailsLink.href = anchorElement.href;
    if (mobileProductTitle) mobileProductTitle.href = anchorElement.href;
  };

  #handleDialogClose = () => {
    const iosVersion = getIOSVersion();
    /**
     * This is a patch to solve an issue with the UI freezing when the dialog is closed.
     * To reproduce it, use iOS 16.0.
     */
    if (!iosVersion || iosVersion.major >= 17 || (iosVersion.major === 16 && iosVersion.minor >= 4)) return;

    requestAnimationFrame(() => {
      /** @type {HTMLElement | null} */
      const grid = document.querySelector('#ResultsList [product-grid-view]');
      if (grid) {
        const currentWidth = grid.getBoundingClientRect().width;
        grid.style.width = `${currentWidth - 1}px`;
        requestAnimationFrame(() => {
          grid.style.width = '';
        });
      }
    });
  };

  /**
   * Updates the Quick View's Form (Variant ID), Price, and Inventory on variant change
   * @param {CustomEvent} event - The variant update event payload
   */
  #updateQuickViewContent = (event) => {
    const html = event.detail.data?.html;
    if (!html) return;

    // 1. Update the buy buttons block (contains form, hidden variant input, Add to Cart button)
    const currentBuyButtons = this.querySelector('.buy-buttons-block');
    const newBuyButtons = html.querySelector('.buy-buttons-block');
    if (currentBuyButtons && newBuyButtons) {
      morph(currentBuyButtons, newBuyButtons);
    } else {
      // Fallback: morph just the form if buy-buttons-block is missing
      const currentForm = this.querySelector('product-form-component');
      const newForm = html.querySelector('product-form-component');
      if (currentForm && newForm) {
        morph(currentForm, newForm);
      }
    }

    // FIX: Explicitly set the hidden variant ID input to the newly selected variant.
    // The HTML fetched from the server defaults to the first available variant 
    // if it was fetched without a specific variant ID context. Overriding it post-morph ensures accuracy.
    const selectedVariantId = event.detail.resource?.id;
    if (selectedVariantId) {
      const formInputs = this.querySelectorAll('form[action*="/cart/add"] input[name="id"]');
      formInputs.forEach(input => {
        input.value = selectedVariantId;
      });
    }

    // 2. Update prices
    const currentPrices = this.querySelectorAll('product-price');
    const newPrices = html.querySelectorAll('product-price');
    currentPrices.forEach((price, index) => {
      const newPrice = newPrices[index];
      if (!newPrice) return;
      try {
        // Preserve mounted custom element to avoid flicker — update inner content
        price.innerHTML = newPrice.innerHTML;
        // Copy attributes from newPrice to existing price element (except id)
        for (const attr of Array.from(newPrice.attributes || [])) {
          if (attr.name === 'id') continue;
          price.setAttribute(attr.name, attr.value);
        }
      } catch (err) {
        // Fallback to morph if DOM update fails for any reason
        morph(price, newPrice);
      }
    });

    // 3. Update inventory status
    const currentInventory = this.querySelector('product-inventory');
    const newInventory = html.querySelector('product-inventory');
    if (currentInventory && newInventory) {
      morph(currentInventory, newInventory);
    }
  };
}

if (!customElements.get('quick-add-dialog')) {
  customElements.define('quick-add-dialog', QuickAddDialog);
}
