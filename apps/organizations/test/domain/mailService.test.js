const { expect } = require("chai");
const sinon = require("sinon");
const config = require("config");
const user = config.get("nodemailer-user");
const { Organization } = require("../../models/Organizations.js");
const mailService = require("../../domain/mailService.js");
const orgRepository = require("../../data-access/orgRepository.js");
const AppError = require("../../../../libraries/error-handling/src/AppError.js");

describe("mail Service", () => {
  afterEach(async () => {
    sinon.restore();
    await Organization.deleteMany();
  });

  describe("mailService 에러 작동 테스트", () => {
    // Repository -> Service 에러 전달 체크
    it("findByOrgId가 null 반환하면 getOrgMail은 400 에러를 던진다.", async () => {
      sinon.stub(orgRepository, "findByOrgId").resolves(null);

      try {
        await mailService.getOrgMail(999);
        throw new Error("여기 오면 안 됨"); // 실패해야 정상
      } catch (err) {
        expect(err).to.be.instanceOf(AppError);
        expect(err.message).to.include("orgId가 존재하지 않습니다.");
      }
    });

    it("getOrgMail에서 예기치 못한 에러 발생시 500 에러를 던진다.", async () => {
      // 저장
      const org = new Organization({
        orgId: 1,
        email: "example@naver.com",
        name: "Example Organization",
        address: {
          city: "Seoul",
          district: "Gangnam",
          detail: "123-456 Some Building",
        },
      });

      await org.save();

      sinon
        .stub(orgRepository, "findByOrgId")
        .rejects(new Error("orgRepository findByOrgId failed"));

      try {
        await mailService.getOrgMail(1);
        throw new Error("여기 오면 안 됨"); // 실패해야 정상
      } catch (err) {
        expect(err).to.be.instanceOf(AppError);
        expect(err.message).to.include(
          "getOrgMail시 예기치 못한 에러가 발생하였습니다.", // stub에서 에러를 낸거지 타고 내려온 에러가 아니므로
        );
      }
    });
  });

  describe("mailService 정상 작동 테스트", () => {
    it("새 MailOptions를 생성한다.", () => {
      const toEmail = "example@naver.com";
      const code = "123456";

      const result = mailService.createMailOptions(toEmail, code);

      expect(result).to.deep.equal({
        from: user,
        to: toEmail,
        subject: "치매예보 2차 인증코드 안내",
        html: `
  <p>2차 인증 코드는 다음과 같습니다.</p>
  <pre style="padding: 10px; background-color: #f4f4f4; border: 1px solid #ddd; font-size: 18px;">
123456
  </pre>
`,
      });
    });

    it("새 MailOptions를 생성한다.", async () => {
      // 저장
      const org = new Organization({
        orgId: 1,
        email: "example@naver.com",
        name: "Example Organization",
        address: {
          city: "Seoul",
          district: "Gangnam",
          detail: "123-456 Some Building",
        },
      });

      await org.save();

      const example_mail = await mailService.getOrgMail(1);

      expect(example_mail).to.equal("example@naver.com");
    });
  });
});
