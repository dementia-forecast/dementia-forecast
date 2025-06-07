const express = require("express");
const authenticater = require("./libraries/authenticate/src"); // 인증 미들웨어
const lifestyleController = require("./entry-points/controller"); // 컨트롤러
const ErrorHandler = require("./libraries/error-handling/src/ErrorHandler");
const { connectMongoose } = require("./libraries/data-access/src");

require("dotenv").config();
const PORT = process.env.PORT;

const app = express();

// body-parser 미들웨어 설정 (Express 내장 기능 사용)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 라이프스타일 저장 및 수정 API
app.post(
  "/lifestyle/save",
  authenticater.authenticate,
  lifestyleController.saveLifestyle
);

// 라이프스타일 조회 API
app.get(
  "/lifestyle/send",
  authenticater.authenticate,
  lifestyleController.getLifestyle
);

// 라이프스타일 삭제 API
app.delete(
  "/lifestyle/delete",
  authenticater.authenticate,
  lifestyleController.deleteLifestyle
);

// 에러 미들웨어 개선 (에러가 발생하면 ErrorHandler로 처리)
app.use((err, req, res, next) => {
  ErrorHandler.handleError(err, res);
  console.log(next); // eslint 에러 예방
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
      await connectMongoose(); // DB 연결 먼저 시도
    }
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
