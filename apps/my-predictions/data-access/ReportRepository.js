// const { User, SurveyResult, Report } = require("./dbConnections");
const { User, SurveyResult, Report } = require("../models/Reports");
const AppError = require("../libraries/error-handling/src/AppError");
const { rethrowAppErr } = require("../libraries/error-handling/src/rethrowErr");

// userId 조회
async function findUserIdByEmail(email) {
  try {
    const user = await User.findOne({ email });
    if (user == null) {
      throw new AppError(
        "user does not exist.",
        400,
        "해당하는 user가 없습니다."
      );
    }
    return user.userId;
  } catch (err) {
    rethrowAppErr(err, {
      name: "Unexpected UserRepository error",
      statusCode: 500,
      description: "userId 조회에 실패하였습니다.",
    });
  }
}

// User 결과 가져오기
async function findUserByUserId(userId) {
  try {
    return await User.findOne({ userId });
  } catch (err) {
    rethrowAppErr(err, {
      name: "Unexpected lifestyleRepository error",
      statusCode: 500,
      description: "User 정보 조회에 실패하였습니다.",
    });
  }
}

// 라이프스타일 결과 가져오기
async function findByUserId(userId) {
  try {
    return await SurveyResult.findOne({ userId });
  } catch (err) {
    rethrowAppErr(err, {
      name: "Unexpected lifestyleRepository error",
      statusCode: 500,
      description: "라이프 스타일 정보 조회에 실패하였습니다.",
    });
  }
}

// 저장
const saveReport = async (reportData) => {
  try {
    const report = new Report(reportData);
    await report.save();
    return report;
  } catch (err) {
    rethrowAppErr(err, "레포트 저장에 실패하였습니다.");
  }
};

// 수정
const updateReport = async (userId, reportData) => {
  try {
    const report = new Report(reportData);
    await Report.updateOne(
      { userId: userId },
      { $set: reportData },
      { upsert: false } // upsert true로 하면 없으면 새로 생성
    );
    return report;
  } catch (err) {
    rethrowAppErr(err, "레포트 수정에 실패하였습니다.");
  }
};

// 가장 최근 레포트 1개 조회
const getLatestReport = async (userId) => {
  try {
    const report = await Report.findOne({ userId })
      .sort({ createdAt: -1 })
      .select("-userId") // userId 제외
      .exec();
    return report;
  } catch (err) {
    rethrowAppErr(err, "최신 레포트 가져오기에 실패하였습니다.");
  }
};

// 가장 최근 레포트 3개 조회
const getThreeReports = async (userId) => {
  try {
    const reports = await Report.find({ userId })
      .sort({ createdAt: -1 })
      .limit(3)
      .select("-userId") // userId 제외
      .exec();
    return reports;
  } catch (err) {
    rethrowAppErr(err, "최신 리포트 3개 가져오기에 실패하였습니다.");
  }
};

// date에 따른 레포트 조회
async function findReportByUserIdAndDate(userId, constrastDate) {
  try {
    return await Report.findOne({
      userId,
      createdAt: constrastDate,
    }).lean();
  } catch (err) {
    rethrowAppErr(
      err,
      "해당 날짜에 해당하는 레포트 가져오기에 실패하였습니다."
    );
  }
}

async function findHighRiskEmails(orgid, start) {
  try {
    const limit = 100;
    const reports = await Report.find({
      orgid,
      riskScore: { $gte: 0.8 },
    })
      .sort({ riskScore: -1 }) // 위험도 높은 순 내림차순 정렬
      .skip(start)
      .limit(limit);

    const emails = reports.map((report) => report.email);
    const uniqueEmails = [...new Set(emails)];
    return uniqueEmails;
  } catch (err) {
    rethrowAppErr(err, {
      name: "Unexpected ReportRepository error",
      statusCode: 500,
      description: "고위험 사용자 이메일 조회에 실패했습니다.",
    });
  }
}

async function countHighRiskUsers(orgid) {
  try {
    const result = await Report.aggregate([
      {
        $match: {
          orgid,
          riskScore: { $gte: 0.8 },
        },
      },
      {
        $group: {
          _id: "$userId", // userId 기준으로 그룹핑 (중복 제거)
        },
      },
      {
        $count: "uniqueCount", // 고유 userId 개수 세기
      },
    ]);

    const count = result[0]?.uniqueCount || 0;
    return count;
  } catch (err) {
    rethrowAppErr(err, {
      name: "Unexpected ReportRepository error",
      statusCode: 500,
      description: "고위험 사용자 수 조회에 실패했습니다.",
    });
  }
}

async function deleteByUserId(userId) {
  try {
    return await Report.deleteMany({ userId });
  } catch (err) {
    rethrowAppErr(err, {
      name: "Unexpected ReportRepository error",
      statusCode: 500,
      description: "ReportRepository 예기치 못한 오류가 발생했습니다.",
    });
  }
}

module.exports = {
  findUserIdByEmail,
  findUserByUserId,
  findByUserId,
  saveReport,
  updateReport,
  getLatestReport,
  getThreeReports,
  findReportByUserIdAndDate,
  findHighRiskEmails,
  countHighRiskUsers,
  deleteByUserId,
};
