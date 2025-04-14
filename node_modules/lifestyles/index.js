const express = require("express");
const authenticater = require("../../libraries/authenticate/src"); // 인증 미들웨어
const lifestyleController = require("./entry-points/controller"); // 컨트롤러
const ErrorHandler = require("../../libraries/error-handling/src/AppError");

const app = express();

// body-parser 미들웨어 설정 (Express 내장 기능 사용)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 라이프스타일 저장 및 수정 API
app.post(
  "/lifestyle/save",
  authenticater.authenticate,
  lifestyleController.saveLifestyle,
);

// 에러 미들웨어 개선 (에러가 발생하면 ErrorHandler로 처리)
app.use((err, req, res, next) => {
  ErrorHandler.handleError(err, res);
  next(); // 에러 미들웨어에서 끝났으면, 후속 미들웨어가 필요하면 next() 호출
});

// 예기치 못한 에러 방어 (서버 전체 적용)
process.on("uncaughtException", (err) => {
  console.error("Unhandled Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버가 ${PORT} 포트에서 실행 중입니다.`);
});

module.exports = app; // app만 export
