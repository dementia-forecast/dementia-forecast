const AppError = require("./AppError");

function rethrowAppErr(
  err,
  {
    name = "AppError",
    statusCode = 500,
    description = "Internal Server Error",
    isOperational = false,
  } = {},
) {
  if (err instanceof AppError) {
    throw err;
  } else {
    throw new AppError(name, statusCode, description, isOperational, err.stack);
  }
}

module.exports = { rethrowAppErr };
