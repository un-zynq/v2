"use strict";

/**
 * CORE LOGIC
 */
class HRN_Core {
  constructor() {
    this.config = {
      src: "https://un-zynq.github.io/games2.json",
      cdn: "https://cdn.jsdelivr.net/gh/un-zynq/thumbnails",
    };
    this.all = [];
    this.filtered = [];
    this.favorites = this._initStorage();
    this.deviceType = 2;
  }

  async init(options = {}) {
    const {
      mode = "all",
      search = "",
      sort = "name",
      src = this.config.src,
      cdn = this.config.cdn,
    } = options;

    this.config.src = src;
    this.config.cdn = cdn;

    this._detectDevice();
    await this._loadData(sort);

    if (search) this.search(search);
    if (mode === "supported") this.filterSupported();
    if (mode === "favs") this.filterFavorites();

    return this;
  }

  _detectDevice() {
    const n = navigator;
    const ua = n.userAgent;
    const touchPoints = n.maxTouchPoints || 0;
    const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
    const hasHover = window.matchMedia("(hover: hover)").matches;
    
    // Simpele device detectie (fallback)
    let scores = { desktop: 0, mobile: 0 };
    if (/Win|Mac|Linux/i.test(ua)) scores.desktop += 15;
    if (hasFinePointer && hasHover) scores.desktop += 20;
    if (/Android|iPhone|iPad|iPod/i.test(ua)) scores.mobile += 20;

    if (scores.desktop > scores.mobile) {
      this.deviceType = touchPoints > 0 ? 1 : 2;
    } else {
      const isLarge = window.screen.width >= 1024;
      this.deviceType = isLarge ? 4 : 3;
    }
  }

  async _loadData(sortKey) {
    try {
      const response = await fetch(this.config.src);
      const data = await response.json();
      const library = [];

      data.forEach((category) => {
        Object.entries(category).forEach(([base, games]) => {
          Object.entries(games).forEach(([alias, meta]) => {
            library.push({
              name: meta.name || alias,
              category: meta.category || "Game",
              alias: alias,
              url: `${base}/${alias}`,
              thumb: `${this.config.cdn}/${base}/${alias}.webp`,
              devices: meta.devices ? String(meta.devices).split(",").map(Number) : null,
              get isSupported() {
                // Gebruik window.HRN veilig
                return this.devices?.includes(window.HRN?.deviceType) ?? true;
              },
              get isFavorite() {
                return window.HRN?.isFavorite(this.alias);
              },
            });
          });
        });
      });

      this.all = library.sort((a, b) => (a[sortKey] || "").localeCompare(b[sortKey] || ""));
      this.filtered = [...this.all];
    } catch (err) {
      console.error("HRN Core Error:", err);
    }
  }

  search(query) {
    const q = query?.toLowerCase().trim();
    this.filtered = q ? this.all.filter((g) => g.name.toLowerCase().includes(q) || g.alias.toLowerCase().includes(q)) : [...this.all];
    return this;
  }

  filterFavorites() {
    this.filtered = this.all.filter((g) => this.isFavorite(g.alias));
    return this;
  }

  filterSupported() {
    this.filtered = this.all.filter((g) => g.isSupported);
    return this;
  }

  reset() {
    this.filtered = [...this.all];
    return this;
  }

  get list() {
    return this.filtered;
  }

  isFavorite(alias) {
    return this.favorites.has(alias);
  }

  toggleFavorite(alias) {
    this.favorites.has(alias) ? this.favorites.delete(alias) : this.favorites.add(alias);
    localStorage.setItem("hrn_favs", JSON.stringify([...this.favorites]));
    return this;
  }

  _initStorage() {
    try {
      const data = localStorage.getItem("hrn_favs");
      return new Set(data ? JSON.parse(data) : []);
    } catch {
      return new Set();
    }
  }
}

/**
 * UI FRAMEWORK
 */
class HRN_UI {
  constructor(core, mountPoint) {
    this.core = core;
    this.container = document.querySelector(mountPoint);
    this.state = {
      view: "all",
      searchQuery: "",
      loading: false
    };
    
    // Inject Styles
    this._injectStyles();
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.render();
  }

  _injectStyles() {
    if (document.getElementById('hrn-styles')) return;
    const style = document.createElement('style');
    style.id = 'hrn-styles';
    style.textContent = `
      :root { --hrn-red: #ff4757; --hrn-bg: #0f0f0f; --hrn-card: #1e1e1e; }
      .hrn-container { padding: 20px; max-width: 1200px; margin: 0 auto; color: white; text-align: left; }
      .hrn-nav { display: flex; gap: 10px; margin-bottom: 20px; }
      .hrn-nav button { background: #333; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; }
      .hrn-nav button.active { background: var(--hrn-red); }
      .hrn-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 15px; }
      .game-card { background: var(--hrn-card); border-radius: 10px; overflow: hidden; position: relative; }
      .game-card img { width: 100%; aspect-ratio: 1; object-fit: cover; }
      .game-info { padding: 10px; }
      .game-info h4 { margin: 0; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .fav-btn { position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.6); border: none; color: white; border-radius: 50%; width: 25px; height: 25px; cursor: pointer; }
      .fav-btn.is-fav { color: gold; }
      .search-input { width: 100%; padding: 10px; margin-bottom: 20px; border-radius: 5px; border: none; background: #222; color: white; }
    `;
    document.head.appendChild(style);
  }

  render() {
    if (!this.container) return;

    // Filter data op basis van state
    this.core.reset();
    if (this.state.searchQuery) this.core.search(this.state.searchQuery);
    if (this.state.view === "favs") this.core.filterFavorites();
    if (this.state.view === "supported") this.core.filterSupported();

    const games = this.core.list;

    this.container.innerHTML = `
      <div class="hrn-container">
        <input type="text" class="search-input" placeholder="Zoek een spel..." value="${this.state.searchQuery}" oninput="UI.setState({searchQuery: this.value})">
        
        <div class="hrn-nav">
          <button class="${this.state.view === 'all' ? 'active' : ''}" onclick="UI.setState({view: 'all'})">Alle</button>
          <button class="${this.state.view === 'supported' ? 'active' : ''}" onclick="UI.setState({view: 'supported'})">📱 Voor mij</button>
          <button class="${this.state.view === 'favs' ? 'active' : ''}" onclick="UI.setState({view: 'favs'})">❤️ Favorieten</button>
        </div>

        <div class="hrn-grid">
          ${games.map(game => `
            <div class="game-card">
              <button class="fav-btn ${game.isFavorite ? 'is-fav' : ''}" onclick="UI.toggleFav('${game.alias}')">★</button>
              <img src="${game.thumb}" loading="lazy">
              <div class="game-info">
                <h4>${game.name}</h4>
                <button style="width:100%; margin-top:5px; background:var(--hrn-red); border:none; color:white; padding:5px; cursor:pointer;" onclick="window.open('${game.url}')">SPELEN</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  toggleFav(alias) {
    this.core.toggleFavorite(alias);
    this.render();
  }
}

/**
 * EXPORTS NAAR WINDOW (VOORKOMT UNDEFINED)
 */
window.HRN_Core = HRN_Core;
window.HRN_UI = HRN_UI;
window.HRN = new HRN_Core(); // Maak direct een instantie aan
