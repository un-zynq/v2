/**
 * HRN Library v7.5.04
 * Behoudt de originele slimme detectie (WebGL, TouchPoints, Platform scores)
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
        this.deviceType = 2; // Default naar desktop
    }

    /**
     * Start alles op: Hardware detectie + Data ophalen
     */
    async init() {
        await this._runSmartDetection();
        await this._loadData();
        this._filtered = [...this._all];
        return this; // Voor chaining: await HRN.init()
    }

    // --- De "Slimme" Device Detectie (Exact zoals je origineel) ---
    async _runSmartDetection() {
        const b = navigator;
        const c = window.screen;
        const d = b.userAgent;
        const e = b.maxTouchPoints || 0;
        const f = window.matchMedia("(pointer: fine)").matches;
        const g = window.matchMedia("(hover: hover)").matches;

        const h = document.createElement('canvas');
        const i = h.getContext('webgl') || h.getContext('experimental-webgl');
        const j = i ? i.getExtension('WEBGL_debug_renderer_info') : null;
        const k = j ? i.getParameter(j.UNMASKED_RENDERER_WEBGL) : "";

        let l = 0; // Desktop score
        let m = 0; // Mobile score

        // Originele puntentelling
        if (/Win|Mac|Linux/i.test(b.platform)) l += 15;
        if (d.includes('x64') || d.includes('wow64')) l += 10;
        if (f && g) l += 20;
        if (/Intel|Nvidia|AMD|Direct3D|GeForce/i.test(k)) l += 25;

        if (/Android|iPhone|iPad|iPod/i.test(d)) m += 20;
        if (/Adreno|Mali|PowerVR|Apple GPU/i.test(k)) m += 25;

        let n = 0;
        if (l > m) {
            n = (e > 0) ? 1 : 2; // 1: Laptop Touch, 2: Desktop
        } else {
            if (b.platform === 'MacIntel' && e > 1) {
                n = 4; // iPad Pro
            } else {
                const o = (c.width >= 1024 || c.height >= 1024 || (c.width >= 768 && e > 1));
                n = o ? 4 : 3; // 4: Tablet, 3: Mobile
            }
        }
        this.deviceType = n;
    }

    // --- Data laden ---
    async _loadData() {
        try {
            const res = await fetch(this.config.src);
            if (!res.ok) throw new Error("Fetch failed");
            const json = await res.json();
            
            const arr = [];
            for (const cat of json) {
                for (const base in cat) {
                    const group = cat[base];
                    for (const alias in group) {
                        const g = group[alias];
                        arr.push({
                            name: g.name || alias,
                            alias: alias,
                            url: `${base}/${alias}`,
                            splash: `${this.config.cdn}/${base}/${alias}.webp`,
                            devices: g.devices ? String(g.devices).split(",").map(Number) : null,
                            // Slimme getters
                            get isSupported() { return this.devices?.includes(window.HRN.deviceType) ?? false; },
                            get isFav() { return window.HRN.isFav(this.alias); }
                        });
                    }
                }
            }
            this._all = arr.sort((a, b) => a.name.localeCompare(b.name));
        } catch (e) {
            console.error("HRN Load Error:", e);
        }
    }

    // --- Chaining Methods ---
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

    // --- Getters & Fav Logic ---
    get list() { return this._filtered; }

    isFav(alias) { return this._favs.has(alias); }

    toggleFav(alias) {
        if (this._favs.has(alias)) this._favs.delete(alias);
        else this._favs.add(alias);
        localStorage.setItem("hrn_f", JSON.stringify([...this._favs]));
        return this;
    }

    _initStorage() {
        try {
            const raw = localStorage.getItem("hrn_f");
            return new Set(raw ? JSON.parse(raw) : []);
        } catch { return new Set(); }
    }
}

const hrnInstance = new HRN();
window.HRN = hrnInstance; // Voor de interne getters in de objecten
export default hrnInstance;
