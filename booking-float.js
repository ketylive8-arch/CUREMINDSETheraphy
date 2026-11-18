/* booking-float.js — כפתור צף לקביעת פגישה (מערכת המזכירה)
 * אייקון עגול תלת־ממדי בזהב, אנימציית ריחוף עדינה, תווית "לקביעת פגישה".
 * מכבד prefers-reduced-motion, נגיש במקלדת, ואינו מתנגש בכפתור curebot או בנגישות.
 */
(function () {
  if (window.__cmBookingLoaded) return;
  window.__cmBookingLoaded = true;

  var BOOKING_URL = 'https://strict-calm-focus-path.base44.app';
  var LABEL = 'לקביעת פגישה';

  var css = ''
    + '#cmBookBtn{position:fixed;right:18px;bottom:78px;z-index:9996;display:inline-flex;align-items:center;gap:10px;'
    + 'padding:0;border:0;background:transparent;cursor:pointer;text-decoration:none;font-family:Rubik,Assistant,sans-serif;'
    + '-webkit-tap-highlight-color:transparent}'
    + '#cmBookBtn .orb{position:relative;width:58px;height:58px;border-radius:50%;display:grid;place-items:center;flex-shrink:0;'
    + 'background:radial-gradient(circle at 30% 26%,#FBEBC4 0%,#E9C97F 42%,#C9A24E 78%,#A9822F 100%);'
    + 'box-shadow:0 10px 22px -8px rgba(138,106,47,.55),inset 0 2px 3px rgba(255,255,255,.85),inset 0 -3px 6px rgba(120,88,28,.45);'
    + 'animation:cmBookFloat 3.6s ease-in-out infinite;transition:transform .22s ease,box-shadow .22s ease}'
    + '#cmBookBtn .orb::after{content:"";position:absolute;inset:5px;border-radius:50%;'
    + 'background:linear-gradient(160deg,rgba(255,255,255,.55),rgba(255,255,255,0) 55%);pointer-events:none}'
    + '#cmBookBtn svg{width:26px;height:26px;position:relative;z-index:1;stroke:#3A2E18;fill:none;stroke-width:1.9;'
    + 'stroke-linecap:round;stroke-linejoin:round}'
    + '#cmBookBtn .lbl{background:#FFFFFF;color:#2D2A26;font-size:14px;font-weight:600;padding:8px 13px;border-radius:999px;'
    + 'border:1px solid #EFE3CC;box-shadow:0 6px 16px -10px rgba(45,42,38,.45);white-space:nowrap;'
    + 'opacity:0;transform:translateX(6px);transition:opacity .2s ease,transform .2s ease;pointer-events:none}'
    + '#cmBookBtn:hover .orb,#cmBookBtn:focus-visible .orb{transform:translateY(-2px) scale(1.04);'
    + 'box-shadow:0 14px 26px -8px rgba(138,106,47,.6),inset 0 2px 3px rgba(255,255,255,.9),inset 0 -3px 6px rgba(120,88,28,.45)}'
    + '#cmBookBtn:hover .lbl,#cmBookBtn:focus-visible .lbl{opacity:1;transform:translateX(0)}'
    + '#cmBookBtn:focus-visible{outline:3px solid #C2974A;outline-offset:3px;border-radius:999px}'
    + '@keyframes cmBookFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}'
    + '@media (max-width:560px){#cmBookBtn{right:14px;bottom:74px}#cmBookBtn .orb{width:52px;height:52px}'
    + '#cmBookBtn svg{width:23px;height:23px}#cmBookBtn .lbl{display:none}}'
    + '@media (prefers-reduced-motion:reduce){#cmBookBtn .orb{animation:none}}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var a = document.createElement('a');
  a.id = 'cmBookBtn';
  a.href = BOOKING_URL;
  a.target = '_blank';
  a.rel = 'noopener';
  a.setAttribute('aria-label', LABEL + ' — קביעת מועד במערכת התורים');
  a.innerHTML =
    '<span class="orb">'
    + '<svg viewBox="0 0 24 24" aria-hidden="true">'
    + '<rect x="3.2" y="5" width="17.6" height="15.5" rx="3.4"></rect>'
    + '<path d="M8 3.2v3.4M16 3.2v3.4M3.4 10.2h17.2"></path>'
    + '<path d="M8.4 14.2h2.2M13.4 14.2h2.2M8.4 17.3h2.2"></path>'
    + '</svg></span>'
    + '<span class="lbl">' + LABEL + '</span>';

  function mount() {
    if (!document.getElementById('cmBookBtn')) document.body.appendChild(a);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
