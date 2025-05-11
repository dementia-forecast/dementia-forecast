const sinon = require("sinon");
const { expect } = require("chai");
const { Organization } = require("../../models/Organizations.js");
const {
  findByOrgId,
  saveOrganization,
} = require("../../data-access/orgRepository.js");
const AppError = require("../../../../libraries/error-handling/src/AppError.js");
const config = require("config");
const rmail = config.get("test-receiver-mail");

describe("orgRepository 에러 작동 테스트", () => {
  beforeEach(async () => {
    await Organization.deleteMany();
    sinon.restore();
  });

  it("DB에 없는 orgId 데이터를 조회하면 null을 반환한다.", async () => {
    const result = await findByOrgId(999);
    expect(result).to.be.null;
  });

  it("findByOrgId에서 Organization.findOne 실패 시 에러를 던진다", async () => {
    await saveOrganization(1, rmail);

    // Organization.findOne을 실패하도록 stub
    sinon
      .stub(Organization, "findOne")
      .rejects(new Error("Organization findOne failed"));

    try {
      await findByOrgId(1);
      throw new Error("여기 오면 안 됨"); // 실패해야 정상
    } catch (err) {
      expect(err).to.be.instanceOf(AppError);
      expect(err.message).to.include(
        "orgRepository에서 예기치 못한 오류가 발생했습니다.",
      );
    }
  });
});

describe("orgRepository 정상 작동 테스트", () => {
  beforeEach(async () => {
    await Organization.deleteMany();
    sinon.restore();
  });

  it("orgId 1번과 email exmail로 Organization 저장 후 findByOrgId로 조회", async () => {
    // 저장
    await saveOrganization(1, rmail);

    // 조회
    const foundOrg = await findByOrgId(1);

    expect(foundOrg).to.not.be.null;
    expect(foundOrg.orgId).to.equal(1);
    expect(foundOrg.email).to.equal(rmail);
    expect(foundOrg.name).to.equal("Example Organization");
    expect(foundOrg.address.city).to.equal("Seoul");
  });
});
