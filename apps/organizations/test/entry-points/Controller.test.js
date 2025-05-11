const { expect } = require("chai");
const sinon = require("sinon");
const config = require("config");
const apiKey = config.get("apiKey");
const rmail = config.get("test-receiver-mail");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const app = require("../../index.js");

const { Organization } = require("../../models/Organizations.js");
const orgRepository = require("../../data-access/orgRepository.js");
const secondAuthStore = require("../../data-access/secondAuthStore");
const mailService = require("../../domain/mailService");
const verifyCodeService = require("../../domain/verifyCodeService");

describe("컨트롤러 & app", () => {
  const userId = 1;
  const code = "123456";

  afterEach(async () => {
    await secondAuthStore.removeCode(userId);
    await Organization.deleteMany({});
    sinon.restore();
  });

  // send-code
  describe("send-code 오류 작동 테스트", () => {
    it("Service단 예상치 못한 에러 발생시 500 에러 throw", async function () {
      this.timeout(5000); // 타임아웃을 5초로 설정

      // org 저장
      await orgRepository.saveOrganization(userId, rmail);

      sinon
        .stub(mailService, "getOrgMail")
        .rejects(new Error("mailService getOrgMail failed"));

      const token = jwt.sign({ userId: userId }, apiKey);

      const res = await request(app)
        .post("/org/second-auth/send-code")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(res.status).to.equal(500);
      expect(res.body.message).to.include("mailService getOrgMail failed");
    });
  });

  describe("send-code 정상 작동 테스트", () => {
    const token = jwt.sign({ userId: userId }, apiKey);

    it("send-code가 정상적으로 작동한다.", async function () {
      this.timeout(5000); // 타임아웃을 5초로 설정

      // org 저장
      await orgRepository.saveOrganization(userId, rmail);

      const res = await request(app)
        .post("/org/second-auth/send-code")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(res.status).to.equal(200);
      expect(res.body.message).to.equal("2차 인증번호 전송 성공");
    });
  });

  // verify-code
  describe("verify-code 오류 작동 테스트", () => {
    it("Service단 예상치 못한 오류 발생 시 500 에러 반환", async () => {
      const token = jwt.sign({ userId: userId }, apiKey);
      sinon
        .stub(verifyCodeService, "verifyCode")
        .rejects(new Error("Service verifyCode failed"));

      // 미리 저장
      await secondAuthStore.saveCode(userId, code, 180);

      const res = await request(app)
        .post("/org/second-auth/verify-code")
        .set("Authorization", `Bearer ${token}`)
        .send({ code: code });

      expect(res.status).to.equal(500);
      expect(res.body.message).to.equal("Service verifyCode failed"); // 바로 next로 넘기기 때문
    });
  });

  describe("verify-code 정상 작동 테스트", () => {
    const token = jwt.sign({ userId: userId }, apiKey);

    it("verify-code가 정상적으로 작동한다.", async () => {
      // 미리 저장
      await secondAuthStore.saveCode(userId, code, 180);

      const res = await request(app)
        .post("/org/second-auth/verify-code")
        .set("Authorization", `Bearer ${token}`)
        .send({ code: code });

      expect(res.status).to.equal(200);
      expect(res.body.message).to.equal("2차 인증 성공");
    });
  });
});
