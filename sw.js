// Service Worker מינימלי — מאפשר התקנה כאפליקציה (PWA) ומסך פתיחה.
// אסטרטגיה: network-first, עם נפילה לקאש כשאין רשת (כדי שהאפליקציה תיפתח גם אופליין).
const CACHE = "cure-admin-v1";
const SHELL = ["/admin", "/adminApp.js", "/icons.js", "/styles.css", "/images/logo.png"];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  // בקשות API תמיד מהרשת (נתונים עדכניים); לא מקאשים נתונים אישיים.
  if (req.url.includes("/api/")) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((m) => m || caches.match("/admin")))
  );
});
