/**
 * HRN Library v8.0.0
 * Modernized for 2024+ standards
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
        this.deviceType = 2; // Default: Desktop/Unknown
    }

    /**
     * @param {Object} options 
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

        await this._detectDevice();
        await this._loadData(sort);
        
        this.search(search);

        if (mode === 'supported') this.onlySupported();
        if (mode === 'favs') this.onlyFavs();
        
        return this;
    }

    /**
     * Moderne Apparaat Detectie
     * Gebruikt User-Agent Client Hints indien beschikbaar
     */
    async _detectDevice() {
        const ua = navigator.userAgentData;
        const fallbackUA = navigator.userAgent;
        const isTouch = navigator.maxTouchPoints > 0;

        // 1 = Mobile Touch, 2 = Desktop, 3 = Tablet/Large Mobile, 4 = Hybrid/Mac iPad
        if (ua) {
            const mobile = ua.mobile;
            const platform = ua.platform.toLowerCase();

            if (mobile) {
                this.deviceType = (window.innerWidth >= 768) ? 3 : 1;
            } else {
                this.deviceType = 2;
            }
        } else {
            // Fallback voor oudere browsers/Safari
            const isMobile = /Android|iPhone|iPod/i.test(fallbackUA);
            const isTablet = /iPad|Macintosh/i.test(fallbackUA) && isTouch;

            if (isTablet) this.deviceType = 4;
            else if (isMobile) this.deviceType = 1;
            else this.deviceType = 2;
        }
    }

    async _loadData(sortKey) {
        try {
            const res = await fetch(this.config.src);
            if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
            
            const json = await res.json();
            const arr = [];

            // Geneste JSON verwerken
            json.forEach(category => {
                Object.entries(category).forEach(([base, aliases]) => {
                    Object.entries(aliases).forEach(([alias, data]) => {
                        arr.push(this._formatGameData(base, alias, data));
                    });
                });
            });

            this._all = arr.sort((a, b) => 
                String(a[sortKey] || '').localeCompare(String(b[sortKey] || ''))
            );
            this._filtered = [...this._all];

        } catch (err) {
            console.error("HRN v8 Load Error:", err);
        }
    }

    _formatGameData(base, alias, data) {
        return {
            name: data.name || alias,
            alias,
            url: `${base}/${alias}`,
            splash: `${this.config.cdn}/${base}/${alias}.webp`,
            devices: data.devices ? String(data.devices).split(",").map(Number) : null,
            // Getters voor dynamische state
            get isSupported() { 
                return !this.devices || this.devices.includes(window.HRN.deviceType); 
            },
            get isFav() { 
                return window.HRN.isFav(this.alias); 
            }
        };
    }

    search(query) {
        const term = query?.toLowerCase().trim();
        if (!term) {
            this._filtered = [...this._all];
        } else {
            this._filtered = this._all.filter(g => 
                g.name.toLowerCase().includes(term) || 
                g.alias.toLowerCase().includes(term)
            );
        }
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

    get list() {
        return this._filtered;
    }

    // Storage Management
    isFav(alias) {
        return this._favs.has(alias);
    }

    toggleFav(alias) {
        if (this._favs.has(alias)) {
            this._favs.delete(alias);
        } else {
            this._favs.add(alias);
        }
        localStorage.setItem("hrn_f", JSON.stringify([...this._favs]));
        return this;
    }

    _initStorage() {
        try {
            const raw = localStorage.getItem("hrn_f");
            return new Set(raw ? JSON.parse(raw) : []);
        } catch {
            return new Set();
        }
    }
}

// Singleton pattern
const hrnInstance = new HRN();
window.HRN = hrnInstance;
export default hrnInstance;
