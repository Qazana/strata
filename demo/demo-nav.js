/* Qazana Strata — DEMO-ONLY navigation chrome (not shipped in the npm package).
   One source, included by every demo page; injects a consistent top bar:
   [All demos] · [kit switcher ▾] · [current kit's pages] … [theme toggle].
   A normal-flow strip (not fixed/sticky) so it never collides with a kit's own
   sticky/fixed header below it. Self-contained: styles + theme toggle live here,
   so it doesn't depend on js/qazana.js load order. */
(function () {
  'use strict';

  // kit → { label, pages:[ [pathFromDemoRoot, label] ] }. Order = bar order.
  var KITS = [
    { key: 'foundations', label: 'Foundations', pages: [['foundations/typography.html', 'Type'], ['foundations/layout.html', 'Layout'], ['foundations/forms.html', 'Forms']] },
    { key: 'app', label: 'App', pages: [['app/components.html', 'Components'], ['app/admin.html', 'Admin'], ['app/errors.html', 'Errors'], ['app/survey.html', 'Survey']] },
    { key: 'site', label: 'Site', pages: [['site/landing.html', 'Landing'], ['site/minimal.html', 'Minimal'], ['site/product.html', 'Product'], ['site/startup.html', 'Startup'], ['site/app.html', 'App'], ['site/event.html', 'Event'], ['site/agency.html', 'Agency'], ['site/newsletter.html', 'Newsletter'], ['site/coming-soon.html', 'Coming soon'], ['site/waitlist.html', 'Waitlist']] },
    { key: 'content', label: 'Content', pages: [['content/blog.html', 'Blog'], ['content/blog-medium.html', 'Reading list'], ['content/article.html', 'Article'], ['content/article-plain.html', 'Article (plain)'], ['content/article-media.html', 'Article (media)']] },
    { key: 'auth', label: 'Auth', pages: [['auth/sign-in.html', 'Sign in'], ['auth/sign-in-centered.html', 'Centered'], ['auth/sign-up.html', 'Sign up'], ['auth/reset.html', 'Reset'], ['auth/check-email.html', 'Check email'], ['auth/new-password.html', 'New password'], ['auth/verify.html', 'Verify'], ['auth/two-factor.html', 'Two-factor'], ['auth/passwordless.html', 'Passwordless'], ['auth/app-password.html', 'App password']] },
    { key: 'email', label: 'Email', pages: [['email/index.html', 'All'], ['email/transactional.html', 'Transactional'], ['email/newsletter.html', 'Newsletter']] },
    { key: 'media', label: 'Media', pages: [['media/index.html', 'All'], ['media/video.html', 'Video'], ['media/audio.html', 'Audio'], ['media/social.html', 'Social']] },
    { key: 'commerce', label: 'Commerce', pages: [['commerce/products.html', 'Products'], ['commerce/product.html', 'Product'], ['commerce/cart.html', 'Cart'], ['commerce/checkout.html', 'Checkout'], ['commerce/order.html', 'Order']] },
    { key: 'billing', label: 'Billing', pages: [['billing/plans.html', 'Plans'], ['billing/methods.html', 'Methods'], ['billing/invoices.html', 'Invoices'], ['billing/overview.html', 'Overview']] },
    { key: 'docs', label: 'Docs', pages: [['docs/guide.html', 'Guide'], ['docs/api.html', 'API'], ['docs/help.html', 'Help'], ['docs/article.html', 'Article']] },
    { key: 'support', label: 'Support', pages: [['support/contact.html', 'Contact'], ['support/tickets.html', 'Tickets'], ['support/ticket.html', 'Ticket']] },
    { key: 'themes', label: 'Themes', pages: [['themes/index.html', 'Switcher']] },
    { key: 'overview', label: 'Overview', pages: [['strata.html', 'Kitchen sink']] },
  ];

  // current page path relative to demo/ root, e.g. "app/components.html"
  var parts = location.pathname.split('/');
  var di = parts.lastIndexOf('demo');
  var rel = di >= 0 ? parts.slice(di + 1).join('/') : parts[parts.length - 1];
  var depth = rel.split('/').length - 1;          // subdir depth under demo/
  var up = depth > 0 ? '../'.repeat(depth) : '';  // prefix to reach demo/ root

  var curKit = null, curPage = rel;
  for (var i = 0; i < KITS.length; i++) {
    for (var j = 0; j < KITS[i].pages.length; j++) {
      if (KITS[i].pages[j][0] === rel) { curKit = KITS[i]; }
    }
  }

  var esc = function (s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
  var html = '';
  html += '<a class="db-home" href="' + up + 'index.html">◳ All demos</a>';
  // kit switcher
  html += '<div class="db-kit"><button class="db-kitbtn" aria-haspopup="true" aria-expanded="false">'
    + (curKit ? esc(curKit.label) : 'Kits') + ' <span aria-hidden="true">▾</span></button><div class="db-kitmenu" role="menu" hidden>';
  for (var k = 0; k < KITS.length; k++) {
    html += '<a role="menuitem" href="' + up + KITS[k].pages[0][0] + '">' + esc(KITS[k].label) + '</a>';
  }
  html += '</div></div>';
  // current kit's pages
  if (curKit && curKit.pages.length > 1) {
    html += '<div class="db-pages">';
    for (var p = 0; p < curKit.pages.length; p++) {
      var active = curKit.pages[p][0] === curPage ? ' aria-current="page"' : '';
      html += '<a href="' + up + curKit.pages[p][0] + '"' + active + '>' + esc(curKit.pages[p][1]) + '</a>';
    }
    html += '</div>';
  }
  html += '<span class="db-spacer"></span>';
  html += '<button class="db-theme" type="button" aria-label="Toggle light / dark">◐</button>';

  var nav = document.createElement('nav');
  nav.className = 'demo-bar';
  nav.setAttribute('aria-label', 'Demo navigation');
  nav.innerHTML = html;

  var style = document.createElement('style');
  style.textContent =
    '.demo-bar{position:relative;z-index:60;display:flex;align-items:center;gap:var(--space-3);'
    + 'padding:var(--space-2) var(--space-4);background:var(--surface-2);border-bottom:1px solid var(--line);'
    + 'font-family:var(--body);font-size:var(--text-sm);color:var(--text-2);flex-wrap:wrap;line-height:1}'
    + '.demo-bar a{color:var(--text-2);text-decoration:none;padding:var(--space-1_5) var(--space-2);border-radius:var(--radius-sm)}'
    + '.demo-bar a:hover{color:var(--text);background:var(--surface)}'
    + '.demo-bar .db-home{font-weight:700;color:var(--text)}'
    + '.demo-bar .db-pages{display:flex;gap:2px;flex-wrap:wrap;border-inline-start:1px solid var(--line);padding-inline-start:var(--space-2)}'
    + '.demo-bar .db-pages a[aria-current="page"]{color:var(--text);font-weight:600}'
    + '.demo-bar .db-spacer{flex:1}'
    + '.demo-bar .db-kit{position:relative}'
    + '.demo-bar .db-kitbtn,.demo-bar .db-theme{font:inherit;color:var(--text);background:var(--surface);border:1px solid var(--line);'
    + 'border-radius:var(--radius-sm);padding:var(--space-1_5) var(--space-2_5);cursor:pointer}'
    + '.demo-bar .db-kitbtn:hover,.demo-bar .db-theme:hover{border-color:var(--line-strong)}'
    + '.demo-bar .db-brand{font:inherit;font-size:var(--text-sm);color:var(--text);background:var(--surface);border:1px solid var(--line);'
    + 'border-radius:var(--radius-sm);padding:var(--space-1_5) var(--space-2);cursor:pointer;max-width:150px}'
    + '.demo-bar .db-brand:hover{border-color:var(--line-strong)}'
    + '.demo-bar .db-kitmenu{position:absolute;top:calc(100% + 6px);inset-inline-start:0;z-index:600;display:flex;flex-direction:column;'
    + 'min-width:160px;background:var(--surface-3,var(--surface));border:1px solid var(--line);border-radius:var(--radius);'
    + 'box-shadow:var(--shadow-lg);padding:var(--space-1_5)}'
    + '.demo-bar .db-kitmenu[hidden]{display:none}'
    + '@media (max-width:760px){.demo-bar .db-pages{display:none}}'  /* keep it one row on mobile */
    + '@media print{.demo-bar{display:none}}';

  document.head.appendChild(style);
  document.body.insertBefore(nav, document.body.firstChild);

  // Some demo bodies are themselves a grid/flex container (e.g. auth's split
  // layout). A plain child would be laid out as a cell/item and stretched —
  // make the bar span the full width as a top row instead.
  var disp = getComputedStyle(document.body).display;
  if (disp.indexOf('grid') >= 0) {
    nav.style.gridColumn = '1 / -1'; nav.style.justifySelf = 'stretch'; nav.style.alignSelf = 'start';
    // these layouts (e.g. auth) are designed as a single full-height row; adding
    // the bar as a row makes the grid distribute leftover height as a gap. Pin
    // the bar to an auto top row and let the original content fill the rest.
    document.body.style.gridTemplateRows = 'auto 1fr';
  } else if (disp.indexOf('flex') >= 0) { nav.style.flex = '0 0 100%'; nav.style.width = '100%'; document.body.style.flexWrap = 'wrap'; }

  // kit switcher open/close (click + Escape + click-away)
  var btn = nav.querySelector('.db-kitbtn'), menu = nav.querySelector('.db-kitmenu');
  var setOpen = function (o) { menu.hidden = !o; btn.setAttribute('aria-expanded', String(o)); };
  btn.addEventListener('click', function (e) { e.stopPropagation(); setOpen(menu.hidden); });
  document.addEventListener('click', function () { setOpen(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });

  // self-contained theme toggle (don't depend on js/qazana.js wiring/order)
  var THEMES = ['dark-knight', 'desert-dunes'];
  nav.querySelector('.db-theme').addEventListener('click', function () {
    var root = document.documentElement;
    var cur = root.getAttribute('data-theme');
    // first click commits the opposite of the OS/default scheme
    var next = cur === 'desert-dunes' || cur === 'light' ? 'dark-knight'
      : cur === 'dark-knight' || cur === 'dark' ? 'desert-dunes'
        : (matchMedia('(prefers-color-scheme: dark)').matches ? 'desert-dunes' : 'dark-knight');
    root.setAttribute('data-theme', next);
  });

  // brand (product theme) picker — preview any example brand on ANY demo page by
  // swapping the theme.css :root override (the same override a product ships).
  // Skipped on themes/index.html, which has its own dedicated switcher (#theme-css).
  if (!document.getElementById('theme-css')) {
    var BRANDS = [['strata', 'Strata · default'], ['qazana', 'qazana'], ['aurora', 'aurora'], ['vermeil', 'vermeil'], ['nocturne', 'nocturne'], ['cedar', 'cedar'], ['material', 'material'], ['stage', 'stage']];
    // each brand is designed for a scheme; applying it on pick shows it as intended
    var BREC = { strata: 'dark-knight', qazana: 'desert-dunes', aurora: 'dark-knight', vermeil: 'desert-dunes', nocturne: 'dark-knight', cedar: 'desert-dunes', material: 'desert-dunes', stage: 'desert-dunes' };
    // display faces not self-hosted by the tokens (loaded lazily on first brand pick)
    var FONTS = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Space+Grotesk:wght@400;500;700&family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,700&family=Roboto:wght@400;500;700&family=Roboto+Flex:opsz,wght@8..144,400;8..144,700&family=Inter:wght@300..800&family=IBM+Plex+Mono:wght@400;500;600&display=swap';
    var fontsLoaded = false;
    function ensureFonts() { if (fontsLoaded) return; var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = FONTS; document.head.appendChild(l); fontsLoaded = true; }
    function brandLink() { var el = document.getElementById('qz-brand'); if (!el) { el = document.createElement('link'); el.id = 'qz-brand'; el.rel = 'stylesheet'; document.head.appendChild(el); } return el; }
    function applyBrand(name, withScheme) {
      if (name === 'strata') { var e = document.getElementById('qz-brand'); if (e) e.removeAttribute('href'); }
      else { ensureFonts(); brandLink().href = up + 'themes/' + name + '.css'; }   // appended last → unlayered :root override wins
      if (withScheme) { var s = BREC[name] || 'dark-knight'; document.documentElement.setAttribute('data-theme', s); try { localStorage.setItem('qazana-theme', s); } catch (e) {} }
      try { localStorage.setItem('qazana-demo-brand', name); } catch (e) {}
    }
    var sel = document.createElement('select');
    sel.className = 'db-brand'; sel.setAttribute('aria-label', 'Brand theme');
    BRANDS.forEach(function (b) { var o = document.createElement('option'); o.value = b[0]; o.textContent = b[1]; sel.appendChild(o); });
    var saved; try { saved = localStorage.getItem('qazana-demo-brand'); } catch (e) {}
    var initial = saved && BREC.hasOwnProperty(saved) ? saved : 'strata';
    sel.value = initial;
    nav.insertBefore(sel, nav.querySelector('.db-theme'));   // sits next to the scheme toggle
    sel.addEventListener('change', function () { applyBrand(sel.value, true); });
    if (initial !== 'strata') applyBrand(initial, false);    // restore persisted brand link (keep the user's scheme)
  }
})();
