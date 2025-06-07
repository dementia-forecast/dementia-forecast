const AppError = require("./AppError");

const ErrorHandler = {
  handleError(err, res) {
    if (err instanceof AppError) {
      // 운영 에러 처리
      res.status(err.statusCode).json({
        message: err.message,
      });
    } else {
      // 예기치 못한 에러 처리
      res.status(500).json({
        message: err.message || "Internal Server Error",
      });
    }
  },
};

module.exports = ErrorHandler;
