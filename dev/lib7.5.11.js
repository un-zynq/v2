/**
 * HRN Library v8.1.0
 * Modernized but keeping the classic "Smart Detection" scoring logic.
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
     * @param {Object} options - Configuratie voor mode, search, sort, src en cdn
     */
    async init(options = {}) {
        const {
            mode = 'all',
            search = '',
            sort = 'name',
            src = this.config.src,
            cdn = this.config.cdn
        } = options;

        this.config.src = src;
        this.config.cdn = cdn;

        this._runSmartDetection(); // De klassieke logica
        await this._loadData(sort);
        
        this.search(search);

        if (mode === 'supported') this.onlySupported();
        else if (mode === 'favs') this.onlyFavs();
        
        return this;
    }

    /**
     * De originele "Smart Detection" logica in een moderne functie
     */
    _runSmartDetection() {
        const n = navigator;
        const screen = window.screen;
        const ua = n.userAgent;
        const touchPoints = n.maxTouchPoints || 0;
        
        // Check voor pointer en hover (moderne CSS-in-JS check)
        const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
        const hasHover = window.matchMedia("(hover: hover)").matches;

        // WebGL Renderer check (de GPU check uit je oude code)
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        const debugInfo = gl?.getExtension('WEBGL_debug_renderer_info');
        const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : "";

        let desktopScore = 0;
        let mobileScore = 0;

        // Platform & UA Checks
        if (/Win|Mac|Linux/i.test(n.platform)) desktopScore += 15;
        if (ua.includes('x64') || ua.includes('wow64')) desktopScore += 10;
        if (hasFinePointer && hasHover) desktopScore += 20;
        
        // GPU Score (Desktop)
        if (/Intel|Nvidia|AMD|Direct3D|GeForce/i.test(renderer)) desktopScore += 25;

        // Mobile Checks
        if (/Android|iPhone|iPad|iPod/i.test(ua)) mobileScore += 20;
        
        // GPU Score (Mobile)
        if (/Adreno|Mali|PowerVR|Apple GPU/i.test(renderer)) mobileScore += 25;

        // De definitieve berekening (Type bepaling)
        if (desktopScore > mobileScore) {
            this.deviceType = (touchPoints > 0) ? 1 : 2; // 1 = Touch Laptop, 2 = Desktop
        } else if (n.platform === 'MacIntel' && touchPoints > 1) {
            this.deviceType = 4; // iPad Pro (Desktop Mode)
        } else {
            // Tablet of Mobiel op basis van resolutie
            const isLargeScreen = screen.width >= 1024 || screen.height >= 1024 || (screen.width >= 768 && touchPoints > 1);
            this.deviceType = isLargeScreen ? 4 : 3; // 4 = Tablet, 3 = Mobiel
        }
    }

    async _loadData(sortKey) {
        try {
            const res = await fetch(this.config.src);
            const json = await res.json();
            const arr = [];

            for (const category of json) {
                for (const [base, games] of Object.entries(category)) {
                    for (const [alias, data] of Object.entries(games)) {
                        arr.push({
                            name: data.name || alias,
                            alias: alias,
                            url: `${base}/${alias}`,
                            splash: `${this.config.cdn}/${base}/${alias}.webp`,
                            devices: data.devices ? String(data.devices).split(",").map(Number) : null,
                            get isSupported() { 
                                return this.devices?.includes(window.HRN.deviceType) ?? false; 
                            },
                            get isFav() { 
                                return window.HRN.isFav(this.alias); 
                            }
                        });
                    }
                }
            }
            
            this._all = arr.sort((a, b) => (a[sortKey] || '').localeCompare(b[sortKey] || ''));
            this._filtered = [...this._all];
        } catch (e) { 
            console.error("HRN v8.1.0 Load Error:", e); 
        }
    }

    search(q) {
        const term = q?.toLowerCase().trim();
        this._filtered = term 
            ? this._all.filter(g => g.name.toLowerCase().includes(term) || g.alias.toLowerCase().includes(term)) 
            : [...this._all];
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
        try {
            const raw = localStorage.getItem("hrn_f");
            return new Set(raw ? JSON.parse(raw) : []);
        } catch (e) {
            return new Set();
        }
    }
}

// Global instance & Export
const hrnInstance = new HRN();
window.HRN = hrnInstance;
export default hrnInstance;
