"use strict";

(function () {
    // ====================== BASIC FALLBACKS ======================
    if (!Array.prototype.includes) {
        Array.prototype.includes = function (v) {
            return this.indexOf(v) !== -1;
        };
    }

    const hasFetch = typeof fetch !== "undefined";
    const hasMap = typeof Map !== "undefined";
    const hasSet = typeof Set !== "undefined";

    // Simple XMLHttpRequest fallback voor hele oude browsers
    function simpleFetch(url) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        resolve({
                            ok: true,
                            json: () => Promise.resolve(data)
                        });
                    } catch (e) {
                        reject(new Error("Invalid JSON"));
                    }
                } else {
                    reject(new Error(`HTTP ${xhr.status}`));
                }
            };
            xhr.onerror = () => reject(new Error("Network error"));
            xhr.send();
        });
    }

    const doFetch = hasFetch ? fetch.bind(window) : simpleFetch;

    // ====================== DEVICE DETECTION ======================
    function detectDeviceType() {
        const ua = navigator.userAgent.toLowerCase();
        const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 2;

        const width = Math.min(screen.width, screen.height);

        if (/ipad|tablet/.test(ua) || (isTouch && width >= 768)) return 4; // Tablet
        if (/mobi|android|iphone|ipod/.test(ua) && width < 768) return 3; // Phone
        if (isTouch) return 1; // Touch device (maar geen phone/tablet)
        return 2; // Desktop / Laptop
    }

    // ====================== HRN CLASS ======================
    class HRN {
        constructor() {
            this.config = {
                src: "https://un-zynq.github.io/games2.json",
                cdn: "https://cdn.jsdelivr.net/gh/un-zynq/thumbnails"
            };

            this.data = [];
            this._map = hasMap ? new Map() : Object.create(null);
            this.favs = this._initStorage("hrn_f", true);   // Set or Array
            this.history = this._initStorage("hrn_h", false); // Array
            this.deviceType = detectDeviceType();

            // Snellere sortering
            this.collator = typeof Intl !== "undefined" && Intl.Collator
                ? new Intl.Collator(undefined, { numeric: true, sensitivity: "base" })
                : null;
        }

        async load(filterByDevice = false) {
            try {
                // Probeer cache eerst
                if ("caches" in window) {
                    const cache = await caches.open("hrn-cache-v1");
                    const cachedResponse = await cache.match(this.config.src);

                    if (cachedResponse) {
                        const json = await cachedResponse.json();
                        this._parse(json, filterByDevice);
                        // Update cache in background
                        this._updateCache(cache).catch(() => {});
                        return this.data;
                    }
                }

                // Geen cache of cache miss → fetch
                return await this._fetchAndParse(filterByDevice);
            } catch (err) {
                console.error("HRN Load Error:", err);
                return [];
            }
        }

        async _updateCache(cache) {
            try {
                const res = await doFetch(this.config.src);
                if (res.ok) {
                    const json = await res.clone().json();
                    await cache.put(this.config.src, new Response(JSON.stringify(json)));
                }
            } catch (e) {
                // Silent fail voor background cache update
            }
        }

        async _fetchAndParse(filterByDevice) {
            const res = await doFetch(this.config.src);
            if (!res.ok) throw new Error("Fetch failed");

            const json = await res.json();
            return this._parse(json, filterByDevice);
        }

        _parse(input, filterByDevice = false) {
            if (!Array.isArray(input)) {
                console.warn("HRN: Input is not an array");
                this.data = [];
                return [];
            }

            const arr = [];
            const map = hasMap ? new Map() : Object.create(null);

            // Veel efficiëntere parsing (flatter)
            for (const category of input) {
                for (const base in category) {
                    const group = category[base];

                    for (const alias in group) {
                        const game = group[alias];

                        // Device filter (werkt ook als "devices" veld ontbreekt → toon altijd)
                        if (filterByDevice && game.devices) {
                            const devices = String(game.devices).split(",").map(n => parseInt(n, 10));
                            if (!devices.includes(this.deviceType)) continue;
                        }

                        const obj = {
                            name: game.name || alias,
                            alias: alias,
                            url: `${base}/${alias}`,
                            splash: `${this.config.cdn}/${base}/${alias}.webp`,
                            devices: game.devices ? String(game.devices).split(",").map(n => parseInt(n, 10)) : null,
                            isFav: this._hasFav(alias)
                        };

                        arr.push(obj);

                        if (hasMap) map.set(alias, obj);
                        else map[alias] = obj;
                    }
                }
            }

            // Sorteren op naam
            if (this.collator) {
                arr.sort((a, b) => this.collator.compare(a.name, b.name));
            } else {
                arr.sort((a, b) => a.name.localeCompare(b.name));
            }

            this.data = arr;
            this._map = map;

            return arr;
        }

        get(alias) {
            return hasMap ? this._map.get(alias) : this._map[alias] || null;
        }

        all() {
            return this.data;
        }

        search(query) {
            if (!query) return this.data;
            const q = query.toLowerCase().trim();
            return this.data.filter(g =>
                g.alias.toLowerCase().includes(q) ||
                g.name.toLowerCase().includes(q)
            );
        }

        random(count = 1) {
            if (!this.data.length) return count === 1 ? null : [];
            const shuffled = [...this.data].sort(() => Math.random() - 0.5);
            return count === 1 ? shuffled[0] : shuffled.slice(0, count);
        }

        // ====================== FAVORITES ======================
        toggleFav(alias) {
            const game = this.get(alias);
            if (!game) return false;

            const isNowFav = this._hasFav(alias)
                ? this._removeFav(alias)
                : this._addFav(alias);

            game.isFav = isNowFav;
            this._saveFavs();
            return isNowFav;
        }

        getFavs() {
            return this.data.filter(g => g.isFav);
        }

        _hasFav(alias) {
            return hasSet ? this.favs.has(alias) : this.favs.includes(alias);
        }

        _addFav(alias) {
            if (hasSet) this.favs.add(alias);
            else if (!this.favs.includes(alias)) this.favs.push(alias);
            return true;
        }

        _removeFav(alias) {
            if (hasSet) this.favs.delete(alias);
            else this.favs = this.favs.filter(a => a !== alias);
            return false;
        }

        _saveFavs() {
            const arr = hasSet ? Array.from(this.favs) : this.favs;
            localStorage.setItem("hrn_f", JSON.stringify(arr));
        }

        // ====================== HISTORY ======================
        logHistory(alias) {
            this.history = [alias, ...this.history.filter(a => a !== alias)].slice(0, 30);
            localStorage.setItem("hrn_h", JSON.stringify(this.history));
        }

        getHistory() {
            return this.history
                .map(alias => this.get(alias))
                .filter(Boolean);
        }

        // ====================== STORAGE ======================
        _initStorage(key, asSet) {
            try {
                const raw = localStorage.getItem(key);
                if (!raw) return asSet ? (hasSet ? new Set() : []) : [];

                const parsed = JSON.parse(raw);

                if (asSet) {
                    return hasSet ? new Set(parsed) : parsed;
                }
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return asSet ? (hasSet ? new Set() : []) : [];
            }
        }
    }

    // ====================== GLOBAL EXPOSURE ======================
    window.HRN = new HRN();

    // Optioneel: auto load example
    // window.HRN.load().then(data => console.log(`Loaded ${data.length} games`));

})();
