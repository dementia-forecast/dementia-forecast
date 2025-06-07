const jwt = require("jsonwebtoken");
require("dotenv").config();
const apiKey = process.env.APIKEY;
const AppError = require("../../error-handling/src/AppError");

function authenticate(req, res, next) {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new AppError(
      "Missing access token",
      401,
      "Access token이 필요합니다.",
    );
  }

  try {
    const decoded = jwt.verify(token, apiKey);
    if (!decoded.userId) {
      throw new AppError("Missing userId", 401, "userId가 null입니다.");
    }
    req.userId = decoded.userId; // 사용자 ID를 req에 저장

    next(); // 다음 미들웨어(컨트롤러)로 이동
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new AppError("Token Expired", 401, "토큰이 만료되었습니다.");
    }

    if (err.name === "JsonWebTokenError") {
      throw new AppError(
        "JsonWebToken error",
        401,
        "비밀키나 토큰 포맷이 맞지 않습니다.",
      );
    }
    next(err);
  }
}

module.exports = {
  authenticate,
};
