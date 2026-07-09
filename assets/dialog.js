import { Component } from '@theme/component';
import { debounce, isClickedOutside, onAnimationEnd } from '@theme/utilities';

/**
 * A custom element that manages a dialog.
 *
 * @typedef {object} Refs
 * @property {HTMLDialogElement} dialog – The dialog element.
 *
 * @extends Component<Refs>
 */
export class DialogComponent extends Component {
  requiredRefs = ['dialog'];

  #observer = null;

  connectedCallback() {
    super.connectedCallback();
    const { dialog } = this.refs;
    if (dialog) {
      dialog.addEventListener('close', this.#handleNativeClose);

      this.#observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'open') {
            if (!dialog.open) {
              this.#handleNativeClose();
            }
          }
        });
      });
      this.#observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });
    }

    if (this.minWidth || this.maxWidth) {
      window.addEventListener('resize', this.#handleResize);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    const { dialog } = this.refs;
    if (dialog) {
      dialog.removeEventListener('close', this.#handleNativeClose);
    }
    if (this.#observer) {
      this.#observer.disconnect();
    }
    // Safeguard: unlock if dialog element is removed from DOM while body is locked
    if (document.body.classList.contains('modal-open') && this.#previousScrollY > 0) {
      this.#handleNativeClose();
    }
    if (this.minWidth || this.maxWidth) {
      window.removeEventListener('resize', this.#handleResize);
    }
  }

  #handleResize = debounce(() => {
    const { minWidth, maxWidth } = this;

    if (!minWidth && !maxWidth) return;

    const windowWidth = window.innerWidth;
    if (windowWidth < minWidth || windowWidth > maxWidth) {
      this.closeDialog();
    }
  }, 50);

  #previousScrollY = 0;
  #previousBodyPaddingRight = '';

  /**
   * Shows the dialog.
   */
  showDialog() {
    const { dialog } = this.refs;

    if (dialog.open || this.isOpening) return;

    this.isOpening = true;
    const scrollY = window.scrollY;
    this.#previousScrollY = scrollY;
    this.#previousBodyPaddingRight = document.body.style.paddingRight || '';

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Prevent layout thrashing by separating DOM reads from DOM writes
    requestAnimationFrame(() => {
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      document.body.style.width = '100%';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.classList.add('modal-open');
      document.documentElement.setAttribute('scroll-lock', '');

      try {
        if (!dialog.open) {
          dialog.showModal();
          this.dispatchEvent(new DialogOpenEvent());
        }
      } catch (error) {
        console.warn('Dialog showModal failed:', error);
      } finally {
        this.isOpening = false;
      }

      this.addEventListener('click', this.#handleClick);
      this.addEventListener('keydown', this.#handleKeyDown);
    });
  }

  /**
   * Closes the dialog.
   */
  closeDialog = async () => {
    const { dialog } = this.refs;

    if (!dialog.open) return;

    this.removeEventListener('click', this.#handleClick);
    this.removeEventListener('keydown', this.#handleKeyDown);

    // Force browser to restart animation by resetting it
    dialog.style.animation = 'none';
    void dialog.offsetWidth;

    dialog.classList.add('dialog-closing');
    dialog.style.animation = '';

    // Safety timeout of 600ms to guarantee close even if Web Animations API hangs
    await Promise.race([
      onAnimationEnd(dialog, undefined, {
        subtree: false,
      }),
      new Promise((resolve) => setTimeout(resolve, 600)),
    ]);

    dialog.close();
    dialog.classList.remove('dialog-closing');
  };

  #handleNativeClose = () => {
    this.removeEventListener('click', this.#handleClick);
    this.removeEventListener('keydown', this.#handleKeyDown);

    document.body.style.width = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.paddingRight = this.#previousBodyPaddingRight;
    document.body.classList.remove('modal-open');
    document.documentElement.removeAttribute('scroll-lock');
    window.scrollTo({ top: this.#previousScrollY, behavior: 'instant' });

    this.dispatchEvent(new DialogCloseEvent());
  };

  /**
   * Toggles the dialog.
   */
  toggleDialog = () => {
    if (this.refs.dialog.open) {
      this.closeDialog();
    } else {
      this.showDialog();
    }
  };

  /**
   * Closes the dialog when the user clicks outside of it.
   *
   * @param {MouseEvent} event - The mouse event.
   */
  #handleClick(event) {
    const { dialog } = this.refs;

    if (isClickedOutside(event, dialog)) {
      this.closeDialog();
    }
  }

  /**
   * Closes the dialog when the user presses the escape key.
   *
   * @param {KeyboardEvent} event - The keyboard event.
   */
  #handleKeyDown(event) {
    if (event.key !== 'Escape') return;

    event.preventDefault();
    this.closeDialog();
  }

  /**
   * Gets the minimum width of the dialog.
   *
   * @returns {number} The minimum width of the dialog.
   */
  get minWidth() {
    return Number(this.getAttribute('dialog-active-min-width'));
  }

  /**
   * Gets the maximum width of the dialog.
   *
   * @returns {number} The maximum width of the dialog.
   */
  get maxWidth() {
    return Number(this.getAttribute('dialog-active-max-width'));
  }
}

if (!customElements.get('dialog-component')) customElements.define('dialog-component', DialogComponent);

export class DialogOpenEvent extends CustomEvent {
  constructor() {
    super(DialogOpenEvent.eventName);
  }

  static eventName = 'dialog:open';
}

export class DialogCloseEvent extends CustomEvent {
  constructor() {
    super(DialogCloseEvent.eventName);
  }

  static eventName = 'dialog:close';
}

document.addEventListener(
  'toggle',
  (event) => {
    if (event.target instanceof HTMLDetailsElement) {
      if (event.target.hasAttribute('scroll-lock')) {
        const { open } = event.target;
        if (open) {
          document.documentElement.setAttribute('scroll-lock', '');
        } else {
          document.documentElement.removeAttribute('scroll-lock');
        }
      }
    }
  },
  { capture: true }
);

// Global safeguard to prevent page from freezing in a locked scroll state
const checkScrollLockSafeguard = () => {
  requestAnimationFrame(() => {
    const hasOpenDialog = Array.from(document.querySelectorAll('dialog')).some(
      (dialog) => dialog.open
    );
    const hasOpenCustomModal = document.querySelector(
      '.quick-add-modal.is-open, .size-chart-modal.is-open, [scroll-lock][open], [scroll-lock].is-open'
    );

    if (!hasOpenDialog && !hasOpenCustomModal) {
      if (document.body.classList.contains('modal-open') || document.documentElement.hasAttribute('scroll-lock')) {
        document.body.style.width = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.classList.remove('modal-open');
        document.documentElement.removeAttribute('scroll-lock');
      }
    }
  });
};

document.addEventListener('click', checkScrollLockSafeguard, { capture: true, passive: true });
document.addEventListener('keydown', checkScrollLockSafeguard, { capture: true, passive: true });
document.addEventListener('focusin', checkScrollLockSafeguard, { capture: true, passive: true });
