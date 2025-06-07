class AppError extends Error {
  constructor(name, statusCode, description, isOperational = true, stack = "") {
    super(description);
    this.name = name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.stack = stack || new Error().stack; // 스택 추적 기본값 설정
  }
}

module.exports = AppError;
