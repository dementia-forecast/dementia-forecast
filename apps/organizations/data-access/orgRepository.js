const { Organization } = require("../models/Organizations");
const {
  rethrowAppErr,
} = require("../../../libraries/error-handling/src/rethrowErr");

async function findByOrgId(orgId) {
  // null은 예외 처리 안함
  try {
    const result = await Organization.findOne({ orgId: orgId });
    return result;
  } catch (err) {
    rethrowAppErr(err, {
      name: "Unexpected orgRepository error",
      statusCode: 500,
      description: "orgRepository에서 예기치 못한 오류가 발생했습니다.",
    });
  }
}

async function saveOrganization(orgId, email) {
  // test용
  // 혹시 기존에 같은 orgId가 있다면 삭제 (중복 방지)
  try {
    await Organization.deleteMany({ orgId });

    const org = new Organization({
      orgId,
      email,
      name: "Example Organization",
      address: {
        city: "Seoul",
        district: "Gangnam",
        detail: "123-456 Some Building",
      },
    });
    await org.save();
    return org;
  } catch (err) {
    rethrowAppErr(err, {
      name: "Unexpected orgRepository error",
      statusCode: 500,
      description: "orgRepository에서 예기치 못한 오류가 발생했습니다.",
    });
  }
}

module.exports = { findByOrgId, saveOrganization };
