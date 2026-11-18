#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""בונה את עמוד התוכניות: דגש על תהליכים אישיים אחד על אחד (פרימיום + ליווי אישי)."""
import re, html

BOOK = "https://strict-calm-focus-path.base44.app"
WA = "https://wa.me/972543032349"
TEL = "tel:0543032349"

tmpl = open('method.html', encoding='utf-8').read()
prefix, rest = tmpl.split('<main id="main"', 1)
_, suffix = rest.split('</main>', 1)
suffix = '</main>' + suffix

def esc(s):
    return html.escape(s, quote=False)

def render(body):
    out = []
    for block in body.strip().split('\n'):
        t = block.strip()
        if not t:
            continue
        if t.startswith('## '):
            out.append('<h2>' + esc(t[3:]) + '</h2>')
        elif t.startswith('### '):
            out.append('<h3>' + esc(t[3:]) + '</h3>')
        elif t.startswith('- '):
            out.append('<li>' + esc(t[2:]) + '</li>')
        else:
            out.append('<p>' + esc(t) + '</p>')
    html_out, in_ul = [], False
    for item in out:
        if item.startswith('<li>'):
            if not in_ul:
                html_out.append('<ul class="bullets">'); in_ul = True
            html_out.append(item)
        else:
            if in_ul:
                html_out.append('</ul>'); in_ul = False
            html_out.append(item)
    if in_ul:
        html_out.append('</ul>')
    return '\n'.join(html_out)

title = 'תהליכים אישיים אחד על אחד · פרימיום וליווי אישי | קטי שגב'
desc = 'תהליכים אישיים בקליניקת CureMindset: תהליך פרימיום ותהליך ליווי אישי, פגישה אישית אחד על אחד עם קטי שגב. קריית מוצקין, קריית חיים ומקוון. סדנאות לנוער כחלק נוסף.'

head = prefix
head = re.sub(r'<title>.*?</title>', '<title>' + esc(title) + '</title>', head, flags=re.S)
head = re.sub(r'<meta name="description" content=".*?" />', '<meta name="description" content="' + esc(desc) + '" />', head, flags=re.S)
head = re.sub(r'<link rel="canonical" href=".*?" />', '<link rel="canonical" href="https://www.ketysegev.com/programs" />', head, flags=re.S)
head = head.replace('https://calendly.com/ketysegev/meet-with-me', BOOK)

body = '''
היי, אני קטי שגב. רוב העבודה שלי בקליניקה היא אחד על אחד.
פגישה אישית, בחדר שקט, בקצב שלך. לא קבוצה, לא הרצאה, לא תוכנית שאמורה להתאים לכולם.
## שני מסלולים אישיים
### תהליך פרימיום
מסלול מעמיק ורציף, למי שרוצה לעבוד על השורש ולא רק על הסימפטום. מפגישה לפגישה נבנית שפה פנימית חדשה, עם תרגול בין המפגשים וכלים שממשיכים לעבוד בשגרה.
המסלול מתאים למי שמרגיש שהדפוס חוזר שוב ושוב, ורוצה תהליך שלא נגמר בהבנה אלא בשינוי שמחזיק.
### תהליך ליווי אישי
מסלול ממוקד, למי שמגיע עם נושא ברור: חרדה לפני מצבים מסוימים, ביטחון עצמי, ויסות רגשי או דפוס תגובה שמפריע ביום יום.
עובדים על מה שמעסיק עכשיו, עם כלים פרקטיים שאפשר ליישם מיד.
## מה משותף לשניהם
- פגישה אישית אחד על אחד עם קטי, לא עם צוות ולא עם מתמחה.
- התאמה אישית של הכלים לגיל, לאישיות ולקצב.
- תרגול מעשי בין המפגשים, כדי שהשינוי יקרה בחיים עצמם.
- מקום בטוח לדבר בו, בלי שיפוט ובלי הגדרות מראש.
## למי זה מתאים
בני נוער מגיל 12 ומעלה, מבוגרים, והורים שמביאים את הילד שלהם לטיפול.
המפגשים מתקיימים בקריית מוצקין, בקריית חיים או אונליין מכל מקום בארץ.
## סדנאות, כחלק נוסף
בנוסף לתהליכים האישיים, אני מעבירה סדנאות חוסן רגשי לבתי ספר, לתנועות נוער ולמסגרות קהילתיות.
הסדנאות הן חלק ממה שאני עושה, אבל הלב של העבודה הוא הפגישה האישית.
## לקביעת פגישה
בחרי מועד פנוי במערכת התורים, והפגישה נקבעת ומאושרת אוטומטית.
אם יש שאלה לפני, אפשר לכתוב לי בוואטסאפ.
'''

cta = (
    '<div class="ctaband"><h2>לקביעת פגישה אישית</h2>'
    '<p>בוחרים מועד פנוי במערכת התורים, והאישור נשלח אוטומטית.</p>'
    '<div class="btnrow"><a class="btn primary" href="' + BOOK + '" target="_blank" rel="noopener">לקביעת פגישה</a>'
    '<a class="btn ghost" href="' + WA + '" target="_blank" rel="noopener">וואטסאפ</a>'
    '<a class="btn ghost" href="' + TEL + '">054-3032349</a></div></div>'
    '<div class="disclaimer">התכנים באתר הם אימון ותמיכה רגשית בשיטת NLP ו-CureMindset. הם אינם טיפול פסיכולוגי או פסיכיאטרי, אבחון או תחליף לייעוץ רפואי. השיטה אינה מבטיחה תוצאה אחידה. במצוקה חריפה או חשש לסיכון: ער"ן 1201, מד"א 101 או חדר מיון.</div>'
)

main = (
    '<main id="main" class="wrap" data-sc-in data-sc-stagger="70">'
    '<section class="hero"><div class="hero-grid"><div>'
    '<p class="eyebrow">התהליכים שלי</p>'
    '<h1>תהליכים אישיים, אחד על אחד.</h1>'
    '<p class="lead">תהליך פרימיום ותהליך ליווי אישי, פגישה אישית עם קטי שגב.</p>'
    '<div class="btnrow"><a class="btn primary" href="' + BOOK + '" target="_blank" rel="noopener">לקביעת פגישה</a>'
    '<a class="btn ghost" href="' + WA + '" target="_blank" rel="noopener">וואטסאפ</a></div>'
    '</div></div></section>'
    '<section class="body-sec">' + render(body) + '</section>' + cta + '</main>'
)

open('programs.html', 'w', encoding='utf-8').write(head + main + suffix.replace('https://calendly.com/ketysegev/meet-with-me', BOOK))
print('built programs.html')

# קישור בולט לתהליכים האישיים מדף הבית
idx = open('index.html', encoding='utf-8').read()
if '/programs' not in idx:
    idx = idx.replace(
        '<a class="btn ghost" href="' + WA + '" target="_blank" rel="noopener">וואטסאפ</a>',
        '<a class="btn ghost" href="/programs">התהליכים האישיים</a>'
        '<a class="btn ghost" href="' + WA + '" target="_blank" rel="noopener">וואטסאפ</a>', 1)
    open('index.html', 'w', encoding='utf-8').write(idx)
    print('home linked to /programs')
