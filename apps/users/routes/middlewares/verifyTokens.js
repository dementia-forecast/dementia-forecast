const jwt = require("jsonwebtoken");
require("dotenv").config();
const JWT_SECRET = process.env.JWTSECRET;

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "토큰 없음" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "유효하지 않은 토큰" });
    req.user = decoded;
    next();
  });
};

module.exports = verifyToken;
