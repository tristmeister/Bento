/**
 * BBS Inklusion Mindmap – Frontend Engine
 * Zoom-Navigation im NotebookLM-Stil
 *
 * Usage (auto-initialized via PHP render / demo.html):
 *   new BBSMindmap(containerEl, config)
 *
 * Config shape:
 *   data             {object}  – Mindmap-JSON-Wurzel
 *   showBreadcrumb   {bool}    – Breadcrumb-Leiste anzeigen
 *   showHomeBtn      {bool}    – Start-Button anzeigen
 *   clickBgBack      {bool}    – Klick auf Hintergrund = Zurück
 *   mobileFullscreen {bool}    – Vollbild auf Mobile
 *   animSpeed        {number}  – Animationsdauer in ms
 */
class BBSMindmap {

  /* ──────────────────────────────────────────────────────────
     Konstruktor & Init
  ────────────────────────────────────────────────────────── */
  constructor(container, config = {}) {
    this.container = container;
    this.cfg = Object.assign({
      data:             {},
      showBreadcrumb:   true,
      showHomeBtn:      true,
      clickBgBack:      true,
      mobileFullscreen: true,
      animSpeed:        360,
    }, config);

    this.stack     = [];   // [{node, label, color}] – Navigationsverlauf
    this.current   = this.cfg.data;
    this.animating = false;

    this._buildShell();
    this._showLevel(this.cfg.data, 'initial');
    this._applyMobileFullscreen();
    window.addEventListener('resize', () => this._applyMobileFullscreen());
  }

  /* ──────────────────────────────────────────────────────────
     DOM-Gerüst aufbauen
  ────────────────────────────────────────────────────────── */
  _buildShell() {
    this.container.classList.add('bbs-mindmap-ready');

    /* Navbar */
    this.navbar = this._el('div', 'mm-navbar');
    this.navbar.setAttribute('role', 'navigation');

    this.backBtn = this._el('button', 'mm-btn mm-back-btn');
    this.backBtn.innerHTML = '<span class="mm-btn-icon" aria-hidden="true">←</span><span class="mm-btn-label">Zurück</span>';
    this.backBtn.setAttribute('aria-label', 'Eine Ebene zurück');
    this.backBtn.hidden = true;
    this.backBtn.addEventListener('click', () => this.goBack());

    this.breadcrumb = this._el('div', 'mm-breadcrumb');
    this.breadcrumb.setAttribute('aria-label', 'Navigationspfad');
    this.breadcrumb.hidden = !this.cfg.showBreadcrumb;

    this.homeBtn = this._el('button', 'mm-btn mm-home-btn');
    this.homeBtn.innerHTML = '<span class="mm-btn-icon" aria-hidden="true">⌂</span><span class="mm-btn-label">Start</span>';
    this.homeBtn.setAttribute('aria-label', 'Zur Startseite');
    this.homeBtn.hidden = true;
    this.homeBtn.addEventListener('click', () => this.goHome());

    this.navbar.appendChild(this.backBtn);
    this.navbar.appendChild(this.breadcrumb);
    if (this.cfg.showHomeBtn) this.navbar.appendChild(this.homeBtn);

    /* Stage (content area) */
    this.stage = this._el('div', 'mm-stage');
    this.stage.setAttribute('role', 'main');

    if (this.cfg.clickBgBack) {
      this.stage.addEventListener('click', (e) => {
        if (e.target === this.stage && this.stack.length > 0) this.goBack();
      });
    }

    this.container.appendChild(this.navbar);
    this.container.appendChild(this.stage);
  }

  /* ──────────────────────────────────────────────────────────
     Level anzeigen (Hauptfunktion)
  ────────────────────────────────────────────────────────── */
  _showLevel(node, direction = 'forward') {
    if (this.animating) return;
    this.animating = true;
    this.current   = node;

    const oldChildren = [...this.stage.children];
    const half        = this.cfg.animSpeed * 0.45;

    /* 1. Alte Elemente animiert ausblenden */
    if (oldChildren.length && direction !== 'initial') {
      const exitClass = direction === 'forward' ? 'mm-exit-fwd' : 'mm-exit-back';
      oldChildren.forEach((el, i) => {
        el.style.setProperty('--exit-i', i);
        el.classList.add(exitClass);
      });
      setTimeout(() => this._renderLevel(node, direction, half), half);
    } else {
      this._renderLevel(node, direction, 0);
    }
  }

  _renderLevel(node, direction, delay) {
    setTimeout(() => {
      this.stage.innerHTML = '';

      /* Root-Hero nur auf Startebene */
      if (this.stack.length === 0) {
        this.stage.appendChild(this._buildRootCard(node));
      } else {
        /* Level-Header zeigt aktuellen Knoten */
        this.stage.appendChild(this._buildLevelHeader(node));
      }

      /* Kinder-Grid oder Leaf-Inhalt */
      if (node.children?.length) {
        const grid = this._buildGrid(node);
        this.stage.appendChild(grid);
      } else {
        this.stage.appendChild(this._buildLeafPanel(node));
      }

      /* Enter-Animation auslösen */
      const enterClass = direction === 'back' ? 'mm-enter-back' : 'mm-enter-fwd';
      const items = this.stage.querySelectorAll('.mm-root-card, .mm-level-header, .mm-node-card, .mm-leaf-panel');
      items.forEach((el, i) => {
        el.style.setProperty('--enter-i', i);
        el.classList.add(enterClass);
        el.addEventListener('animationend', () => el.classList.remove(enterClass), { once: true });
      });

      this._updateNav();
      this.animating = false;
    }, delay);
  }

  /* ──────────────────────────────────────────────────────────
     Root-Hero-Karte (Startebene)
  ────────────────────────────────────────────────────────── */
  _buildRootCard(node) {
    const card = this._el('div', 'mm-root-card');
    card.style.setProperty('--node-color', node.color || '#5c6bc0');

    card.innerHTML = `
      ${node.icon ? `<span class="mm-root-icon" aria-hidden="true">${this._esc(node.icon)}</span>` : ''}
      <h2 class="mm-root-label">${this._esc(node.label)}</h2>
      ${node.children?.length
        ? `<p class="mm-root-sub">${node.children.length} Themenbereiche – wähle einen aus</p>`
        : ''}
    `;
    return card;
  }

  /* ──────────────────────────────────────────────────────────
     Level-Header (tiefere Ebenen)
  ────────────────────────────────────────────────────────── */
  _buildLevelHeader(node) {
    const parentColor = this._resolveColor(node);
    const header = this._el('div', 'mm-level-header');
    header.style.setProperty('--node-color', parentColor);
    header.innerHTML = `
      ${node.icon ? `<span class="mm-level-icon" aria-hidden="true">${this._esc(node.icon)}</span>` : ''}
      <h2 class="mm-level-title">${this._esc(node.label)}</h2>
    `;
    return header;
  }

  /* ──────────────────────────────────────────────────────────
     Karten-Grid
  ────────────────────────────────────────────────────────── */
  _buildGrid(node) {
    const color    = this._resolveColor(node);
    const grid     = this._el('div', 'mm-grid');
    const count    = node.children.length;
    grid.setAttribute('data-count', count);

    node.children.forEach((child, i) => {
      const card = this._buildNodeCard(child, color, i);
      grid.appendChild(card);
    });
    return grid;
  }

  /* ──────────────────────────────────────────────────────────
     Einzelne Knoten-Karte
  ────────────────────────────────────────────────────────── */
  _buildNodeCard(node, parentColor, index) {
    const hasChildren = !!(node.children?.length);
    const hasContent  = !!(node.content);
    const hasUrl      = !!(node.url);
    const isInteractive = hasChildren || hasContent || hasUrl;
    const color = node.color || parentColor || '#5c6bc0';

    const card = this._el('div', 'mm-node-card');
    card.style.setProperty('--node-color', color);
    card.setAttribute('data-index', index);
    if (isInteractive) {
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', node.label);
    }
    if (node.planned) card.classList.add('mm-is-planned');
    if (!isInteractive) card.classList.add('mm-is-static');

    /* Card inner */
    card.innerHTML = `
      <div class="mm-card-inner">
        ${node.icon ? `<span class="mm-node-icon" aria-hidden="true">${this._esc(node.icon)}</span>` : ''}
        <div class="mm-node-body">
          <span class="mm-node-label">${this._esc(node.label)}</span>
          ${node.planned ? '<span class="mm-planned-badge">Geplant</span>' : ''}
          ${hasChildren ? `<span class="mm-node-count">${node.children.length} ${node.children.length === 1 ? 'Eintrag' : 'Einträge'}</span>` : ''}
        </div>
        ${isInteractive ? '<span class="mm-node-chevron" aria-hidden="true">›</span>' : ''}
      </div>
    `;

    if (isInteractive) {
      const activate = () => {
        if (this.animating) return;

        if (hasChildren) {
          this.stack.push({ node: this.current, label: this.current.label, color: this._resolveColor(this.current) });
          this._showLevel(node, 'forward');
        } else if (hasContent) {
          this._expandLeafInline(card, node);
        } else if (hasUrl) {
          window.open(node.url, '_blank', 'noopener noreferrer');
        }
      };

      card.addEventListener('click', activate);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
      });

      /* Hover-Pulse */
      card.addEventListener('pointerenter', () => {
        if (!this.animating) card.classList.add('mm-hovered');
      });
      card.addEventListener('pointerleave', () => card.classList.remove('mm-hovered'));
    }

    return card;
  }

  /* ──────────────────────────────────────────────────────────
     Leaf-Panel (letzter Knoten, kein children)
  ────────────────────────────────────────────────────────── */
  _buildLeafPanel(node) {
    const color = this._resolveColor(node);
    const panel = this._el('div', 'mm-leaf-panel');
    panel.style.setProperty('--node-color', color);

    let inner = `<div class="mm-leaf-inner">`;

    if (node.content) {
      inner += `<div class="mm-leaf-content">${node.content}</div>`;
    } else {
      inner += `<p class="mm-leaf-empty">Kein weiterer Inhalt vorhanden.</p>`;
    }

    if (node.url) {
      inner += `<a href="${this._esc(node.url)}" target="_blank" rel="noopener noreferrer" class="mm-leaf-link">
                  Mehr erfahren →
                </a>`;
    }

    inner += `</div>`;
    panel.innerHTML = inner;
    return panel;
  }

  /* Inline-Expand für Leaf-Karten (Content-Panel klappt auf) */
  _expandLeafInline(card, node) {
    const color = node.color || this._resolveColor(this.current);

    /* Schon offen? → schließen */
    const existing = card.querySelector('.mm-inline-leaf');
    if (existing) {
      existing.classList.add('mm-collapsing');
      existing.addEventListener('animationend', () => existing.remove(), { once: true });
      card.classList.remove('mm-card-expanded');
      return;
    }

    /* Panel erstellen */
    const panel = this._el('div', 'mm-inline-leaf mm-expanding');
    panel.style.setProperty('--node-color', color);
    let html = '';
    if (node.content) html += `<div class="mm-inline-content">${node.content}</div>`;
    if (node.url)     html += `<a href="${this._esc(node.url)}" target="_blank" rel="noopener noreferrer" class="mm-inline-link">Mehr erfahren →</a>`;

    panel.innerHTML = html;
    panel.addEventListener('animationend', () => panel.classList.remove('mm-expanding'), { once: true });
    card.appendChild(panel);
    card.classList.add('mm-card-expanded');
  }

  /* ──────────────────────────────────────────────────────────
     Navigation
  ────────────────────────────────────────────────────────── */
  goBack() {
    if (this.animating || this.stack.length === 0) return;
    const prev = this.stack.pop();
    this._showLevel(prev.node, 'back');
  }

  goHome() {
    if (this.animating) return;
    this.stack = [];
    this._showLevel(this.cfg.data, 'back');
  }

  _jumpTo(index) {
    if (this.animating) return;
    const target = this.stack[index];
    this.stack   = this.stack.slice(0, index);
    this._showLevel(target.node, 'back');
  }

  _updateNav() {
    const depth = this.stack.length;
    this.backBtn.hidden = depth === 0;
    if (this.cfg.showHomeBtn) this.homeBtn.hidden = depth === 0;

    /* Breadcrumb */
    if (this.cfg.showBreadcrumb) {
      this.breadcrumb.hidden  = depth === 0;
      this.breadcrumb.innerHTML = '';

      /* Root-Link */
      const rootCrumb = this._el('button', 'mm-crumb mm-crumb-root');
      rootCrumb.textContent = '⌂';
      rootCrumb.setAttribute('aria-label', 'Start');
      rootCrumb.addEventListener('click', () => this.goHome());
      this.breadcrumb.appendChild(rootCrumb);

      this.stack.forEach((item, i) => {
        const sep = this._el('span', 'mm-crumb-sep');
        sep.textContent = '›';
        sep.setAttribute('aria-hidden', 'true');
        this.breadcrumb.appendChild(sep);

        const crumb = this._el('button', 'mm-crumb');
        crumb.textContent = item.label.length > 22 ? item.label.slice(0, 22) + '…' : item.label;
        crumb.setAttribute('aria-label', item.label);
        const idx = i;
        crumb.addEventListener('click', () => this._jumpTo(idx + 1));
        this.breadcrumb.appendChild(crumb);
      });
    }
  }

  /* ──────────────────────────────────────────────────────────
     Mobile Fullscreen
  ────────────────────────────────────────────────────────── */
  _applyMobileFullscreen() {
    if (!this.cfg.mobileFullscreen) return;
    const isMobile = window.innerWidth < 768;
    this.container.classList.toggle('mm-mobile-fullscreen', isMobile);
  }

  /* ──────────────────────────────────────────────────────────
     Hilfsfunktionen
  ────────────────────────────────────────────────────────── */
  _resolveColor(node) {
    if (node?.color) return node.color;
    /* Farbe vom letzten Stack-Item erben */
    for (let i = this.stack.length - 1; i >= 0; i--) {
      if (this.stack[i].color) return this.stack[i].color;
    }
    return '#5c6bc0';
  }

  _el(tag, classes = '') {
    const el = document.createElement(tag);
    if (classes) classes.trim().split(/\s+/).forEach(c => { if (c) el.classList.add(c); });
    return el;
  }

  _esc(str) {
    const d = document.createElement('div');
    d.textContent = String(str ?? '');
    return d.innerHTML;
  }
}

/* Auto-init für alle .bbs-mindmap[data-config] auf der Seite */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.bbs-mindmap[data-config]').forEach(el => {
    try {
      new BBSMindmap(el, JSON.parse(el.dataset.config));
    } catch (e) {
      console.error('[BBSMindmap] Fehler:', e);
    }
  });
});
