const PredictionService = require("../domain/PredictionService");
const OrgService = require("../domain/OrgService");

// 분석 레포트 생성
async function createReport(req, res, next) {
  try {
    const userId = req.userId; // authenticate 미들웨어에서 추출된 userId
    const parsedData = req.body;

    const [riskScore, lifelogValues, lifeStyleValues] =
      await PredictionService.makePrediction(userId, parsedData);

    // risk_level 계산
    let risk_level = "low";
    if (riskScore >= 0.8) risk_level = "high";
    else if (riskScore >= 0.5) risk_level = "medium";

    // lifeStyleValues -> question_list 변환
    const question_list = lifeStyleValues.map((item) => ({
      question_id: item.question_id,
      answer: item.answer,
    }));

    // lifelogValues → biometric_data_list 변환
    const biometric_data_list = lifelogValues.map((item) => ({
      biometric_data_id: item.feature_id,
      biometric_data_value: item.value,
    }));

    res.status(200).json({
      risk_score: riskScore,
      risk_level,
      question_list,
      biometric_data_list,
      message: "레포트 생성 성공",
    });
  } catch (err) {
    next(err);
  }
}

// 분석레포트 조회
async function findReport(req, res, next) {
  try {
    const userId = req.userId; // authenticate 미들웨어에서 추출된 userId
    const create_date = req.params.date; // YYYYMMDD 형태

    // 해당 날짜에 대한 보고서 조회 및 복호화
    const [riskScore, lifelogValues, lifeStyleValues] =
      await PredictionService.findReportByDate(userId, create_date);

    // risk_level 계산
    let risk_level = "low";
    if (riskScore >= 0.8) risk_level = "high";
    else if (riskScore >= 0.5) risk_level = "medium";

    // lifelogValues → biometric_data_list 변환
    const biometric_data_list = lifelogValues.map((item) => ({
      biometric_data_id: item.feature_id,
      biometric_data_value: item.value,
    }));

    // lifeStyleValues → question_list 변환
    const question_list = lifeStyleValues.map((item) => ({
      question_id: item.question_id,
      answer: item.answer,
    }));

    res.status(200).json({
      risk_score: riskScore,
      risk_level,
      question_list,
      biometric_data_list,
      message: "레포트 조회 성공",
    });
  } catch (err) {
    next(err);
  }
}

// 한 사용자의 분석 레포트 조회 (email)
async function getReportByEmail(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "email이 필요합니다." });
    }

    const report = await OrgService.findReportByEmail(email);

    res.status(200).json({
      riskScore: report.riskScore,
      lifelogs: report.lifelogs,
      lifestyles: report.lifestyles,
      message: "분석 레포트 조회 성공(공공기관)",
    });
  } catch (err) {
    next(err);
  }
}

// 2. 위험도 높은 사람들 중 start~start+99 이메일 제공 (orgid, start)
async function getHighRiskEmails(req, res, next) {
  try {
    const { orgid, start } = req.body;

    if (orgid === undefined || start === undefined) {
      return res.status(400).json({ message: "orgid와 start가 필요합니다." });
    }

    const emails = await OrgService.findReportByInfo(orgid, start);

    res
      .status(200)
      .json({ emails: emails, message: "이메일 조회 성공(공공기관)" });
  } catch (err) {
    next(err);
  }
}

// 3. 위험도 높은 사용자 수 반환 (orgid)
async function getHighRiskUserCount(req, res, next) {
  try {
    const { orgid } = req.body;

    if (orgid === undefined) {
      return res.status(400).json({ message: "orgid가 필요합니다." });
    }

    const count = await OrgService.countRiskUsers(orgid);

    res.status(200).json({
      count: count,
      message: "위험도 높은 사용자 수 조회 성공(공공기관)",
    });
  } catch (err) {
    next(err);
  }
}

async function deleteReport(req, res, next) {
  try {
    const userId = req.userId; // 인증된 사용자 ID
    await PredictionService.delReport(userId);

    return res.status(200).json({
      message: "레포트 삭제 성공",
    });
  } catch (err) {
    next(err); // 에러를 미들웨어로 전달
  }
}

module.exports = {
  createReport,
  findReport,
  getReportByEmail,
  getHighRiskEmails,
  getHighRiskUserCount,
  deleteReport,
};
