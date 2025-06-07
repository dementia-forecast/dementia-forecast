const ReportRepository = require("../data-access/ReportRepository");
const { rethrowAppErr } = require("../libraries/error-handling/src/rethrowErr");

// 1. 한 사용자의 분석 레포트 조회
async function findReportByEmail(email) {
  try {
    // userId 조회
    const userId = await ReportRepository.findUserIdByEmail(email);

    // 분석 레포트 반환
    const report = await ReportRepository.getLatestReport(userId);

    return {
      riskScore: report.riskScore,
      lifelogs: report.lifelogs,
      lifestyles: report.lifestyles,
    };
  } catch (err) {
    rethrowAppErr(err, {
      name: "Unexpected OrgService error",
      statusCode: 500,
      description: "사용자 분석 레포트 조회에 실패했습니다.",
    });
  }
}

// 2. 위험도 높은 사람들 중 start~start+99의 이메일 제공
async function findReportByInfo(orgid, start) {
  try {
    return await ReportRepository.findHighRiskEmails(orgid, start);
  } catch (err) {
    rethrowAppErr(err, {
      name: "Unexpected OrgService error",
      statusCode: 500,
      description: "고위험 사용자 이메일 조회에 실패했습니다.",
    });
  }
}

// 3. 위험도 높은 사용자 수 반환
async function countRiskUsers(orgid) {
  try {
    return await ReportRepository.countHighRiskUsers(orgid);
  } catch (err) {
    rethrowAppErr(err, {
      name: "Unexpected OrgService error",
      statusCode: 500,
      description: "고위험 사용자 이메일 조회에 실패했습니다.",
    });
  }
}

module.exports = {
  findReportByEmail,
  findReportByInfo,
  countRiskUsers,
};
