const express = require("express");
const authenticater = require("./libraries/authenticate/src"); // 인증 미들웨어
const { connectMongoose } = require("./libraries/data-access/src");
const predictionController = require("./entry-points/Controller"); // 컨트롤러
const ErrorHandler = require("./libraries/error-handling/src/ErrorHandler");

require("dotenv").config();
const port = parseInt(process.env.PORT, 10);

const app = express();

// body-parser 미들웨어 설정 (Express 내장 기능 사용)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 분석 레포트 생성 API
app.post(
  "/prediction/report/create",
  authenticater.authenticate,
  predictionController.createReport,
);

// 분석레포트 조회 API
app.get(
  "/prediction/report/:date",
  authenticater.authenticate,
  predictionController.findReport,
);

// 한 사용자의 분석 레포트 조회 API
app.post("/org/risky/report", predictionController.getReportByEmail);

// 위험도 높은 사람들 이메일 제공 API
app.post("/org/risky/get", predictionController.getHighRiskEmails);

// 위험도 높은 사용자 수 반환 API
app.post("/org/risky/count", predictionController.getHighRiskUserCount);

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
    app.listen(port, () => {
      console.log(`서버가 ${port} 포트에서 실행 중입니다.`);
    });
  } catch (error) {
    console.error("서버 실행 중 오류 발생:", error);
    process.exit(1);
  }
}

startServer(); // 서버 시작

module.exports = app; // app만 export
