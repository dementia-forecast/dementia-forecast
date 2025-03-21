const winston = require("winston");

// 기본 로그 형식
const logFormat = winston.format.printf(({ timestamp, level, message }) => {
  return `${timestamp} [${level}]: ${message}`;
});

// 로거 설정
const logger = winston.createLogger({
  level: "info", // 기본 로그 레벨 (info, warn, error 등)
  format: winston.format.combine(
    winston.format.timestamp(), // 타임스탬프 추가
    winston.format.simple(),
    logFormat, // 커스텀 로그 형식
  ),
  transports: [
    // 콘솔 로그만 남기기
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(), // 로그 레벨 색상 추가
        winston.format.simple(), // 간단한 포맷
      ),
    }),
  ],
});

// 로그 출력 예시
logger.info("This is an info log");
logger.warn("This is a warning log");
logger.error("This is an error log");

module.exports = logger;
