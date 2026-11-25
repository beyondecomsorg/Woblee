class BlackFridayCountdown extends HTMLElement {
  #timeout;

  connectedCallback() {
    const saleStart = this.dataset.saleStart?.trim();
    const start = saleStart ? parseSaleTime(saleStart) : -Infinity;
    const end = parseSaleTime(this.dataset.saleEnd ?? '');
    const units = this.querySelectorAll('[data-sale-unit]');

    const update = () => {
      const now = Date.now();
      this.hidden = !(start < end && now < end);
      if (this.hidden) return;

      const saleIsLive = now >= start;
      const phase = saleIsLive ? 'live' : 'upcoming';
      if (this.dataset.salePhase !== phase) this.dataset.salePhase = phase;

      const milliseconds = (saleIsLive ? end : start) - now;
      const seconds = Math.ceil(milliseconds / 1000);
      const values = [
        Math.floor(seconds / 86400),
        Math.floor(seconds / 3600) % 24,
        Math.floor(seconds / 60) % 60,
        seconds % 60,
      ];

      units.forEach((unit, index) => {
        unit.textContent = String(values[index]).padStart(2, '0');
      });

      this.#timeout = setTimeout(update, milliseconds % 1000 || 1000);
    };

    update();
  }

  disconnectedCallback() {
    clearTimeout(this.#timeout);
  }
}

function parseSaleTime(value) {
  const match = value.trim().match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(Z|[+-]\d{2}:\d{2})$/);
  if (!match) return NaN;

  const [, localTime, offset] = match;
  const calendarTime = new Date(localTime + 'Z');
  if (!Number.isFinite(calendarTime.getTime()) || !calendarTime.toISOString().startsWith(localTime)) return NaN;
  return Date.parse(localTime + offset);
}

if (!customElements.get('black-friday-countdown')) {
  customElements.define('black-friday-countdown', BlackFridayCountdown);
}
