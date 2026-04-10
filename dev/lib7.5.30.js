"use strict";

/* =========================
   DATA LAYER
========================= */
class DataLayer {
    constructor(config) {
        this.config = config;
    }

    async load(sortKey = "name") {
        const res = await fetch(this.config.src);
        const data = await res.json();

        const list = [];

        data.forEach(category => {
            Object.entries(category).forEach(([base, games]) => {
                Object.entries(games).forEach(([alias, meta]) => {
                    list.push({
                        name: meta.name || alias,
                        category: meta.category,
                        alias,
                        url: `${base}/${alias}`,
                        thumb: `${this.config.cdn}/${base}/${alias}.webp`,
                        devices: meta.devices
                            ? String(meta.devices).split(",").map(Number)
                            : [],
                        playCount: meta.playCount || 0
                    });
                });
            });
        });

        return list.sort((a, b) =>
            (a[sortKey] || "").localeCompare(b[sortKey] || "")
        );
    }
}

/* =========================
   DEVICE ENGINE
========================= */
class DeviceEngine {
    detect() {
        const ua = navigator.userAgent;
        const touch = navigator.maxTouchPoints || 0;

        if (/Android|iPhone|iPad|iPod/i.test(ua)) return touch > 1 ? 4 : 3;
        if (/Macintosh/i.test(ua) && touch > 1) return 4;
        if (touch > 0) return 1;

        return 2;
    }

    isSupported(game, deviceType) {
        return !game.devices.length || game.devices.includes(deviceType);
    }
}

/* =========================
   STORAGE LAYER
========================= */
class StorageLayer {
    constructor() {
        this.favs = new Set(this._load("ZYNQ_favs"));
        this.history = this._load("ZYNQ_history") || [];
    }

    _load(key) {
        try {
            const d = localStorage.getItem(key);
            return d ? JSON.parse(d) : null;
        } catch {
            return null;
        }
    }

    saveFavs() {
        localStorage.setItem("ZYNQ_favs", JSON.stringify([...this.favs]));
    }

    saveHistory() {
        localStorage.setItem("ZYNQ_history", JSON.stringify(this.history));
    }
}

/* =========================
   QUERY ENGINE
========================= */
class QueryEngine {
    search(list, q) {
        if (!q) return list;
        q = q.toLowerCase();
        return list.filter(
            g =>
                g.name.toLowerCase().includes(q) ||
                g.alias.toLowerCase().includes(q)
        );
    }

    filterSupported(list, deviceType, deviceEngine) {
        return list.filter(g =>
            deviceEngine.isSupported(g, deviceType)
        );
    }

    filterFavorites(list, storage) {
        return list.filter(g => storage.favs.has(g.alias));
    }

    sort(list, key) {
        return [...list].sort((a, b) =>
            (a[key] || "").localeCompare(b[key] || "")
        );
    }

    sortByPopularity(list) {
        return [...list].sort((a, b) => b.playCount - a.playCount);
    }

    shuffle(list) {
        const arr = [...list];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
}

/* =========================
   ZYNQ CORE (FAÇADE)
========================= */
class ZYNQ_Core {
    constructor() {
        this.config = {
            src: "https://un-zynq.github.io/games2.json",
            cdn: "https://cdn.jsdelivr.net/gh/un-zynq/thumbnails"
        };

        this.all = [];
        this.filtered = [];

        this.deviceType = 2;

        this.storage = new StorageLayer();
        this.device = new DeviceEngine();
        this.query = new QueryEngine();
        this.data = new DataLayer(this.config);
    }

    /* INIT */
    async init(options = {}) {
        const {
            mode = "all",
            search = "",
            sort = "name"
        } = options;

        this.deviceType = this.device.detect();
        this.all = await this.data.load(sort);
        this.filtered = [...this.all];

        if (search) this.filtered = this.query.search(this.filtered, search);

        if (mode === "supported")
            this.filtered = this.query.filterSupported(
                this.filtered,
                this.deviceType,
                this.device
            );

        if (mode === "favs")
            this.filtered = this.query.filterFavorites(
                this.filtered,
                this.storage
            );

        return this;
    }

    /* SEARCH */
    search(q) {
        this.filtered = this.query.search(this.filtered, q);
        return this;
    }

    /* RANDOM */
    random(limit = 1) {
        const shuffled = this.query.shuffle(this.filtered);
        this.filtered = shuffled.slice(0, limit);
        return this;
    }

    getRandomOne() {
        const pool = this.filtered.length ? this.filtered : this.all;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    /* SHUFFLE */
    shuffle() {
        this.filtered = this.query.shuffle(this.filtered);
        return this;
    }

    /* SORT */
    sortBy(key = "name") {
        this.filtered = this.query.sort(this.filtered, key);
        return this;
    }

    sortByPopularity() {
        this.filtered = this.query.sortByPopularity(this.filtered);
        return this;
    }

    /* LOOKUP */
    getByAlias(alias) {
        return this.all.find(g => g.alias === alias) || null;
    }

    getByCategory(cat) {
        this.filtered = this.all.filter(g => g.category === cat);
        return this;
    }

    /* FILTERS */
    filterSupported() {
        this.filtered = this.query.filterSupported(
            this.filtered,
            this.deviceType,
            this.device
        );
        return this;
    }

    filterFavorites() {
        this.filtered = this.query.filterFavorites(
            this.filtered,
            this.storage
        );
        return this;
    }

    /* FAVORITES */
    toggleFavorite(alias) {
        this.storage.favs.has(alias)
            ? this.storage.favs.delete(alias)
            : this.storage.favs.add(alias);

        this.storage.saveFavs();
        return this;
    }

    isFavorite(alias) {
        return this.storage.favs.has(alias);
    }

    /* HISTORY */
    addToHistory(alias) {
        this.storage.history = [
            alias,
            ...this.storage.history.filter(a => a !== alias)
        ].slice(0, 50);

        this.storage.saveHistory();
        return this;
    }

    getHistory() {
        return this.storage.history
            .map(a => this.getByAlias(a))
            .filter(Boolean);
    }

    clearHistory() {
        this.storage.history = [];
        this.storage.saveHistory();
        return this;
    }

    /* RESET */
    reset() {
        this.filtered = [...this.all];
        return this;
    }

    /* GETTERS */
    get list() {
        return this.filtered;
    }

    get total() {
        return this.all.length;
    }

    get filteredCount() {
        return this.filtered.length;
    }
}

/* EXPORT */
const ZYNQ = new ZYNQ_Core();
window.ZYNQ = ZYNQ;

if (typeof module !== "undefined") module.exports = ZYNQ;
if (typeof define === "function") define([], () => ZYNQ);
