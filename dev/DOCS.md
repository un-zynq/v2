# HRN Engine v7.4.2 Documentation

The HRN Engine is a specialized JavaScript library designed for managing, filtering, and caching large-scale game collections. It utilizes the Cache API for persistence and Map structures for high-performance data retrieval.

---

## Initialization

Load the library via the following CDN link:
`https://cdn.jsdelivr.net/gh/un-zynq/v2/dev/lib7.4.2.js`

```javascript
await window.HRN.load();
```

---

## Core API Methods

### load()
Initializes the engine and populates the data set.
* **Logic:** Checks the Cache API for existing data. If found, it parses the cache for immediate use and triggers a background fetch to update the storage. If no cache exists, it performs a standard fetch.
* **Returns:** `Promise<Array>` (The sorted list of game objects).

### all()
Accesses the current data set stored in memory.
* **Returns:** `Array`

### get(alias)
Retrieves a specific game object by its unique identifier.
* **Parameters:** `alias` (String)
* **Returns:** `Object` or `null`.

### search(query)
Filters the collection based on the alias or the display name.
* **Parameters:** `q` (String)
* **Returns:** `Array`

---

## Utility Functions

### random(n)
Selects random entries from the library.
* **Parameters:** `n` (Number, default = 1)
* **Returns:** `Object` (if n=1) or `Array` (if n > 1).

### logHistory(alias)
Stores a game identifier in the local history. Limits the history to the last 30 unique entries.
* **Parameters:** `alias` (String)

### getHistory()
Retrieves the game objects from the history list, ordered from most recent to oldest.
* **Returns:** `Array`

---

## Favorites Management

Persistence is handled automatically via `localStorage`.

| Method | Description |
| :--- | :--- |
| `toggleFav(alias)` | Adds or removes a game from the favorites set. Returns `Boolean`. |
| `getFavs()` | Returns an array of all game objects marked as favorites. |

---

## Data Structure

Each game object contains the following standard properties:

```json
{
    "name": "String",
    "alias": "String",
    "url": "String (path/alias)",
    "splash": "String (URL to .webp)",
    "isFav": "Boolean"
}
```

---

## Technical Specifications

### Sharding
The engine is designed to parse data structured in shards to prevent main-thread blocking during large JSON operations. The `_parse` method flattens these shards into a single searchable array.

### Sorting
Sorting is implemented using `Intl.Collator` with the `numeric` property enabled. This ensures natural alphanumeric sorting (e.g., "Game 2" precedes "Game 10").

### Caching Strategy
HRN employs a "Stale-While-Revalidate" strategy. It prioritizes the `caches` API for near-instant load times while ensuring data remains up-to-date through background network requests.

### Configuration
* **Thumbnail CDN:** `https://cdn.jsdelivr.net/gh/un-zynq/thumbnails`
* **Data Source:** `https://un-zynq.github.io/games2.json`
* **Storage Keys:** `hrn_f` (Favorites), `hrn_h` (History)
