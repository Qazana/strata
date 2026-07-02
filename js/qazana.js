/* Qazana Strata — generic component behaviours (vanilla, data-attribute driven).
   No framework deps; attach via data-* hooks; reduced-motion aware.
   Reactive micro-interactions + subtle info reveals. */

/* ---- shared month-grid model (pure; no DOM) ----------------------------------
   One source for the calendar maths behind the date picker, the inline calendar,
   and the date-range. The interface is the test surface: daysInMonth / firstWeekday
   (Monday-first) / roll (normalise an over/underflowed month) / monthGrid (the cell
   model). Behaviours render the cells and own their own selection + header. */
var QZcal = {
  MONTHS: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  DOW: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
  pad: function (n) { return (n < 10 ? '0' : '') + n; },
  daysInMonth: function (y, m) { return new Date(y, m + 1, 0).getDate(); },
  firstWeekday: function (y, m) { return (new Date(y, m, 1).getDay() + 6) % 7; },
  roll: function (y, m) { while (m < 0) { m += 12; y--; } while (m > 11) { m -= 12; y++; } return { y: y, m: m }; },
  monthGrid: function (y, m) {
    var days = [], n = this.daysInMonth(y, m), d;
    for (d = 1; d <= n; d++) days.push(d);
    return { year: y, month: m, name: this.MONTHS[m], blanks: this.firstWeekday(y, m), days: days };
  },
};

/* ---- behavior registry + public re-init -----------------------------------
   Every setup-style behavior below registers itself here instead of wiring its
   own DOMContentLoaded pass. QZ.init(root) walks the registry and binds any
   matching element that isn't bound yet — so markup rendered AFTER load (React/
   Vue/Ember mounts, HTMX swaps, dynamic imports) gets behavior by calling
   QZ.init(newSubtree) (or QZ.init() for the whole document). Idempotent: an
   element is bound to a given behavior once, no matter how often init runs.
   Delegated behaviors (modal, popover, tooltips, …) listen on document and need
   no re-init. ---- */
var QZ = (function () {
  'use strict';
  var behaviors = [];
  function bind(el, b) {
    var bound = el.__qzBound || (el.__qzBound = {});
    if (bound[b.name]) return;
    bound[b.name] = true;
    try { b.setup(el); }
    catch (e) { if (window.console && console.error) console.error('QZ behavior "' + b.name + '" failed on', el, e); }
  }
  return {
    behavior: function (name, selector, setup) { behaviors.push({ name: name, selector: selector, setup: setup }); },
    init: function (root) {
      root = root || document;
      behaviors.forEach(function (b) {
        if (root.matches && root.matches(b.selector)) bind(root, b);
        if (root.querySelectorAll) Array.prototype.forEach.call(root.querySelectorAll(b.selector), function (el) { bind(el, b); });
      });
      return root;
    },
  };
})();

/* internal: make a rendered .cal-grid keyboard-operable — day cells become
   focusable button-role controls with a roving tabindex, arrow-key movement
   (←/→ one day, ↑/↓ one week), Home/End, and Enter/Space activation. Re-run
   after every render (the grids rebuild their cells). label(dayText) builds
   the accessible name. Shared by the date picker, the inline calendar and the
   date-range. */
function QZdayNav(grid, label) {
  var days = Array.prototype.slice.call(grid.querySelectorAll('.day'));
  if (!days.length) return;
  var start = grid.querySelector('.day.sel') || days[0];
  days.forEach(function (d) {
    d.setAttribute('role', 'button');
    d.setAttribute('aria-label', label(d.textContent));
    if (d.classList.contains('sel')) d.setAttribute('aria-pressed', 'true');
    d.tabIndex = d === start ? 0 : -1;
    d.addEventListener('keydown', function (e) {
      var i = days.indexOf(d), n = null;
      if (e.key === 'ArrowRight') n = days[i + 1];
      else if (e.key === 'ArrowLeft') n = days[i - 1];
      else if (e.key === 'ArrowDown') n = days[i + 7];
      else if (e.key === 'ArrowUp') n = days[i - 7];
      else if (e.key === 'Home') n = days[0];
      else if (e.key === 'End') n = days[days.length - 1];
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); d.click(); return; }
      else return;
      e.preventDefault();
      if (n) { days.forEach(function (x) { x.tabIndex = -1; }); n.tabIndex = 0; n.focus(); }
    });
  });
}

(function () {
  'use strict';
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function countUp(el) {
    var target = parseFloat(el.dataset.count);
    var suffix = el.dataset.suffix || '';
    if (RM || isNaN(target)) { el.textContent = (isNaN(target) ? el.textContent : target) + suffix; return; }
    var dur = 900, t0 = null;
    function tick(now) {
      if (t0 === null) t0 = now;
      var p = Math.min(1, (now - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);            // easeOutCubic
      el.textContent = Math.round(target * e) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // reveal-on-scroll: fill confidence bars + run count-ups when they enter view
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;
      el.querySelectorAll('.conf .bar i').forEach(function (b) { b.style.width = b.dataset.w; });
      if (el.dataset.count !== undefined) countUp(el);
      io.unobserve(el);
    });
  }, { threshold: 0.25 }) : null;

  // prep confidence bars to animate from 0 → target (final state straight away without IO)
  QZ.behavior('conf-bar', '.conf .bar i', function (b) {
    b.dataset.w = b.style.width || '0%';
    if (io && !RM) b.style.width = '0'; else b.style.width = b.dataset.w;
  });
  QZ.behavior('reveal', '[data-count], .row, .gap-row', function (el) {
    if (io) io.observe(el);
    else if (el.dataset.count !== undefined) countUp(el);
  });

  // copy-to-clipboard with feedback (preserves icon buttons)
  QZ.behavior('copy', '[data-copy]', function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.dataset.copy || location.href;
      if (navigator.clipboard) navigator.clipboard.writeText(text);
      var icon = !!btn.querySelector('i');
      var old = btn.dataset.html || btn.innerHTML;
      btn.dataset.html = old;
      btn.innerHTML = icon ? '<i class="fa-solid fa-check"></i>' : 'Copied ✓';  // static markup, no user input
      btn.classList.add('copied');
      setTimeout(function () { btn.innerHTML = btn.dataset.html; btn.classList.remove('copied'); }, 1400);
    });
  });
})();

/* ---- searchable select (combobox) + paste-from-clipboard ---- */
(function () {
  'use strict';

  var openCombo = null;   // the close() of the currently-open combo — one shared outside-click/Esc listener, not one per instance
  document.addEventListener('click', function () { if (openCombo) openCombo(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && openCombo) openCombo(); });

  function setupCombo(combo) {
    var btn = combo.querySelector('.combo-btn');
    var pop = combo.querySelector('.combo-pop');
    var val = combo.querySelector('.combo-val');
    var search = combo.querySelector('.combo-search input');
    var opts = Array.prototype.slice.call(combo.querySelectorAll('.combo-opt'));
    var empty = combo.querySelector('.combo-empty');
    if (!btn || !pop) return;
    var active = -1;                                   // keyboard-highlighted option

    function visible() { return opts.filter(function (o) { return !o.hidden; }); }
    function setActive(i) {
      var vis = visible(); opts.forEach(function (o) { o.classList.remove('active'); });
      if (!vis.length) { active = -1; return; }
      active = (i + vis.length) % vis.length;
      vis[active].classList.add('active');
      vis[active].scrollIntoView({ block: 'nearest' });
    }
    function open() {
      if (openCombo && openCombo !== close) openCombo();
      pop.hidden = false; btn.setAttribute('aria-expanded', 'true'); active = -1;
      openCombo = close;
      if (search) { search.value = ''; filter(''); search.focus(); }
    }
    function close() { pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); if (openCombo === close) openCombo = null; }
    function filter(q) {
      q = q.toLowerCase(); var any = false;
      opts.forEach(function (o) { var m = o.textContent.toLowerCase().indexOf(q) > -1; o.hidden = !m; if (m) any = true; o.classList.remove('active'); });
      active = -1; if (empty) empty.hidden = any;
    }
    function choose(o) {
      if (val) val.textContent = o.textContent.trim();
      opts.forEach(function (x) { x.classList.remove('sel'); x.setAttribute('aria-selected', 'false'); });
      o.classList.add('sel'); o.setAttribute('aria-selected', 'true'); close(); btn.focus();
    }
    btn.addEventListener('click', function (e) { e.stopPropagation(); pop.hidden ? open() : close(); });
    btn.addEventListener('keydown', function (e) { if (pop.hidden && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(); } });
    if (search) {
      search.addEventListener('input', function () { filter(search.value); });
      search.addEventListener('keydown', function (e) {
        var vis = visible();
        if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
        else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
        else if (e.key === 'End') { e.preventDefault(); setActive(vis.length - 1); }
        else if (e.key === 'Enter' && active > -1 && vis[active]) { e.preventDefault(); choose(vis[active]); }
        else if (e.key === 'Escape') { close(); btn.focus(); }
      });
    }
    opts.forEach(function (o) { o.addEventListener('click', function () { choose(o); }); });
    combo.addEventListener('click', function (e) { e.stopPropagation(); });
  }

  // paste-from-clipboard into a target input (e.g. the URL field)
  function setupPaste(btn) {
    btn.addEventListener('click', function () {
      var input = document.querySelector(btn.getAttribute('data-paste'));
      if (!input) return;
      var done = function (txt) {
        if (txt) input.value = txt;
        input.focus();
        var old = btn.dataset.label || btn.textContent; btn.dataset.label = old;
        if (txt) { btn.textContent = 'Pasted ✓'; setTimeout(function () { btn.textContent = old; }, 1200); }
      };
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(done).catch(function () { done(''); }); // blocked → just focus for ⌘V
      } else { done(''); }
    });
  }

  QZ.behavior('combo', '[data-combo]', setupCombo);
  QZ.behavior('paste', '[data-paste]', setupPaste);
})();

/* ---- audio player · date picker · dual range · wizard · toast-undo ---- */
(function () {
  'use strict';
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var closePicker=null;   // the close() of the open picker — one shared outside-click/Esc listener, not one per instance
  document.addEventListener('click',function(){if(closePicker)closePicker();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&closePicker)closePicker(true);});

  function setupPicker(pk){
    var inp=pk.querySelector('input'),cal=pk.querySelector('.cal');
    if(!inp||!cal)return;
    // default to today; an existing YYYY-MM-DD value becomes the selection
    var now=new Date(),Y=now.getFullYear(),M=now.getMonth(),selY=null,selM=null,selD=null;
    var pre=/^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(inp.value||'');
    if(pre){selY=+pre[1];selM=+pre[2]-1;selD=+pre[3];Y=selY;M=selM;}
    function refocus(sel){var b=cal.querySelector(sel);if(b)b.focus();}
    function days(){
      cal.innerHTML='';
      var grid=QZcal.monthGrid(Y,M);
      var h=document.createElement('div');h.className='cal-h';
      h.innerHTML='<button type="button" data-y="-1" title="Previous year">«</button>'
        +'<button type="button" data-m="-1" title="Previous month">‹</button>'
        +'<button type="button" class="cal-title">'+grid.name+' '+Y+'</button>'
        +'<button type="button" data-m="1" title="Next month">›</button>'
        +'<button type="button" data-y="1" title="Next year">»</button>';
      cal.appendChild(h);
      var g=document.createElement('div');g.className='cal-grid';
      QZcal.DOW.forEach(function(d){var e=document.createElement('div');e.className='dow';e.textContent=d;g.appendChild(e);});
      var i;for(i=0;i<grid.blanks;i++)g.appendChild(document.createElement('div'));
      grid.days.forEach(function(d){var e=document.createElement('div');e.className='day';e.textContent=d;
        if(Y===selY&&M===selM&&d===selD)e.classList.add('sel');
        e.addEventListener('click',function(){selY=Y;selM=M;selD=d;inp.value=Y+'-'+QZcal.pad(M+1)+'-'+QZcal.pad(d);close(true);});
        g.appendChild(e);});
      cal.appendChild(g);
      QZdayNav(g,function(d){return d+' '+grid.name+' '+Y;});
      h.querySelectorAll('[data-m]').forEach(function(b){b.addEventListener('click',function(){var r=QZcal.roll(Y,M+(+b.dataset.m));Y=r.y;M=r.m;days();refocus('[data-m="'+b.dataset.m+'"]');});});
      h.querySelectorAll('[data-y]').forEach(function(b){b.addEventListener('click',function(){Y+=+b.dataset.y;days();refocus('[data-y="'+b.dataset.y+'"]');});});
      h.querySelector('.cal-title').addEventListener('click',function(){monthsView();refocus('.cal-title');});
    }
    function monthsView(){
      cal.innerHTML='';
      var h=document.createElement('div');h.className='cal-h';
      h.innerHTML='<button type="button" data-y="-1" title="Previous year">«</button><button type="button" class="cal-title">'+Y+'</button><button type="button" data-y="1" title="Next year">»</button>';
      cal.appendChild(h);
      var grid=document.createElement('div');grid.className='cal-grid months';
      QZcal.MONTHS.forEach(function(mn,mi){var e=document.createElement('div');e.className='mcell';e.textContent=mn.slice(0,3);
        e.setAttribute('role','button');e.tabIndex=0;e.setAttribute('aria-label',mn+' '+Y);
        if(mi===M)e.classList.add('sel');
        function pick(){M=mi;days();refocus('.day[tabindex="0"]');}
        e.addEventListener('click',pick);
        e.addEventListener('keydown',function(ev){if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();pick();}});
        grid.appendChild(e);});
      cal.appendChild(grid);
      h.querySelectorAll('[data-y]').forEach(function(b){b.addEventListener('click',function(){Y+=+b.dataset.y;monthsView();refocus('[data-y="'+b.dataset.y+'"]');});});
    }
    var suppress=false;   // refocusing the input after close must not re-open it
    function open(){
      if(suppress||cal.hidden===false)return;
      if(closePicker&&closePicker!==close)closePicker();
      cal.hidden=false;days();closePicker=close;
    }
    function close(refocusInput){
      cal.hidden=true;
      if(closePicker===close)closePicker=null;
      if(refocusInput){suppress=true;inp.focus();setTimeout(function(){suppress=false;},0);}
    }
    inp.addEventListener('focus',open);
    inp.addEventListener('click',open);
    pk.addEventListener('click',function(e){e.stopPropagation();});
  }

  function setupDual(d){
    var ins=d.querySelectorAll('input[type=range]'),fill=d.querySelector('.track i'),out=d.parentNode.querySelector('.dual-out');
    var lo=ins[0],hi=ins[1],min=+lo.min,max=+lo.max;
    function upd(){var a=Math.min(+lo.value,+hi.value),b=Math.max(+lo.value,+hi.value);
      var pa=(a-min)/(max-min)*100,pb=(b-min)/(max-min)*100;
      /* logical insets: native range inputs mirror under dir=rtl, the fill must too */
      fill.style.insetInlineStart=pa+'%';fill.style.insetInlineEnd=(100-pb)+'%';
      if(out)out.textContent=a+'–'+b;}
    ins.forEach(function(i){i.addEventListener('input',upd);});upd();
  }

  function setupWizard(w){
    var steps=w.querySelectorAll('.wstep'),panes=w.querySelectorAll('.wpane'),
        next=w.querySelector('[data-wnext]'),back=w.querySelector('[data-wback]'),lines=w.querySelectorAll('.wline');
    var cur=0;
    function show(){steps.forEach(function(s,i){s.classList.toggle('active',i===cur);s.classList.toggle('done',i<cur);});
      lines.forEach(function(l,i){l.classList.toggle('done',i<cur);});
      panes.forEach(function(pn,i){pn.hidden=i!==cur;});
      if(back)back.disabled=cur===0;if(next)next.textContent=cur===steps.length-1?'Finish':'Next';}
    if(next)next.addEventListener('click',function(){if(cur<steps.length-1){cur++;show();}});
    if(back)back.addEventListener('click',function(){if(cur>0){cur--;show();}});
    show();
  }

  QZ.behavior('picker','[data-picker]',setupPicker);
  QZ.behavior('dual','[data-dual]',setupDual);
  QZ.behavior('wizard','[data-wizard]',setupWizard);
  QZ.behavior('toast-undo','.toast .undo button',function(b){
    b.addEventListener('click',function(){var t=b.closest('.toast');if(t)t.style.opacity=t.style.opacity==='0.4'?'1':'0.4';});
  });
})();

/* ---- tabs (switch panels) ---- */
(function () {
  'use strict';
  var uid = 0;
  QZ.behavior('tabs', '[data-tabs]', function (group) {
    var tabs = Array.prototype.slice.call(group.querySelectorAll('.tab'));
    var panels = group.querySelectorAll('.tabpanel');
    var bar = tabs[0] && tabs[0].parentElement; if (bar) bar.setAttribute('role', 'tablist');
    function select(i) {
      tabs.forEach(function (x, j) { x.classList.toggle('active', j === i); x.setAttribute('aria-selected', j === i ? 'true' : 'false'); x.tabIndex = j === i ? 0 : -1; });
      panels.forEach(function (p, j) { p.hidden = j !== i; });
    }
    tabs.forEach(function (t, i) {
      t.setAttribute('role', 'tab'); t.tabIndex = t.classList.contains('active') ? 0 : -1;
      var p = panels[i];
      if (p) {   // pair tab ↔ panel so AT can follow the relationship
        if (!t.id) t.id = 'qz-tab-' + (++uid);
        if (!p.id) p.id = 'qz-tabpanel-' + (++uid);
        t.setAttribute('aria-controls', p.id);
        p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', t.id);
        if (!p.hasAttribute('tabindex')) p.tabIndex = 0;
      }
      t.addEventListener('click', function () { select(i); });
      t.addEventListener('keydown', function (e) {
        var n;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') n = 0;
        else if (e.key === 'End') n = tabs.length - 1;
        else return;
        e.preventDefault(); select(n); tabs[n].focus();
      });
    });
  });
})();

/* ---- inline calendar (standalone, month nav) ---- */
(function () {
  'use strict';
  QZ.behavior('calendar', '[data-calendar]', function (cal) {
    // defaults to today (selected); month nav + full day-cell keyboard operation
    var now=new Date(),Y=now.getFullYear(),M=now.getMonth(),selY=Y,selM=M,selD=now.getDate();
    function render(focusDay){
      cal.innerHTML='';
      var grid=QZcal.monthGrid(Y,M);
      var h=document.createElement('div');h.className='cal-h';
      h.innerHTML='<button type="button" data-d="-1" title="Previous month">‹</button><span class="cal-title">'+grid.name+' '+Y+'</span><button type="button" data-d="1" title="Next month">›</button>';
      cal.appendChild(h);
      var g=document.createElement('div');g.className='cal-grid';
      QZcal.DOW.forEach(function(d){var e=document.createElement('div');e.className='dow';e.textContent=d;g.appendChild(e);});
      var i;for(i=0;i<grid.blanks;i++)g.appendChild(document.createElement('div'));
      grid.days.forEach(function(d){var e=document.createElement('div');e.className='day';e.textContent=d;
        if(Y===selY&&M===selM&&d===selD)e.classList.add('sel');
        e.addEventListener('click',function(){selY=Y;selM=M;selD=d;render(d);});g.appendChild(e);});
      cal.appendChild(g);
      QZdayNav(g,function(d){return d+' '+grid.name+' '+Y;});
      if(focusDay){var f=g.querySelectorAll('.day')[focusDay-1];if(f){g.querySelectorAll('.day').forEach(function(x){x.tabIndex=-1;});f.tabIndex=0;f.focus();}}
      h.querySelectorAll('[data-d]').forEach(function(b){b.addEventListener('click',function(){var r=QZcal.roll(Y,M+(+b.dataset.d));Y=r.y;M=r.m;render();var nb=cal.querySelector('[data-d="'+b.dataset.d+'"]');if(nb)nb.focus();});});
    }
    render();
  });
})();

/* ---- context menu (right-click) + data table sort/select ---- */
(function () {
  'use strict';
  var openMenu = null;   // one shared outside-click closer for whichever ctx menu is open
  document.addEventListener('click', function () { if (openMenu) { openMenu.style.display = 'none'; openMenu = null; } });
  QZ.behavior('ctx', '[data-ctx]', function (zone) {
    var menu = document.querySelector(zone.dataset.ctx); if (!menu) return;
    zone.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      if (openMenu && openMenu !== menu) openMenu.style.display = 'none';
      menu.style.display = 'block'; openMenu = menu;
      menu.style.left = Math.min(e.clientX, window.innerWidth - 230) + 'px';
      menu.style.top = e.clientY + 'px';
    });
    menu.addEventListener('click', function (e) { e.stopPropagation(); menu.style.display = 'none'; if (openMenu === menu) openMenu = null; });
  });
  // Horizontally-scrollable table wrappers must be keyboard-reachable so the
  // content can be scrolled without a pointer (WCAG 2.1.1). For any .tbl-wrap
  // whose content overflows, expose it as a focusable, labelled region.
  QZ.behavior('tbl-wrap', '.tbl-wrap', function (wrap) {
    if (wrap.scrollWidth > wrap.clientWidth) {
      if (!wrap.hasAttribute('tabindex')) wrap.setAttribute('tabindex', '0');
      if (!wrap.hasAttribute('role')) wrap.setAttribute('role', 'region');
      if (!wrap.hasAttribute('aria-label')) wrap.setAttribute('aria-label', 'Table, scrollable');
    }
  });
  QZ.behavior('table-sort', '[data-table-sort] th.sortable', function (th) {
    th.addEventListener('click', function () {
      var asc = th.classList.contains('asc');
      th.parentNode.querySelectorAll('th').forEach(function (x) { x.classList.remove('asc', 'desc'); });
      th.classList.add(asc ? 'desc' : 'asc');
    });
  });
  QZ.behavior('select-all', '[data-select-all]', function (cb) {
    cb.addEventListener('change', function () {
      // the controlled table: the one this checkbox lives in, or — when it sits
      // in a toolbar/header beside the table — the nearest ancestor that has one
      var table = cb.closest('table');
      if (!table) { var p = cb.parentElement; while (p && !(table = p.querySelector('table'))) p = p.parentElement; }
      if (!table) return;
      table.querySelectorAll('tbody input[type=checkbox]').forEach(function (x) {
        x.checked = cb.checked;
        var tr = x.closest('tr'); if (tr) tr.classList.toggle('selected', cb.checked);
      });
    });
  });
})();

/* ---- toggle group · rating · live toast ---- */
(function () {
  'use strict';
  QZ.behavior('toggle-group', '.toggle-group button', function (b) {
    b.setAttribute('aria-pressed', b.classList.contains('on') ? 'true' : 'false');
    b.addEventListener('click', function () { b.setAttribute('aria-pressed', b.classList.toggle('on') ? 'true' : 'false'); });
  });
  // rating: a radiogroup — stars are keyboard-focusable radios (arrows move+set,
  // Enter/Space sets), hover preview stays pointer-only
  QZ.behavior('rating', '.rating:not(.ro)', function (r) {
    var stars = Array.prototype.slice.call(r.querySelectorAll('i')), val = r.parentNode.querySelector('.rating-val');
    if (!stars.length) return;
    r.setAttribute('role', 'radiogroup');
    if (!r.hasAttribute('aria-label')) r.setAttribute('aria-label', 'Rating');
    function current() { var n = -1; stars.forEach(function (x, j) { if (x.classList.contains('on')) n = j; }); return n; }
    function select(i) {
      stars.forEach(function (x, j) {
        x.classList.toggle('on', j <= i);
        x.setAttribute('aria-checked', j === i ? 'true' : 'false');
        x.tabIndex = j === i ? 0 : -1;
      });
      if (val) val.textContent = (i + 1) + '/' + stars.length;
    }
    stars.forEach(function (s, i) {
      s.setAttribute('role', 'radio');
      s.setAttribute('aria-label', (i + 1) + ' of ' + stars.length);
      s.setAttribute('aria-checked', 'false');
      s.tabIndex = -1;
      s.addEventListener('click', function () { select(i); });
      s.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') n = Math.min(stars.length - 1, i + 1);
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') n = Math.max(0, i - 1);
        else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); select(i); return; }
        else return;
        e.preventDefault(); select(n); stars[n].focus();
      });
      s.addEventListener('mouseenter', function () { stars.forEach(function (x, j) { x.style.color = j <= i ? 'var(--warning)' : ''; }); });
    });
    r.addEventListener('mouseleave', function () { stars.forEach(function (x) { x.style.color = ''; }); });
    var c = current();
    if (c > -1) select(c); else stars[0].tabIndex = 0;   // roving stop even before a first pick
  });
  var hosts = {};
  function hostFor(pos) {                               // pos: tr (default) | tl | bl | br
    var key = pos || 'tr';
    if (hosts[key]) return hosts[key];
    var h = document.createElement('div');
    h.className = 'toast-host' + (key !== 'tr' ? ' ' + key : '');
    document.body.appendChild(h); hosts[key] = h; return h;
  }
  QZ.behavior('toast', '[data-toast]', function (btn) {
    btn.addEventListener('click', function () {
      var host = hostFor(btn.dataset.toastPos);
      var t = document.createElement('div'); t.className = 'toast ' + (btn.dataset.toastType || 'ok');
      t.innerHTML = '<span class="ic"><i class="fa-solid fa-check"></i></span><div><div class="ti2"></div></div>'; // static
      t.querySelector('.ti2').textContent = btn.dataset.toast || 'Done';   // message as text (no injection)
      host.appendChild(t);
      requestAnimationFrame(function () { t.classList.add('in'); });
      setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 300); }, 2600);
    });
  });
})();

/* ---- shared: drag-reorder · color picker · amount format ---- */
(function () {
  'use strict';
  QZ.behavior('reorder', '[data-reorder]', function (list) {
    var dragEl = null;
    // a11y: keyboard reordering announces moves through a polite live region
    var live = document.createElement('div');
    live.setAttribute('aria-live', 'polite');
    live.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap';
    list.appendChild(live);
    function siblings() { return Array.prototype.slice.call(list.querySelectorAll('.reorder-item')); }
    function announce(it) {
      var items = siblings(), pos = items.indexOf(it) + 1;
      var label = (it.textContent || 'Item').trim().replace(/\s+/g, ' ').slice(0, 40);
      live.textContent = label + ', position ' + pos + ' of ' + items.length;
    }
    list.querySelectorAll('.reorder-item').forEach(function (it) {
      it.draggable = true;
      if (!(it.getAttribute('tabindex'))) it.tabIndex = 0;          // keyboard-focusable
      it.setAttribute('aria-roledescription', 'Reorderable item, press Alt with Arrow Up or Down to move');
      it.addEventListener('dragstart', function () { dragEl = it; it.classList.add('dragging'); });
      it.addEventListener('dragend', function () { it.classList.remove('dragging'); list.querySelectorAll('.over').forEach(function (x) { x.classList.remove('over'); }); });
      it.addEventListener('dragover', function (e) { e.preventDefault(); if (it !== dragEl) it.classList.add('over'); });
      it.addEventListener('dragleave', function () { it.classList.remove('over'); });
      it.addEventListener('drop', function (e) {
        e.preventDefault(); it.classList.remove('over');
        if (!dragEl || it === dragEl) return;
        var items = siblings();   // only .reorder-item — the injected live region must not skew the index math
        if (items.indexOf(dragEl) < items.indexOf(it)) it.after(dragEl); else it.before(dragEl);
      });
      // keyboard reorder: Alt+ArrowUp / Alt+ArrowDown move the focused item
      it.addEventListener('keydown', function (e) {
        if (!e.altKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
        var items = siblings(), idx = items.indexOf(it);
        if (e.key === 'ArrowUp' && idx > 0) { e.preventDefault(); list.insertBefore(it, items[idx - 1]); it.focus(); announce(it); }
        else if (e.key === 'ArrowDown' && idx < items.length - 1) { e.preventDefault(); list.insertBefore(items[idx + 1], it); it.focus(); announce(it); }
      });
    });
  });
  // color swatches: a radiogroup — keyboard-focusable radios with arrow-key roving
  QZ.behavior('colorpicker', '[data-colorpicker]', function (cp) {
    var sws = Array.prototype.slice.call(cp.querySelectorAll('.sw'));
    if (!sws.length) return;
    cp.setAttribute('role', 'radiogroup');
    if (!cp.hasAttribute('aria-label')) cp.setAttribute('aria-label', 'Color');
    function select(sw) {
      sws.forEach(function (x) { x.classList.remove('on'); x.setAttribute('aria-checked', 'false'); x.tabIndex = -1; });
      sw.classList.add('on'); sw.setAttribute('aria-checked', 'true'); sw.tabIndex = 0;
    }
    sws.forEach(function (sw, i) {
      sw.style.color = sw.dataset.c; sw.style.background = sw.dataset.c;
      sw.setAttribute('role', 'radio');
      sw.setAttribute('aria-label', sw.dataset.c || 'Color ' + (i + 1));
      sw.setAttribute('aria-checked', 'false'); sw.tabIndex = -1;
      sw.addEventListener('click', function () { select(sw); });
      sw.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = sws[(i + 1) % sws.length];
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = sws[(i - 1 + sws.length) % sws.length];
        else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); select(sw); return; }
        else return;
        e.preventDefault(); select(n); n.focus();
      });
    });
    var on = cp.querySelector('.sw.on');
    if (on) select(on); else sws[0].tabIndex = 0;
  });
  QZ.behavior('amount', '.amount-field input', function (inp) {
    inp.addEventListener('blur', function () {
      var n = parseFloat(inp.value.replace(/[, ]/g, ''));
      if (isNaN(n)) return;
      inp.value = n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
      var f = inp.closest('.amount-field'); f.classList.toggle('pos', n > 0); f.classList.toggle('neg', n < 0);
    });
  });
})();

/* ---- admin: split-pane · bulk bar · faceted filters · date range ---- */
(function () {
  'use strict';
  QZ.behavior('split', '[data-split]', function (sp) {
    var items = sp.querySelectorAll('.split-item'), panes = sp.querySelectorAll('.sd-pane');
    items.forEach(function (it) {
      it.addEventListener('click', function () {
        items.forEach(function (x) { x.classList.remove('active'); }); it.classList.add('active');
        panes.forEach(function (p) { p.hidden = p.dataset.room !== it.dataset.room; });
      });
    });
  });

  QZ.behavior('bulk', '[data-bulk]', function (t) {
    var bar = document.querySelector('[data-bulkbar]');
    function upd() {
      var n = t.querySelectorAll('tbody input[type=checkbox]:checked').length;
      if (bar) { bar.hidden = n === 0; var c = bar.querySelector('.bcount'); if (c) c.textContent = n; }
    }
    t.addEventListener('change', upd);
    var sa = t.querySelector('[data-select-all]'); if (sa) sa.addEventListener('change', function () { setTimeout(upd, 0); });
    upd();
  });

  QZ.behavior('fchip', '[data-fchip]', function (b) { b.addEventListener('click', function () { var c = b.closest('.fchip'); if (c) c.remove(); }); });
  QZ.behavior('fclear', '[data-fclear]', function (b) {
    b.addEventListener('click', function () { var f = b.closest('.facets'); if (f) f.querySelectorAll('.fchip').forEach(function (c) { c.remove(); }); });
  });

  QZ.behavior('daterange', '[data-daterange]', function (dr) {
    var cals = dr.querySelector('.dr-cals'), summary = dr.querySelector('.daterange-summary');
    var now = new Date(), Y = now.getFullYear(), M = now.getMonth(), start = null, end = null;
    function key(o){return o.y*372+o.m*31+o.d;}
    function eq(a,o){return a&&a.y===o.y&&a.m===o.m&&a.d===o.d;}
    function inRange(o){if(!start||!end)return false;var k=key(o);return k>key(start)&&k<key(end);}
    function fmt(o){return o.y+'-'+QZcal.pad(o.m+1)+'-'+QZcal.pad(o.d);}
    function buildMonth(y,m){
      var box=document.createElement('div');box.className='month';
      var h=document.createElement('div');h.className='cal-h';
      h.innerHTML='<button type="button" data-nav="-1">‹</button><span class="cal-title">'+QZcal.MONTHS[m]+' '+y+'</span><button type="button" data-nav="1">›</button>';
      box.appendChild(h);
      var g=document.createElement('div');g.className='cal-grid';
      QZcal.DOW.forEach(function(d){var e=document.createElement('div');e.className='dow';e.textContent=d;g.appendChild(e);});
      var grid=QZcal.monthGrid(y,m),i;for(i=0;i<grid.blanks;i++)g.appendChild(document.createElement('div'));
      grid.days.forEach(function(d){var o={y:y,m:m,d:d};var e=document.createElement('div');e.className='day';e.textContent=d;
        if(eq(start,o))e.classList.add('rstart','sel');else if(eq(end,o))e.classList.add('rend','sel');else if(inRange(o))e.classList.add('range');
        e.addEventListener('click',function(){
          if(!start||(start&&end)){start=o;end=null;}
          else{ if(key(o)<key(start)){end=start;start=o;}else end=o; }
          render();
        });
        g.appendChild(e);});
      box.appendChild(g);
      QZdayNav(g,function(d){return d+' '+QZcal.MONTHS[m]+' '+y;});
      h.querySelectorAll('[data-nav]').forEach(function(b){b.addEventListener('click',function(){
        var bi=Array.prototype.indexOf.call(cals.children,box);   // same month box after the rebuild
        var r=QZcal.roll(Y,M+(+b.dataset.nav));Y=r.y;M=r.m;render();
        var nb=cals.querySelectorAll('[data-nav="'+b.dataset.nav+'"]')[bi];if(nb)nb.focus();
      });});
      cals.appendChild(box);
    }
    function render(){
      cals.innerHTML='';
      [0,1].forEach(function(off){var r=QZcal.roll(Y,M+off);buildMonth(r.y,r.m);});
      summary.textContent = start&&end ? fmt(start)+'  →  '+fmt(end) : start ? fmt(start)+'  →  …' : 'Select a start and end date';
    }
    render();
  });
})();

/* ---- heatmap fill ---- */
(function () {
  'use strict';
  QZ.behavior('heatmap', '[data-heatmap]', function (hm) {
    var cols = parseInt(hm.dataset.cols || '14', 10), rows = parseInt(hm.dataset.rows || '5', 10);
    hm.style.setProperty('--cols', cols);
    for (var i = 0; i < cols * rows; i++) {
      var cell = document.createElement('i');
      var v = (Math.sin(i * 0.7) + Math.sin(i * 0.23) + 2) / 4;                 // 0..1 deterministic
      v = Math.max(0, Math.min(1, v * (0.5 + 0.35 * (Math.sin(i * 5.13) + 1)))); // stable per index — no per-render jitter
      cell.style.background = v < 0.08 ? 'var(--surface-2)' : 'rgb(var(--primary-rgb) / ' + (0.15 + v * 0.75).toFixed(2) + ')';
      hm.appendChild(cell);
    }
  });
})();

/* ---- theme switcher: [data-theme-toggle] cycles html[data-theme] through a
   list of named schemes and persists the choice. The list is the attribute's
   value (comma-separated theme ids); add a CSS `:root[data-theme="<id>"]` block
   and append the id here to register a new theme. Default cycle: dark ↔
   desert-dunes. The button icon follows the resolved color-scheme, so any
   theme (light- or dark-based) gets the right glyph automatically. ---- */
(function () {
  'use strict';
  var KEY = 'qazana-theme';
  var root = document.documentElement;
  // apply a persisted explicit choice as early as this (deferred) script runs
  try { var saved = localStorage.getItem(KEY); if (saved) root.setAttribute('data-theme', saved); } catch (e) {}
  function isLight() { return (getComputedStyle(root).colorScheme || '').indexOf('light') === 0; }
  function sync(btn) {
    // only manage sun/moon glyphs — leave deliberately chosen icons alone
    var i = btn.querySelector('i');
    if (i && /fa-(sun|moon)\b/.test(i.className)) i.className = isLight() ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    // a visible text label is the accessible name; only label icon-only buttons
    if (!btn.textContent.trim()) btn.setAttribute('aria-label', 'Switch theme (current: ' + (root.getAttribute('data-theme') || 'auto') + ')');
  }
  QZ.behavior('theme-toggle', '[data-theme-toggle]', function (btn) {
    var list = (btn.getAttribute('data-theme-toggle') || 'dark-knight,desert-dunes')
      .split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    sync(btn);
    btn.addEventListener('click', function () {
      var next = list[(list.indexOf(root.getAttribute('data-theme')) + 1) % list.length];
      root.setAttribute('data-theme', next);
      try { localStorage.setItem(KEY, next); } catch (e) {}
      document.querySelectorAll('[data-theme-toggle]').forEach(sync);
    });
  });
})();

/* ---- direction switcher: [data-dir-toggle] flips html[dir] between ltr and
   rtl and persists the choice. The kits are RTL-ready (logical properties +
   targeted [dir="rtl"] refinements), so this is both a demo affordance and a
   smoke test: any component that drifts back to physical left/right shows up
   the moment the toggle flips. ---- */
(function () {
  'use strict';
  var KEY = 'qazana-dir';
  var root = document.documentElement;
  try { var saved = localStorage.getItem(KEY); if (saved) root.setAttribute('dir', saved); } catch (e) {}
  function sync(btn) {
    var rtl = root.getAttribute('dir') === 'rtl';
    btn.setAttribute('aria-pressed', String(rtl));
    btn.setAttribute('aria-label', 'Switch text direction (current: ' + (rtl ? 'rtl' : 'ltr') + ')');
    // icon reflects the current direction (align-left = ltr, align-right = rtl),
    // mirroring the theme toggle's sun/moon. Only manage the align glyphs so a
    // deliberately chosen icon is left alone.
    var i = btn.querySelector('i');
    if (i && /fa-align-(left|right)\b/.test(i.className)) i.className = 'fa-solid fa-align-' + (rtl ? 'right' : 'left');
  }
  QZ.behavior('dir-toggle', '[data-dir-toggle]', function (btn) {
    sync(btn);
    btn.addEventListener('click', function () {
      var next = root.getAttribute('dir') === 'rtl' ? 'ltr' : 'rtl';
      root.setAttribute('dir', next);
      try { localStorage.setItem(KEY, next); } catch (e) {}
      document.querySelectorAll('[data-dir-toggle]').forEach(sync);
    });
  });
})();

/* ---- auth helpers: password show/hide, strength meter, OTP auto-advance ---- */
(function () {
  'use strict';
  // show/hide password — delegated so it works on any [data-pw-toggle] / .pw-toggle
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-pw-toggle], .pw-toggle');
    if (!b) return;
    e.preventDefault();
    var sel = b.getAttribute('data-pw-toggle');
    var wrap = b.closest('.pw') || b.parentElement;
    var inp = (sel && document.querySelector(sel)) || (wrap && wrap.querySelector('input'));
    if (!inp) return;
    var show = inp.type === 'password';
    inp.type = show ? 'text' : 'password';
    if (!b.querySelector('i')) b.textContent = show ? 'HIDE' : 'SHOW';
    b.setAttribute('aria-pressed', show ? 'true' : 'false');
  });

  // password strength: [data-pw-strength] -> sibling .pwbar i (+class) and .pwhint
  function score(v) {
    var s = 0;
    if (v.length >= 8) s++;
    if (/[0-9]/.test(v)) s++;
    if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    return Math.min(s, 4);
  }
  var SLABEL = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];
  var SCLASS = ['', 'weak', 'fair', 'good', 'strong'];
  QZ.behavior('pw-strength', '[data-pw-strength]', function (inp) {
    var field = inp.closest('.field') || inp.parentElement;
    var bar = field && field.querySelector('.pwbar i');
    var hint = field && field.querySelector('.pwhint');
    inp.addEventListener('input', function () {
      var v = inp.value, s = v ? score(v) : 0;
      if (bar) { bar.style.width = (v ? (s / 4 * 100) : 0) + '%'; bar.className = SCLASS[s]; }
      if (hint) hint.textContent = v ? SLABEL[s] : '';
    });
  });

  // OTP: [data-otp] container of single-char inputs — auto-advance + backspace
  QZ.behavior('otp', '[data-otp]', function (box) {
    var ins = Array.prototype.slice.call(box.querySelectorAll('input'));
    ins.forEach(function (inp, i) {
      inp.addEventListener('input', function () {
        inp.value = inp.value.replace(/\D/g, '').slice(0, 1);
        if (inp.value && ins[i + 1]) ins[i + 1].focus();
      });
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && !inp.value && ins[i - 1]) ins[i - 1].focus();
      });
    });
  });
})();

/* ---- density toggle: [data-density-toggle] flips html data-density (compact ↔ comfortable) ---- */
(function () {
  'use strict';
  var KEY = 'qazana-density';
  var root = document.documentElement;
  try { var s = localStorage.getItem(KEY); if (s === 'compact') root.setAttribute('data-density', 'compact'); } catch (e) {}
  function compact() { return root.getAttribute('data-density') === 'compact'; }
  function sync(btn) {
    var i = btn.querySelector('i');
    if (i) i.className = compact() ? 'fa-solid fa-up-right-and-down-left-from-center' : 'fa-solid fa-compress';
    btn.setAttribute('aria-pressed', compact() ? 'true' : 'false');
    btn.setAttribute('title', compact() ? 'Switch to comfortable density' : 'Switch to compact density');
  }
  QZ.behavior('density-toggle', '[data-density-toggle]', function (btn) {
    sync(btn);
    btn.addEventListener('click', function () {
      root.setAttribute('data-density', compact() ? 'comfortable' : 'compact');
      try { localStorage.setItem(KEY, compact() ? 'compact' : 'comfortable'); } catch (e) {}
      document.querySelectorAll('[data-density-toggle]').forEach(sync);
    });
  });
})();

/* ---- modal a11y: [data-modal-open="#id"] opens a .modal-scrim dialog with
   focus-trap, body scroll-lock, Esc + scrim-click close, and focus restore ---- */
(function () {
  'use strict';
  var openEl = null, lastFocus = null;
  function focusables(c) {
    return Array.prototype.slice.call(c.querySelectorAll(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
    )).filter(function (e) { return e.offsetParent !== null; });
  }
  function open(scrim) {
    lastFocus = document.activeElement;
    scrim.removeAttribute('hidden');
    scrim.classList.add('is-open');
    QZscroll.lock();
    openEl = scrim;
    var f = focusables(scrim);
    if (!scrim.hasAttribute('tabindex')) scrim.tabIndex = -1;   // make the fallback focus() actually take
    (f[0] || scrim).focus();
  }
  function close() {
    if (!openEl) return;
    openEl.classList.remove('is-open');
    QZscroll.unlock();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    openEl = null;
  }
  document.addEventListener('click', function (e) {
    var trig = e.target.closest('[data-modal-open]');
    if (trig) { var m = document.querySelector(trig.getAttribute('data-modal-open')); if (m) { e.preventDefault(); open(m); } return; }
    if (e.target.closest('[data-modal-close]')) { close(); return; }
    if (openEl && e.target === openEl) close();   // click on the scrim (outside the dialog)
  });
  document.addEventListener('keydown', function (e) {
    if (!openEl) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'Tab') {
      var f = focusables(openEl); if (!f.length) { e.preventDefault(); return; }
      var first = f[0], last = f[f.length - 1];
      if (!openEl.contains(document.activeElement)) { e.preventDefault(); first.focus(); return; }   // recapture escaped focus
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
})();

/* ---- popover / popconfirm: [data-popover] toggles a .popover (sibling, or the
   selector in the attribute); outside-click / Esc / [data-popover-close] close;
   Esc and the close button hand focus back to the trigger ---- */
(function () {
  'use strict';
  var open = null, opener = null;
  function close(restore) {
    if (!open) return;
    open.classList.remove('is-open'); open = null;
    if (restore && opener && opener.focus) opener.focus();
    opener = null;
  }
  document.addEventListener('click', function (e) {
    var trig = e.target.closest('[data-popover]');
    if (trig) {
      e.preventDefault(); e.stopPropagation();
      var sel = trig.getAttribute('data-popover');
      var pop = sel ? document.querySelector(sel) : (trig.closest('.popover-wrap') || trig.parentElement).querySelector('.popover');
      if (!pop) return;
      if (pop === open) { close(true); return; }
      close(); pop.classList.add('is-open'); open = pop; opener = trig;
      var f = pop.querySelector('button,a[href],input,select,textarea'); if (f) f.focus();
      return;
    }
    if (e.target.closest('[data-popover-close]')) { close(true); return; }
    if (open && !e.target.closest('.popover')) close();   // click outside the panel — focus follows the click
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(true); });
})();

/* ---- command palette (⌘K / Ctrl+K) — search, group, keyboard nav ---- */
(function () {
  'use strict';
  var scrim = null, lastFocus = null;
  function panel() { return document.querySelector('.cmdk-scrim'); }
  function items(s) { return Array.prototype.slice.call(s.querySelectorAll('.cmd-item')); }
  function visible(s) { return items(s).filter(function (i) { return !i.hidden; }); }
  function setActive(s, idx) {
    var vis = visible(s); items(s).forEach(function (i) { i.classList.remove('active'); });
    if (!vis.length) return; idx = (idx + vis.length) % vis.length;
    vis[idx].classList.add('active'); vis[idx].scrollIntoView({ block: 'nearest' });
  }
  function activeIndex(s) { var vis = visible(s); return vis.findIndex(function (i) { return i.classList.contains('active'); }); }
  function filter(s, q) {
    q = q.trim().toLowerCase();
    items(s).forEach(function (i) { i.hidden = q && i.textContent.toLowerCase().indexOf(q) === -1; });
    s.querySelectorAll('.cmd-grp').forEach(function (g) { g.hidden = !g.querySelector('.cmd-item:not([hidden])'); });
    var empty = s.querySelector('.cmd-empty'); if (empty) empty.hidden = visible(s).length > 0;
    setActive(s, 0);
  }
  function open() {
    var s = panel(); if (!s) return;
    lastFocus = document.activeElement; scrim = s; s.removeAttribute('hidden'); s.classList.add('is-open');
    QZscroll.lock();
    var inp = s.querySelector('.cmdk-search input'); if (inp) { inp.value = ''; filter(s, ''); inp.focus(); }
  }
  function close() {
    if (!scrim) return;
    scrim.classList.remove('is-open'); QZscroll.unlock();
    if (lastFocus && lastFocus.focus) lastFocus.focus(); scrim = null;
  }
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); scrim ? close() : open(); return; }
    if (!scrim) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'Tab') {   // contain focus in the palette while it's open
      var f = Array.prototype.slice.call(scrim.querySelectorAll(
        'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
      )).filter(function (el) { return el.offsetParent !== null; });
      if (!f.length) { e.preventDefault(); return; }
      var first = f[0], last = f[f.length - 1];
      if (!scrim.contains(document.activeElement)) { e.preventDefault(); first.focus(); return; }
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(scrim, activeIndex(scrim) + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(scrim, activeIndex(scrim) - 1); }
    else if (e.key === 'Enter') { var vis = visible(scrim), i = activeIndex(scrim); if (vis[i]) { e.preventDefault(); vis[i].click(); } }
  });
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-cmdk-open]')) { e.preventDefault(); open(); return; }
    if (!scrim) return;
    var it = e.target.closest('.cmd-item'); if (it) { close(); return; }   // demo: select closes
    if (e.target === scrim) close();
  });
  document.addEventListener('input', function (e) { if (scrim && e.target.closest('.cmdk-search')) filter(scrim, e.target.value); });
})();

/* ---- tree view: [data-tree] — expand/collapse, select, full keyboard nav ---- */
(function () {
  'use strict';
  function rows(tree) { return Array.prototype.slice.call(tree.querySelectorAll('.tree-row')); }
  function visibleRows(tree) { return rows(tree).filter(function (r) { return r.offsetParent !== null; }); }
  function item(row) { return row.closest('.tree-item'); }
  function hasChildren(row) { var it = item(row); return it && it.querySelector('.tree-children'); }
  function expanded(row) { return item(row).getAttribute('aria-expanded') === 'true'; }
  function setExpanded(row, v) { if (hasChildren(row)) item(row).setAttribute('aria-expanded', v ? 'true' : 'false'); }
  function setup(tree) {
    // fill in any missing tree semantics — authored markup (role=treeitem on
    // .tree-item, role=group on .tree-children) is respected, minimal markup
    // gets the same model added. The treeitem is the .tree-item; the row is
    // its visual, focusable label.
    if (!tree.hasAttribute('role')) tree.setAttribute('role', 'tree');
    Array.prototype.forEach.call(tree.querySelectorAll('.tree-children'), function (c) { if (!c.hasAttribute('role')) c.setAttribute('role', 'group'); });
    Array.prototype.forEach.call(tree.querySelectorAll('.tree-item'), function (it) {
      if (!it.hasAttribute('role')) it.setAttribute('role', 'treeitem');
      it.setAttribute('aria-selected', it.querySelector('.tree-row') && it.querySelector('.tree-row').classList.contains('sel') ? 'true' : 'false');
    });
    rows(tree).forEach(function (r, i) {
      r.tabIndex = i === 0 ? 0 : -1;
      r.addEventListener('click', function () {
        rows(tree).forEach(function (x) { x.classList.remove('sel'); x.tabIndex = -1; item(x).setAttribute('aria-selected', 'false'); });
        r.classList.add('sel'); r.tabIndex = 0; item(r).setAttribute('aria-selected', 'true');
        if (hasChildren(r)) setExpanded(r, !expanded(r));
      });
      r.addEventListener('keydown', function (e) {
        var vis = visibleRows(tree), idx = vis.indexOf(r), n = null;
        if (e.key === 'ArrowDown') n = vis[idx + 1];
        else if (e.key === 'ArrowUp') n = vis[idx - 1];
        else if (e.key === 'ArrowRight') { if (hasChildren(r) && !expanded(r)) { setExpanded(r, true); return e.preventDefault(); } n = vis[idx + 1]; }
        else if (e.key === 'ArrowLeft') { if (hasChildren(r) && expanded(r)) { setExpanded(r, false); return e.preventDefault(); } var p = item(r).parentElement.closest('.tree-item'); n = p && p.querySelector('.tree-row'); }
        else if (e.key === 'Home') n = vis[0];
        else if (e.key === 'End') n = vis[vis.length - 1];
        else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); r.click(); return; }
        else return;
        if (n) { e.preventDefault(); rows(tree).forEach(function (x) { x.tabIndex = -1; }); n.tabIndex = 0; n.focus(); }
      });
    });
  }
  QZ.behavior('tree', '[data-tree]', setup);
})();

/* ---- form validation: [data-validate] — declarative rules through the native
   Constraint Validation API (required, type=email/url/number, minlength, maxlength,
   pattern, min/max/step) plus cross-field data-match. Drives the canonical
   .form-field / .field-error / .is-error vocabulary (and the legacy .field-row /
   .ferr it predates — the engine resolves either), wires aria-invalid +
   aria-describedby, and validates on submit, on blur after a field is touched, then
   live-clears a field once it's fixed ("reward early, punish late"). Async / remote
   rules plug into the SAME pipeline via the native setCustomValidity seam: set a
   custom validity on the control and this engine renders inp.validationMessage
   through the field's error node. On a VALID submit the form submits normally; a
   form with no action (or action="#") instead shows an inline .form-msg.ok and
   stays put — for demos and forms whose submit is handled in JS. ---- */
(function () {
  'use strict';
  var uid = 0;
  function fieldOf(inp) { return inp.closest('.form-field, .field-row, .field') || inp.parentElement; }
  function errNode(inp, make) {
    var f = fieldOf(inp), err = f.querySelector('.field-error, .ferr, .err');
    if (!err && make) { err = document.createElement('span'); err.className = 'field-error'; f.appendChild(err); }
    if (err && !err.id) err.id = 'qz-err-' + (++uid);
    return err;
  }
  // Friendly message for the control's current validity (native strings are clunky).
  // Cross-field match is layered on first — it isn't a native constraint — then the
  // native validity flags, then customError (the async seam) via validationMessage.
  function messageFor(inp) {
    var T = QZi18n.validate;
    var sel = inp.getAttribute('data-match');
    if (sel) { var other = QZq(sel); if (other && inp.value !== other.value) return inp.getAttribute('data-msg-match') || T.match; }
    // Manual minlength check: validity.tooShort only fires for user-edited (dirty)
    // values, so a persist-restored too-short draft would otherwise read as valid.
    var ml = parseInt(inp.getAttribute('minlength'), 10);
    if (ml > 0 && inp.value && inp.value.length < ml) return inp.getAttribute('data-msg') || QZi18n.fmt(T.minlength, { min: ml });
    if (inp.validity.valid) return null;
    if (inp.getAttribute('data-msg')) return inp.getAttribute('data-msg');
    var v = inp.validity;
    if (v.valueMissing) return T.required;
    if (v.typeMismatch) return inp.type === 'email' ? T.email : inp.type === 'url' ? T.url : T.value;
    if (v.tooShort) return QZi18n.fmt(T.minlength, { min: inp.getAttribute('minlength') });
    if (v.tooLong) return QZi18n.fmt(T.maxlength, { max: inp.getAttribute('maxlength') });
    if (v.rangeUnderflow) return QZi18n.fmt(T.min, { min: inp.getAttribute('min') });
    if (v.rangeOverflow) return QZi18n.fmt(T.max, { max: inp.getAttribute('max') });
    if (v.stepMismatch) return T.step;
    if (v.patternMismatch) return inp.getAttribute('title') || T.pattern;
    return inp.validationMessage || T.generic;
  }
  function setError(inp, msg) {
    var f = fieldOf(inp), err = errNode(inp, true);
    inp.classList.add('is-error'); inp.classList.remove('is-success'); inp.setAttribute('aria-invalid', 'true');
    if (f.classList.contains('form-field')) f.classList.add('is-error');
    err.textContent = msg; err.style.display = '';
    var d = (inp.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
    if (d.indexOf(err.id) < 0) { d.push(err.id); inp.setAttribute('aria-describedby', d.join(' ')); }
  }
  function clearError(inp) {
    var f = fieldOf(inp), err = errNode(inp, false);
    inp.classList.remove('is-error'); inp.removeAttribute('aria-invalid');
    if (f.classList.contains('form-field')) f.classList.remove('is-error');
    if (err && err.dataset.auto !== '0') err.style.display = 'none';   // leave author-written sticky errors alone
  }
  // valid + non-empty → positive feedback (.is-success) for text-like controls only;
  // never checkbox/radio (value is "on" regardless of checked) or selects, and never
  // an empty optional field.
  function check(inp) {
    var msg = messageFor(inp);
    if (msg) { setError(inp, msg); return msg; }
    clearError(inp);
    var textLike = inp.tagName !== 'SELECT' && inp.type !== 'checkbox' && inp.type !== 'radio';
    inp.classList.toggle('is-success', textLike && (inp.value || '').trim() !== '');
    return null;
  }
  function realAction(form) { var a = (form.getAttribute('action') || '').trim(); return !!a && a !== '#'; }
  function setup(form) {
    var fields = Array.prototype.slice.call(form.querySelectorAll('input, textarea, select'))
      .filter(function (i) { return i.type !== 'submit' && i.type !== 'button' && i.type !== 'hidden' && !i.disabled; });
    form.setAttribute('novalidate', '');                                   // we own the UX, not the native bubbles
    fields.forEach(function (inp) {
      inp.addEventListener('blur', function () { check(inp); });            // punish late: only after the field is touched
      inp.addEventListener('input', function () { if (inp.classList.contains('is-error')) check(inp); }); // reward early
    });
    form.addEventListener('submit', function (e) {
      var bad = 0, first = null;
      fields.forEach(function (inp) { if (check(inp)) { bad++; if (!first) first = inp; } });
      var msg = form.querySelector('.form-msg');
      if (bad) {
        e.preventDefault();
        if (!msg) { msg = document.createElement('div'); form.insertBefore(msg, form.firstChild); }
        msg.className = 'form-msg error';
        msg.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> ';
        msg.appendChild(document.createTextNode(QZi18n.fmt(QZi18n.validate.fix, { n: bad, s: bad > 1 ? QZi18n.time.plural : '' })));
        if (first) first.focus();
        return;
      }
      // valid: a real action submits normally; an action-less form stays put (no reload
      // to nowhere). The inline "submitted" banner is OPT-IN via data-validate="confirm"
      // so we never inject an uninvited success message into a JS-handled form.
      if (realAction(form)) return;
      e.preventDefault();
      if (form.getAttribute('data-validate') === 'confirm') {
        if (!msg) { msg = document.createElement('div'); form.insertBefore(msg, form.firstChild); }
        msg.className = 'form-msg ok';
        msg.innerHTML = '<i class="fa-solid fa-check"></i> ';
        msg.appendChild(document.createTextNode(QZi18n.validate.ok));
      }
    });
  }
  QZ.behavior('validate', '[data-validate]', setup);
})();

/* ---- table: expandable rows [data-row-toggle] · global filter [data-table-filter="#id"] ---- */
(function () {
  'use strict';
  document.addEventListener('click', function (e) {
    var t = e.target.closest('.row-toggle'); if (!t) return;
    var tr = t.closest('tr'), detail = tr.nextElementSibling;
    if (detail && detail.classList.contains('row-detail')) { var open = tr.classList.toggle('is-open'); detail.hidden = !open; t.setAttribute('aria-expanded', open ? 'true' : 'false'); }
  });
  QZ.behavior('table-filter', '[data-table-filter]', function (inp) {
    var table = document.querySelector(inp.getAttribute('data-table-filter')); if (!table) return;
    inp.addEventListener('input', function () {
      var q = inp.value.trim().toLowerCase();
      table.querySelectorAll('tbody tr:not(.row-detail)').forEach(function (tr) {
        var hit = tr.textContent.toLowerCase().indexOf(q) > -1; tr.hidden = q && !hit;
        var d = tr.nextElementSibling; if (d && d.classList.contains('row-detail')) d.hidden = true, tr.classList.remove('is-open');
      });
    });
  });
})();

/* ---- resizable split: a .resizer between panes drags the previous pane's width ---- */
(function () {
  'use strict';
  QZ.behavior('resizer', '.split .resizer', function (rz) {
      var prev = rz.previousElementSibling, split = rz.closest('.split');
      if (!prev || !split) return;
      rz.addEventListener('pointerdown', function (e) {
        e.preventDefault(); rz.classList.add('dragging'); rz.setPointerCapture(e.pointerId);
        var startX = e.clientX, startW = prev.getBoundingClientRect().width, total = split.getBoundingClientRect().width;
        function move(ev) {
          var w = Math.max(120, Math.min(total - 160, startW + (ev.clientX - startX)));
          prev.style.flex = '0 0 ' + w + 'px';
        }
        function up(ev) { rz.classList.remove('dragging'); rz.releasePointerCapture(e.pointerId); rz.removeEventListener('pointermove', move); rz.removeEventListener('pointerup', up); }
        rz.addEventListener('pointermove', move); rz.addEventListener('pointerup', up);
      });
  });
})();

/* ---- TOC scrollspy: [data-toc] links highlight the section in view ---- */
(function () {
  'use strict';
  QZ.behavior('toc', '[data-toc]', function (toc) {
    var links = Array.prototype.slice.call(toc.querySelectorAll('a[href^="#"]'));
    var map = {};
    links.forEach(function (a) { var t = document.getElementById(a.getAttribute('href').slice(1)); if (t) map[a.getAttribute('href')] = t; });
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('active', map[a.getAttribute('href')] === en.target); });
      });
    }, { rootMargin: '0px 0px -70% 0px', threshold: 0 });
    Object.keys(map).forEach(function (h) { io.observe(map[h]); });
  });
})();

/* ---- commerce: quantity stepper [data-stepper] — clamps min/max/step, disables
   at bounds, fires native change event. Buttons carry aria-label; the <input> is
   the source of truth. ---- */
(function () {
  'use strict';
  function num(v, fallback) { var n = parseFloat(v); return isNaN(n) ? fallback : n; }   // 0 is a legal bound — no ||-defaulting
  function setupStepper(root) {
    var inp = root.querySelector('input[type=number]');
    if (!inp) return;
    var dec = root.querySelector('[data-dec]');
    var inc = root.querySelector('[data-inc]');
    var min = num(inp.min, 1);
    var max = num(inp.max, 999);
    var step = num(inp.step, 1) || 1;
    function val() { return num(inp.value, min); }
    function upd() {
      var v = Math.max(min, Math.min(max, val()));
      inp.value = v;
      if (dec) dec.disabled = v <= min;
      if (inc) inc.disabled = v >= max;
    }
    if (dec) dec.addEventListener('click', function () { inp.value = Math.max(min, val() - step); upd(); inp.dispatchEvent(new Event('change', { bubbles: true })); });
    if (inc) inc.addEventListener('click', function () { inp.value = Math.min(max, val() + step); upd(); inp.dispatchEvent(new Event('change', { bubbles: true })); });
    inp.addEventListener('change', upd);
    inp.addEventListener('blur', upd);
    upd();
  }
  QZ.behavior('stepper', '[data-stepper]', setupStepper);
})();

/* ---- commerce: variant/swatch picker [data-variant] — radiogroup with arrow
   navigation; skips .oos options (aria-disabled, still focusable); syncs a
   labelled output when [data-variant-label] is present. ---- */
(function () {
  'use strict';
  function setupVariant(group) {
    var opts = Array.prototype.slice.call(group.querySelectorAll('[role="radio"]'));
    var label = document.querySelector(group.getAttribute('data-variant-label') || '__none__');
    group.setAttribute('role', 'radiogroup');
    function select(opt) {
      if (opt.getAttribute('aria-disabled') === 'true') return;
      opts.forEach(function (o) { o.setAttribute('aria-checked', 'false'); o.classList.remove('on'); });
      opt.setAttribute('aria-checked', 'true'); opt.classList.add('on');
      if (label) label.textContent = opt.getAttribute('data-value') || opt.textContent.trim();
    }
    function focusable() { return opts.filter(function (o) { return o.getAttribute('aria-disabled') !== 'true'; }); }
    opts.forEach(function (opt, i) {
      opt.tabIndex = (i === 0) ? 0 : -1;
      opt.addEventListener('click', function () { select(opt); opt.focus(); });
      opt.addEventListener('keydown', function (e) {
        var fo = focusable(), idx = fo.indexOf(opt), n = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = fo[(idx + 1) % fo.length];
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = fo[(idx - 1 + fo.length) % fo.length];
        else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); select(opt); return; }
        else return;
        e.preventDefault(); opts.forEach(function (o) { o.tabIndex = -1; }); n.tabIndex = 0; n.focus(); select(n);
      });
    });
    var first = focusable()[0]; if (first && first.getAttribute('aria-checked') !== 'true') select(first);
  }
  QZ.behavior('variant', '[data-variant]', setupVariant);
})();

/* ---- off-canvas admin sidebar: [data-sidebar-toggle] flips .nav-open on the
   target .adminframe; backdrop-click, nav-item-click and Esc close it ---- */
(function () {
  'use strict';
  function frameFor(btn) {
    var sel = btn.getAttribute('data-sidebar-toggle');
    return (sel && document.querySelector(sel)) || btn.closest('.adminframe') || document.querySelector('.adminframe');
  }
  function syncBtns(on) {
    document.querySelectorAll('[data-sidebar-toggle]').forEach(function (b) { b.setAttribute('aria-expanded', on ? 'true' : 'false'); });
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-sidebar-toggle]');
    if (btn) { var f = frameFor(btn); if (f) syncBtns(f.classList.toggle('nav-open')); return; }
    var open = document.querySelector('.adminframe.nav-open');
    if (!open) return;
    // a tap on the scrim (the .adminframe itself, outside the sidebar) or on a nav item closes
    if (!e.target.closest('.sidebar') || e.target.closest('.side-item')) { open.classList.remove('nav-open'); syncBtns(false); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var open = document.querySelector('.adminframe.nav-open');
    if (open) { open.classList.remove('nav-open'); syncBtns(false); }
  });
})();

/* ---- mobile site navigation drawer: [data-nav-drawer-toggle] opens/closes
   the .nav-drawer panel with overlay; Esc, overlay-click, and nav-item close ---- */
(function () {
  'use strict';
  var drawer = null, overlay = null, trigger = null;
  function focusables(c) {
    return Array.prototype.slice.call(c.querySelectorAll(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
    )).filter(function (el) { return el.offsetParent !== null; });
  }
  function isOpen() { return !!(drawer && drawer.classList.contains('open')); }
  /* reflect state on the external opener(s) only — not the in-drawer close button */
  function syncToggles(expanded) {
    var toggles = document.querySelectorAll('[data-nav-drawer-toggle]');
    Array.prototype.forEach.call(toggles, function (t) {
      if (!t.closest('.nav-drawer')) t.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    });
  }
  function open() {
    drawer = document.querySelector('.nav-drawer');
    overlay = document.querySelector('.nav-drawer-overlay');
    if (!drawer) return;
    drawer.classList.add('open');
    if (overlay) overlay.classList.add('open');
    QZscroll.lock();
    syncToggles(true);
    var f = focusables(drawer);
    (f[0] || drawer).focus();
  }
  function close() {
    if (!drawer) drawer = document.querySelector('.nav-drawer');
    if (!overlay) overlay = document.querySelector('.nav-drawer-overlay');
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    QZscroll.unlock();
    syncToggles(false);
    if (trigger && trigger.focus) trigger.focus();
    trigger = null;
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-nav-drawer-toggle]');
    if (btn) { e.preventDefault(); if (isOpen()) { close(); } else { trigger = btn; open(); } return; }
    if (e.target.closest('.nav-drawer-overlay.open')) { close(); return; }
    if (e.target.closest('.nav-drawer') && e.target.closest('a')) close();
  });
  document.addEventListener('keydown', function (e) {
    if (!isOpen()) return;          /* only act while open — no cross-component side effects */
    if (e.key === 'Escape') { close(); return; }
    if (e.key !== 'Tab') return;
    var f = focusables(drawer);
    if (!f.length) { e.preventDefault(); drawer.focus(); return; }
    var first = f[0], last = f[f.length - 1];
    if (!drawer.contains(document.activeElement)) { e.preventDefault(); first.focus(); return; }
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
})();

/* ---- media kit: waveform progress (data-wave) + volume fill (data-vol) ---- */
(function () {
  'use strict';
  // data-wave: render deterministic bars; data-progress (0-100) marks played bars .on
  function renderWave(w) {
    var bars = Math.min(Math.max(parseInt(w.dataset.bars, 10) || 48, 8), 200);
    var played = Math.round(bars * (parseFloat(w.dataset.progress) || 0) / 100);
    var html = '';
    for (var i = 0; i < bars; i++) {
      var h = Math.round(25 + 70 * Math.abs(Math.sin(i * 1.7) + Math.sin(i * 0.43)) / 2);
      html += '<i class="' + (i < played ? 'on' : '') + '" style="height:' + h + '%"></i>';
    }
    w.innerHTML = html;
  }

  // data-vol: keep the range track's fill (--vol) in sync with its value
  function syncVol(r) { r.style.setProperty('--vol', r.value + '%'); }

  QZ.behavior('wave', '[data-wave]', renderWave);
  QZ.behavior('vol', 'input[data-vol]', function (r) {
    syncVol(r);
    r.addEventListener('input', function () { syncVol(r); });
  });
})();

/* ---- billing: monthly/annual cycle toggle [data-billing-cycle="<selector>"] —
   a radiogroup (arrow-key nav, like [data-variant]) that flips data-cycle on a
   NAMED target region so CSS swaps the pre-rendered monthly/annual price spans.
   No math: both prices live in the markup; JS only toggles state. ---- */
(function () {
  'use strict';
  function setup(group) {
    var target = document.querySelector(group.getAttribute('data-billing-cycle') || '__none__');
    var opts = Array.prototype.slice.call(group.querySelectorAll('[role="radio"]'));
    if (!target || !opts.length) return;
    group.setAttribute('role', 'radiogroup');
    function select(opt, fire) {
      opts.forEach(function (o) { o.setAttribute('aria-checked', 'false'); o.classList.remove('on'); o.tabIndex = -1; });
      opt.setAttribute('aria-checked', 'true'); opt.classList.add('on'); opt.tabIndex = 0;
      target.setAttribute('data-cycle', opt.getAttribute('data-value'));
      if (fire) group.dispatchEvent(new Event('change', { bubbles: true }));
    }
    opts.forEach(function (opt, i) {
      opt.tabIndex = (i === 0) ? 0 : -1;
      opt.addEventListener('click', function () { select(opt, true); opt.focus(); });
      opt.addEventListener('keydown', function (e) {
        var idx = opts.indexOf(opt), n = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = opts[(idx + 1) % opts.length];
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = opts[(idx - 1 + opts.length) % opts.length];
        else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); select(opt, true); return; }
        else return;
        e.preventDefault(); select(n, true); n.focus();
      });
    });
    // sync to the initially-checked option (or the first), honouring server markup
    var checked = opts.filter(function (o) { return o.getAttribute('aria-checked') === 'true'; })[0] || opts[0];
    select(checked, false);
  }
  QZ.behavior('billing-cycle', '[data-billing-cycle]', setup);
})();

/* ---- tooltips: ONE engine for both [data-tip] (text) and .tip>.tip-pop (rich).
   Renders a single floating node in <body> (position:fixed) so it escapes any
   overflow:hidden / transformed ancestor, and auto-positions: honours
   data-tip-pos as the PREFERRED side, flips when it would clip the viewport, and
   shifts along the cross axis to stay in view. The pure-CSS [data-tip]/.tip-pop
   rendering is the no-JS fallback, suppressed via .qz-tip-js on <html>.
   WCAG 1.4.13: hoverable (rich), Esc-dismissible, aria-describedby. ---- */
(function () {
  var GAP = 8, EDGE = 8, HIDE_DELAY = 80;
  var tip, arrow, body, cur = null, hideT = null, overTip = false;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function opposite(s) { return { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }[s] || 'bottom'; }
  function triggerOf(el) { return (el && el.closest) ? el.closest('[data-tip],.tip') : null; }

  function buildTip() {
    tip = document.createElement('div');
    tip.className = 'qz-tip'; tip.id = 'qz-tip';   /* role set only while shown (empty role=tooltip has no a11y name) */
    arrow = document.createElement('span'); arrow.className = 'qz-arrow';
    body = document.createElement('span'); body.className = 'qz-tip-body';
    tip.appendChild(arrow); tip.appendChild(body);
    document.body.appendChild(tip);
    tip.addEventListener('pointerenter', function () { overTip = true; clearTimeout(hideT); });
    tip.addEventListener('pointerleave', function () { overTip = false; scheduleHide(); });
  }

  function fill(trg) {
    var pop = trg.matches('.tip') ? trg.querySelector('.tip-pop') : null;
    var rich = !!pop || trg.hasAttribute('data-tip-card');
    if (pop) { body.textContent = ''; body.appendChild(pop.cloneNode(true)); }
    else { body.textContent = trg.getAttribute('data-tip') || ''; }
    if (rich) tip.setAttribute('data-rich', ''); else tip.removeAttribute('data-rich');
    var pos = (pop ? pop.getAttribute('data-tip-pos') : trg.getAttribute('data-tip-pos')) || 'top';
    return { ok: !!pop || body.textContent !== '', pos: pos };
  }

  function place(rect, pref) {
    var tw = tip.offsetWidth, th = tip.offsetHeight, vw = innerWidth, vh = innerHeight;
    var space = { top: rect.top, bottom: vh - rect.bottom, left: rect.left, right: vw - rect.right };
    var need = { top: th + GAP, bottom: th + GAP, left: tw + GAP, right: tw + GAP };
    var order = [pref, opposite(pref), 'top', 'bottom', 'right', 'left'], side = null;
    for (var i = 0; i < order.length; i++) { if (space[order[i]] >= need[order[i]]) { side = order[i]; break; } }
    if (!side) side = (Math.max(space.top, space.bottom) >= Math.max(space.left, space.right))
      ? (space.top > space.bottom ? 'top' : 'bottom') : (space.left > space.right ? 'left' : 'right');
    var cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2, x, y;
    if (side === 'top') { x = cx - tw / 2; y = rect.top - th - GAP; }
    else if (side === 'bottom') { x = cx - tw / 2; y = rect.bottom + GAP; }
    else if (side === 'left') { x = rect.left - tw - GAP; y = cy - th / 2; }
    else { x = rect.right + GAP; y = cy - th / 2; }
    var sx = clamp(x, EDGE, Math.max(EDGE, vw - tw - EDGE)), sy = clamp(y, EDGE, Math.max(EDGE, vh - th - EDGE));
    tip.style.left = sx + 'px'; tip.style.top = sy + 'px'; tip.setAttribute('data-pos', side);
    if (side === 'top' || side === 'bottom') { arrow.style.left = clamp(cx - sx, 12, tw - 12) + 'px'; arrow.style.top = ''; }
    else { arrow.style.top = clamp(cy - sy, 12, th - 12) + 'px'; arrow.style.left = ''; }
  }

  // append/remove our id as a TOKEN — a trigger's own aria-describedby (hints,
  // validation errors) must survive the tooltip's lifecycle
  function addDesc(el) {
    var d = (el.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
    if (d.indexOf('qz-tip') < 0) { d.push('qz-tip'); el.setAttribute('aria-describedby', d.join(' ')); }
  }
  function dropDesc(el) {
    var d = (el.getAttribute('aria-describedby') || '').split(/\s+/).filter(function (t) { return t && t !== 'qz-tip'; });
    if (d.length) el.setAttribute('aria-describedby', d.join(' ')); else el.removeAttribute('aria-describedby');
  }
  function show(trg) {
    clearTimeout(hideT);
    if (cur && cur !== trg) dropDesc(cur);
    cur = trg;
    var c = fill(trg);
    if (!c.ok) { hide(); return; }
    place(trg.getBoundingClientRect(), c.pos);
    tip.setAttribute('role', 'tooltip');
    tip.classList.add('show');
    addDesc(trg);
  }
  function hide() { tip.classList.remove('show'); tip.removeAttribute('role'); if (cur) dropDesc(cur); cur = null; }
  function scheduleHide() { clearTimeout(hideT); hideT = setTimeout(function () { if (!overTip) hide(); }, HIDE_DELAY); }

  function init() {
    document.documentElement.classList.add('qz-tip-js');
    buildTip();
    document.addEventListener('pointerover', function (e) { var t = triggerOf(e.target); if (t && t !== cur) show(t); });
    document.addEventListener('pointerout', function (e) { var t = triggerOf(e.target); if (t && t === cur && triggerOf(e.relatedTarget) !== t) scheduleHide(); });
    document.addEventListener('focusin', function (e) { var t = triggerOf(e.target); if (t) show(t); });
    document.addEventListener('focusout', function (e) { if (cur && triggerOf(e.target) === cur) scheduleHide(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && cur) hide(); });
    addEventListener('scroll', function () { if (cur) hide(); }, true);
    addEventListener('resize', function () { if (cur) hide(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

/* ---- lightbox: a [data-lightbox] container's items (its <a>/[data-lightbox-item]
   children) open a full-screen viewer built once at <body> level. Items are images
   or videos (data-type="video", or a .mp4/.webm/.mov/.m4v href). Prev/next + counter
   + caption; keyboard (←/→/Esc), focus trap, focus restore, background-scroll lock. ---- */
(function () {
  var lb, stage, capEl, countEl, prevB, nextB, items = [], idx = 0, opener = null;
  var curGid = null, syncing = false, prevHash = '';
  var VIDEO = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;

  // Deep-link state lives in the hash as #lightbox=<group-id>/<index>, so a viewer
  // can be shared and reopened. Hash-based to stay router-agnostic (no pushState
  // route collision); a group needs an id to be deep-linkable.
  function hashFor(gid, i) { return '#lightbox=' + encodeURIComponent(gid) + '/' + i; }
  function parseHash() { var m = /^#lightbox=([^/]+)\/(\d+)$/.exec(location.hash); return m ? { gid: decodeURIComponent(m[1]), idx: +m[2] } : null; }
  function writeHash(mode) {                 // mode: 'push' | 'replace' | null (opened from the hash already)
    if (!curGid || !history.replaceState || mode === null) return;
    var h = hashFor(curGid, idx); if (location.hash === h) return;
    syncing = true; history[mode === 'push' ? 'pushState' : 'replaceState'](null, '', h); syncing = false;
  }

  function build() {
    lb = document.createElement('div');
    lb.className = 'qz-lightbox'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Media viewer');
    lb.innerHTML =
      '<button class="lb-btn lb-prev" type="button" aria-label="Previous">‹</button>' +
      '<div class="lb-stage"></div>' +
      '<button class="lb-btn lb-next" type="button" aria-label="Next">›</button>' +
      '<button class="lb-btn lb-close" type="button" aria-label="Close">✕</button>' +
      '<div class="lb-bar"><span class="lb-cap"></span><span class="lb-count"></span></div>';
    document.body.appendChild(lb);
    stage = lb.querySelector('.lb-stage'); capEl = lb.querySelector('.lb-cap'); countEl = lb.querySelector('.lb-count');
    prevB = lb.querySelector('.lb-prev'); nextB = lb.querySelector('.lb-next');
    prevB.addEventListener('click', function () { go(-1); });
    nextB.addEventListener('click', function () { go(1); });
    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  }

  function render() {
    var it = items[idx], node;
    stage.textContent = '';
    if (it.type === 'video') { node = document.createElement('video'); node.src = it.src; node.controls = true; node.autoplay = true; node.playsInline = true; if (it.poster) node.poster = it.poster; }
    else { node = document.createElement('img'); node.src = it.src; node.alt = it.cap || ''; }
    stage.appendChild(node);
    capEl.textContent = it.cap || '';
    countEl.textContent = items.length > 1 ? (idx + 1) + ' / ' + items.length : '';
    var multi = items.length > 1;
    prevB.style.display = nextB.style.display = multi ? '' : 'none';
  }
  function go(d) { idx = (idx + d + items.length) % items.length; render(); writeHash('replace'); }

  function open(list, i, trigger, gid, mode) {
    items = list; idx = i; opener = trigger || null; curGid = gid || null;
    if (!lb) build();
    if (mode === 'push') prevHash = location.hash;     // remember the page's pre-open hash to restore on close
    render(); lb.classList.add('open');
    QZscroll.lock();
    document.addEventListener('keydown', onKey);
    lb.querySelector('.lb-close').focus();
    writeHash(mode);
  }
  function openGroup(group, i, trigger, mode) {
    var list = collect(group); if (!list.length) return;
    open(list, Math.max(0, Math.min(list.length - 1, i || 0)), trigger, group.id || null, mode);
  }
  function close(fromHash) {
    if (!lb) return;
    lb.classList.remove('open'); stage.textContent = '';
    QZscroll.unlock();
    document.removeEventListener('keydown', onKey);
    if (!fromHash && curGid && history.replaceState && parseHash()) {   // user-closed → restore the pre-open hash, not a bare path
      syncing = true; history.replaceState(null, '', location.pathname + location.search + (prevHash || '')); syncing = false;
    }
    curGid = null; prevHash = '';
    if (opener && opener.focus) opener.focus();
  }
  function onKey(e) {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'Tab') {
      var f = lb.querySelectorAll('.lb-btn'); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  function collect(group) {
    var els = group.querySelectorAll('[data-lightbox-item],a[href]');
    return Array.prototype.map.call(els, function (el) {
      var src = el.getAttribute('data-src') || el.getAttribute('href');
      var type = el.getAttribute('data-type') || (VIDEO.test(src || '') ? 'video' : 'image');
      var thumb = el.querySelector('img');
      return { src: src, type: type, cap: el.getAttribute('data-caption') || '', poster: el.getAttribute('data-poster') || (thumb ? thumb.src : ''), el: el };
    });
  }
  function fromHash(trigger) {
    var p = parseHash(); if (!p) return false;
    var g = document.getElementById(p.gid);
    if (!g || !g.matches('[data-lightbox]')) return false;
    openGroup(g, p.idx, trigger, null);                  // already in the hash → don't re-write history
    return true;
  }
  function init() {
    document.addEventListener('click', function (e) {
      var item = e.target.closest('[data-lightbox] [data-lightbox-item], [data-lightbox] a[href]');
      if (!item) return;
      var group = item.closest('[data-lightbox]'); if (!group) return;
      e.preventDefault();
      var list = collect(group), i = 0;
      for (var k = 0; k < list.length; k++) { if (list[k].el === item) { i = k; break; } }
      open(list, i, item, group.id || null, 'push');     // push a history entry so Back closes the viewer
    });
    window.addEventListener('hashchange', function () {
      if (syncing) return;
      if (!fromHash(null) && lb && lb.classList.contains('open')) close(true);   // hash cleared (e.g. Back) → close
    });
    fromHash(null);                                        // cold load: open directly from a shared link
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

/* ---- shared storage helper: namespaced ("qz:"), scope-aware (local | session),
   try/catch-wrapped so private mode / disabled storage degrade silently to no-ops.
   One place to set the namespacing + sensitive-data policy; backs [data-persist]
   and [data-qz-dismiss]. (The older toggle behaviors keep their own bespoke keys.) ---- */
var QZstore = (function () {
  'use strict';
  var NS = 'qz:';
  function area(scope) { try { return scope === 'session' ? window.sessionStorage : window.localStorage; } catch (e) { return null; } }
  return {
    get: function (key, scope) { var a = area(scope); try { return a ? a.getItem(NS + key) : null; } catch (e) { return null; } },
    set: function (key, val, scope) { var a = area(scope); try { if (a) a.setItem(NS + key, val); } catch (e) {} },
    remove: function (key, scope) { var a = area(scope); try { if (a) a.removeItem(NS + key); } catch (e) {} },
  };
})();

/* ---- shared i18n: default UI strings for the JS behaviors, overridable by setting
   window.QZi18n (deep-merged) BEFORE this script loads — so non-English consumers can
   retheme validate / confirm / relative-time copy without forking the engine. Per-element
   data-* overrides (data-msg, data-qz-confirm-ok, …) still win over these global defaults.
   `{token}` placeholders are filled by QZi18n.fmt. ---- */
var QZi18n = (function () {
  'use strict';
  var defaults = {
    validate: {
      required: 'This field is required.', email: 'Enter a valid email address.', url: 'Enter a valid URL.',
      value: 'Enter a valid value.', minlength: 'Must be at least {min} characters.', maxlength: 'Must be at most {max} characters.',
      min: 'Must be {min} or more.', max: 'Must be {max} or less.', step: 'Enter a valid increment.',
      pattern: "Doesn't match the required format.", match: "Doesn't match.",
      fix: 'Please fix {n} field{s} below.', ok: 'Looks good — submitted.', generic: 'Please correct this field.'
    },
    confirm: { title: 'Are you sure?', ok: 'Confirm', cancel: 'Cancel' },
    time: {
      units: { year: 'year', month: 'month', week: 'week', day: 'day', hour: 'hour', minute: 'minute', second: 'second' },
      now: 'just now', ago: '{v} ago', in: 'in {v}', plural: 's'
    }
  };
  var user = (typeof window !== 'undefined' && window.QZi18n) || {};
  function merge(d, u) {
    var out = {}, k;
    for (k in d) out[k] = (d[k] && typeof d[k] === 'object' && !(d[k] instanceof Array)) ? merge(d[k], (u && u[k]) || {}) : ((u && k in u) ? u[k] : d[k]);
    for (k in u) if (!(k in out)) out[k] = u[k];
    return out;
  }
  var I = merge(defaults, user);
  I.fmt = function (s, vars) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return (vars && k in vars) ? vars[k] : m; }); };
  return I;
})();

/* ---- shared scroll-lock: ref-counted body scroll lock so stacked overlays (a confirm
   over a modal, a lightbox, …) can't clobber each other's restore. The original inline
   overflow + a scrollbar-gap padding are captured on the FIRST lock and restored on the
   LAST unlock; the gap is added on top of any existing body padding, not overwritten. ---- */
var QZscroll = (function () {
  'use strict';
  var depth = 0, prevOverflow = '', prevPad = '';
  return {
    lock: function () {
      if (depth === 0) {
        prevOverflow = document.body.style.overflow;
        prevPad = document.body.style.paddingRight;
        var sbw = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = 'hidden';
        if (sbw > 0) document.body.style.paddingRight = ((parseFloat(getComputedStyle(document.body).paddingRight) || 0) + sbw) + 'px';
      }
      depth++;
    },
    unlock: function () {
      if (depth === 0) return;
      if (--depth === 0) { document.body.style.overflow = prevOverflow; document.body.style.paddingRight = prevPad; }
    },
  };
})();

/* ---- shared helpers: a safe querySelector (a malformed author selector must not
   throw and abort a whole init pass) and a ready() that also fires when the script is
   injected AFTER load (SPA / dynamic import), not just on DOMContentLoaded. ---- */
function QZq(sel, root) { try { return sel ? (root || document).querySelector(sel) : null; } catch (e) { return null; } }
function QZready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }

/* ---- form autosave: [data-persist] snapshots its fields to storage on input and
   restores them on load, so a refresh / accidental nav doesn't lose typing. Opt-in
   per form; storage key is the attribute's value or the form id, scope is
   data-persist-scope ("local" default | "session"), optional data-persist-ttl="<ms>"
   expires the draft. SENSITIVE fields are never written — password & file inputs,
   [data-no-persist], or a name/id matching pass|card|cvv|cvc|ssn|secret|token|otp|pin —
   so PII/credentials don't land in storage. The blob is version-stamped so a schema
   change invalidates old drafts. Cleared on a real (non-prevented) submit. ---- */
(function () {
  'use strict';
  var VERSION = 1;
  // Match sensitive field NAMES on whole tokens (split on separators + camelCase), not
  // substrings — so "shipping" / "passenger" / "discard" aren't false-positived by
  // pin / pass / card and silently dropped from the snapshot. Unambiguous longer terms
  // are ALSO matched as substrings, so concatenated lowercase names ("creditcard",
  // "mypassword", "ssntaxid") can't slip a card number or password into storage.
  var SENSITIVE = { password: 1, passwd: 1, pass: 1, card: 1, cardnumber: 1, cardno: 1, ccnumber: 1, cc: 1, cvv: 1, cvc: 1, csc: 1, ssn: 1, sin: 1, secret: 1, token: 1, otp: 1, pin: 1, iban: 1, routing: 1 };
  var SENSITIVE_SUB = /password|passwd|passphrase|passcode|creditcard|debitcard|cardnumber|cardno|cvv|cvc|ssn|secret|iban|taxid/;
  function keyOf(el) { return el.name || el.id || ''; }
  function isSensitive(el) {
    var k = keyOf(el).toLowerCase();
    if (SENSITIVE_SUB.test(k)) return true;
    var tokens = keyOf(el).replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().split(/[^a-z0-9]+/);
    for (var i = 0; i < tokens.length; i++) if (SENSITIVE[tokens[i]]) return true;
    return false;
  }
  function persistable(form) {
    return Array.prototype.slice.call(form.querySelectorAll('input, textarea, select')).filter(function (el) {
      if (/^(password|file|submit|button|hidden|image|reset)$/.test(el.type)) return false;
      if (el.hasAttribute('data-no-persist')) return false;
      if (isSensitive(el)) return false;
      return !!keyOf(el);
    });
  }
  function setup(form) {
    var key = form.getAttribute('data-persist') || form.id;
    if (!key) return;
    var scope = form.getAttribute('data-persist-scope') === 'session' ? 'session' : 'local';
    var ttl = parseInt(form.getAttribute('data-persist-ttl'), 10);     // optional ms; NaN/0 = no expiry
    var storeKey = 'persist:' + key, fields = persistable(form);

    var raw = QZstore.get(storeKey, scope), blob = null;
    if (raw) { try { blob = JSON.parse(raw); } catch (e) {} }
    // version + TTL gate: drop a foreign-schema or expired draft rather than restoring it
    var fresh = blob && blob.v === VERSION && (!blob.exp || blob.exp > Date.now());
    if (blob && !fresh) QZstore.remove(storeKey, scope);
    var saved = fresh ? blob.d : null;
    if (saved) fields.forEach(function (el) {
      var k = keyOf(el); if (!(k in saved)) return;
      if (el.type === 'checkbox') el.checked = !!saved[k];
      else if (el.type === 'radio') el.checked = el.value === saved[k];
      else el.value = saved[k];
      el.dispatchEvent(new Event('input', { bubbles: true }));   // let dependent behaviors (char-count, validate) re-sync
    });

    function snapshot() {
      var data = {};
      fields.forEach(function (el) {
        var k = keyOf(el);
        if (el.type === 'checkbox') data[k] = el.checked;
        else if (el.type === 'radio') { if (el.checked) data[k] = el.value; }
        else data[k] = el.value;
      });
      var rec = { v: VERSION, d: data };
      if (ttl > 0) rec.exp = Date.now() + ttl;
      QZstore.set(storeKey, JSON.stringify(rec), scope);
    }
    form.addEventListener('input', snapshot);
    form.addEventListener('change', snapshot);
    // Defer the clear so a consumer's submit handler registered AFTER us (the common
    // AJAX case) can preventDefault first — otherwise we'd wipe the draft of a submit
    // that never actually navigated.
    form.addEventListener('submit', function (e) {
      setTimeout(function () { if (!e.defaultPrevented) QZstore.remove(storeKey, scope); }, 0);
    });
  }
  QZ.behavior('persist', '[data-persist]', setup);
})();

/* ---- textarea auto-grow: [data-autosize] resizes a <textarea> to fit its content
   (no inner scrollbar). A max-height in CSS still caps it (scroll returns past it).
   Re-measures on focus so a textarea hidden at load (closed tab/accordion) sizes
   correctly once shown. ---- */
(function () {
  'use strict';
  function fit(t) { var prev = t.style.height; t.style.height = 'auto'; var h = t.scrollHeight; t.style.height = h ? h + 'px' : prev; }  // h===0 → hidden; leave as-is
  function setup(t) {
    t.addEventListener('input', function () { fit(t); });
    t.addEventListener('focus', function () { fit(t); });
    fit(t);
  }
  QZ.behavior('autosize', 'textarea[data-autosize]', setup);
})();

/* ---- character counter: [data-char-count] on a maxlength'd control keeps a counter
   in sync ("n / max"). The counter is the element matching the attribute's selector
   (when set), else a .char-count / .counter in the same field, else one is created.
   Near the limit it gains .is-near and becomes aria-live polite — so the count is NOT
   announced on every keystroke, only as the limit approaches. ---- */
(function () {
  'use strict';
  function counterFor(el) {
    var t = QZq(el.getAttribute('data-char-count')); if (t) return t;
    var field = el.closest('.form-field, .field-row, .field') || el.parentElement;
    var c = field.querySelector('.char-count, .counter');
    if (!c) { c = document.createElement('span'); c.className = 'char-count'; field.appendChild(c); }
    return c;
  }
  function setup(el) {
    var max = parseInt(el.getAttribute('maxlength'), 10);
    if (!(max > 0)) return;
    var c = counterFor(el), near = Math.max(5, Math.round(max * 0.1));
    function upd() {
      var n = el.value.length, isNear = max - n <= near;
      c.textContent = n + ' / ' + max; c.classList.toggle('is-near', isNear);
      if (isNear) c.setAttribute('aria-live', 'polite'); else c.removeAttribute('aria-live');
    }
    el.addEventListener('input', upd); upd();
  }
  QZ.behavior('char-count', '[data-char-count]', setup);
})();

/* ---- submit lock: a form [data-submit-lock] disables its submit button and marks it
   .is-loading + aria-busy once a submit passes validation, so a slow round-trip can't
   be double-submitted. Gated on the form being valid (no .is-error painted by
   [data-validate], and native checkValidity). Unlock seams so a JS-handled submit that
   never navigates can't stay locked forever: a numeric value (data-submit-lock="1200")
   auto-unlocks after that many ms; the form also unlocks on a `qz:unlock` event it can
   dispatch, on the next edit to the form, and on a bfcache back-nav (pageshow). ---- */
(function () {
  'use strict';
  function setup(form) {
    var btn = form.querySelector('button[type=submit], input[type=submit], button:not([type])');
    if (!btn) return;
    function unlock() { btn.disabled = false; btn.classList.remove('is-loading'); btn.removeAttribute('aria-busy'); }
    form.addEventListener('submit', function () {
      if (form.querySelector('.is-error') || !form.checkValidity()) return;     // validation will block this submit
      btn.disabled = true; btn.classList.add('is-loading'); btn.setAttribute('aria-busy', 'true');
      var ms = parseInt(form.getAttribute('data-submit-lock'), 10);
      if (ms > 0) setTimeout(unlock, ms);
    });
    form.addEventListener('qz:unlock', unlock);                                  // explicit seam for JS handlers
    form.addEventListener('input', function () { if (btn.disabled) unlock(); }); // editing after a lock frees it
    window.addEventListener('pageshow', unlock);
  }
  QZ.behavior('submit-lock', '[data-submit-lock]', setup);
})();

/* ---- confirm-before-action: [data-qz-confirm="message"] intercepts a click on a
   link/button and asks for confirmation in an accessible body-level dialog
   (role=alertdialog, focus trap, Esc / Cancel / backdrop dismiss, focus restore)
   instead of the blocking native confirm(). On Confirm the original element is
   re-activated — a submit button via form.requestSubmit() to preserve submitter /
   formaction semantics, anything else by replaying its click. data-qz-confirm-ok /
   data-qz-confirm-cancel relabel the buttons, data-qz-confirm-danger tints the confirm
   button destructive. (Namespaced data-qz-* to avoid colliding with Rails UJS's
   data-confirm.) ---- */
(function () {
  'use strict';
  var dlg, msgEl, okB, cancelB, pending = null, lastFocus = null;
  function build() {
    dlg = document.createElement('div'); dlg.className = 'qz-confirm'; dlg.hidden = true;
    dlg.innerHTML =
      '<div class="qz-confirm-box" role="alertdialog" aria-modal="true" aria-labelledby="qz-confirm-msg">' +
      '<p class="qz-confirm-msg" id="qz-confirm-msg"></p>' +
      '<div class="qz-confirm-actions">' +
      '<button type="button" class="qz-confirm-cancel"></button>' +
      '<button type="button" class="qz-confirm-ok"></button>' +
      '</div></div>';
    document.body.appendChild(dlg);
    msgEl = dlg.querySelector('.qz-confirm-msg');
    okB = dlg.querySelector('.qz-confirm-ok'); cancelB = dlg.querySelector('.qz-confirm-cancel');
    okB.addEventListener('click', accept);
    cancelB.addEventListener('click', dismiss);
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dismiss(); });
  }
  function open(trig) {
    if (!dlg) build();
    pending = trig; lastFocus = document.activeElement;
    msgEl.textContent = trig.getAttribute('data-qz-confirm') || QZi18n.confirm.title;
    okB.textContent = trig.getAttribute('data-qz-confirm-ok') || QZi18n.confirm.ok;
    cancelB.textContent = trig.getAttribute('data-qz-confirm-cancel') || QZi18n.confirm.cancel;
    okB.classList.toggle('danger', trig.hasAttribute('data-qz-confirm-danger'));
    dlg.hidden = false; dlg.classList.add('is-open');
    QZscroll.lock();
    cancelB.focus();                                   // default focus on the safe choice
  }
  function teardown() {
    dlg.classList.remove('is-open'); dlg.hidden = true; QZscroll.unlock();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function dismiss() { if (!pending) return; pending = null; teardown(); }
  function accept() {
    var trig = pending; pending = null; teardown();
    if (!trig) return;
    var isSubmit = (trig.tagName === 'BUTTON' && trig.type !== 'button' && trig.type !== 'reset') || (trig.tagName === 'INPUT' && trig.type === 'submit');
    if (isSubmit && trig.form && trig.form.requestSubmit) {           // preserve submitter + formaction
      try { trig.form.requestSubmit(trig); return; } catch (e) {}
    }
    trig.dataset.qzConfirmed = '1'; trig.click(); delete trig.dataset.qzConfirmed;   // let the re-activation through
  }
  document.addEventListener('click', function (e) {
    var trig = e.target.closest('[data-qz-confirm]');
    if (!trig || trig.dataset.qzConfirmed) return;
    e.preventDefault(); e.stopPropagation();
    open(trig);
  }, true);                                            // capture: beat the element's own handlers until confirmed
  document.addEventListener('keydown', function (e) {
    if (!pending) return;
    if (e.key === 'Escape') { dismiss(); return; }
    if (e.key === 'Tab') {
      var first = cancelB, last = okB;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
})();

/* ---- read-more: [data-clamp="3"] clamps its content to N lines, adding an
   accessible toggle (aria-expanded) to expand/collapse. The toggle is omitted when the
   content already fits — measured after web fonts settle, and re-measured the first
   time the element becomes visible (so a clamp inside a hidden tab/accordion is sized
   correctly). data-clamp-more / data-clamp-less relabel it. ---- */
(function () {
  'use strict';
  function setup(el) {
    var lines = parseInt(el.getAttribute('data-clamp'), 10) || 3;
    el.style.setProperty('--clamp-lines', lines);
    el.classList.add('is-clamped');
    var more = el.getAttribute('data-clamp-more') || 'Read more', less = el.getAttribute('data-clamp-less') || 'Show less';
    function measure() {
      if (!el.clientHeight) return;                                              // hidden — decide once visible
      if (el.scrollHeight <= el.clientHeight + 1) { el.classList.remove('is-clamped'); return; }  // fits → no toggle
      if (el.nextElementSibling && el.nextElementSibling.classList.contains('clamp-toggle')) return;  // already wired
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'clamp-toggle'; btn.textContent = more; btn.setAttribute('aria-expanded', 'false');
      el.insertAdjacentElement('afterend', btn);
      btn.addEventListener('click', function () {
        var expanded = el.classList.toggle('is-clamped') === false;
        btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        btn.textContent = expanded ? less : more;
      });
    }
    measure();
    if (document.fonts && document.fonts.ready && document.fonts.ready.then) document.fonts.ready.then(measure);
    if ('IntersectionObserver' in window && !el.clientHeight) {
      var io = new IntersectionObserver(function (ents) { ents.forEach(function (en) { if (en.isIntersecting) { measure(); io.disconnect(); } }); });
      io.observe(el);
    }
  }
  QZ.behavior('clamp', '[data-clamp]', setup);
})();

/* ---- dismissible: a [data-qz-dismiss] control hides its target — the selector in the
   attribute, else its closest .alert / .banner / [data-dismissible]. When that target
   has an id (or data-qz-dismiss-key) the dismissal is remembered in storage (scope via
   data-qz-dismiss-scope) so it stays gone on reload. (Namespaced data-qz-* to avoid
   colliding with Bootstrap's data-dismiss.) ---- */
(function () {
  'use strict';
  function targetOf(btn) {
    return QZq(btn.getAttribute('data-qz-dismiss')) || btn.closest('.alert, .banner, [data-dismissible]') || btn.parentElement;
  }
  QZ.behavior('dismiss', '[data-qz-dismiss]', function (btn) {
    var el = targetOf(btn);
    var key = btn.getAttribute('data-qz-dismiss-key') || (el && el.id) || '';
    var scope = btn.getAttribute('data-qz-dismiss-scope') === 'session' ? 'session' : 'local';
    if (el && key && QZstore.get('dismiss:' + key, scope)) { el.hidden = true; return; }
    btn.addEventListener('click', function () {
      if (!el) return;
      el.hidden = true;
      if (key) QZstore.set('dismiss:' + key, '1', scope);
    });
  });
})();

/* ---- relative time: [data-relative-time] renders "3h ago" / "in 2 days" from its
   datetime (the datetime attribute on a <time>, else the attribute's value), refreshing
   once a minute. Uses Intl.RelativeTimeFormat (true localization, no morphology hacks)
   when available, falling back to the QZi18n.time strings on older engines; locale via
   QZi18n.locale. Skips detached nodes on each tick; absolute time kept as title. ---- */
(function () {
  'use strict';
  var DIV = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60], ['second', 1]];
  var RTF = (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat)
    ? new Intl.RelativeTimeFormat(QZi18n.locale || undefined, { numeric: 'always' }) : null;
  function phrase(then) {
    var diff = (then - Date.now()) / 1000, abs = Math.abs(diff);
    if (abs < 45) return QZi18n.time.now;
    for (var i = 0; i < DIV.length; i++) {
      if (abs >= DIV[i][1] || DIV[i][0] === 'second') {
        if (RTF) return RTF.format(Math.round(diff / DIV[i][1]), DIV[i][0]);
        var T = QZi18n.time, n = Math.round(abs / DIV[i][1]), label = n + ' ' + T.units[DIV[i][0]] + (n !== 1 ? T.plural : '');
        return QZi18n.fmt(diff < 0 ? T.ago : T.in, { v: label });
      }
    }
  }
  function setup(el) {
    var then = Date.parse(el.getAttribute('datetime') || el.getAttribute('data-relative-time'));
    if (isNaN(then)) return null;
    if (!el.title) el.title = new Date(then).toLocaleString();
    return function () { el.textContent = phrase(then); };
  }
  var pairs = [], timer = null;
  function tick() {
    pairs = pairs.filter(function (p) { return p.el.isConnected; });   // drop detached nodes for good
    if (!pairs.length) { clearInterval(timer); timer = null; return; } // idle: stop; the next bind restarts it
    pairs.forEach(function (p) { p.f(); });
  }
  QZ.behavior('relative-time', '[data-relative-time]', function (el) {
    var f = setup(el); if (!f) return;
    f(); pairs.push({ el: el, f: f });
    if (!timer) timer = setInterval(tick, 60000);
  });
})();

/* ---- public namespace + boot --------------------------------------------------
   window.QZ is the supported surface for framework integration:
     QZ.init(root?)  re-scan a subtree (or the whole document) and bind behaviors
                     to any matching element that isn't bound yet — call it after
                     rendering new markup (React effect, Ember didInsert, HTMX swap).
     QZ.store / QZ.i18n / QZ.scroll / QZ.q / QZ.ready / QZ.cal
                     aliases of the shared helpers (QZstore, QZi18n, …), which stay
                     available under their historical names too. ---- */
QZ.cal = QZcal; QZ.store = QZstore; QZ.i18n = QZi18n; QZ.scroll = QZscroll; QZ.q = QZq; QZ.ready = QZready;
window.QZ = QZ;
QZready(function () { QZ.init(); });
