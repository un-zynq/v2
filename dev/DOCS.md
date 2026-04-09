# HRN Core Documentation v7.5.19

Modern, lightweight game library loader and device detection utility.

---

## Installation

### Standard Script
```html
<script src="https://cdn.jsdelivr.net/gh/un-zynq/v2/dev/lib7.5.19.min.js"></script>
```

### ES Module
```javascript
import 'https://cdn.jsdelivr.net/gh/un-zynq/v2/dev/lib7.5.19.min.js';
```

---

## Initialization

```javascript
await HRN.init({
  mode: 'all',       // 'all', 'supported', 'favs'
  sort: 'name',      // 'name', 'category', 'alias'
  search: '',        // Initial search query
  src: undefined,    // Custom JSON source URL
  cdn: undefined     // Custom Thumbnail CDN URL
});
```

---

## Core API

### Properties
| Property | Type | Description |
| :--- | :--- | :--- |
| `HRN.list` | `Array` | Returns the current filtered and sorted game list. |
| `HRN.deviceType` | `Number` | 1: Desktop (Touch), 2: Desktop (Mouse), 3: Mobile, 4: Tablet. |

### Methods
| Method | Description |
| :--- | :--- |
| `search(query)` | Filters the list by name or alias. |
| `random(limit)` | Shuffles the current list and limits results. |
| `limit(count, offset)`| Slices the list for pagination. |
| `filterSupported()` | Filters list by device compatibility. |
| `filterFavorites()` | Filters list by favorited games. |
| `toggleFavorite(id)`| Toggles favorite status and saves to LocalStorage. |
| `on(event, cb)` | Subscribes to events (`init`, `filter`, `favoriteUpdate`). |
| `reset()` | Clears all filters and restores the full list. |

---

## Data Structure

```javascript
{
  name: "Game Name",
  category: "Action",
  alias: "game-id",
  url: "path/game-id",
  thumb: "cdn/path/game-id.webp",
  isSupported: true,
  isFavorite: false
}
```

---

## Usage Example

### Events & Pagination
```javascript
// Listen for updates
HRN.on('filter', (list) => {
  console.log(`${list.length} games found.`);
});

async function loadPortal() {
  await HRN.init();
  
  // Chainable Discovery:
  // Search 'quest', only supported, get 5 random results, skip first 0
  const games = HRN.search('quest')
                   .filterSupported()
                   .random(10)
                   .limit(5, 0)
                   .list;
}
```
