"use strict";

(function () {
    if (!Array.prototype.includes) {
        Array.prototype.includes = function(v) { return this.indexOf(v) !== -1; };
    }

    const hasMap = typeof Map !== "undefined";
    const hasSet = typeof Set !== "undefined";

    class HRN {
        constructor() {
            this.config = {
                src: "https://un-zynq.github.io/games2.json",
                cdn: "https://cdn.jsdelivr.net/gh/un-zynq/thumbnails"
            };
            this.allGames = [];
            this.deviceType = 2; // Default: PC No Touch
            this._map = hasMap ? new Map() : {};
            this.favs = this._initStorage("hrn_f", true);
            
            // Start direct de detectie
            this._detectDevice();
        }

        // De "slimme" detectie logica
        _detectDevice() {
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

            let l = 0; let m = 0;

            if (/Win|Mac|Linux/i.test(b.platform)) l += 15;
            if (d.includes('x64') || d.includes('wow64')) l += 10;
            if (f && g) l += 20;
            if (/Intel|Nvidia|AMD|Direct3D|GeForce/i.test(k)) l += 25;

            if (/Android|iPhone|iPad|iPod/i.test(d)) m += 20;
            if (/Adreno|Mali|PowerVR|Apple GPU/i.test(k)) m += 25;

            if (l > m) {
                this.deviceType = (e > 0) ? 1 : 2; // 1: PC Touch, 2: PC No Touch
            } else {
                if (b.platform === 'MacIntel' && e > 1) {
                    this.deviceType = 4; // Tablet (iPad)
                } else {
                    const o = (c.width >= 1024 || c.height >= 1024 || (c.width >= 768 && e > 1));
                    this.deviceType = o ? 4 : 3; // 4: Tablet, 3: Phone
                }
            }
        }

        async load() {
            try {
                const res = await (typeof fetch !== "undefined" ? fetch(this.config.src) : this.simpleFetch(this.config.src));
                const json = await (typeof res.json === "function" ? res.json() : JSON.parse(res.responseText));
                this._parse(json);
            } catch (e) {
                console.error("HRN Load Error:", e);
            }
        }

        _parse(input) {
            if (!Array.isArray(input)) return;
            const arr = [];
            const map = hasMap ? new Map() : {};

            input.forEach(cat => {
                for (const base in cat) {
                    const group = cat[base];
                    for (const alias in group) {
                        const g = group[alias];
                        const obj = {
                            name: g.name || alias,
                            alias: alias,
                            url: `${base}/${alias}`,
                            splash: `${this.config.cdn}/${base}/${alias}.webp`,
                            // Als devices niet is opgegeven, gaan we ervan uit dat hij overal werkt
                            devices: g.devices ? String(g.devices).split(",").map(n => parseInt(n)) : [1, 2, 3, 4],
                            isFav: this._hasFav(alias)
                        };
                        arr.push(obj);
                        if (hasMap) map.set(alias, obj); else map[alias] = obj;
                    }
                }
            });

            arr.sort((a, b) => a.name.localeCompare(b.name));
            this.allGames = arr;
            this._map = map;
        }

        // NIEUW: Haal games op die compatibel zijn met het huidige apparaat
        getGamesForDevice() {
            return this.allGames.filter(g => g.devices.includes(this.deviceType));
        }

        get(alias) { return hasMap ? this._map.get(alias) : this._map[alias] || null; }
        
        search(q, deviceOnly = false) {
            let list = deviceOnly ? this.getGamesForDevice() : this.allGames;
            if (!q) return list;
            q = q.toLowerCase().trim();
            return list.filter(g => g.alias.toLowerCase().includes(q) || g.name.toLowerCase().includes(q));
        }

        toggleFav(alias) {
            const game = this.get(alias);
            if (!game) return false;
            const nowFav = this._hasFav(alias) ? this._removeFav(alias) : this._addFav(alias);
            game.isFav = nowFav;
            this._saveFavs();
            return nowFav;
        }

        _initStorage(key, asSet) {
            try {
                const raw = localStorage.getItem(key);
                if (!raw) return asSet ? (hasSet ? new Set() : []) : [];
                const parsed = JSON.parse(raw);
                return asSet ? (hasSet ? new Set(parsed) : parsed) : parsed;
            } catch { return asSet ? (hasSet ? new Set() : []) : []; }
        }

        _hasFav(a) { return hasSet ? this.favs.has(a) : this.favs.includes(a); }
        _addFav(a) { if (hasSet) this.favs.add(a); else if (!this.favs.includes(a)) this.favs.push(a); return true; }
        _removeFav(a) { if (hasSet) this.favs.delete(a); else this.favs = this.favs.filter(x => x !== a); return false; }
        _saveFavs() { localStorage.setItem("hrn_f", JSON.stringify(hasSet ? Array.from(this.favs) : this.favs)); }
    }

    window.HRN = new HRN();
})();
