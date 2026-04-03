/**
 * BBS Wesermarsch – Inklusion Mindmap · Option B
 * "Focus Zoom Explorer"
 *
 * Navigationskonzept:
 *  - Startseite: Kacheln der 5 Hauptkategorien
 *  - Klick → Kreisförmige Ripple-Animation expandiert vom Klickpunkt aus
 *  - Unterthemen erscheinen gestaffelt von unten
 *  - Zurück: umgekehrte Kreis-Animation kollabiert auf Zurück-Button
 *
 * Usage:
 *  new BBSMindmapB(document.getElementById('container'), BBS_MINDMAP_DATA);
 */
class BBSMindmapB {
  constructor(container, data) {
    this.root      = container;
    this.data      = data;
    this.stack     = [];   // navigation stack: [{node, screenEl, originX, originY}]
    this.animating = false;

    this.root.classList.add('bbs-mindmap-b');
    this._buildHomeScreen();
  }

  /* ────────────────────────────────────────────────────────
     HOME SCREEN
  ──────────────────────────────────────────────────────── */
  _buildHomeScreen() {
    const screen = this._el('div', 'mm-screen mm-screen--home');

    // Hero
    const hero = this._el('div', 'mm-hero');
    hero.innerHTML = `
      <p class="mm-hero__eyebrow">BBS Wesermarsch</p>
      <h1 class="mm-hero__title">${this.data.label}</h1>
      <p class="mm-hero__sub">Wähle ein Thema, um mehr zu erfahren</p>`;
    screen.appendChild(hero);

    // Cards grid
    const grid = this._el('div', 'mm-home-grid');

    this.data.children.forEach((branch, i) => {
      const card = this._buildHomeCard(branch, i);
      grid.appendChild(card);
    });

    screen.appendChild(grid);
    this.root.appendChild(screen);
    this.homeScreen = screen;
  }

  _buildHomeCard(node, index) {
    const card = this._el('div', 'mm-home-card');
    card.style.background = `linear-gradient(135deg, ${node.color} 0%, ${node.colorDark} 100%)`;
    card.style.setProperty('--card-delay', `${0.05 + index * 0.07}s`);
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', node.label);

    const count = node.children.length;
    card.innerHTML = `
      <span class="mm-home-card__icon">${node.icon}</span>
      <div class="mm-home-card__title">${node.label}</div>
      <div class="mm-home-card__count">${count} ${count === 1 ? 'Punkt' : 'Punkte'}</div>
      <span class="mm-home-card__arrow">›</span>`;

    const open = (e) => {
      if (this.animating) return;
      const rect = card.getBoundingClientRect();
      const containerRect = this.root.getBoundingClientRect();
      const originX = rect.left - containerRect.left + rect.width  / 2;
      const originY = rect.top  - containerRect.top  + rect.height / 2;
      this._openDetail(node, null, originX, originY);
    };

    card.addEventListener('click', open);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(e); }
    });

    return card;
  }

  /* ────────────────────────────────────────────────────────
     DETAIL SCREEN
  ──────────────────────────────────────────────────────── */
  _openDetail(node, parentBranch, originX, originY) {
    if (this.animating) return;
    this.animating = true;

    // Resolve the branch color (walk up to top-level branch)
    const branch = parentBranch || node;
    const color  = branch.color || node.color;

    // Build the screen
    const screen = this._buildDetailScreen(node, branch);
    screen.style.setProperty('--screen-color', color);
    screen.style.setProperty('--origin-x', `${originX}px`);
    screen.style.setProperty('--origin-y', `${originY}px`);
    this.root.appendChild(screen);

    // Push to stack
    this.stack.push({ node, screen, branch, originX, originY });

    // Trigger expand animation
    requestAnimationFrame(() => {
      screen.classList.add('mm-screen--detail', 'is-active', 'mm-screen--expanding');
      screen.addEventListener('animationend', () => {
        screen.classList.remove('mm-screen--expanding');
        // Set permanent clip-path to fully visible
        screen.style.clipPath = 'circle(180% at ' + originX + 'px ' + originY + 'px)';
        this.animating = false;
      }, { once: true });
    });
  }

  _buildDetailScreen(node, branch) {
    const screen = this._el('div', 'mm-screen mm-screen--detail');

    // Top bar
    const topbar = this._el('div', 'mm-detail-topbar');
    const backBtn = this._el('button', 'mm-back-btn');
    backBtn.innerHTML = '&#8592;';
    backBtn.setAttribute('aria-label', 'Zurück');
    backBtn.addEventListener('click', () => this._goBack());

    const titles = this._el('div', 'mm-topbar-titles');

    // Build breadcrumb from stack
    const breadcrumbParts = this.stack.map(s => s.node.label.replace(/–.*/, '').trim());
    if (breadcrumbParts.length > 0) {
      const bc = this._el('div', 'mm-topbar-breadcrumb');
      bc.textContent = breadcrumbParts.join(' › ');
      titles.appendChild(bc);
    }

    const titleEl = this._el('div', 'mm-topbar-title');
    titleEl.textContent = node.label;
    titles.appendChild(titleEl);

    topbar.appendChild(backBtn);
    topbar.appendChild(titles);
    screen.appendChild(topbar);

    // Hero
    const hero = this._el('div', 'mm-detail-hero');
    hero.innerHTML = `
      <span class="mm-detail-hero__icon">${branch.icon || '●'}</span>
      <h2 class="mm-detail-hero__title">${node.label}</h2>
      <p class="mm-detail-hero__sub">${node.children.length} ${node.children.length === 1 ? 'Eintrag' : 'Einträge'}</p>`;
    screen.appendChild(hero);

    // Items
    const list = this._el('div', 'mm-item-list');
    let delay = 0.18;

    node.children.forEach(child => {
      // Sub-group heading if this child itself has children and we're on L1
      const hasChildren = child.children && child.children.length > 0;

      const card = this._el('div',
        `mm-item-card ${hasChildren ? '' : 'mm-item-card--leaf'} ${(!hasChildren && child.url) ? 'mm-item-card--link' : ''}`
      );
      card.setAttribute('tabindex', hasChildren || child.url ? '0' : '-1');
      if (hasChildren || child.url) card.setAttribute('role', 'button');
      card.style.setProperty('--item-delay', `${delay}s`);
      delay += 0.05;

      // Dot
      const dot = this._el('div', 'mm-item-card__dot');
      card.appendChild(dot);

      // Body
      const body = this._el('div', '');
      const label = this._el('div', `mm-item-card__label${child.planned ? ' planned' : ''}`);
      label.textContent = child.label;
      body.appendChild(label);

      if (hasChildren) {
        const sub = this._el('div', 'mm-item-card__sub');
        sub.textContent = `${child.children.length} Unterpunkt${child.children.length !== 1 ? 'e' : ''}`;
        body.appendChild(sub);
      }
      card.appendChild(body);

      // Planned badge
      if (child.planned) {
        const badge = this._el('span', 'mm-badge-planned');
        badge.textContent = 'Geplant';
        card.appendChild(badge);
      }

      // Chevron for drillable items
      if (hasChildren) {
        const chev = this._el('div', 'mm-item-card__chevron');
        chev.textContent = '›';
        card.appendChild(chev);

        const dive = (e) => {
          if (this.animating) return;
          const rect = card.getBoundingClientRect();
          const containerRect = this.root.getBoundingClientRect();
          const ox = rect.left - containerRect.left + rect.width  / 2;
          const oy = rect.top  - containerRect.top  + rect.height / 2;
          this._openDetail(child, branch, ox, oy);
        };
        card.addEventListener('click', dive);
        card.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dive(e); }
        });
      } else if (child.url) {
        card.addEventListener('click', () => window.open(child.url, '_blank'));
        card.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.open(child.url, '_blank'); }
        });
      }

      list.appendChild(card);
    });

    screen.appendChild(list);
    return screen;
  }

  /* ────────────────────────────────────────────────────────
     BACK NAVIGATION
  ──────────────────────────────────────────────────────── */
  _goBack() {
    if (this.animating || this.stack.length === 0) return;
    this.animating = true;

    const { screen, originX, originY } = this.stack[this.stack.length - 1];

    // Collapse from back-button position (top-left area ~40px,40px)
    const containerRect = this.root.getBoundingClientRect();
    const backBtnEl = screen.querySelector('.mm-back-btn');
    let collapseX = 40, collapseY = 40;
    if (backBtnEl) {
      const r = backBtnEl.getBoundingClientRect();
      collapseX = r.left - containerRect.left + r.width  / 2;
      collapseY = r.top  - containerRect.top  + r.height / 2;
    }

    screen.style.setProperty('--origin-x', `${collapseX}px`);
    screen.style.setProperty('--origin-y', `${collapseY}px`);
    screen.style.clipPath = '';  // reset so animation can override

    screen.classList.add('mm-screen--collapsing');
    screen.addEventListener('animationend', () => {
      screen.remove();
      this.stack.pop();
      this.animating = false;
    }, { once: true });
  }

  /* ────────────────────────────────────────────────────────
     Helpers
  ──────────────────────────────────────────────────────── */
  _el(tag, classes = '') {
    const el = document.createElement(tag);
    if (classes) {
      classes.trim().split(/\s+/).forEach(c => { if (c) el.classList.add(c); });
    }
    return el;
  }

  destroy() {
    this.root.innerHTML = '';
    this.root.classList.remove('bbs-mindmap-b');
  }
}
