const redisClient = require("../../../libraries/cache-store/redisClient");
const {
  rethrowAppErr,
} = require("../../../libraries/error-handling/src/rethrowErr");

async function saveCode(userId, code, ttlSeconds = 180, attempts = 0) {
  const now = Date.now();

  const data = {
    code: code,
    createdAt: now,
    expiredAt: now + ttlSeconds * 1000,
    attempts: attempts,
    maxAttempts: 5,
  };

  try {
    // Redis에 데이터 저장
    await redisClient.setEx(
      `secondAuth:${userId}`,
      ttlSeconds,
      JSON.stringify(data),
    );
  } catch (err) {
    rethrowAppErr(err, {
      name: "Unexpected save Code failure",
      statusCode: 500,
      description: "saveCode시 예상치 못한 에러가 발생하였습니다.",
    });
  }
}

async function saveCodeKeepTTL(userId, code, attempts = 0) {
  const key = `secondAuth:${userId}`;

  // 기존 데이터 가져오기
  const existingDataStr = await redisClient.get(key);
  if (!existingDataStr) {
    throw new Error("데이터 없음");
  }

  const existingData = JSON.parse(existingDataStr);

  // 수정할 데이터 생성
  const newData = {
    ...existingData,
    code: code,
    attempts: attempts,
  };

  // 저장 (TTL 유지)
  try {
    await redisClient.set(key, JSON.stringify(newData), {
      KEEPTTL: true, // TTL 그대로 유지
    });
  } catch (err) {
    rethrowAppErr(err, {
      name: "Unexpected modify Code failure",
      statusCode: 500,
      description: "modifyCode시 예상치 못한 에러가 발생하였습니다.",
    });
  }
}

async function getCodeData(userId) {
  // 따로 null 반환시 에러처리 안함
  try {
    const result = await redisClient.get(`secondAuth:${userId}`);
    return result ? JSON.parse(result) : null;
  } catch (err) {
    rethrowAppErr(err, {
      name: "Unexpected get Code Data failure",
      statusCode: 500,
      description: "getCodeData시 예상치 못한 에러가 발생하였습니다.",
    });
  }
}

async function incrementAttempt(userId) {
  // data가 있는지, attempt 초과했는지는 Service 단에서 체크
  try {
    const data = await getCodeData(userId);
    // 수정할 데이터 생성
    const newData = {
      ...data,
      attempts: data.attempts + 1,
    };

    await redisClient.set(`secondAuth:${userId}`, JSON.stringify(newData), {
      KEEPTTL: true, // TTL 그대로 유지
    });
  } catch (err) {
    rethrowAppErr(err, {
      name: "Unexpected increment Attempt failure",
      statusCode: 500,
      description: "incrementAttempt시 예상치 못한 에러가 발생하였습니다.",
    });
  }
}

async function removeCode(userId) {
  try {
    await redisClient.del(`secondAuth:${userId}`);
  } catch (err) {
    rethrowAppErr(err, {
      name: "Unexpected remove Code failure",
      statusCode: 500,
      description: "removeCode시 예상치 못한 에러가 발생하였습니다.",
    });
  }
}

module.exports = {
  saveCode,
  saveCodeKeepTTL,
  getCodeData,
  incrementAttempt,
  removeCode,
};
