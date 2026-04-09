"use strict";

class HRN_Core {
  constructor() {
    this.config = {
      src: "https://un-zynq.github.io/games2.json",
      cdn: "https://cdn.jsdelivr.net/gh/un-zynq/thumbnails",
    };
    this.all = [];
    this.loaded = false;
    this.favorites = new Set(JSON.parse(localStorage.getItem("hrn_favs") || "[]"));
    this.deviceType = 2;
  }

  async init() {
    if (this.loaded) return;
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
      this.loaded = true;
      // Vertel de elementen dat de data er is!
      window.dispatchEvent(new CustomEvent('hrn-ready'));
    } catch (e) {
      console.error("HRN Load error", e);
    }
  }

  _detectDevice() {
    const ua = navigator.userAgent;
    this.deviceType = /Android|iPhone|iPad|iPod/i.test(ua) ? 3 : 2;
  }

  toggleFav(alias) {
    this.favorites.has(alias) ? this.favorites.delete(alias) : this.favorites.add(alias);
    localStorage.setItem("hrn_favs", JSON.stringify([...this.favorites]));
    window.dispatchEvent(new CustomEvent('hrn-update'));
  }
}

window.HRN = new HRN_Core();

/**
 * CUSTOM ELEMENTS
 */

class HRNGrid extends HTMLElement {
  constructor() {
    super();
    this.render = this.render.bind(this);
  }

  connectedCallback() {
    // Luister naar updates of het laden van data
    window.addEventListener('hrn-ready', this.render);
    window.addEventListener('hrn-update', this.render);

    if (window.HRN.loaded) {
      this.render();
    } else {
      this.innerHTML = `<div style="color:gray; padding:20px;">Games laden...</div>`;
      window.HRN.init(); // Start de fetch
    }
  }

  render() {
    const filter = this.getAttribute('filter') || 'all';
    let games = window.HRN.all;

    if (filter === 'favs') games = games.filter(g => window.HRN.favorites.has(g.alias));
    if (filter === 'supported') games = games.filter(g => g.isSupported);

    if (games.length === 0 && filter === 'favs') {
        this.innerHTML = `<div style="color:gray; padding:20px;">Geen favorieten gevonden.</div>`;
        return;
    }

    this.style.display = 'grid';
    this.style.gridTemplateColumns = 'repeat(auto-fill, minmax(150px, 1fr))';
    this.style.gap = '15px';

    this.innerHTML = games.map(g => `<hrn-card alias="${g.alias}"></hrn-card>`).join('');
  }
}

class HRNCard extends HTMLElement {
  connectedCallback() {
    const alias = this.getAttribute('alias');
    const game = window.HRN.all.find(g => g.alias === alias);
    if (!game) return;

    const isFav = window.HRN.favorites.has(alias);

    this.innerHTML = `
      <div class="game-card" style="background:#1e1e1e; border-radius:10px; overflow:hidden; position:relative; color:white; font-family:sans-serif;">
        <img src="${game.thumb}" style="width:100%; aspect-ratio:1; object-fit:cover; display:block;">
        <div style="padding:10px;">
          <h4 style="margin:0; font-size:14px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${game.name}</h4>
          <button onclick="window.open('${game.url}')" style="width:100%; margin-top:8px; cursor:pointer; background:#ff4757; color:white; border:none; padding:5px; border-radius:4px; font-weight:bold;">PLAY</button>
        </div>
        <button class="fav-btn" style="position:absolute; top:5px; right:5px; background:rgba(0,0,0,0.5); color:${isFav ? 'gold' : 'white'}; border:none; border-radius:50%; width:25px; height:25px; cursor:pointer; font-size:16px;">
          ★
        </button>
      </div>
    `;

    this.querySelector('.fav-btn').onclick = (e) => {
      e.preventDefault();
      window.HRN.toggleFav(alias);
    };
  }
}

// Registreer
customElements.define('hrn-grid', HRNGrid);
customElements.define('hrn-card', HRNCard);
window.HRN_Core = HRN_Core;
