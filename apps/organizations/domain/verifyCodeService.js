const AppError = require("../../../libraries/error-handling/src/AppError");
const secondAuthStore = require("../data-access/secondAuthStore");
const {
  rethrowAppErr,
} = require("../../../libraries/error-handling/src/rethrowErr");

async function generateCode(userId) {
  try {
    const existingData = await secondAuthStore.getCodeData(userId);

    if (existingData) {
      return existingData.code; // 이미 발급된 코드 반환
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6자리 랜덤 코드 생성
    await secondAuthStore.saveCode(userId, code, 180);

    return code;
  } catch (err) {
    rethrowAppErr(err, {
      name: "generate Code failure",
      statusCode: 500,
      description: "generateCode시 예기치 못한 에러가 발생하였습니다.",
    });
  }
}

async function verifyCode(userId, inputCode) {
  try {
    const data = await secondAuthStore.getCodeData(userId);

    if (!data) {
      throw new AppError(
        "Code data not exist",
        401,
        "2차 인증 시간이 만료되었습니다.",
      );
    }

    if (data.attempts >= data.maxAttempts) {
      await secondAuthStore.removeCode(userId);
      throw new AppError(
        "Second auth Attemp count exceeded",
        401,
        "2차 인증 횟수가 초과되었습니다.",
      );
    }

    if (parseInt(inputCode) !== parseInt(data.code)) {
      await secondAuthStore.incrementAttempt(userId);
      throw new AppError(
        "Second auth wrong input code",
        401,
        "2차 인증 코드가 맞지 않습니다.",
      );
    }

    await secondAuthStore.removeCode(userId);
    return true;
  } catch (err) {
    rethrowAppErr(err, {
      name: "verify Code failure",
      statusCode: 500,
      description: "verifyCode시 예기치 못한 에러가 발생하였습니다.",
    });
  }
}

module.exports = {
  generateCode,
  verifyCode,
};
