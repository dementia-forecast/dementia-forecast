class AppError extends Error {
  constructor(name, httpCode, description, isOperational, stack = "") {
    super(description);
    this.name = name;
    this.httpCode = httpCode;
    this.isOperational = isOperational;
    this.stack = stack || new Error().stack; // 스택 추적 기본값 설정
  }
}

module.exports = AppError;
