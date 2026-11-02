import re,glob
CAL="https://calendly.com/ketysegev/meet-with-me"
foot='''<footer class="site"><div class="wrap">
  <div class="foot-top">
    <div><h4>CureMindset</h4><p>קטי שגב · מאמנת מנטלית. שיטה שנבנתה מניסיון אישי, לא מתיאוריה.</p><a href="%s" rel="noopener">לשיחת היכרות ללא עלות</a></div>
    <div><h4>האתר</h4><a href="/method">השיטה</a><a href="/programs">תוכניות</a><a href="/faq">שאלות נפוצות</a><a href="/articles">מאמרים</a><a href="/contact">יצירת קשר</a></div>
    <div><h4>מידע</h4><a href="/privacy">פרטיות</a><a href="/terms">תנאי שימוש</a><a href="/accessibility">נגישות</a><a href="/responsibility">הבהרת אחריות</a></div>
  </div>
  <div class="foot-mark" aria-hidden="true">CureMindset</div>
  <div class="foot-legal"><span>© 2026 CureMindset · קטי שגב</span></div>
</div></footer>'''%CAL
n=0
for f in glob.glob("*.html"):
    s=open(f,encoding="utf8").read()
    if '<header class="site"' not in s: continue
    o=s
    s=re.sub(r'<button type="button" class="cta-top"[^>]*>.*?</button>','<a class="cta-top" href="%s" rel="noopener">שיחת היכרות</a>'%CAL,s,flags=re.S)
    s=re.sub(r'<footer class="site">.*?</footer>',foot,s,flags=re.S)
    s=re.sub(r'<link href="https://fonts.googleapis.com/css2[^>]*>\s*','',s)
    s=re.sub(r'<link rel="preconnect" href="https://fonts.g[^>]*>\s*','',s)
    if 'cm3.css' not in s: s=s.replace('</head>','<link rel="preload" href="/fonts/heebo-hebrew-500-normal.woff2" as="font" type="font/woff2" crossorigin>\n<link rel="stylesheet" href="/cm3.css?v=20261102a">\n</head>',1)
    if s!=o: open(f,"w",encoding="utf8").write(s); n+=1
print(n)
