const Organization = require("./organization.model");

/**
 * email로 기관 찾기
 */
async function getOrganizationByEmail(email) {
  return await Organization.findOne({ email });
}

/**
 * 전체 기관 리스트 가져오기
 */
async function getAllOrganizations() {
  return await Organization.find();
}

module.exports = { getOrganizationByEmail, getAllOrganizations };
