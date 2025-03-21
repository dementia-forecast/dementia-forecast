const AppError = require("./AppError");
const logger = require("./logger"); // logger 가져오기

class ErrorHandler {
  handleError(err, res) {
    // 에러를 로깅
    logger.error(`Error: ${err.message}\nStack: ${err.stack}`);

    if (err instanceof AppError) {
      // 운영 에러 처리
      res.status(err.httpCode).json({
        statusCode: err.httpCode,
        message: err.description,
      });
    } else {
      // 예기치 못한 에러 처리
      console.error(err);
      res.status(500).json({
        statusCode: 500,
        message: err.description,
      });
    }
  }
}

module.exports = ErrorHandler;
