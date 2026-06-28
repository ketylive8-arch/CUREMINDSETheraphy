const { ensurePatient } = require("./db");

function deviceTokenMiddleware(req, res, next) {
  const token = req.header("X-Device-Token");
  if (!token || typeof token !== "string" || token.length > 200) {
    return res.status(400).json({ error: "Missing or invalid X-Device-Token header" });
  }
  ensurePatient(token);
  req.deviceToken = token;
  next();
}

module.exports = { deviceTokenMiddleware };
