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

  document.addEventListener('DOMContentLoaded', function () {
    // prep confidence bars to animate from 0 → target
    document.querySelectorAll('.conf .bar i').forEach(function (b) {
      b.dataset.w = b.style.width || '0%';
      if (!RM) b.style.width = '0';
    });

    if (io) {
      document.querySelectorAll('[data-count], .row, .gap-row').forEach(function (el) { io.observe(el); });
    } else {
      // no IO: just show final state
      document.querySelectorAll('.conf .bar i').forEach(function (b) { b.style.width = b.dataset.w; });
      document.querySelectorAll('[data-count]').forEach(countUp);
    }

    // expandable track rows (ignore clicks on inner links/buttons)

    // copy-to-clipboard with feedback (preserves icon buttons)
    document.querySelectorAll('[data-copy]').forEach(function (btn) {
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

  });
})();

/* ---- searchable select (combobox) + paste-from-clipboard ---- */
(function () {
  'use strict';

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
      pop.hidden = false; btn.setAttribute('aria-expanded', 'true'); active = -1;
      if (search) { search.value = ''; filter(''); search.focus(); }
    }
    function close() { pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
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
    document.addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
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

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-combo]').forEach(setupCombo);
    document.querySelectorAll('[data-paste]').forEach(setupPaste);
  });
})();

/* ---- audio player · date picker · dual range · wizard · toast-undo ---- */
(function () {
  'use strict';
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setupPicker(pk){
    var inp=pk.querySelector('input'),cal=pk.querySelector('.cal');
    var Y=2026,M=5,selY=2026,selM=5,selD=9; // M 0-based (June)
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
        e.addEventListener('click',function(){selY=Y;selM=M;selD=d;inp.value=Y+'-'+QZcal.pad(M+1)+'-'+QZcal.pad(d);cal.hidden=true;});
        g.appendChild(e);});
      cal.appendChild(g);
      h.querySelectorAll('[data-m]').forEach(function(b){b.addEventListener('click',function(){var r=QZcal.roll(Y,M+(+b.dataset.m));Y=r.y;M=r.m;days();});});
      h.querySelectorAll('[data-y]').forEach(function(b){b.addEventListener('click',function(){Y+=+b.dataset.y;days();});});
      h.querySelector('.cal-title').addEventListener('click',monthsView);
    }
    function monthsView(){
      cal.innerHTML='';
      var h=document.createElement('div');h.className='cal-h';
      h.innerHTML='<button type="button" data-y="-1" title="Previous year">«</button><button type="button" class="cal-title">'+Y+'</button><button type="button" data-y="1" title="Next year">»</button>';
      cal.appendChild(h);
      var grid=document.createElement('div');grid.className='cal-grid months';
      QZcal.MONTHS.forEach(function(mn,mi){var e=document.createElement('div');e.className='mcell';e.textContent=mn.slice(0,3);
        if(mi===M)e.classList.add('sel');e.addEventListener('click',function(){M=mi;days();});grid.appendChild(e);});
      cal.appendChild(grid);
      h.querySelectorAll('[data-y]').forEach(function(b){b.addEventListener('click',function(){Y+=+b.dataset.y;monthsView();});});
    }
    function open(){cal.hidden=false;days();}
    inp.addEventListener('focus',open);
    inp.addEventListener('click',open);
    pk.addEventListener('click',function(e){e.stopPropagation();});
    document.addEventListener('click',function(){cal.hidden=true;});
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

  document.addEventListener('DOMContentLoaded',function(){
    document.querySelectorAll('[data-picker]').forEach(setupPicker);
    document.querySelectorAll('[data-dual]').forEach(setupDual);
    document.querySelectorAll('[data-wizard]').forEach(setupWizard);
    document.querySelectorAll('.toast .undo button').forEach(function(b){
      b.addEventListener('click',function(){var t=b.closest('.toast');if(t)t.style.opacity=t.style.opacity==='0.4'?'1':'0.4';});
    });
  });
})();

/* ---- tabs (switch panels) ---- */
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('[data-tabs]').forEach(function (group) {
    var tabs = Array.prototype.slice.call(group.querySelectorAll('.tab'));
    var panels = group.querySelectorAll('.tabpanel');
    var bar = tabs[0] && tabs[0].parentElement; if (bar) bar.setAttribute('role', 'tablist');
    function select(i) {
      tabs.forEach(function (x, j) { x.classList.toggle('active', j === i); x.setAttribute('aria-selected', j === i ? 'true' : 'false'); x.tabIndex = j === i ? 0 : -1; });
      panels.forEach(function (p, j) { p.hidden = j !== i; });
    }
    tabs.forEach(function (t, i) {
      t.setAttribute('role', 'tab'); t.tabIndex = t.classList.contains('active') ? 0 : -1;
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
});

/* ---- inline calendar (standalone, month nav) ---- */
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('[data-calendar]').forEach(function (cal) {
    var Y=2026,M=5,selD=9;
    function render(){
      cal.innerHTML='';
      var grid=QZcal.monthGrid(Y,M);
      var h=document.createElement('div');h.className='cal-h';
      h.innerHTML='<button type="button" data-d="-1" title="Previous month">‹</button><span class="cal-title">'+grid.name+' '+Y+'</span><button type="button" data-d="1" title="Next month">›</button>';
      cal.appendChild(h);
      var g=document.createElement('div');g.className='cal-grid';
      QZcal.DOW.forEach(function(d){var e=document.createElement('div');e.className='dow';e.textContent=d;g.appendChild(e);});
      var i;for(i=0;i<grid.blanks;i++)g.appendChild(document.createElement('div'));
      grid.days.forEach(function(d){var e=document.createElement('div');e.className='day';e.textContent=d;if(d===selD)e.classList.add('sel');
        e.addEventListener('click',function(){selD=d;render();});g.appendChild(e);});
      cal.appendChild(g);
      h.querySelectorAll('[data-d]').forEach(function(b){b.addEventListener('click',function(){var r=QZcal.roll(Y,M+(+b.dataset.d));Y=r.y;M=r.m;render();});});
    }
    render();
  });
});

/* ---- context menu (right-click) + data table sort/select ---- */
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('[data-ctx]').forEach(function (zone) {
    var menu = document.querySelector(zone.dataset.ctx); if (!menu) return;
    zone.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      menu.style.display = 'block';
      menu.style.left = Math.min(e.clientX, window.innerWidth - 230) + 'px';
      menu.style.top = e.clientY + 'px';
    });
    document.addEventListener('click', function () { menu.style.display = 'none'; });
    menu.addEventListener('click', function (e) { e.stopPropagation(); menu.style.display = 'none'; });
  });
  // Horizontally-scrollable table wrappers must be keyboard-reachable so the
  // content can be scrolled without a pointer (WCAG 2.1.1). For any .tbl-wrap
  // whose content overflows, expose it as a focusable, labelled region.
  document.querySelectorAll('.tbl-wrap').forEach(function (wrap) {
    if (wrap.scrollWidth > wrap.clientWidth) {
      if (!wrap.hasAttribute('tabindex')) wrap.setAttribute('tabindex', '0');
      if (!wrap.hasAttribute('role')) wrap.setAttribute('role', 'region');
      if (!wrap.hasAttribute('aria-label')) wrap.setAttribute('aria-label', 'Table, scrollable');
    }
  });
  document.querySelectorAll('[data-table-sort] th.sortable').forEach(function (th) {
    th.addEventListener('click', function () {
      var asc = th.classList.contains('asc');
      th.parentNode.querySelectorAll('th').forEach(function (x) { x.classList.remove('asc', 'desc'); });
      th.classList.add(asc ? 'desc' : 'asc');
    });
  });
  document.querySelectorAll('[data-select-all]').forEach(function (cb) {
    cb.addEventListener('change', function () {
      // the controlled table: the one this checkbox lives in, or — when it sits
      // in a toolbar/header beside the table — the nearest ancestor that has one
      var table = cb.closest('table');
      if (!table) { var p = cb.parentElement; while (p && !(table = p.querySelector('table'))) p = p.parentElement; }
      if (!table) return;
      table.querySelectorAll('tbody input[type=checkbox]').forEach(function (x) {
        x.checked = cb.checked; x.closest('tr').classList.toggle('selected', cb.checked);
      });
    });
  });
});

/* ---- toggle group · rating · live toast ---- */
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.toggle-group button').forEach(function (b) {
    b.addEventListener('click', function () { b.classList.toggle('on'); });
  });
  document.querySelectorAll('.rating:not(.ro)').forEach(function (r) {
    var stars = r.querySelectorAll('i'), val = r.parentNode.querySelector('.rating-val');
    stars.forEach(function (s, i) {
      s.addEventListener('click', function () {
        stars.forEach(function (x, j) { x.classList.toggle('on', j <= i); });
        if (val) val.textContent = (i + 1) + '/5';
      });
      s.addEventListener('mouseenter', function () { stars.forEach(function (x, j) { x.style.color = j <= i ? 'var(--warning)' : ''; }); });
    });
    r.addEventListener('mouseleave', function () { stars.forEach(function (x) { x.style.color = ''; }); });
  });
  var hosts = {};
  function hostFor(pos) {                               // pos: tr (default) | tl | bl | br
    var key = pos || 'tr';
    if (hosts[key]) return hosts[key];
    var h = document.createElement('div');
    h.className = 'toast-host' + (key !== 'tr' ? ' ' + key : '');
    document.body.appendChild(h); hosts[key] = h; return h;
  }
  document.querySelectorAll('[data-toast]').forEach(function (btn) {
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
});

/* ---- shared: drag-reorder · color picker · amount format ---- */
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('[data-reorder]').forEach(function (list) {
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
        var items = Array.prototype.slice.call(list.children);
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
  document.querySelectorAll('[data-colorpicker]').forEach(function (cp) {
    cp.querySelectorAll('.sw').forEach(function (sw) {
      sw.style.color = sw.dataset.c; sw.style.background = sw.dataset.c;
      sw.addEventListener('click', function () { cp.querySelectorAll('.sw').forEach(function (x) { x.classList.remove('on'); }); sw.classList.add('on'); });
    });
  });
  document.querySelectorAll('.amount-field input').forEach(function (inp) {
    inp.addEventListener('blur', function () {
      var n = parseFloat(inp.value.replace(/[, ]/g, ''));
      if (isNaN(n)) return;
      inp.value = n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
      var f = inp.closest('.amount-field'); f.classList.toggle('pos', n > 0); f.classList.toggle('neg', n < 0);
    });
  });
});

/* ---- admin: split-pane · bulk bar · faceted filters · date range ---- */
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('[data-split]').forEach(function (sp) {
    var items = sp.querySelectorAll('.split-item'), panes = sp.querySelectorAll('.sd-pane');
    items.forEach(function (it) {
      it.addEventListener('click', function () {
        items.forEach(function (x) { x.classList.remove('active'); }); it.classList.add('active');
        panes.forEach(function (p) { p.hidden = p.dataset.room !== it.dataset.room; });
      });
    });
  });

  document.querySelectorAll('[data-bulk]').forEach(function (t) {
    var bar = document.querySelector('[data-bulkbar]');
    function upd() {
      var n = t.querySelectorAll('tbody input[type=checkbox]:checked').length;
      if (bar) { bar.hidden = n === 0; var c = bar.querySelector('.bcount'); if (c) c.textContent = n; }
    }
    t.addEventListener('change', upd);
    var sa = t.querySelector('[data-select-all]'); if (sa) sa.addEventListener('change', function () { setTimeout(upd, 0); });
    upd();
  });

  document.querySelectorAll('[data-fchip]').forEach(function (b) { b.addEventListener('click', function () { var c = b.closest('.fchip'); if (c) c.remove(); }); });
  document.querySelectorAll('[data-fclear]').forEach(function (b) {
    b.addEventListener('click', function () { var f = b.closest('.facets'); if (f) f.querySelectorAll('.fchip').forEach(function (c) { c.remove(); }); });
  });

  document.querySelectorAll('[data-daterange]').forEach(function (dr) {
    var cals = dr.querySelector('.dr-cals'), summary = dr.querySelector('.daterange-summary');
    var Y = 2026, M = 5, start = null, end = null;
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
      h.querySelectorAll('[data-nav]').forEach(function(b){b.addEventListener('click',function(){var r=QZcal.roll(Y,M+(+b.dataset.nav));Y=r.y;M=r.m;render();});});
      cals.appendChild(box);
    }
    function render(){
      cals.innerHTML='';
      [0,1].forEach(function(off){var r=QZcal.roll(Y,M+off);buildMonth(r.y,r.m);});
      summary.textContent = start&&end ? fmt(start)+'  →  '+fmt(end) : start ? fmt(start)+'  →  …' : 'Select a start and end date';
    }
    render();
  });
});

/* ---- heatmap fill ---- */
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('[data-heatmap]').forEach(function (hm) {
    var cols = parseInt(hm.dataset.cols || '14', 10), rows = parseInt(hm.dataset.rows || '5', 10);
    hm.style.setProperty('--cols', cols);
    for (var i = 0; i < cols * rows; i++) {
      var cell = document.createElement('i');
      var v = (Math.sin(i * 0.7) + Math.sin(i * 0.23) + 2) / 4;   // 0..1 deterministic-ish
      v = Math.max(0, Math.min(1, v * (0.5 + Math.random() * 0.7)));
      cell.style.background = v < 0.08 ? 'var(--surface-2)' : 'rgb(var(--primary-rgb) / ' + (0.15 + v * 0.75).toFixed(2) + ')';
      hm.appendChild(cell);
    }
  });
});

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
  function init() {
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
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
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
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
  function init() {
    document.querySelectorAll('[data-dir-toggle]').forEach(function (btn) {
      sync(btn);
      btn.addEventListener('click', function () {
        var next = root.getAttribute('dir') === 'rtl' ? 'ltr' : 'rtl';
        root.setAttribute('dir', next);
        try { localStorage.setItem(KEY, next); } catch (e) {}
        document.querySelectorAll('[data-dir-toggle]').forEach(sync);
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
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
  document.querySelectorAll('[data-pw-strength]').forEach(function (inp) {
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
  document.querySelectorAll('[data-otp]').forEach(function (box) {
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
  function init() {
    document.querySelectorAll('[data-density-toggle]').forEach(function (btn) {
      sync(btn);
      btn.addEventListener('click', function () {
        root.setAttribute('data-density', compact() ? 'comfortable' : 'compact');
        try { localStorage.setItem(KEY, compact() ? 'compact' : 'comfortable'); } catch (e) {}
        document.querySelectorAll('[data-density-toggle]').forEach(sync);
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
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
    var sbw = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (sbw > 0) document.body.style.paddingRight = sbw + 'px';
    openEl = scrim;
    var f = focusables(scrim);
    (f[0] || scrim).focus();
  }
  function close() {
    if (!openEl) return;
    openEl.classList.remove('is-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
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
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
})();

/* ---- popover / popconfirm: [data-popover] toggles a .popover (sibling, or the
   selector in the attribute); outside-click / Esc / [data-popover-close] close ---- */
(function () {
  'use strict';
  var open = null;
  function close() { if (open) { open.classList.remove('is-open'); open = null; } }
  document.addEventListener('click', function (e) {
    var trig = e.target.closest('[data-popover]');
    if (trig) {
      e.preventDefault(); e.stopPropagation();
      var sel = trig.getAttribute('data-popover');
      var pop = sel ? document.querySelector(sel) : (trig.closest('.popover-wrap') || trig.parentElement).querySelector('.popover');
      if (!pop) return;
      if (pop === open) { close(); return; }
      close(); pop.classList.add('is-open'); open = pop;
      var f = pop.querySelector('button,a[href],input,select,textarea'); if (f) f.focus();
      return;
    }
    if (e.target.closest('[data-popover-close]')) { close(); return; }
    if (open && !e.target.closest('.popover')) close();   // click outside the panel
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
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
    var sbw = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden'; if (sbw > 0) document.body.style.paddingRight = sbw + 'px';
    var inp = s.querySelector('.cmdk-search input'); if (inp) { inp.value = ''; filter(s, ''); inp.focus(); }
  }
  function close() {
    if (!scrim) return;
    scrim.classList.remove('is-open'); document.body.style.overflow = ''; document.body.style.paddingRight = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus(); scrim = null;
  }
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); scrim ? close() : open(); return; }
    if (!scrim) return;
    if (e.key === 'Escape') { close(); return; }
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
    tree.setAttribute('role', 'tree');
    rows(tree).forEach(function (r, i) {
      r.tabIndex = i === 0 ? 0 : -1;
      r.addEventListener('click', function () {
        rows(tree).forEach(function (x) { x.classList.remove('sel'); x.tabIndex = -1; });
        r.classList.add('sel'); r.tabIndex = 0;
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
  document.addEventListener('DOMContentLoaded', function () { document.querySelectorAll('[data-tree]').forEach(setup); });
})();

/* ---- form validation: [data-validate] — required / email / minlength / data-match ---- */
(function () {
  'use strict';
  function fieldOf(inp) { return inp.closest('.field-row, .field') || inp.parentElement; }
  function setError(inp, msg) {
    inp.classList.add('is-error'); inp.setAttribute('aria-invalid', 'true');
    var f = fieldOf(inp), err = f.querySelector('.ferr');
    if (!err) { err = document.createElement('span'); err.className = 'ferr'; f.appendChild(err); }
    err.textContent = msg; err.style.display = '';
  }
  function clearError(inp) {
    inp.classList.remove('is-error'); inp.removeAttribute('aria-invalid');
    var err = fieldOf(inp).querySelector('.ferr'); if (err && err.dataset.auto !== '0') err.style.display = 'none';
  }
  function validateField(inp) {
    var v = (inp.value || '').trim();
    if (inp.hasAttribute('required') && !v) return 'This field is required.';
    if (v && inp.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return 'Enter a valid email.';
    var min = inp.getAttribute('minlength'); if (v && min && v.length < +min) return 'Must be at least ' + min + ' characters.';
    var match = inp.getAttribute('data-match'); if (match) { var other = document.querySelector(match); if (other && v !== other.value) return "Doesn't match."; }
    return null;
  }
  function setup(form) {
    var fields = Array.prototype.slice.call(form.querySelectorAll('input, textarea, select')).filter(function (i) { return i.type !== 'submit' && i.type !== 'button'; });
    form.setAttribute('novalidate', '');
    fields.forEach(function (inp) { inp.addEventListener('input', function () { clearError(inp); }); });
    form.addEventListener('submit', function (e) {
      var bad = 0, first = null;
      fields.forEach(function (inp) { var m = validateField(inp); if (m) { bad++; setError(inp, m); if (!first) first = inp; } else clearError(inp); });
      var msg = form.querySelector('.form-msg');
      if (bad) {
        e.preventDefault();
        if (!msg) { msg = document.createElement('div'); msg.className = 'form-msg'; form.insertBefore(msg, form.firstChild); }
        msg.className = 'form-msg error'; msg.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Please fix ' + bad + ' field' + (bad > 1 ? 's' : '') + ' below.';
        if (first) first.focus();
      } else {
        e.preventDefault();   // demo: don't actually navigate
        if (!msg) { msg = document.createElement('div'); form.insertBefore(msg, form.firstChild); }
        msg.className = 'form-msg ok'; msg.innerHTML = '<i class="fa-solid fa-check"></i> Looks good — submitted.';
      }
    });
  }
  document.addEventListener('DOMContentLoaded', function () { document.querySelectorAll('[data-validate]').forEach(setup); });
})();

/* ---- table: expandable rows [data-row-toggle] · global filter [data-table-filter="#id"] ---- */
(function () {
  'use strict';
  document.addEventListener('click', function (e) {
    var t = e.target.closest('.row-toggle'); if (!t) return;
    var tr = t.closest('tr'), detail = tr.nextElementSibling;
    if (detail && detail.classList.contains('row-detail')) { var open = tr.classList.toggle('is-open'); detail.hidden = !open; t.setAttribute('aria-expanded', open ? 'true' : 'false'); }
  });
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-table-filter]').forEach(function (inp) {
      var table = document.querySelector(inp.getAttribute('data-table-filter')); if (!table) return;
      inp.addEventListener('input', function () {
        var q = inp.value.trim().toLowerCase();
        table.querySelectorAll('tbody tr:not(.row-detail)').forEach(function (tr) {
          var hit = tr.textContent.toLowerCase().indexOf(q) > -1; tr.hidden = q && !hit;
          var d = tr.nextElementSibling; if (d && d.classList.contains('row-detail')) d.hidden = true, tr.classList.remove('is-open');
        });
      });
    });
  });
})();

/* ---- resizable split: a .resizer between panes drags the previous pane's width ---- */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.split .resizer').forEach(function (rz) {
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
  });
})();

/* ---- TOC scrollspy: [data-toc] links highlight the section in view ---- */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-toc]').forEach(function (toc) {
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
  });
})();

/* ---- commerce: quantity stepper [data-stepper] — clamps min/max/step, disables
   at bounds, fires native change event. Buttons carry aria-label; the <input> is
   the source of truth. ---- */
(function () {
  'use strict';
  function setupStepper(root) {
    var inp = root.querySelector('input[type=number]');
    if (!inp) return;
    var dec = root.querySelector('[data-dec]');
    var inc = root.querySelector('[data-inc]');
    var min = parseFloat(inp.min) || 1;
    var max = parseFloat(inp.max) || 999;
    var step = parseFloat(inp.step) || 1;
    function upd() {
      var v = Math.max(min, Math.min(max, parseFloat(inp.value) || min));
      inp.value = v;
      if (dec) dec.disabled = v <= min;
      if (inc) inc.disabled = v >= max;
    }
    if (dec) dec.addEventListener('click', function () { inp.value = Math.max(min, (parseFloat(inp.value) || min) - step); upd(); inp.dispatchEvent(new Event('change', { bubbles: true })); });
    if (inc) inc.addEventListener('click', function () { inp.value = Math.min(max, (parseFloat(inp.value) || min) + step); upd(); inp.dispatchEvent(new Event('change', { bubbles: true })); });
    inp.addEventListener('change', upd);
    inp.addEventListener('blur', upd);
    upd();
  }
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-stepper]').forEach(setupStepper);
  });
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
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-variant]').forEach(setupVariant);
  });
})();

/* ---- off-canvas admin sidebar: [data-sidebar-toggle] flips .nav-open on the
   target .adminframe; backdrop-click, nav-item-click and Esc close it ---- */
(function () {
  'use strict';
  function frameFor(btn) {
    var sel = btn.getAttribute('data-sidebar-toggle');
    return (sel && document.querySelector(sel)) || btn.closest('.adminframe') || document.querySelector('.adminframe');
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-sidebar-toggle]');
    if (btn) { var f = frameFor(btn); if (f) f.classList.toggle('nav-open'); return; }
    var open = document.querySelector('.adminframe.nav-open');
    if (!open) return;
    // a tap on the scrim (the .adminframe itself, outside the sidebar) or on a nav item closes
    if (!e.target.closest('.sidebar') || e.target.closest('.side-item')) open.classList.remove('nav-open');
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var open = document.querySelector('.adminframe.nav-open');
    if (open) open.classList.remove('nav-open');
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
    document.body.style.overflow = 'hidden';
    syncToggles(true);
    var f = focusables(drawer);
    (f[0] || drawer).focus();
  }
  function close() {
    if (!drawer) drawer = document.querySelector('.nav-drawer');
    if (!overlay) overlay = document.querySelector('.nav-drawer-overlay');
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
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

  function init() {
    document.querySelectorAll('[data-wave]').forEach(renderWave);
    document.querySelectorAll('input[data-vol]').forEach(function (r) {
      syncVol(r);
      r.addEventListener('input', function () { syncVol(r); });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
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
  function init() { document.querySelectorAll('[data-billing-cycle]').forEach(setup); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
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

  function show(trg) {
    clearTimeout(hideT);
    if (cur && cur !== trg) cur.removeAttribute('aria-describedby');
    cur = trg;
    var c = fill(trg);
    if (!c.ok) { hide(); return; }
    place(trg.getBoundingClientRect(), c.pos);
    tip.setAttribute('role', 'tooltip');
    tip.classList.add('show');
    trg.setAttribute('aria-describedby', 'qz-tip');
  }
  function hide() { tip.classList.remove('show'); tip.removeAttribute('role'); if (cur) cur.removeAttribute('aria-describedby'); cur = null; }
  function scheduleHide() { clearTimeout(hideT); hideT = setTimeout(function () { if (!overTip) hide(); }, HIDE_DELAY); }

  function init() {
    document.documentElement.classList.add('qz-tip-js');
    buildTip();
    document.addEventListener('pointerover', function (e) { var t = triggerOf(e.target); if (t && t !== cur) show(t); });
    document.addEventListener('pointerout', function (e) { var t = triggerOf(e.target); if (t && t === cur && triggerOf(e.relatedTarget) !== t) scheduleHide(); });
    document.addEventListener('focusin', function (e) { var t = triggerOf(e.target); if (t) show(t); });
    document.addEventListener('focusout', function (e) { if (triggerOf(e.target) === cur) scheduleHide(); });
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
  var VIDEO = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;

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
  function go(d) { idx = (idx + d + items.length) % items.length; render(); }

  function open(list, i, trigger) {
    items = list; idx = i; opener = trigger || null;
    if (!lb) build();
    render(); lb.classList.add('open');
    document.documentElement.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    lb.querySelector('.lb-close').focus();
  }
  function close() {
    if (!lb) return;
    lb.classList.remove('open'); stage.textContent = '';
    document.documentElement.style.overflow = '';
    document.removeEventListener('keydown', onKey);
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
  function init() {
    document.addEventListener('click', function (e) {
      var item = e.target.closest('[data-lightbox] [data-lightbox-item], [data-lightbox] a[href]');
      if (!item) return;
      var group = item.closest('[data-lightbox]'); if (!group) return;
      e.preventDefault();
      var list = collect(group), i = 0;
      for (var k = 0; k < list.length; k++) { if (list[k].el === item) { i = k; break; } }
      open(list, i, item);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
