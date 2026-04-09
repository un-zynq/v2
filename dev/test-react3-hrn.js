"use strict";

/**
 * HRN CORE - De hersenen
 */
class HRN_Core {
  constructor() {
    this.config = {
      src: "https://un-zynq.github.io/games2.json",
      cdn: "https://cdn.jsdelivr.net/gh/un-zynq/thumbnails",
    };
    this.all = [];
    this.favorites = new Set(JSON.parse(localStorage.getItem("hrn_favs") || "[]"));
    this.deviceType = 2; // Default desktop
  }

  async init() {
    this._detectDevice();
    try {
      const res = await fetch(this.config.src);
      const data = await res.json();
      const library = [];
      data.forEach(cat => {
        Object.entries(cat).forEach(([base, games]) => {
          Object.entries(games).forEach(([alias, meta]) => {
            library.push({
              ...meta,
              alias,
              url: `${base}/${alias}`,
              thumb: `${this.config.cdn}/${base}/${alias}.webp`,
              isSupported: meta.devices ? String(meta.devices).split(",").map(Number).includes(this.deviceType) : true
            });
          });
        });
      });
      this.all = library;
    } catch (e) { console.error("Load error", e); }
  }

  _detectDevice() {
    const ua = navigator.userAgent;
    if (/Android|iPhone|iPad|iPod/i.test(ua)) this.deviceType = 3;
    // Simpele detectie, kan uitgebreid worden
  }

  toggleFav(alias) {
    this.favorites.has(alias) ? this.favorites.delete(alias) : this.favorites.add(alias);
    localStorage.setItem("hrn_favs", JSON.stringify([...this.favorites]));
    window.dispatchEvent(new CustomEvent('hrn-fav-change', { detail: { alias } }));
  }
}

// Singleton instance
window.HRN = new HRN_Core();

/**
 * CUSTOM ELEMENTS - De bouwstenen
 */

// 1. <hrn-grid> - De container die automatisch games laadt
class HRNGrid extends HTMLElement {
  async connectedCallback() {
    this.innerHTML = `<div class="hrn-loading">Laden...</div>`;
    if (!window.HRN.all.length) await window.HRN.init();
    this.render();
  }

  render() {
    const filter = this.getAttribute('filter') || 'all';
    let games = window.HRN.all;

    if (filter === 'favs') games = games.filter(g => window.HRN.favorites.has(g.alias));
    if (filter === 'supported') games = games.filter(g => g.isSupported);

    this.innerHTML = `
      <style>
        hrn-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px; }
      </style>
      ${games.map(g => `<hrn-card alias="${g.alias}"></hrn-card>`).join('')}
    `;
  }
}

// 2. <hrn-card> - Een individuele game kaart
class HRNCard extends HTMLElement {
  connectedCallback() {
    const alias = this.getAttribute('alias');
    const game = window.HRN.all.find(g => g.alias === alias);
    if (!game) return;

    const isFav = window.HRN.favorites.has(alias);

    this.innerHTML = `
      <div class="game-card" style="background:#1e1e1e; border-radius:10px; overflow:hidden; position:relative;">
        <img src="${game.thumb}" style="width:100%; aspect-ratio:1; object-fit:cover;">
        <div style="padding:10px;">
          <h4 style="margin:0; font-size:14px; color:white;">${game.name}</h4>
          <button onclick="window.open('${game.url}')" style="width:100%; margin-top:8px; cursor:pointer;">PLAY</button>
        </div>
        <button class="fav-btn" data-alias="${alias}" style="position:absolute; top:5px; right:5px; background:rgba(0,0,0,0.5); color:${isFav ? 'gold' : 'white'}; border:none; border-radius:50%; cursor:pointer;">
          ★
        </button>
      </div>
    `;

    this.querySelector('.fav-btn').onclick = (e) => {
      e.stopPropagation();
      window.HRN.toggleFav(alias);
      this.connectedCallback(); // Re-render card
    };
  }
}

// Registreer de elementen
customElements.define('hrn-grid', HRNGrid);
customElements.define('hrn-card', HRNCard);
