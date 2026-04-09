// =============================================
// docsLib.js - Volledige Herbruikbare Documentatie Bibliotheek
// =============================================

class DocsLib {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;

    if (!this.container) {
      console.error('DocsLib: Container niet gevonden');
      return;
    }

    this.options = {
      dataUrl: './data.json',
      llmCopyUrl: './llm-data.txt',
      theme: 'light',           // light | dark | auto
      sidebarWidth: '280px',
      ...options
    };

    this.docsData = { groups: [] };
    this.currentTheme = this.options.theme === 'auto' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : this.options.theme;

    this.init();
  }

  async init() {
    this.injectStyles();
    this.createStructure();
    await this.loadScripts();
    this.renderSkeletons();

    try {
      const response = await fetch(this.options.dataUrl);
      this.docsData = await response.json();
    } catch (error) {
      this.contentContainer.innerHTML = `<h1>Error</h1><p>Kon data.json niet laden.</p>`;
      return;
    }

    this.renderSidebar();
    this.renderAllContent();
    this.setupEventListeners();
    this.applyTheme();
  }

  injectStyles() {
    if (document.getElementById('docslib-styles')) return;

    const style = document.createElement('style');
    style.id = 'docslib-styles';
    style.textContent = `
      :root {
        --sidebar-width: ${this.options.sidebarWidth};
        --transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        --radius: 8px;
        --z-navbar: 1000;
        --z-sidebar: 1010;
        --z-overlay: 1005;
        --z-search: 2000;
        --z-toggle: 2010;
      }

      .docslib.light-mode {
        --bg-main: #ffffff;
        --bg-sidebar: #f8fafc;
        --bg-subtle: #f1f5f9;
        --bg-overlay: rgba(15,23,42,0.4);
        --text-main: #0f172a;
        --text-body: #475569;
        --text-muted: #64748b;
        --accent: #2563eb;
        --accent-light: #eff6ff;
        --accent-border: #dbeafe;
        --border-color: #e2e8f0;
        --code-bg: #ffffff;
        --code-header-bg: #f8fafc;
        --code-text: #1e293b;
        --inline-code-text: #db2777;
        --sh-comment: #64748b;
        --sh-punctuation: #64748b;
        --sh-property: #dc2626;
        --sh-string: #16a34a;
        --sh-keyword: #2563eb;
        --sh-function: #7c3aed;
        --sh-variable: #ea580c;
        --scrollbar-thumb: #cbd5e1;
        --skeleton-bg: #e2e8f0;
        --skeleton-shine: #f1f5f9;
      }

      .docslib.dark-mode {
        --bg-main: #0f172a;
        --bg-sidebar: #1e293b;
        --bg-subtle: #334155;
        --bg-overlay: rgba(0,0,0,0.6);
        --text-main: #f1f5f9;
        --text-body: #cbd5e1;
        --text-muted: #94a3b8;
        --accent: #3b82f6;
        --accent-light: rgba(59,130,246,0.1);
        --accent-border: #1e40af;
        --border-color: #334155;
        --code-bg: #1e293b;
        --code-header-bg: #0f172a;
        --code-text: #f1f5f9;
        --inline-code-text: #60a5fa;
        --sh-comment: #94a3b8;
        --sh-punctuation: #94a3b8;
        --sh-property: #f87171;
        --sh-string: #4ade80;
        --sh-keyword: #60a5fa;
        --sh-function: #a78bfa;
        --sh-variable: #fb923c;
        --scrollbar-thumb: #475569;
        --skeleton-bg: #334155;
        --skeleton-shine: #475569;
      }

      .docslib {
        display: flex;
        height: 100%;
        width: 100%;
        overflow: hidden;
        font-family: 'Inter', system-ui, sans-serif;
        background: var(--bg-main);
        color: var(--text-main);
        transition: background-color 0.3s ease, color 0.3s ease;
      }

      .docslib-sidebar {
        width: var(--sidebar-width);
        background: var(--bg-sidebar);
        border-right: 1px solid var(--border-color);
        display: flex;
        flex-direction: column;
        padding: 20px 0;
        z-index: var(--z-sidebar);
        flex-shrink: 0;
        transition: transform var(--transition);
        position: relative;
      }

      .sidebar-scroll {
        flex: 1;
        overflow-y: auto;
        padding: 0 16px;
        padding-bottom: 80px;
      }

      .search-container {
        position: relative;
        margin: 0 16px 32px;
      }

      #search-trigger-input {
        width: 100%;
        padding: 10px 14px;
        border-radius: var(--radius);
        border: 1px solid var(--border-color);
        background: var(--bg-main);
        font-size: 14px;
        outline: none;
        cursor: pointer;
        color: var(--text-main);
      }

      .search-shortcut {
        position: absolute;
        right: 10px;
        font-size: 10px;
        background: var(--bg-subtle);
        padding: 2px 6px;
        border-radius: 4px;
        color: var(--text-muted);
        border: 1px solid var(--border-color);
        pointer-events: none;
      }

      .nav-group {
        margin-bottom: 16px;
      }

      .nav-group-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        cursor: pointer;
        border-radius: 6px;
        user-select: none;
      }

      .nav-group-header:hover {
        background: var(--bg-subtle);
      }

      .nav-group-title {
        font-size: 11px;
        font-weight: 700;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: .05em;
      }

      .nav-group-toggle-icon {
        width: 16px;
        height: 16px;
        color: var(--text-muted);
        transition: transform 0.2s ease;
      }

      .nav-group.collapsed .nav-group-toggle-icon {
        transform: rotate(-90deg);
      }

      .nav-group-items {
        overflow: hidden;
        transition: max-height 0.3s ease;
        padding-left: 4px;
      }

      .nav-item {
        display: flex;
        align-items: center;
        padding: 10px 12px;
        font-size: 14px;
        color: var(--text-muted);
        cursor: pointer;
        border-radius: 6px;
        margin-bottom: 4px;
      }

      .nav-item:hover {
        background: var(--bg-subtle);
        color: var(--text-main);
      }

      .nav-item.active {
        background: var(--bg-main);
        color: var(--accent);
        font-weight: 500;
      }

      .nav-icon {
        margin-right: 12px;
        width: 16px;
        height: 16px;
        opacity: .6;
      }

      .docslib-main {
        flex: 1;
        overflow-y: auto;
        padding-top: 40px;
      }

      .docslib-content {
        max-width: 820px;
        margin: 0 auto;
        padding: 0 48px 40px;
      }

      .doc-section {
        padding-top: 40px;
        margin-bottom: 40px;
      }

      .section-divider {
        border: 0;
        height: 1px;
        background: var(--border-color);
        margin: 40px 0;
      }

      .badge {
        background: var(--accent-light);
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
        color: var(--accent);
        border: 1px solid var(--accent-border);
        display: inline-block;
        margin-bottom: 20px;
      }

      h1, h2, h3, h4 {
        margin-top: 40px;
        margin-bottom: 20px;
        font-weight: 700;
        line-height: 1.3;
        color: var(--text-main);
        scroll-margin-top: 80px;
      }

      h1 { font-size: 34px; border-bottom: 1px solid var(--border-color); padding-bottom: 20px; margin-top: 0; }
      h2 { font-size: 26px; margin-top: 64px; border-top: 1px solid var(--border-color); padding-top: 32px; }
      h3 { font-size: 20px; margin-top: 40px; }

      p {
        line-height: 1.75;
        color: var(--text-body);
        font-size: 15px;
        margin-bottom: 24px;
      }

      a { color: var(--accent); text-decoration: none; font-weight: 500; }
      a:hover { text-decoration: underline; }

      code:not(pre > code) {
        background: var(--bg-subtle);
        color: var(--inline-code-text);
        padding: 0.2em 0.4em;
        border-radius: 4px;
        font-size: 85%;
        font-family: 'JetBrains Mono', monospace;
      }

      .code-section {
        margin: 36px 0;
        background: var(--code-bg);
        border-radius: var(--radius);
        border: 1px solid var(--border-color);
        overflow: hidden;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
      }

      .code-header {
        background: var(--code-header-bg);
        padding: 0 18px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 48px;
        border-bottom: 1px solid var(--border-color);
      }

      .copy-button {
        background: none;
        border: none;
        width: 32px;
        height: 32px;
        cursor: pointer;
        color: #94a3b8;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
      }

      .copy-button:hover {
        color: var(--text-main);
        background: var(--bg-subtle);
      }

      pre[class*="language-"] {
        margin: 0 !important;
        padding: 20px !important;
        font-size: 13.5px !important;
        background: transparent !important;
        font-family: 'JetBrains Mono', monospace;
        color: var(--code-text);
      }

      .token.comment { color: var(--sh-comment); }
      .token.punctuation { color: var(--sh-punctuation); }
      .token.property, .token.tag, .token.boolean, .token.number, .token.constant, .token.symbol, .token.deleted { color: var(--sh-property); }
      .token.selector, .token.attr-name, .token.string, .token.char, .token.builtin, .token.inserted { color: var(--sh-string); }
      .token.atrule, .token.attr-value, .token.keyword { color: var(--sh-keyword); }
      .token.function, .token.class-name { color: var(--sh-function); }
      .token.regex, .token.important, .token.variable { color: var(--sh-variable); }

      .skeleton {
        background: var(--skeleton-bg);
        position: relative;
        overflow: hidden;
        border-radius: 4px;
        min-height: 1em;
      }

      .skeleton::after {
        content: '';
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        transform: translateX(-100%);
        background: linear-gradient(90deg, transparent, var(--skeleton-shine), transparent);
        animation: shimmer 1.5s infinite;
      }

      @keyframes shimmer { 100% { transform: translateX(100%); } }

      .llm-btn {
        width: 100%;
        padding: 10px;
        background: var(--bg-main);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        color: var(--text-muted);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
      }

      .llm-btn:hover {
        background: var(--bg-subtle);
        color: var(--text-main);
      }

      /* Search overlay */
      #search-overlay {
        position: fixed;
        inset: 0;
        background: var(--bg-overlay);
        display: none;
        justify-content: center;
        align-items: flex-start;
        padding-top: 10vh;
        z-index: var(--z-search);
        backdrop-filter: blur(4px);
      }

      #search-overlay.active { display: flex; }

      .search-modal {
        width: 90%;
        max-width: 640px;
        background: var(--bg-main);
        border-radius: 12px;
        box-shadow: 0 25px 50px -12px rgba(0,0,0,.25);
        overflow: hidden;
        border: 1px solid var(--border-color);
      }
    `;
    document.head.appendChild(style);
  }

  createStructure() {
    this.container.innerHTML = `
      <div class="docslib ${this.currentTheme}-mode" style="height:100%;width:100%;">
        <aside class="docslib-sidebar">
          <div class="search-container" id="search-trigger">
            <input type="text" id="search-trigger-input" placeholder="Search documentation..." readonly>
            <span class="search-shortcut">Ctrl K</span>
          </div>
          <div class="sidebar-scroll" id="dynamic-nav"></div>
          <div class="sidebar-footer">
            <button class="llm-btn" id="llm-copy-btn">
              <span>Copy for LLMs</span>
            </button>
          </div>
        </aside>

        <main class="docslib-main">
          <div class="docslib-content" id="dynamic-content"></div>
        </main>

        <!-- Search Overlay -->
        <div id="search-overlay">
          <div class="search-modal">
            <div class="search-modal-header" style="padding:20px;border-bottom:1px solid var(--border-color);display:flex;align-items:center;gap:14px;">
              <input type="text" id="search-input-real" placeholder="Search by title, tags or content..." style="flex:1;border:none;outline:none;font-size:16px;background:transparent;color:var(--text-main);">
            </div>
            <div id="search-results" style="overflow-y:auto;flex:1;padding:12px;min-height:200px;"></div>
          </div>
        </div>
      </div>
    `;

    this.root = this.container.querySelector('.docslib');
    this.navContainer = this.container.querySelector('#dynamic-nav');
    this.contentContainer = this.container.querySelector('#dynamic-content');
    this.llmBtn = this.container.querySelector('#llm-copy-btn');
    this.searchOverlay = this.container.querySelector('#search-overlay');
    this.searchInput = this.container.querySelector('#search-input-real');
    this.searchResults = this.container.querySelector('#search-results');
  }

  async loadScripts() {
    const scripts = [
      'https://unpkg.com/lucide@latest',
      'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-typescript.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-bash.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-json.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-python.min.js',
      'https://cdn.jsdelivr.net/npm/marked/marked.min.js'
    ];

    for (const src of scripts) {
      if (!document.querySelector(`script[src="${src}"]`)) {
        await new Promise(resolve => {
          const s = document.createElement('script');
          s.src = src;
          s.async = false;
          s.onload = resolve;
          document.head.appendChild(s);
        });
      }
    }
  }

  renderSkeletons() {
    let navHtml = '';
    for (let i = 0; i < 4; i++) {
      navHtml += `<div style="padding:12px"><div class="skeleton" style="height:10px;width:30%;margin-bottom:16px"></div>`;
      for (let j = 0; j < 3; j++) navHtml += `<div class="skeleton" style="height:28px;margin-bottom:10px"></div>`;
      navHtml += `</div>`;
    }
    this.navContainer.innerHTML = navHtml;

    this.contentContainer.innerHTML = `
      <div class="skeleton" style="height:38px;width:40%;margin-bottom:28px"></div>
      <div class="skeleton" style="height:16px;margin-bottom:20px"></div>
      <div class="skeleton" style="height:16px;margin-bottom:20px"></div>
      <div class="skeleton" style="height:180px;margin-top:36px"></div>
    `;
  }

  parseMarkdown(text) {
    if (!text) return '';
    const html = marked.parse(text, { breaks: true, gfm: true });
    const temp = document.createElement('div');
    temp.innerHTML = html;
    temp.querySelectorAll('table').forEach(table => {
      const wrapper = document.createElement('div');
      wrapper.className = 'table-wrapper';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
    return temp.innerHTML;
  }

  processCodeBlocks(container) {
    container.querySelectorAll('pre').forEach(pre => {
      const codeEl = pre.querySelector('code');
      const langClass = codeEl ? Array.from(codeEl.classList).find(c => c.startsWith('language-')) || '' : '';
      const lang = langClass ? langClass.replace('language-', '') : 'text';

      const wrapper = document.createElement('div');
      wrapper.className = 'code-section';

      const header = document.createElement('div');
      header.className = 'code-header';
      header.innerHTML = `<span class="code-tab">${lang.toUpperCase()}</span><button class="copy-button"><i data-lucide="copy" size="14"></i></button>`;

      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(header);
      wrapper.appendChild(pre);

      header.querySelector('.copy-button').onclick = async () => {
        const text = codeEl ? codeEl.textContent : pre.textContent;
        await navigator.clipboard.writeText(text);
        const btn = header.querySelector('.copy-button');
        btn.innerHTML = '<i data-lucide="check" style="color:#16a34a" size="14"></i>';
        lucide.createIcons();
        setTimeout(() => {
          btn.innerHTML = '<i data-lucide="copy" size="14"></i>';
          lucide.createIcons();
        }, 2000);
      };
    });
  }

  flattenItems(items) {
    return items.reduce((acc, item) => {
      acc.push(item);
      if (item.children) acc.push(...this.flattenItems(item.children));
      return acc;
    }, []);
  }

  scrollToSection(id) {
    const target = document.getElementById(`section-${id}`);
    if (target) {
      this.container.querySelector('.docslib-main').scrollTo({
        top: target.offsetTop - 20,
        behavior: 'smooth'
      });
    }
  }

  renderAllContent() {
    this.contentContainer.innerHTML = '';
    const allItems = this.flattenItems(this.docsData.groups.flatMap(g => g.items)).filter(i => i.content);

    allItems.forEach((item, index) => {
      const section = document.createElement('section');
      section.id = `section-${item.id}`;
      section.className = 'doc-section';
      section.innerHTML = `<span class="badge">${item.badge || 'Docs'}</span>${this.parseMarkdown(item.content)}`;
      this.contentContainer.appendChild(section);

      if (index < allItems.length - 1) {
        const hr = document.createElement('hr');
        hr.className = 'section-divider';
        this.contentContainer.appendChild(hr);
      }
    });

    this.processCodeBlocks(this.contentContainer);
    Prism.highlightAll();
    lucide.createIcons();
  }

  createNavItem(item, container) {
    const el = document.createElement('div');
    el.className = 'nav-item';
    el.id = `nav-${item.id}`;
    el.innerHTML = `<i data-lucide="${item.icon || 'file-text'}" class="nav-icon"></i><span>${item.label}</span>`;
    el.onclick = (e) => {
      e.stopPropagation();
      this.scrollToSection(item.id);
    };
    container.appendChild(el);

    if (item.children) {
      const childGroup = document.createElement('div');
      childGroup.className = 'nested-container';
      item.children.forEach(child => this.createNavItem(child, childGroup));
      container.appendChild(childGroup);
    }
  }

  renderSidebar() {
    this.navContainer.innerHTML = '';
    this.docsData.groups.forEach(g => {
      const groupDiv = document.createElement('div');
      groupDiv.className = 'nav-group';

      const header = document.createElement('div');
      header.className = 'nav-group-header';
      header.innerHTML = `<span class="nav-group-title">${g.title}</span><i data-lucide="chevron-down" class="nav-group-toggle-icon"></i>`;

      const itemsDiv = document.createElement('div');
      itemsDiv.className = 'nav-group-items';
      g.items.forEach(i => this.createNavItem(i, itemsDiv));

      header.onclick = () => {
        const isCollapsed = groupDiv.classList.contains('collapsed');
        if (isCollapsed) {
          groupDiv.classList.remove('collapsed');
          itemsDiv.style.maxHeight = itemsDiv.scrollHeight + 'px';
        } else {
          groupDiv.classList.add('collapsed');
          itemsDiv.style.maxHeight = '0px';
        }
      };

      groupDiv.appendChild(header);
      groupDiv.appendChild(itemsDiv);
      this.navContainer.appendChild(groupDiv);
    });
    lucide.createIcons();

    // Open all groups by default
    setTimeout(() => {
      document.querySelectorAll('.nav-group-items').forEach(el => {
        el.style.maxHeight = el.scrollHeight + 'px';
      });
    }, 100);
  }

  openSearch() {
    this.searchOverlay.classList.add('active');
    this.searchInput.value = '';
    this.performSearch('');
    setTimeout(() => this.searchInput.focus(), 50);
  }

  closeSearch() {
    this.searchOverlay.classList.remove('active');
  }

  performSearch(query) {
    const allItems = this.flattenItems(this.docsData.groups.flatMap(g => g.items)).filter(i => i.content);
    let results = [];

    if (!query.trim()) {
      results = allItems;
    } else {
      const q = query.toLowerCase();
      results = allItems.map(item => {
        let score = 0;
        const label = (item.label || "").toLowerCase();
        const content = (item.content || "").toLowerCase();

        if (label === q) score += 100;
        else if (label.startsWith(q)) score += 80;
        else if (label.includes(q)) score += 60;

        if (content.includes(q)) {
          score += 20;
          const count = content.split(q).length - 1;
          score += Math.min(count * 2, 20);
        }
        return { ...item, score };
      }).filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score);
    }

    this.renderSearchResults(results, query);
  }

  renderSearchResults(results, query) {
    if (results.length === 0) {
      this.searchResults.innerHTML = `<div style="padding:40px 20px;text-align:center;color:var(--text-muted);">No results found for "${query}"</div>`;
      return;
    }

    this.searchResults.innerHTML = results.map(item => {
      const preview = item.content ? item.content.replace(/[#*`]/g, '').substring(0, 80) + '...' : '';
      return `
        <div class="search-result-item" data-id="${item.id}" style="padding:12px 16px;display:flex;align-items:center;gap:14px;cursor:pointer;border-radius:8px;margin-bottom:4px;">
          <i data-lucide="${item.icon || 'file-text'}" size="18" style="color:#94a3b8"></i>
          <div>
            <div style="font-weight:600;">${item.label}</div>
            <div style="font-size:12px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${preview}</div>
          </div>
        </div>
      `;
    }).join('');

    lucide.createIcons();

    this.searchResults.querySelectorAll('.search-result-item').forEach(el => {
      el.onclick = () => {
        this.scrollToSection(el.dataset.id);
        this.closeSearch();
      };
    });
  }

  setupEventListeners() {
    // Search
    this.container.querySelector('#search-trigger').onclick = () => this.openSearch();
    this.searchOverlay.onclick = (e) => {
      if (e.target === this.searchOverlay) this.closeSearch();
    };
    this.searchInput.oninput = (e) => this.performSearch(e.target.value);

    // Keyboard
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.openSearch();
      }
      if (e.key === 'Escape') this.closeSearch();
    });

    // LLM Copy
    this.llmBtn.onclick = async () => {
      const original = this.llmBtn.innerHTML;
      try {
        const res = await fetch(this.options.llmCopyUrl);
        const text = await res.text();
        await navigator.clipboard.writeText(text);
        this.llmBtn.innerHTML = '<span>Copied!</span>';
      } catch (err) {
        this.llmBtn.innerHTML = '<span>Error</span>';
      }
      setTimeout(() => {
        this.llmBtn.innerHTML = original;
      }, 2000);
    };

    // Scroll spy for active nav
    const mainScroll = this.container.querySelector('.docslib-main');
    mainScroll.onscroll = () => {
      const sections = this.contentContainer.querySelectorAll('.doc-section');
      let current = "";
      sections.forEach(s => {
        if (mainScroll.scrollTop >= s.offsetTop - 100) current = s.id.replace('section-', '');
      });
      if (current) {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const activeEl = document.getElementById(`nav-${current}`);
        if (activeEl) activeEl.classList.add('active');
      }
    };
  }

  applyTheme() {
    // Theme toggle kan later toegevoegd worden indien gewenst
  }

  setTheme(theme) {
    this.currentTheme = theme;
    this.root.className = `docslib ${theme}-mode`;
  }

  destroy() {
    this.container.innerHTML = '';
  }
}

// Custom Element
class DocsLibElement extends HTMLElement {
  connectedCallback() {
    this.style.display = 'block';
    this.style.height = '100%';
    this.style.width = '100%';

    new DocsLib(this, {
      dataUrl: this.getAttribute('data-url') || './data.json',
      llmCopyUrl: this.getAttribute('llm-url') || './llm-data.txt',
      theme: this.getAttribute('theme') || 'light',
      sidebarWidth: this.getAttribute('sidebar-width') || '280px'
    });
  }
}

if (!customElements.get('docs-lib')) {
  customElements.define('docs-lib', DocsLibElement);
}

// Global export
window.DocsLib = DocsLib;
