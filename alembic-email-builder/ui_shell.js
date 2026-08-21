/* Alembic Email Builder — interface shell behaviours.
   Presentation-only helpers layered on top of app.js: the File menu,
   the section-library search, the QA tab badge, and Save via keyboard.
   Nothing here changes email output or QA rules. */
(function () {
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* ---------------------------------------------------------------- File menu */
  const menuBtn = $('#fileMenuBtn');
  const menu = $('#fileMenu');

  function closeMenu() {
    if (!menu) return;
    menu.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }
  function openMenu() {
    menu.classList.add('open');
    menuBtn.setAttribute('aria-expanded', 'true');
  }

  if (menuBtn && menu) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.contains('open') ? closeMenu() : openMenu();
    });
    // Any menu action closes the menu; app.js keeps its own click handlers.
    menu.addEventListener('click', (e) => {
      if (e.target.closest('.menu-item')) closeMenu();
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.menu-wrap')) closeMenu();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* ------------------------------------------------- Section-library search */
  const search = $('#blockSearch');
  const clearBtn = $('#blockSearchClear');
  const grid = $('#blockGrid');
  const empty = $('#blockEmpty');
  const hint = $('#audienceHint');

  function filterBlocks() {
    if (!grid) return;
    const q = (search.value || '').trim().toLowerCase();
    clearBtn.classList.toggle('show', !!q);
    if (hint) hint.style.display = q ? 'none' : '';

    let shown = 0;
    let currentTitle = null;
    let groupHits = 0;

    const flushGroup = () => {
      if (currentTitle) currentTitle.hidden = groupHits === 0;
    };

    Array.from(grid.children).forEach((node) => {
      if (node.classList.contains('block-group-title')) {
        flushGroup();
        currentTitle = node;
        groupHits = 0;
        return;
      }
      if (!node.classList.contains('block-card')) return;
      const text = node.textContent.toLowerCase();
      const match = !q || text.includes(q);
      node.hidden = !match;
      if (match) {
        shown += 1;
        groupHits += 1;
      }
    });
    flushGroup();

    if (empty) empty.hidden = shown > 0;
  }

  if (search && grid) {
    search.addEventListener('input', filterBlocks);
    clearBtn.addEventListener('click', () => {
      search.value = '';
      search.focus();
      filterBlocks();
    });
    search.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && search.value) {
        e.stopPropagation();
        search.value = '';
        filterBlocks();
      }
    });
    // app.js rebuilds the grid when the product or audience changes.
    new MutationObserver(filterBlocks).observe(grid, { childList: true });
  }

  /* --------------------------------------------------------- QA tab badge */
  const qaSummary = $('#qaSummary');
  const qaBadge = $('#qaTabBadge');

  function syncQaBadge() {
    if (!qaSummary || !qaBadge) return;
    const copy = $('.qa-summary-copy', qaSummary);
    const blocking = copy ? Number((copy.textContent.match(/(\d+)\s+blocking/) || [])[1] || 0) : 0;
    qaBadge.textContent = blocking > 99 ? '99+' : String(blocking);
    qaBadge.classList.toggle('show', blocking > 0);
    qaBadge.title = blocking ? `${blocking} blocking issue(s)` : '';
  }

  if (qaSummary && qaBadge) {
    new MutationObserver(syncQaBadge).observe(qaSummary, { childList: true, subtree: true });
    syncQaBadge();
  }

  /* ----------------------------------------- Mobile width picker visibility */
  const deviceFrame = $('#deviceFrame');
  const previewToolbar = $('.preview-toolbar');

  function syncPreviewMode() {
    if (!deviceFrame || !previewToolbar) return;
    previewToolbar.classList.toggle('is-mobile', deviceFrame.classList.contains('mobile'));
  }

  if (deviceFrame && previewToolbar) {
    new MutationObserver(syncPreviewMode).observe(deviceFrame, { attributes: true, attributeFilter: ['class'] });
    syncPreviewMode();
  }

  /* ------------------------------------------------------------- Save via key */
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      $('#saveBtn')?.click();
    }
  });
})();
