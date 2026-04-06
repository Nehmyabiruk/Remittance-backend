const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    console.log("[AUTH] No Authorization header provided.");
    return res.status(401).json({ message: "No token, access denied" });
  }

  // Handle optional 'Bearer ' prefix
  const token = authHeader.startsWith("Bearer ") 
    ? authHeader.slice(7) 
    : authHeader;

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    console.log("[AUTH] Token verified for user ID:", req.user.id);
    next();
  } catch (err) {
    console.error("[AUTH] Token verification failed:", err.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};