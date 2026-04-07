/**
 * HRN Library v7.5.09
 * Geavanceerde Initialisatie + Deep State Control
 */
"use strict";

class HRN {
    constructor() {
        this.config = {
            src: "https://un-zynq.github.io/games2.json",
            cdn: "https://cdn.jsdelivr.net/gh/un-zynq/thumbnails"
        };
        this._all = [];
        this._filtered = [];
        this._favs = this._initStorage();
        this.deviceType = 2; 
    }

    /**
     * @param {Object} options - Uitgebreide configuratie
     * @param {string} options.mode - 'all' | 'supported' | 'favs'
     * @param {string} options.search - Direct filteren op zoekterm bij start
     * @param {string} options.sort - 'name' | 'alias' | 'newest'
     * @param {string} options.src - Overschrijf de standaard JSON bron
     * @param {string} options.cdn - Overschrijf de standaard Thumbnails bron
     */
    async init(options = {}) {
        const settings = {
            mode: 'all',
            search: '',
            sort: 'name',
            ...options
        };

        // Overschrijf config indien meegegeven
        if (settings.src) this.config.src = settings.src;
        if (settings.cdn) this.config.cdn = settings.cdn;

        await this._runSmartDetection();
        await this._loadData(settings.sort);
        
        // Verwerk initiële filters
        this.search(settings.search);

        if (settings.mode === 'supported') this.onlySupported();
        else if (settings.mode === 'favs') this.onlyFavs();
        
        return this;
    }

    async _runSmartDetection() {
        const b = navigator, c = window.screen, d = b.userAgent, e = b.maxTouchPoints || 0;
        const f = window.matchMedia("(pointer: fine)").matches, g = window.matchMedia("(hover: hover)").matches;
        const h = document.createElement('canvas').getContext('webgl') || document.createElement('canvas').getContext('experimental-webgl');
        const j = h?.getExtension('WEBGL_debug_renderer_info');
        const k = j ? h.getParameter(j.UNMASKED_RENDERER_WEBGL) : "";

        let l = 0, m = 0;
        if (/Win|Mac|Linux/i.test(b.platform)) l += 15;
        if (d.includes('x64') || d.includes('wow64')) l += 10;
        if (f && g) l += 20;
        if (/Intel|Nvidia|AMD|Direct3D|GeForce/i.test(k)) l += 25;
        if (/Android|iPhone|iPad|iPod/i.test(d)) m += 20;
        if (/Adreno|Mali|PowerVR|Apple GPU/i.test(k)) m += 25;

        if (l > m) this.deviceType = (e > 0) ? 1 : 2;
        else if (b.platform === 'MacIntel' && e > 1) this.deviceType = 4;
        else this.deviceType = (c.width >= 1024 || c.height >= 1024 || (c.width >= 768 && e > 1)) ? 4 : 3;
    }

    async _loadData(sortKey) {
        try {
            const res = await fetch(this.config.src);
            const json = await res.json();
            const arr = [];
            for (const cat of json) {
                for (const base in cat) {
                    for (const alias in cat[base]) {
                        const g = cat[base][alias];
                        arr.push({
                            name: g.name || alias,
                            alias: alias,
                            url: `${base}/${alias}`,
                            splash: `${this.config.cdn}/${base}/${alias}.webp`,
                            devices: g.devices ? String(g.devices).split(",").map(Number) : null,
                            get isSupported() { return this.devices?.includes(window.HRN.deviceType) ?? false; },
                            get isFav() { return window.HRN.isFav(this.alias); }
                        });
                    }
                }
            }
            // Sorteren op basis van de gekozen init-optie
            this._all = arr.sort((a, b) => (a[sortKey] || '').localeCompare(b[sortKey] || ''));
        } catch (e) { console.error("HRN v7.5.09 Load Error:", e); }
    }

    search(q) {
        const term = q?.toLowerCase().trim();
        this._filtered = term ? this._all.filter(g => g.name.toLowerCase().includes(term) || g.alias.toLowerCase().includes(term)) : [...this._all];
        return this;
    }

    onlyFavs() {
        this._filtered = this._filtered.filter(g => g.isFav);
        return this;
    }

    onlySupported() {
        this._filtered = this._filtered.filter(g => g.isSupported);
        return this;
    }

    reset() {
        this._filtered = [...this._all];
        return this;
    }

    get list() { return this._filtered; }

    isFav(alias) { return this._favs.has(alias); }
    toggleFav(alias) {
        this._favs.has(alias) ? this._favs.delete(alias) : this._favs.add(alias);
        localStorage.setItem("hrn_f", JSON.stringify([...this._favs]));
        return this;
    }
    _initStorage() {
        const raw = localStorage.getItem("hrn_f");
        return new Set(raw ? JSON.parse(raw) : []);
    }
}

const hrnInstance = new HRN();
window.HRN = hrnInstance;
export default hrnInstance;
