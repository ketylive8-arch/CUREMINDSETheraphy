// HTTP Basic Auth for /api/admin/* only. The static admin.html shell is served
// unauthenticated so it can show a custom-built login form instead of the
// browser's native Basic-Auth popup; adminApp.js sends the Authorization header
// itself on every /api/admin/* request once the therapist signs in.

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function adminAuthMiddleware(req, res, next) {
  const adminUser = process.env.ADMIN_USER;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminUser || !adminPassword) {
    return res.status(503).json({ error: "Admin credentials are not configured on the server" });
  }

  const header = req.header("Authorization") || "";
  const [scheme, encoded] = header.split(" ");
  if (scheme !== "Basic" || !encoded) {
    return res.status(401).json({ error: "Authentication required" });
  }

  let decoded;
  try {
    decoded = Buffer.from(encoded, "base64").toString("utf8");
  } catch {
    return res.status(401).json({ error: "Invalid Authorization header" });
  }

  const sepIndex = decoded.indexOf(":");
  if (sepIndex === -1) {
    return res.status(401).json({ error: "Invalid Authorization header" });
  }
  const user = decoded.slice(0, sepIndex);
  const password = decoded.slice(sepIndex + 1);

  const userOk = user.length === adminUser.length && timingSafeEqual(user, adminUser);
  const passwordOk = password.length === adminPassword.length && timingSafeEqual(password, adminPassword);
  if (!userOk || !passwordOk) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  next();
}

module.exports = { adminAuthMiddleware };
