const express = require("express");
const authenticater = require("../../libraries/authenticate/src"); // 인증 미들웨어
const orgController = require("./entry-points/Controller"); // 컨트롤러
const ErrorHandler = require("../../libraries/error-handling/src/ErrorHandler");
const redisClient = require("../../libraries/cache-store/redisClient");
const { connectMongoose } = require("../../libraries/data-access/src");

const app = express();

// body-parser 미들웨어 설정 (Express 내장 기능 사용)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2차 인증 번호 전송
app.post(
  "/org/second-auth/send-code",
  authenticater.authenticate,
  orgController.secAuthSend,
);

// 2차 인증 번호 인증
app.post(
  "/org/second-auth/verify-code",
  authenticater.authenticate,
  orgController.secAuthVerify,
);

// 에러 미들웨어 개선 (에러가 발생하면 ErrorHandler로 처리)
app.use((err, req, res, next) => {
  ErrorHandler.handleError(err, res);
  console.log(next);
});

// 예기치 못한 에러 방어 (서버 전체 적용)
process.on("uncaughtException", (err) => {
  console.error("Unhandled Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// 서버 실행
async function startServer() {
  try {
    const isTest = process.env.NODE_ENV === "test";
    if (!isTest) {
      if (!redisClient.isOpen) {
        await redisClient.connect();
      }
      await connectMongoose(); // DB 연결시도
    }
    const PORT = 3001;
    app.listen(PORT, () => {
      console.log(`서버가 ${PORT} 포트에서 실행 중입니다.`);
    });
  } catch (error) {
    console.error("서버 실행 중 오류 발생:", error);
    process.exit(1);
  }
}

startServer(); // 서버 시작

module.exports = app; // app만 export
