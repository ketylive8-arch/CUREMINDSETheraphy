/* ============================================================
 * sc-site.js — מחבר את עמודי האתר למנוע scroll-craft (2026-10-24)
 * מוסיף את מאפייני data-sc-* לסקשנים הקיימים בזמן ריצה, כך שכל
 * עמוד מקבל את אותה חוויית גלילה של /emotional-therapist-krayot
 * בלי לגעת בתוכן. אם הסקריפט לא נטען — העמוד נשאר מלא וקריא.
 * דורש: /vendor/scrollcraft/scrollcraft.js (נטען לפניו, defer).
 * ============================================================ */
(function () {
  'use strict';
  if (!window.ScrollCraft || document.documentElement.hasAttribute('data-sc-site')) return;
  document.documentElement.setAttribute('data-sc-site', '');

  var CANVAS = ['#FBF7EF', '#FFFFFF'];
  var BLOCKS = 'section, .pull-quote, .alt-band, .ctaband, .related, .disclaimer, .cards, .section-head, article, aside, figure, .embed-16x9, .big-stat, .cta-mid';

  function addGrain() {
    var g = document.createElement('div');
    g.className = 'sc-grain';
    g.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(g, document.body.firstChild);
  }

  // h1 שמכיל רק טקסט (בלי <br>, קישורים או הדגשות) — רק אותו מותר לפצל לשורות
  function textOnly(el) { return el && el.children.length === 0 && el.textContent.trim().length > 0; }

  function revealBlock(el, i) {
    if (el.hasAttribute('data-sc-in')) return;
    el.setAttribute('data-sc-in', '');
    // בלוקים קצרים מקבלים כניסה מדורגת של הילדים; ארוכים — כניסה אחת
    if (el.children.length > 1 && el.children.length <= 10 && el.offsetHeight < innerHeight * 1.6) {
      el.setAttribute('data-sc-stagger', '70');
    }
    if (el.tagName === 'SECTION') {
      el.setAttribute('data-sc-act', 'flow');
      el.setAttribute('data-sc-drift', CANVAS[i % 2]);
    }
  }

  function revealMedia(scope) {
    Array.prototype.forEach.call(scope.querySelectorAll('img'), function (img) {
      if (img.closest('header, footer, nav, [data-sc-reveal], .hero-inner')) return;
      var w = img.getAttribute('width') || img.naturalWidth || img.offsetWidth;
      if (w && w < 240) return; // לוגואים ואייקונים נשארים כמו שהם
      img.setAttribute('data-sc-reveal', 'up');
      img.setAttribute('data-sc-reveal-at', '0.05 0.45');
    });
  }

  function decorateStatic(main) {
    var kids = Array.prototype.filter.call(main.children, function (el) {
      return el.matches(BLOCKS) || el.tagName === 'DIV' || el.tagName === 'P';
    });
    if (!kids.length) return;
    var hero = kids[0].matches('.hero, header') ? kids[0] : null;
    if (hero) {
      hero.setAttribute('data-sc-act', 'flow');
      hero.setAttribute('data-sc-drift', CANVAS[0]);
      var inner = hero.querySelector('.hero-grid > div, .hero-inner') || hero;
      inner.setAttribute('data-sc-in', '');
      inner.setAttribute('data-sc-stagger', '70');
      var h1 = hero.querySelector('h1');
      if (textOnly(h1)) h1.setAttribute('data-sc-kinetic', 'lines');
    }
    var n = 1;
    kids.forEach(function (el) { if (el !== hero) revealBlock(el, n++); });
  }

  // הירו מלא־רוחב שיושב מחוץ ל-main (אודות/סדנאות/הסיפור האישי)
  function decorateOuterHero() {
    var outer = document.querySelector('body > .hero, body > section.hero, body > header.hero');
    if (!outer) return;
    outer.setAttribute('data-sc-act', 'flow');
    var inner = outer.querySelector('.hero-inner') || outer;
    inner.setAttribute('data-sc-in', '');
    inner.setAttribute('data-sc-stagger', '70');
  }

  function mount() {
    addGrain();
    var main = document.querySelector('main');
    if (main) { decorateStatic(main); revealMedia(main); }
    else {
      // עמודי מאמר בלי <main>: כל בלוק ישיר של body מקבל כניסה
      Array.prototype.forEach.call(document.body.children, function (el, i) {
        if (el.matches('section, article, aside') && !el.matches('.hero:first-of-type')) revealBlock(el, i);
      });
    }
    decorateOuterHero();
    window.ScrollCraft.mount(document.body);
  }

  // דף הבית (React): ממתינים שהסקשנים ירונדרו, ומוסיפים רק כניסות עדינות —
  // בלי פיצול טקסט ובלי drift, כדי לא להתנגש ב-React ובצבעי הסקשנים שלו.
  function mountReactHome(root) {
    var done = false;
    function go() {
      var secs = root.querySelectorAll('section');
      if (done || secs.length < 3) return false;
      done = true;
      addGrain();
      Array.prototype.forEach.call(secs, function (s, i) {
        if (i === 0) return; // ה-Hero נשאר יציב מעל הקפל
        var box = s.firstElementChild;
        if (box && !box.hasAttribute('data-sc-in')) box.setAttribute('data-sc-in', '');
      });
      window.ScrollCraft.mount(root);
      return true;
    }
    if (go()) return;
    var mo = new MutationObserver(function () { if (go()) mo.disconnect(); });
    mo.observe(root, { childList: true, subtree: true });
    setTimeout(function () { mo.disconnect(); }, 15000);
  }

  function start() {
    var root = document.getElementById('root');
    if (root && document.querySelector('script[type="text/babel"]')) mountReactHome(root);
    else mount();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
