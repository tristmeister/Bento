/**
 * BBS Inklusion Mindmap – Frontend Engine
 * Radiales Zoom-Navigationssystem · NotebookLM-Stil
 */
class BBSMindmap {

  constructor(container, config = {}) {
    this.container = container;
    this.cfg = Object.assign({
      data:             {},
      showBreadcrumb:   true,
      showHomeBtn:      true,
      clickBgBack:      true,
      mobileFullscreen: false,
      animSpeed:        360,
    }, config);

    this.stack        = [];
    this.current      = this.cfg.data;
    this.animating    = false;
    this._resizeTimer = null;

    this._buildShell();
    this._showLevel(this.cfg.data, 'initial');
    this._applyMobileFullscreen();
    window.addEventListener('resize', () => {
      this._applyMobileFullscreen();
      clearTimeout(this._resizeTimer);
      this._resizeTimer = setTimeout(() => this._repositionIfNeeded(), 160);
    });
  }

  /* ── DOM-Gerüst ───────────────────────────────────────────── */
  _buildShell() {
    this.container.classList.add('bbs-mindmap-ready');
    this.container.style.setProperty('--mm-anim-speed', this.cfg.animSpeed + 'ms');

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

  /* ── Level-Navigation ─────────────────────────────────────── */
  _showLevel(node, direction = 'forward') {
    if (this.animating) return;
    this.animating = true;
    this.current   = node;

    const oldChildren = [...this.stage.children];
    const half        = this.cfg.animSpeed * 0.45;

    if (oldChildren.length && direction !== 'initial') {
      const exitClass = direction === 'forward' ? 'mm-exit-fwd' : 'mm-exit-back';
      oldChildren.forEach(el => el.classList.add(exitClass));
      setTimeout(() => this._renderLevel(node, direction, half), half);
    } else {
      this._renderLevel(node, direction, 0);
    }
  }

  _renderLevel(node, direction, delay) {
    setTimeout(() => {
      this.stage.innerHTML = '';
      const enterClass = direction === 'back' ? 'mm-enter-back' : 'mm-enter-fwd';

      if (node.children?.length) {
        this.stage.appendChild(this._buildRadialScreen(node, enterClass));
      } else {
        const panel = this._buildLeafPanel(node);
        panel.classList.add(enterClass);
        panel.addEventListener('animationend', () => panel.classList.remove(enterClass), { once: true });
        this.stage.appendChild(panel);
      }

      this._updateNav();
      this.animating = false;
    }, delay);
  }

  /* ── Radiales Layout ──────────────────────────────────────── */
  _buildRadialScreen(node, enterClass) {
    const wrap     = this._el('div', 'mm-radial');
    const color    = node.color || this._resolveColor(node);
    const isMobile = window.innerWidth < 640;

    wrap.appendChild(this._buildCenterCard(node));

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('mm-radial-svg');
    svg.setAttribute('aria-hidden', 'true');
    wrap.appendChild(svg);

    if (isMobile) {
      wrap.classList.add('mm-radial--list');
      this.stage.classList.add('mm-stage--list');
      node.children.forEach((child, i) => {
        const orbit = this._el('div', 'mm-radial-orbit');
        orbit.style.setProperty('--float-delay', (i * 0.55 % 2.8).toFixed(2) + 's');
        orbit.appendChild(this._buildNodeCard(child, color, i));
        wrap.appendChild(orbit);
      });
    } else {
      wrap.classList.remove('mm-radial--list');
      this.stage.classList.remove('mm-stage--list');
      this._buildRadialPositions(wrap, svg, node, color);
    }

    // Wrapper-Einblend-Animation nach dem nächsten Paint
    requestAnimationFrame(() => {
      wrap.classList.add(enterClass);
      wrap.addEventListener('animationend', () => wrap.classList.remove(enterClass), { once: true });
    });

    return wrap;
  }

  /*
   * Kern-Logik: Orbits starten am Zentrum und fliegen per CSS-Transition
   * zu ihren Zielpositionen — kein Positions-Sprung, keine Hackigkeit.
   *
   * Ablauf:
   *  1. Positionen berechnen
   *  2. Alle Orbits bei (cx, cy) erstellen → browser registriert Startzustand
   *  3. void wrap.offsetHeight → erzwingt Reflow → Startzustand eingefroren
   *  4. Zielpositionen setzen → CSS-Transition startet automatisch
   *  5. SVG-Linien verzögert zeichnen (nach Orbit-Ankunft)
   */
  _buildRadialPositions(wrap, svg, node, color) {
    const ww = this.stage.offsetWidth;
    const wh = this.stage.offsetHeight
               || Math.max(420, window.innerHeight - (this.navbar?.offsetHeight || 58));
    if (!ww || !wh) return;

    const cx    = ww / 2;
    const cy    = wh / 2;
    const count = node.children.length;

    const centerW = Math.min(340, ww * 0.36);
    const childW  = Math.min(230, ww * 0.20);
    const minR    = centerW / 2 + childW / 2 + 28;
    const maxR    = Math.min(ww * 0.41, wh * 0.41);
    const radius  = Math.max(minR, Math.min(maxR, 320));

    // Zielpositionen vorberechnen
    const targets = node.children.map((_, i) => {
      const rad = ((360 / count) * i - 90) * Math.PI / 180;
      return {
        x: Math.round(cx + radius * Math.cos(rad)),
        y: Math.round(cy + radius * Math.sin(rad)),
      };
    });

    svg.setAttribute('width', ww);
    svg.setAttribute('height', wh);
    svg.setAttribute('viewBox', `0 0 ${ww} ${wh}`);

    // Schritt 1: Orbits AM ZENTRUM erstellen
    node.children.forEach((child, i) => {
      const orbit = this._el('div', 'mm-radial-orbit');
      orbit.style.left = cx + 'px';   // Startposition = Zentrum
      orbit.style.top  = cy + 'px';
      orbit.style.setProperty('--orbit-i', i);
      // Float-Animation erst nach Ende der Transition starten (0.7s + Stagger)
      const floatDelay = 0.72 + i * 0.065 + (i * 0.4 % 1.4);
      orbit.style.setProperty('--float-delay', floatDelay.toFixed(2) + 's');
      orbit.appendChild(this._buildNodeCard(child, color, i));
      wrap.appendChild(orbit);
    });

    // Schritt 2: Reflow erzwingen → Browser registriert Zentrum als Startzustand
    void wrap.offsetHeight;

    // Schritt 3: Zielpositionen setzen → CSS-Transition übernimmt die Bewegung
    const orbits = wrap.querySelectorAll('.mm-radial-orbit');
    orbits.forEach((orbit, i) => {
      orbit.style.left = targets[i].x + 'px';
      orbit.style.top  = targets[i].y + 'px';
    });

    // Schritt 4: SVG-Linien zeichnen (verzögert, damit sie bei Orbit-Ankunft erscheinen)
    targets.forEach((pos, i) => {
      const len  = Math.round(Math.hypot(pos.x - cx, pos.y - cy));
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', cx); line.setAttribute('y1', cy);
      line.setAttribute('x2', pos.x); line.setAttribute('y2', pos.y);
      line.style.setProperty('--line-length', len);
      line.style.setProperty('--line-i', i);
      line.classList.add('mm-radial-line');
      svg.appendChild(line);
    });
  }

  _buildCenterCard(node) {
    const isRoot = this.stack.length === 0;
    const color  = node.color || this._resolveColor(node);
    const card   = this._el('div', 'mm-radial-center');
    card.style.setProperty('--node-color', color);

    let sub = '';
    if (node.children?.length) {
      sub = isRoot
        ? `${node.children.length} Themenbereiche – wähle einen aus`
        : `${node.children.length} ${node.children.length === 1 ? 'Unterpunkt' : 'Unterpunkte'}`;
    }

    card.innerHTML = `
      <div class="mm-center-inner">
        ${node.icon ? `<span class="mm-center-icon" aria-hidden="true">${this._esc(node.icon)}</span>` : ''}
        <div class="mm-center-body">
          <span class="mm-center-label">${this._esc(node.label)}</span>
          ${sub ? `<span class="mm-center-sub">${sub}</span>` : ''}
        </div>
      </div>`;
    return card;
  }

  /* Resize: Transition kurz deaktivieren für sofortige Neupositionierung */
  _repositionIfNeeded() {
    const radial = this.stage.querySelector('.mm-radial');
    if (!radial) return;

    const isMobile = window.innerWidth < 640;
    const orbits   = radial.querySelectorAll('.mm-radial-orbit');
    const svg      = radial.querySelector('.mm-radial-svg');

    if (isMobile) {
      radial.classList.add('mm-radial--list');
      this.stage.classList.add('mm-stage--list');
      orbits.forEach(o => { o.style.left = ''; o.style.top = ''; });
      if (svg) svg.innerHTML = '';
      return;
    }

    radial.classList.remove('mm-radial--list');
    this.stage.classList.remove('mm-stage--list');

    const ww = this.stage.offsetWidth;
    const wh = this.stage.offsetHeight;
    if (!ww || !wh || !orbits.length) return;

    // Transition temporär deaktivieren → kein langsames Gleiten beim Resize
    orbits.forEach(o => (o.style.transition = 'none'));

    const cx    = ww / 2;
    const cy    = wh / 2;
    const count = orbits.length;
    const centerW = Math.min(340, ww * 0.36);
    const childW  = Math.min(230, ww * 0.20);
    const minR    = centerW / 2 + childW / 2 + 28;
    const maxR    = Math.min(ww * 0.41, wh * 0.41);
    const radius  = Math.max(minR, Math.min(maxR, 320));

    if (svg) {
      svg.setAttribute('width', ww);
      svg.setAttribute('height', wh);
      svg.setAttribute('viewBox', `0 0 ${ww} ${wh}`);
      svg.innerHTML = '';
    }

    orbits.forEach((orbit, i) => {
      const rad = ((360 / count) * i - 90) * Math.PI / 180;
      const x   = Math.round(cx + radius * Math.cos(rad));
      const y   = Math.round(cy + radius * Math.sin(rad));

      orbit.style.left = x + 'px';
      orbit.style.top  = y + 'px';

      if (svg) {
        const len  = Math.round(Math.hypot(x - cx, y - cy));
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', cx); line.setAttribute('y1', cy);
        line.setAttribute('x2', x);  line.setAttribute('y2', y);
        line.style.setProperty('--line-length', len);
        line.style.setProperty('--line-i', i);
        line.classList.add('mm-radial-line');
        svg.appendChild(line);
      }
    });

    // Transition nach einem Frame wieder aktivieren
    requestAnimationFrame(() => orbits.forEach(o => (o.style.transition = '')));
  }

  /* ── Knoten-Karte ─────────────────────────────────────────── */
  _buildNodeCard(node, parentColor, index) {
    const hasChildren  = !!(node.children?.length);
    const hasContent   = !!(node.content);
    const hasUrl       = !!(node.url);
    const isInteractive = hasChildren || hasContent || hasUrl;
    const color = node.color || parentColor || '#5c6bc0';

    const card = this._el('div', 'mm-node-card');
    card.style.setProperty('--node-color', color);
    card.setAttribute('data-index', index);
    if (isInteractive) {
      card.setAttribute('role',       'button');
      card.setAttribute('tabindex',   '0');
      card.setAttribute('aria-label', node.label);
    }
    if (node.planned)   card.classList.add('mm-is-planned');
    if (!isInteractive) card.classList.add('mm-is-static');

    card.innerHTML = `
      <div class="mm-card-inner">
        ${node.icon ? `<span class="mm-node-icon" aria-hidden="true">${this._esc(node.icon)}</span>` : ''}
        <div class="mm-node-body">
          <span class="mm-node-label">${this._esc(node.label)}</span>
          ${node.planned ? '<span class="mm-planned-badge">Geplant</span>' : ''}
          ${hasChildren ? `<span class="mm-node-count">${node.children.length} ${node.children.length === 1 ? 'Eintrag' : 'Einträge'}</span>` : ''}
        </div>
        ${isInteractive ? '<span class="mm-node-chevron" aria-hidden="true">›</span>' : ''}
      </div>`;

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
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
      });
      card.addEventListener('pointerenter', () => { if (!this.animating) card.classList.add('mm-hovered'); });
      card.addEventListener('pointerleave', () => card.classList.remove('mm-hovered'));
    }

    return card;
  }

  /* ── Leaf Panel ───────────────────────────────────────────── */
  _buildLeafPanel(node) {
    const color = this._resolveColor(node);
    const panel = this._el('div', 'mm-leaf-panel');
    panel.style.setProperty('--node-color', color);

    let inner = `<div class="mm-leaf-inner">`;
    if (node.content) inner += `<div class="mm-leaf-content">${node.content}</div>`;
    else              inner += `<p class="mm-leaf-empty">Kein weiterer Inhalt vorhanden.</p>`;
    if (node.url) {
      inner += `<a href="${this._esc(node.url)}" target="_blank" rel="noopener noreferrer" class="mm-leaf-link">Mehr erfahren →</a>`;
    }
    inner += `</div>`;
    panel.innerHTML = inner;
    return panel;
  }

  _expandLeafInline(card, node) {
    const color    = node.color || this._resolveColor(this.current);
    const existing = card.querySelector('.mm-inline-leaf');
    if (existing) {
      existing.classList.add('mm-collapsing');
      existing.addEventListener('animationend', () => existing.remove(), { once: true });
      card.classList.remove('mm-card-expanded');
      return;
    }
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

  /* ── Navigations-API ──────────────────────────────────────── */
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

    if (this.cfg.showBreadcrumb) {
      this.breadcrumb.hidden    = depth === 0;
      this.breadcrumb.innerHTML = '';

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

  _applyMobileFullscreen() {
    if (!this.cfg.mobileFullscreen) return;
    this.container.classList.toggle('mm-mobile-fullscreen', window.innerWidth < 768);
  }

  /* ── Helpers ──────────────────────────────────────────────── */
  _resolveColor(node) {
    if (node?.color) return node.color;
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

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.bbs-mindmap[data-config]').forEach(el => {
    try {
      new BBSMindmap(el, JSON.parse(el.dataset.config));
    } catch (e) {
      console.error('[BBSMindmap] Fehler:', e);
    }
  });
});
