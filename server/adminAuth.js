// HTTP Basic Auth for /api/admin/* only. The static admin.html shell is served
// unauthenticated so it can show a custom-built login form instead of the
// browser's native Basic-Auth popup; adminApp.js sends the Authorization header
// itself on every /api/admin/* request once the therapist signs in.
//
// Credentials resolve in this order:
//   1. ADMIN_USER / ADMIN_PASSWORD env vars (recommended for production)
//   2. Built-in default: user "kety", password verified against a scrypt HASH
//      (the plaintext password is NOT stored in code — only its irreversible hash,
//       so the public repo never exposes it). Lets the admin work out-of-the-box.
// To change the default password, set ADMIN_PASSWORD in Render's environment.

const crypto = require("node:crypto");

const DEFAULT_ADMIN_USER = "kety";
// scrypt hash ("salt:derived") of the default admin password — not the password itself.
const DEFAULT_ADMIN_PASSWORD_HASH =
  "90afa61ff79dec288700f9c3db652bd3:b4af8d7b8c08988568b265f3af578987b793370b220e2e78550fe070bbec6a4cf428cdf20fddc4e611f2250a91d33daa7900c769411a146c2b20dd093f8d0640";

function timingSafeEqualStr(a, b) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function verifyAgainstHash(password, stored) {
  const [salt, hash] = String(stored).split(":");
  if (!salt || !hash) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const known = Buffer.from(hash, "hex");
  return known.length === derived.length && crypto.timingSafeEqual(known, derived);
}

function adminAuthMiddleware(req, res, next) {
  const adminUser = process.env.ADMIN_USER || DEFAULT_ADMIN_USER;
  const adminPassword = process.env.ADMIN_PASSWORD; // if unset, fall back to the hash

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

  const userOk = timingSafeEqualStr(user, adminUser);
  const passwordOk = adminPassword
    ? timingSafeEqualStr(password, adminPassword)
    : verifyAgainstHash(password, DEFAULT_ADMIN_PASSWORD_HASH);

  if (!userOk || !passwordOk) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  next();
}

module.exports = { adminAuthMiddleware };
