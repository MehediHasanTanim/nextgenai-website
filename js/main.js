(function () {
  'use strict';

  // Where the contact form sends mail.
  var CONTACT_EMAIL = 'nextgenai1983@gmail.com';

  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  // Theme toggle (persisted when storage is available)
  $('#theme').addEventListener('click', function () {
    var dark = root.dataset.theme
      ? root.dataset.theme === 'dark'
      : !matchMedia('(prefers-color-scheme: light)').matches;
    var next = dark ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('nga-theme', next); } catch (e) {}
  });

  // Mobile menu
  var burger = $('#burger');
  var menu = $('#menu');
  function setMenu(open) {
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
  }
  burger.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });

  // Portfolio dropdown: hover/focus works in CSS; the chevron button toggles it for touch + keyboard
  var dd = $('.dd');
  var ddBtn = $('.dd__btn');
  function setDd(open) {
    dd.classList.toggle('open', open);
    ddBtn.setAttribute('aria-expanded', String(open));
  }
  ddBtn.addEventListener('click', function (e) { e.stopPropagation(); setDd(!dd.classList.contains('open')); });
  document.addEventListener('click', function (e) { if (!dd.contains(e.target)) setDd(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && dd.classList.contains('open')) { setDd(false); ddBtn.focus(); }
  });

  // Showcase pause / play (home page) — moving content needs a stop control
  var sc = $('#showcase'), scBtn = $('#scPause');
  if (sc && scBtn) {
    scBtn.addEventListener('click', function () {
      var paused = sc.classList.toggle('is-paused');
      scBtn.setAttribute('aria-pressed', String(paused));
      scBtn.setAttribute('aria-label', paused ? 'Play the moving showcase' : 'Pause the moving showcase');
      scBtn.lastChild.textContent = paused ? 'Play' : 'Pause';
    });
  }

  // Portfolio filters (home page)
  var chips = $$('.chip');
  var cards = $$('#grid .card');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.dataset.filter;
      chips.forEach(function (c) {
        var on = c === chip;
        c.classList.toggle('is-on', on);
        c.setAttribute('aria-pressed', String(on));
      });
      cards.forEach(function (card) {
        card.hidden = !(f === 'all' || card.dataset.cat === f);
      });
    });
  });

  // Reveal on scroll
  var items = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  // Screenshot gallery arrows (product pages)
  var strip = $('#shots');
  $$('[data-scroll]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      strip.scrollBy({ left: Number(btn.dataset.scroll) * strip.clientWidth * 0.8, behavior: 'smooth' });
    });
  });

  // Lightbox (product pages)
  var lb = $('#lb');
  var shots = window.__SHOTS || [];
  if (lb && shots.length) {
    var img = $('#lbImg'), cap = $('#lbCap'), cur = 0, opener = null;
    var show = function (i) {
      cur = (i + shots.length) % shots.length;
      img.src = shots[cur].src;
      img.alt = shots[cur].cap;
      cap.textContent = shots[cur].cap + '  (' + (cur + 1) + ' / ' + shots.length + ')';
    };
    var close = function () {
      lb.hidden = true;
      document.body.classList.remove('lb-open');
      if (opener) opener.focus();
    };
    $$('[data-lb]').forEach(function (b) {
      b.addEventListener('click', function () {
        opener = b;
        show(Number(b.dataset.lb));
        lb.hidden = false;
        document.body.classList.add('lb-open');
        $('[data-lb-close]').focus();
      });
    });
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.closest('[data-lb-close]')) close();
      var st = e.target.closest('[data-lb-step]');
      if (st) show(cur + Number(st.dataset.lbStep));
    });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') show(cur + 1);
      if (e.key === 'ArrowLeft') show(cur - 1);
    });
  }

  // Contact form → opens the visitor's mail client (no backend needed)
  var form = $('#form');
  if (form) {
    var msg = $('#formMsg');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      ['name', 'email', 'msg'].forEach(function (n) {
        var el = form.elements[n];
        var bad = !el.value.trim() || (n === 'email' && !/^\S+@\S+\.\S+$/.test(el.value));
        el.classList.toggle('invalid', bad);
        if (bad) ok = false;
      });
      if (!ok) { msg.textContent = 'Please fill in all fields with a valid email.'; return; }
      var body = form.elements.msg.value + '\n\n— ' + form.elements.name.value + ' (' + form.elements.email.value + ')';
      location.href = 'mailto:' + CONTACT_EMAIL +
        '?subject=' + encodeURIComponent('Hello from the nextgenai website') +
        '&body=' + encodeURIComponent(body);
      msg.textContent = 'Opening your email app…';
    });
  }
})();
