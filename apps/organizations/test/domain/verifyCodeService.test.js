const { expect } = require("chai");
const sinon = require("sinon");

const secondAuthStore = require("../../data-access/secondAuthStore");
const verifyCodeService = require("../../domain/verifyCodeService");
const AppError = require("../../../../libraries/error-handling/src/AppError.js");
const { Organization } = require("../../models/Organizations.js");

describe("verifyCodeService", () => {
  const userId = 1;
  const code = "123456";

  afterEach(async () => {
    sinon.restore();
    await secondAuthStore.removeCode(userId);
    await Organization.deleteMany({});
  });

  describe("verifyCodeService 에러 테스트", () => {
    // generateCode(userId)
    it("generateCode시 getCodeData에서 예상치 못한 에러 발생시 에러 rethrow", async () => {
      sinon
        .stub(secondAuthStore, "getCodeData")
        .rejects(new Error("secondAuthStore getCodeData failed"));

      try {
        const result = await verifyCodeService.generateCode(userId);
        console.log(result);
        throw new Error("여기 오면 안 됨"); // 실패해야 정상
      } catch (err) {
        expect(err).to.be.instanceOf(AppError);
        expect(err.message).to.include(
          "generateCode시 예기치 못한 에러가 발생하였습니다.",
        );
      }
    });

    // verifyCode(userId, inputCode)
    it("저장된 2차 인증 데이터가 존재하지 않을시 401 에러 throw", async () => {
      sinon.stub(secondAuthStore, "getCodeData").resolves(null);

      try {
        await verifyCodeService.verifyCode(userId, code);
        throw new Error("여기 오면 안 됨"); // 실패해야 정상
      } catch (err) {
        expect(err).to.be.instanceOf(AppError);
        expect(err.message).to.include("2차 인증 시간이 만료되었습니다.");
      }
    });

    it("2차 인증 횟수 초과시 401 에러 throw", async () => {
      sinon.stub(secondAuthStore, "getCodeData").resolves({
        code: code,
        createdAt: Date.now(),
        expiredAt: Date.now() + 180 * 1000,
        attempts: 5,
        maxAttempts: 5,
      });

      try {
        await verifyCodeService.verifyCode(userId, code);
        throw new Error("여기 오면 안 됨"); // 실패해야 정상
      } catch (err) {
        expect(err).to.be.instanceOf(AppError);
        expect(err.message).to.include("2차 인증 횟수가 초과되었습니다.");
      }
    });

    it("2차 인증 코드 맞지 않을시 attempts 1 증가 후 401 에러 throw", async () => {
      await secondAuthStore.saveCode(userId, code); // 미리 발급

      try {
        await verifyCodeService.verifyCode(userId, "234567");
        throw new Error("여기 오면 안 됨"); // 실패해야 정상
      } catch (err) {
        const data = await secondAuthStore.getCodeData(userId);
        expect(data.attempts).to.equal(1);
        expect(err).to.be.instanceOf(AppError);
        expect(err.message).to.include("2차 인증 코드가 맞지 않습니다.");
      }
    });

    it("verifyCode시 예상치 못한 에러 발생시 500 에러 throw", async () => {
      await secondAuthStore.saveCode(userId, code); // 미리 발급

      sinon
        .stub(secondAuthStore, "removeCode")
        .rejects(new Error("secondAuthStore removeCode failed"));

      try {
        await verifyCodeService.verifyCode(userId, code);
        throw new Error("여기 오면 안 됨"); // 실패해야 정상
      } catch (err) {
        expect(err).to.be.instanceOf(AppError);
        expect(err.message).to.include(
          "verifyCode시 예기치 못한 에러가 발생하였습니다.",
        );
      }
    });
  });

  describe("verifyCodeService 정상 작동 테스트", () => {
    // generateCode(userId)
    it("generateCode시 이미 발급된 code 존재시 그대로 반환", async () => {
      await secondAuthStore.saveCode(userId, code); // 미리 발급

      const getCode = await verifyCodeService.generateCode(userId);
      expect(getCode).to.equal(code);
    });

    it("generateCode시 발급된 code 없을시 saveCode 후 해당 코드 반환 ", async () => {
      sinon.stub(secondAuthStore, "getCodeData").resolves(null);

      const getCode = await verifyCodeService.generateCode(userId);
      expect(getCode).to.exist;
    });

    // verifyCode(userId, inputCode)
    it("올바른 상태의 code가 Redis에 저장되어 있고 올바른 2차 인증 코드 입력 시 true 반환", async () => {
      await secondAuthStore.saveCode(userId, code); // 미리 발급

      const result = await verifyCodeService.verifyCode(userId, code);
      const isRemove = (await secondAuthStore.getCodeData(userId)) === null;
      expect(result).to.equal(true);
      expect(isRemove).to.equal(true);
    });
  });
});
console;
