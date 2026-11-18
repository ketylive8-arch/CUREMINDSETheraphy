/* copy-2026.js — עדכון ניסוח ההירו לפי גרסת התוכן v3 (17.11.2026)
 * החלפה עדינה של טקסטים בעמוד הבית: טיפול שמגיע לשורש.
 * לא נוגע בעיצוב, לא נוגע בניווט, ולא מבצע שינוי אם הטקסט כבר מעודכן.
 */
(function () {
  var NEW_H1 = 'טיפול שמגיע לשורש.';
  var NEW_LEAD = 'קטי שגב, מטפלת NLP ומאמנת מנטלית. שיטת CureMindset עובדת על הדפוסים, על הדיבור הפנימי ועל מה שהגוף זוכר.';
  var NEW_P = 'בטיפול אנחנו מזהים את הדפוס, מרגיעים את המערכת הרגשית ומלמדים את הגוף תגובה חדשה. לנוער, למבוגרים ולהורים שמביאים את הילד שלהם לטיפול. בקריית מוצקין, בקריית חיים ובזום לכל הארץ.';

  function swap() {
    var hero = document.querySelector('.hero');
    if (!hero) return false;

    var h1 = hero.querySelector('h1');
    if (h1 && h1.textContent.indexOf('כוח הרצון') !== -1) h1.textContent = NEW_H1;

    var lead = hero.querySelector('.lead');
    if (lead && lead.textContent.indexOf('התת-מודע') !== -1) lead.textContent = NEW_LEAD;

    var ps = hero.querySelectorAll('p');
    for (var i = 0; i < ps.length; i++) {
      if (!ps[i].classList.contains('lead') && ps[i].textContent.indexOf('השורש, לא רק') !== -1) {
        ps[i].textContent = NEW_P;
        return true;
      }
    }
    return h1 && h1.textContent === NEW_H1;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(swap, 60); });
  } else {
    setTimeout(swap, 60);
  }
  // React מרנדר אחרי הטעינה: מנסים שוב קצר, ואם צריך גם עם observer
  setTimeout(swap, 700);
  setTimeout(swap, 1600);
  try {
    var mo = new MutationObserver(function () { if (swap()) mo.disconnect(); });
    mo.observe(document.body, { childList: true, subtree: true });
    setTimeout(function () { mo.disconnect(); }, 6000);
  } catch (e) {}
})();
