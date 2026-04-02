/**
 * BBS Wesermarsch – Inklusion Mindmap
 * Interactive mindmap widget: desktop tree + mobile drill-down
 *
 * Usage:
 *   new BBSMindmap(document.getElementById('my-container'), BBS_MINDMAP_DATA);
 */

class BBSMindmap {
  constructor(container, data) {
    this.container  = container;
    this.data       = data;
    this.expanded   = new Set();          // IDs of expanded branch nodes
    this.navPath    = [];                 // mobile breadcrumb path [{node, label}]
    this.currentNode = data;              // currently displayed mobile node
    this._raf       = null;
    this._resizeTimeout = null;

    // Layout constants (desktop)
    this.L = {
      padX:       80,
      padY:       56,
      nodeH:      46,
      nodeW:      190,
      gapY:       14,   // vertical gap between siblings
      colGap:     270,  // horizontal distance between columns
      rootW:      190,
      leafW:      210,
    };

    this._init();
  }

  /* ────────────────────────────────────────────────────────
     Init
  ──────────────────────────────────────────────────────── */
  _init() {
    this.container.innerHTML = '';
    this.container.classList.add('bbs-mindmap-wrapper');

    // Desktop surface
    this.desktopEl = this._el('div', 'mm-desktop');
    this.svgEl     = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svgEl.classList.add('mm-svg');
    this.desktopEl.appendChild(this.svgEl);
    this.container.appendChild(this.desktopEl);

    // Mobile surface
    this.mobileEl = this._el('div', 'mm-mobile');
    this.container.appendChild(this.mobileEl);

    // Hint + legend
    this.hintEl   = this._el('p', 'mm-hint');
    this.hintEl.textContent = 'Klicke auf einen farbigen Knoten, um die Unterpunkte zu öffnen';
    this.container.appendChild(this.hintEl);

    this.legendEl = this._el('div', 'mm-legend');
    this.container.appendChild(this.legendEl);

    // Tooltip (desktop)
    this.tooltipEl = this._el('div', 'mm-tooltip');
    document.body.appendChild(this.tooltipEl);

    // Node element registry
    this.nodeEls = new Map();   // id → DOM element

    this._buildDesktop();
    this._buildMobile();
    this._updateLayout();
    this._buildLegend();

    window.addEventListener('resize', () => {
      clearTimeout(this._resizeTimeout);
      this._resizeTimeout = setTimeout(() => this._updateLayout(), 80);
    });
  }

  /* ────────────────────────────────────────────────────────
     DESKTOP
  ──────────────────────────────────────────────────────── */
  _buildDesktop() {
    // Create all node elements (initially positioned off-screen)
    this._createNodeEl(this.data, 0, null);
    this._walkTree(this.data, (node, depth, parent) => {
      if (node !== this.data) this._createNodeEl(node, depth, parent);
    });
  }

  _createNodeEl(node, depth, parent) {
    const el = this._el('div', 'mm-node');
    el.setAttribute('tabindex', node.children?.length ? '0' : '-1');
    el.setAttribute('data-id', node.id);
    el.setAttribute('role', node.children?.length ? 'button' : 'text');
    if (node.children?.length) {
      el.setAttribute('aria-expanded', 'false');
      el.setAttribute('aria-label', node.label.replace('\n', ' '));
    }

    // Level class + color
    if (depth === 0) {
      el.classList.add('mm-node--root');
      el.style.background = node.color;
    } else if (depth === 1) {
      el.classList.add('mm-node--branch', 'is-clickable');
      el.style.background = node.color;
    } else if (node.children?.length) {
      el.classList.add('mm-node--subbranch', 'is-clickable');
      el.style.background = parent ? this._ancestorColor(node) : '#888';
      el.style.borderColor = parent ? this._ancestorColor(node) : '#888';
    } else {
      el.classList.add('mm-node--leaf');
      el.style.borderColor = parent ? this._ancestorColor(node) : '#ccc';
    }

    // Label text
    const labelEl = this._el('span', 'mm-node__label');
    labelEl.textContent = node.label.replace('\n', ' ');
    el.appendChild(labelEl);

    // Expand arrow for clickable nodes
    if (node.children?.length && depth > 0) {
      el.classList.add('is-clickable');
      const arrow = this._el('span', 'mm-node__arrow');
      arrow.textContent = '▶';
      el.appendChild(arrow);

      el.addEventListener('click', () => this._toggleNode(node));
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._toggleNode(node); }
      });
    }

    // Leaf URL click
    if (!node.children?.length && depth > 0) {
      if (node.url) {
        el.classList.add('is-clickable');
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => window.open(node.url, '_blank'));
      }
    }

    if (node.planned) el.classList.add('planned');

    // Hidden by default except root and level-1
    if (depth > 1) el.classList.add('mm-node--hidden');

    this.desktopEl.appendChild(el);
    this.nodeEls.set(node.id, el);

    return el;
  }

  /* Toggle expand/collapse on desktop */
  _toggleNode(node) {
    const isExpanded = this.expanded.has(node.id);
    if (isExpanded) {
      // Collapse this node and all descendants
      this._collapseSubtree(node);
    } else {
      this.expanded.add(node.id);
    }

    const el = this.nodeEls.get(node.id);
    el.classList.toggle('is-expanded', this.expanded.has(node.id));
    el.setAttribute('aria-expanded', String(this.expanded.has(node.id)));

    this._updateLayout();
  }

  _collapseSubtree(node) {
    this.expanded.delete(node.id);
    if (node.children) {
      node.children.forEach(c => this._collapseSubtree(c));
    }
  }

  /* ── Layout algorithm ────────────────────────────────────── */
  _updateLayout() {
    const { padX, padY, nodeH, nodeW, gapY, colGap, rootW } = this.L;
    const col0X = padX;  // root column x

    // Measure how many "leaf-height slots" each branch needs
    const slotCount = (node, depth) => {
      if (!node.children || !this.expanded.has(node.id)) return 1;
      return node.children.reduce((s, c) => s + slotCount(c, depth + 1), 0);
    };

    const totalSlots = this.data.children.reduce((s, c) => s + slotCount(c, 1), 0);
    const slotH = nodeH + gapY;
    const totalH = totalSlots * slotH - gapY + padY * 2;

    // Resize desktop container
    this.desktopEl.style.minHeight = totalH + 'px';

    // Root: vertically centered
    const rootEl = this.nodeEls.get(this.data.id);
    const rootTop = totalH / 2 - nodeH / 2;
    rootEl.style.left   = col0X + 'px';
    rootEl.style.top    = rootTop + 'px';
    rootEl.style.width  = rootW + 'px';

    // Position branches + their children recursively
    let cursor = padY;  // running y position for level-1 nodes

    this.data.children.forEach(branch => {
      const slots  = slotCount(branch, 1);
      const branchH = slots * slotH - gapY;
      const branchTop = cursor + branchH / 2 - nodeH / 2;
      const branchEl  = this.nodeEls.get(branch.id);

      branchEl.style.left    = (col0X + colGap) + 'px';
      branchEl.style.top     = branchTop + 'px';
      branchEl.style.width   = nodeW + 'px';
      branchEl.classList.remove('mm-node--hidden');
      branchEl.style.opacity = '1';
      branchEl.style.transform = '';

      if (this.expanded.has(branch.id) && branch.children) {
        let childCursor = cursor;
        branch.children.forEach(child => {
          const childSlots = slotCount(child, 2);
          const childH     = childSlots * slotH - gapY;
          const childTop   = childCursor + childH / 2 - nodeH / 2;
          const childEl    = this.nodeEls.get(child.id);

          childEl.style.left    = (col0X + colGap * 2) + 'px';
          childEl.style.top     = childTop + 'px';
          childEl.style.width   = (this.L.leafW) + 'px';
          childEl.classList.remove('mm-node--hidden');
          childEl.style.opacity = '1';
          childEl.style.transform = '';

          if (this.expanded.has(child.id) && child.children) {
            let gcCursor = childCursor;
            child.children.forEach(gc => {
              const gcEl = this.nodeEls.get(gc.id);
              gcEl.style.left    = (col0X + colGap * 3) + 'px';
              gcEl.style.top     = gcCursor + 'px';
              gcEl.style.width   = this.L.leafW + 'px';
              gcEl.classList.remove('mm-node--hidden');
              gcEl.style.opacity = '1';
              gcEl.style.transform = '';
              gcCursor += slotH;
            });
          } else if (child.children) {
            child.children.forEach(gc => {
              const gcEl = this.nodeEls.get(gc.id);
              gcEl.classList.add('mm-node--hidden');
            });
          }
          childCursor += childSlots * slotH;
        });
      } else if (branch.children) {
        // Hide all descendants
        this._walkTree(branch, (n) => {
          if (n !== branch) {
            const e = this.nodeEls.get(n.id);
            if (e) e.classList.add('mm-node--hidden');
          }
        });
      }

      cursor += slots * slotH;
    });

    // Redraw SVG connections after layout settles
    cancelAnimationFrame(this._raf);
    this._raf = requestAnimationFrame(() => this._drawConnections());
  }

  /* ── SVG connections ─────────────────────────────────────── */
  _drawConnections() {
    while (this.svgEl.firstChild) this.svgEl.removeChild(this.svgEl.firstChild);

    const containerRect = this.desktopEl.getBoundingClientRect();
    const scrollTop     = this.desktopEl.scrollTop;
    const scrollLeft    = this.desktopEl.scrollLeft;

    const midRight = (el) => {
      const r = el.getBoundingClientRect();
      return {
        x: r.right  - containerRect.left + scrollLeft,
        y: r.top    - containerRect.top  + scrollTop + r.height / 2
      };
    };
    const midLeft = (el) => {
      const r = el.getBoundingClientRect();
      return {
        x: r.left   - containerRect.left + scrollLeft,
        y: r.top    - containerRect.top  + scrollTop + r.height / 2
      };
    };

    const rootEl = this.nodeEls.get(this.data.id);
    const rootOut = midRight(rootEl);

    this.data.children.forEach(branch => {
      const bEl  = this.nodeEls.get(branch.id);
      const bIn  = midLeft(bEl);
      this._svgCurve(rootOut, bIn, branch.color, 2.5, this.svgEl);

      if (this.expanded.has(branch.id) && branch.children) {
        const bOut = midRight(bEl);
        branch.children.forEach(child => {
          const cEl = this.nodeEls.get(child.id);
          if (!cEl.classList.contains('mm-node--hidden')) {
            const cIn  = midLeft(cEl);
            this._svgCurve(bOut, cIn, branch.color, 2, this.svgEl);

            if (this.expanded.has(child.id) && child.children) {
              const cOut = midRight(cEl);
              child.children.forEach(gc => {
                const gcEl = this.nodeEls.get(gc.id);
                if (!gcEl.classList.contains('mm-node--hidden')) {
                  const gcIn = midLeft(gcEl);
                  this._svgCurve(cOut, gcIn, branch.color, 1.5, this.svgEl);
                }
              });
            }
          }
        });
      }
    });
  }

  _svgCurve(from, to, color, width, svgEl) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const cx   = (from.x + to.x) / 2;
    path.setAttribute('d',
      `M ${from.x} ${from.y} C ${cx} ${from.y} ${cx} ${to.y} ${to.x} ${to.y}`
    );
    path.setAttribute('stroke', color || '#888');
    path.setAttribute('stroke-width', String(width));
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    path.style.opacity = '0.55';
    svgEl.appendChild(path);
  }

  /* ── Legend ──────────────────────────────────────────────── */
  _buildLegend() {
    this.legendEl.innerHTML = '';
    this.data.children.forEach(branch => {
      const item = this._el('div', 'mm-legend__item');
      const dot  = this._el('span', 'mm-legend__dot');
      dot.style.background = branch.color;
      item.appendChild(dot);
      item.appendChild(document.createTextNode(branch.label.replace('\n', ' ')));
      this.legendEl.appendChild(item);
    });
  }

  /* ────────────────────────────────────────────────────────
     MOBILE
  ──────────────────────────────────────────────────────── */
  _buildMobile() {
    this.mobileEl.innerHTML = '';

    // Top bar
    const topbar = this._el('div', 'mm-mobile__topbar');
    this.breadcrumbEl = this._el('div', 'mm-mobile__breadcrumb');
    topbar.appendChild(this.breadcrumbEl);

    const header = this._el('div', 'mm-mobile__header');
    this.backBtn  = this._el('button', 'mm-mobile__back mm-mobile__back--hidden');
    this.backBtn.textContent = '←';
    this.backBtn.setAttribute('aria-label', 'Zurück');
    this.backBtn.addEventListener('click', () => this._mobileBack());
    header.appendChild(this.backBtn);

    this.mobileTitleEl = this._el('div', 'mm-mobile__title');
    header.appendChild(this.mobileTitleEl);
    topbar.appendChild(header);
    this.mobileEl.appendChild(topbar);

    // View container
    this.mobileViewEl = this._el('div', 'mm-mobile__view');
    this.mobileEl.appendChild(this.mobileViewEl);

    this._renderMobileView(this.data, null);
  }

  _renderMobileView(node, direction) {
    const view = this.mobileViewEl;

    const doRender = () => {
      view.innerHTML = '';
      view.style.animation = '';

      // Hero only on root
      if (node === this.data) {
        const hero = this._el('div', 'mm-mobile__hero');
        hero.innerHTML = `
          <h2>${node.label.replace('\n', '<br>')}</h2>
          <p>${node.children.length} Themenbereiche erkunden</p>`;
        view.appendChild(hero);
        this.mobileTitleEl.textContent = '';
      } else {
        this.mobileTitleEl.textContent = node.label.replace('\n', ' ');
      }

      // Breadcrumb
      const crumbs = this.navPath.map((p, i) => {
        const s = document.createElement('span');
        s.textContent = p.label;
        s.addEventListener('click', () => {
          const steps = this.navPath.length - i;
          for (let k = 0; k < steps; k++) this._mobileBack(true);
        });
        return s;
      });

      this.breadcrumbEl.innerHTML = '';
      crumbs.forEach((c, i) => {
        this.breadcrumbEl.appendChild(c);
        if (i < crumbs.length - 1) {
          const sep = document.createElement('span');
          sep.className = 'sep';
          sep.textContent = ' › ';
          this.breadcrumbEl.appendChild(sep);
        }
      });

      // Back button
      this.backBtn.classList.toggle('mm-mobile__back--hidden', this.navPath.length === 0);

      // Cards
      const cards = this._el('div', 'mm-mobile__cards');

      // Section label when inside a category
      if (node !== this.data && node.children?.length) {
        const secLabel = this._el('p', 'mm-mobile__section-label');
        secLabel.textContent = 'Unterpunkte';
        view.appendChild(secLabel);
      }

      (node.children || []).forEach(child => {
        const card = this._buildMobileCard(child, node);
        cards.appendChild(card);
      });

      view.appendChild(cards);

      // Animate entrance
      if (direction) {
        const inClass = direction === 'forward' ? 'mm-anim-in-right' : 'mm-anim-in-left';
        view.classList.add(inClass);
        const cleanup = () => view.classList.remove(inClass);
        view.addEventListener('animationend', cleanup, { once: true });
      }
    };

    // If there's existing content, slide it out first
    if (direction && view.children.length > 0) {
      const outClass = direction === 'forward' ? 'mm-anim-out-left' : 'mm-anim-out-right';
      view.classList.add(outClass);
      view.addEventListener('animationend', () => {
        view.classList.remove(outClass);
        doRender();
      }, { once: true });
    } else {
      doRender();
    }
  }

  _buildMobileCard(node, parentNode) {
    const hasChildren = node.children?.length > 0;
    const color       = this._ancestorColor(node, parentNode);
    const card        = this._el('div', `mm-mobile__card ${hasChildren ? '' : 'mm-mobile__card--leaf'}`);
    card.style.borderLeftColor = color;
    card.setAttribute('role', hasChildren ? 'button' : 'listitem');
    if (hasChildren) card.setAttribute('tabindex', '0');

    // Icon bubble
    const iconBubble = this._el('div', 'mm-card__icon');
    iconBubble.style.background = color;
    iconBubble.style.opacity = hasChildren ? '1' : '0.75';
    // Use emoji from top-level node, or a generic bullet
    const topMatch = this.data.children.find(c => c.id === node.id || this._isDescendant(c, node.id));
    iconBubble.textContent = (node.icon) || (topMatch?.icon) || '•';
    card.appendChild(iconBubble);

    // Body
    const body  = this._el('div', 'mm-card__body');
    const label = this._el('div', 'mm-card__label');
    label.textContent = node.label.replace('\n', ' ');
    if (node.planned) label.classList.add('planned');
    body.appendChild(label);

    if (hasChildren) {
      const sub = this._el('div', 'mm-card__sub');
      sub.textContent = `${node.children.length} Unterpunkt${node.children.length !== 1 ? 'e' : ''}`;
      body.appendChild(sub);
    }
    card.appendChild(body);

    // Chevron for drillable nodes
    if (hasChildren) {
      const chev = this._el('div', 'mm-card__chevron');
      chev.textContent = '›';
      card.appendChild(chev);

      const navigate = () => {
        this.navPath.push({ node: this.currentNode, label: this.currentNode === this.data ? 'Start' : this.currentNode.label.replace('\n', ' ') });
        this.currentNode = node;
        this._renderMobileView(node, 'forward');
      };

      card.addEventListener('click', navigate);
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(); }
      });
    } else if (node.url) {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => window.open(node.url, '_blank'));
    }

    return card;
  }

  _mobileBack(silent = false) {
    if (this.navPath.length === 0) return;
    const prev = this.navPath.pop();
    this.currentNode = prev.node;
    if (!silent) {
      this._renderMobileView(this.currentNode, 'back');
    }
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

  _walkTree(node, cb, depth = 0, parent = null) {
    cb(node, depth, parent);
    if (node.children) {
      node.children.forEach(c => this._walkTree(c, cb, depth + 1, node));
    }
  }

  /* Find the color of the nearest ancestor branch node */
  _ancestorColor(node, knownParent = null) {
    // Check if the node itself has a color (branch)
    if (node.color) return node.color;
    // Search top-level branches
    for (const branch of this.data.children) {
      if (this._isDescendant(branch, node.id)) return branch.color;
    }
    return knownParent?.color || '#888';
  }

  _isDescendant(ancestor, targetId) {
    if (ancestor.id === targetId) return true;
    if (ancestor.children) {
      return ancestor.children.some(c => this._isDescendant(c, targetId));
    }
    return false;
  }

  _showTooltip(text) {
    this.tooltipEl.textContent = text;
    this.tooltipEl.classList.add('visible');
    clearTimeout(this._tooltipTimeout);
    this._tooltipTimeout = setTimeout(() => this.tooltipEl.classList.remove('visible'), 2500);
  }

  destroy() {
    window.removeEventListener('resize', this._onResize);
    this.container.innerHTML = '';
    if (this.tooltipEl?.parentNode) this.tooltipEl.parentNode.removeChild(this.tooltipEl);
  }
}
