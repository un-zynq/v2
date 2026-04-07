# HRN Engine v7.4.2 Documentation

The **HRN Engine** is a high-performance JavaScript library designed for managing, filtering, and caching large-scale game collections. It leverages the Cache API for persistence and optimized Map structures for fast data retrieval.

---

## Installation & Initialization

Load the library via CDN:

```html
<script src="https://cdn.jsdelivr.net/gh/un-zynq/v2/dev/lib7.4.2.js"></script>
```

Initialize the engine:

```javascript
await window.HRN.load();
```

---

## Core API

### `HRN.load()`

Initializes the engine and loads the game collection.

**Behavior:**
- Checks the Cache API for existing data.
- On cache hit: parses cached data immediately and triggers a background fetch to update storage (Stale-While-Revalidate).
- On cache miss: performs a standard fetch.

**Returns:** `Promise<Array>` — The sorted array of game objects.

### `HRN.all()`

Returns the complete dataset currently held in memory.

**Returns:** `Array`

### `HRN.get(alias)`

Retrieves a specific game object by its unique alias.

**Parameters:**
- `alias` (String)

**Returns:** `Object | null`

### `HRN.search(query)`

Searches the collection by alias or name (partial match).

**Parameters:**
- `query` (String)

**Returns:** `Array`

---

## Utility Methods

### `HRN.random(n = 1)`

Selects random game(s) from the collection.

**Parameters:**
- `n` (Number) — Number of items to return (default: 1)

**Returns:** `Object` (when `n = 1`) or `Array` (when `n > 1`)

### `HRN.logHistory(alias)`

Adds a game to the viewing history. History is limited to the last 30 unique entries and stored locally.

**Parameters:**
- `alias` (String)

### `HRN.getHistory()`

Returns the history as game objects, ordered from most recent to oldest.

**Returns:** `Array`

---

## Favorites Management

Favorites are automatically persisted using `localStorage`.

| Method                  | Description                                              | Returns                  |
|-------------------------|----------------------------------------------------------|--------------------------|
| `HRN.toggleFav(alias)`  | Toggles a game’s favorite status                         | `Boolean` (new status)   |
| `HRN.getFavs()`         | Returns all games marked as favorites                    | `Array`                  |

---

## Data Structure

Each game object contains the following properties:

```json
{
  "name": "string",
  "alias": "string",
  "url": "string",
  "splash": "string",
  "isFav": "boolean"
}
```

**Field Descriptions:**
- `name`   — Display name of the game
- `alias`  — Unique identifier
- `url`    — Path or alias to the game
- `splash` — URL to a 4:3 `.webp` thumbnail image
- `isFav`  — Dynamically managed by the engine

---

## Technical Specifications

### Sharding & Performance
To prevent main-thread blocking with large datasets, the engine supports **sharded** JSON files. The internal `_parse` method flattens these shards into a single searchable array.

### Sorting
Sorting is performed using `Intl.Collator` with `{ numeric: true }`, enabling natural alphanumeric ordering (e.g., "Game 2" before "Game 10").

### Caching Strategy
HRN implements a **Stale-While-Revalidate** strategy:
- Delivers data from cache for instant loading
- Updates storage in the background via network requests
