/**
 * HRN Library v7.5.04 - Optimized & Chainable
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

    async init() {
        await this._detectDevice();
        await this._load();
        this._filtered = [...this._all];
        return this; // Chaining support
    }

    // --- Core Logica ---

    async _load() {
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
            this._all = arr.sort((a, b) => a.name.localeCompare(b.name));
        } catch (e) { console.error("Load error", e); }
    }

    // --- Chainable Filters ---

    search(q) {
        if (!q) {
            this._filtered = [...this._all];
        } else {
            const term = q.toLowerCase();
            this._filtered = this._all.filter(g => 
                g.name.toLowerCase().includes(term) || g.alias.toLowerCase().includes(term)
            );
        }
        return this;
    }

    onlyFavs() {
        this._filtered = this._all.filter(g => g.isFav);
        return this;
    }

    onlySupported() {
        this._filtered = this._all.filter(g => g.isSupported);
        return this;
    }

    reset() {
        this._filtered = [...this._all];
        return this;
    }

    // --- Getters & Actions ---

    get list() {
        return this._filtered;
    }

    isFav(alias) {
        return this._favs.has(alias);
    }

    toggleFav(alias) {
        if (this._favs.has(alias)) this._favs.delete(alias);
        else this._favs.add(alias);
        localStorage.setItem("hrn_f", JSON.stringify([...this._favs]));
        return this;
    }

    // --- Internals ---

    _initStorage() {
        const raw = localStorage.getItem("hrn_f");
        return new Set(raw ? JSON.parse(raw) : []);
    }

    async _detectDevice() {
        const b = navigator, d = b.userAgent, e = b.maxTouchPoints || 0;
        const f = window.matchMedia("(pointer: fine)").matches, g = window.matchMedia("(hover: hover)").matches;
        const h = document.createElement('canvas').getContext('webgl');
        const j = h?.getExtension('WEBGL_debug_renderer_info');
        const k = j ? h.getParameter(j.UNMASKED_RENDERER_WEBGL) : "";

        let l = 0, m = 0;
        if (/Win|Mac|Linux/i.test(b.platform)) l += 15;
        if (d.includes('x64')) l += 10;
        if (f && g) l += 20;
        if (/Intel|Nvidia|AMD/i.test(k)) l += 25;
        if (/Android|iPhone|iPad/i.test(d)) m += 20;
        if (/Adreno|Mali|Apple GPU/i.test(k)) m += 25;

        if (l > m) this.deviceType = (e > 0) ? 1 : 2;
        else if (b.platform === 'MacIntel' && e > 1) this.deviceType = 4;
        else this.deviceType = (window.screen.width >= 1024 || (window.screen.width >= 768 && e > 1)) ? 4 : 3;
    }
}

const hrnInstance = new HRN();
window.HRN = hrnInstance; // Voor interne getters
export default hrnInstance;
