const { ensurePatient } = require("./db");
const { accountIdFromToken } = require("./auth");

// זהות המבקש: אם יש אסימון התחברות תקין (X-Auth-Token) — הזהות היא מזהה החשבון,
// כך שכל הנתונים נשמרים תחת החשבון ונגישים מכל מכשיר אחרי התחברות. אם אין
// התחברות — נופלים חזרה למזהה המכשיר (X-Device-Token) לגלישת ניסיון אנונימית.
function deviceTokenMiddleware(req, res, next) {
  const authToken = req.header("X-Auth-Token");
  const accountId = accountIdFromToken(authToken);
  if (accountId) {
    ensurePatient(accountId);
    req.deviceToken = accountId;
    req.accountId = accountId;
    return next();
  }

  const token = req.header("X-Device-Token");
  if (!token || typeof token !== "string" || token.length > 200) {
    return res.status(400).json({ error: "Missing or invalid X-Device-Token header" });
  }
  ensurePatient(token);
  req.deviceToken = token;
  next();
}

module.exports = { deviceTokenMiddleware };
