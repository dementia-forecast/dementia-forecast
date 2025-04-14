const jwt = require("jsonwebtoken");
const config = require("config");
const apiKey = config.get("apiKey");

function authenticate(req, res, next) {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Access token is required" });
  }

  try {
    const decoded = jwt.verify(token, apiKey);
    req.userId = decoded.userId; // 사용자 ID를 req에 저장
    next(); // 다음 미들웨어(컨트롤러)로 이동
  } catch (err) {
    next(err);
  }
}

module.exports = {
  authenticate,
};
