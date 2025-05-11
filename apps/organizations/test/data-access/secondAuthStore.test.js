const sinon = require("sinon");
const { expect } = require("chai");

const redisClient = require("../../../../libraries/cache-store/redisClient");
const secondAuthStore = require("../../data-access/secondAuthStore");
const AppError = require("../../../../libraries/error-handling/src/AppError.js");

describe("secondAuthStore 오류 테스트", () => {
  const userId = 1;
  const code = "123456";

  afterEach(async () => {
    sinon.restore();
    await secondAuthStore.removeCode(userId);
  });

  it("saveCode에서 redis setEx 실패 시 에러를 던진다", async () => {
    sinon.stub(redisClient, "setEx").rejects(new Error("Redis setEx failed"));

    try {
      await secondAuthStore.saveCode(userId, code, 180);
      throw new Error("여기 오면 안 됨"); // 이 줄에 오면 실패
    } catch (err) {
      expect(err).to.be.instanceOf(AppError);
      expect(err.message).to.include(
        "saveCode시 예상치 못한 에러가 발생하였습니다.",
      );
    }
  });

  it("getCodeData에서 redis get 실패 시 에러를 던진다", async () => {
    sinon.stub(redisClient, "get").rejects(new Error("Redis get failed"));

    try {
      await secondAuthStore.getCodeData(userId);
      throw new Error("여기 오면 안 됨");
    } catch (err) {
      expect(err).to.be.instanceOf(AppError);
      expect(err.message).to.include(
        "getCodeData시 예상치 못한 에러가 발생하였습니다.",
      );
    }
  });

  it("incrementAttempt에서 getCodeData 실패 시 에러를 던진다", async () => {
    sinon.stub(redisClient, "get").rejects(new Error("Redis get failed"));

    try {
      await secondAuthStore.incrementAttempt(userId);
      throw new Error("여기 오면 안 됨");
    } catch (err) {
      expect(err).to.be.instanceOf(AppError);
      expect(err.message).to.include(
        "getCodeData시 예상치 못한 에러가 발생하였습니다.",
      ); // get 실패가 원인
    }
  });

  it("removeCode에서 redis del 실패 시 에러를 던진다", async () => {
    sinon.stub(redisClient, "del").rejects(new Error("Redis del failed"));

    try {
      await secondAuthStore.removeCode(userId);
      throw new Error("여기 오면 안 됨");
    } catch (err) {
      expect(err).to.be.instanceOf(AppError);
      expect(err.message).to.include(
        "removeCode시 예상치 못한 에러가 발생하였습니다.",
      );
    }
  });

  it("getCodeData는 저장된 값이 JSON 형식이 아닐 때 null을 반환한다", async () => {
    sinon.stub(redisClient, "get").resolves("INVALID_JSON");

    try {
      await secondAuthStore.getCodeData(userId);
      throw new Error("여기 오면 안 됨"); // JSON.parse 실패해야 정상
    } catch (err) {
      expect(err).to.be.instanceOf(AppError);
      expect(err.message).to.include(
        "getCodeData시 예상치 못한 에러가 발생하였습니다.",
      );
    }
  });
});

describe("secondAuthStore 정상 테스트", () => {
  const userId = 1;
  const code = "123456";

  afterEach(async () => {
    sinon.restore();
    await secondAuthStore.removeCode(userId);
  });

  it("userId와 code를 입력받아 Redis에 저장 후 조회한다.", async () => {
    await secondAuthStore.saveCode(userId, code, 180);

    const data = await secondAuthStore.getCodeData(userId);

    expect(data.code).to.equal(code);
    expect(data.attempts).to.equal(0);
    expect(data.maxAttempts).to.equal(5);
  });

  it("userId와 code를 입력받아 Redis에 저장 후 attempts 1 증가한다.", async () => {
    await secondAuthStore.saveCode(userId, code, 180);
    await secondAuthStore.incrementAttempt(userId);

    const data = await secondAuthStore.getCodeData(userId);

    expect(data.attempts).to.equal(1);
  });

  it("userId와 code를 입력받아 Redis에 저장 후 삭제한다.", async () => {
    await secondAuthStore.saveCode(userId, code, 180);
    await secondAuthStore.removeCode(userId);

    const data = await secondAuthStore.getCodeData(userId);

    expect(data).to.be.null;
  });
});
