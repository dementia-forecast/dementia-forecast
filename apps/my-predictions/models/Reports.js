const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userId: {
    type: Number,
    unique: true,
  },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  name: { type: String },
  kakaoId: { type: String },
  dob: { type: Date },
  gender: { type: String },
  contact: { type: String },
  address: { type: String },
  local: { type: Number },
  consent: { type: Number },
  created_at: { type: Date, default: Date.now },
});

const SurveyResultSchema = new mongoose.Schema({
  userId: { type: Number, required: true, unique: true },
  question_list: [
    {
      question_id: { type: Number, required: true },
      answer: { type: String, required: true },
    },
  ],
});

function getCurrentKSTDate() {
  const now = new Date();

  // UTC 시간 밀리초 + 9시간(9*60*60*1000)
  const kstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);

  // KST 기준 연, 월, 일, 시, 분, 초 추출
  const year = kstTime.getUTCFullYear();
  const month = kstTime.getUTCMonth(); // 0~11
  const day = kstTime.getUTCDate();
  const hour = 0;
  const minute = 0;
  const second = 0;

  // KST 시각으로 Date 객체 생성 (UTC 기준이지만 9시간 더한 시각으로 만듦)
  // 여기서 그냥 kstTime 리턴해도 됨, 아래는 좀 더 명확히 생성하는 버전
  return new Date(Date.UTC(year, month, day, hour, minute, second));
}

const ReportSchema = new mongoose.Schema({
  userId: { type: Number, required: true },
  orgid: { type: Number },
  email: { type: String, required: true },
  riskScore: { type: Number, required: true },
  consent: { type: Number, required: true },
  createdAt: {
    type: Date,
    default: getCurrentKSTDate,
  },
  lifelogs: { type: String, required: true }, // JSON.stringify → 암호문 저장
  lifestyles: { type: String, required: true }, // JSON.stringify → 암호문 저장
});

const OrganizationSchema = new mongoose.Schema({
  orgId: { type: Number, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  address: {
    city: { type: String, required: true },
    district: { type: String, required: true },
    detail: { type: String },
  },
});

const OrgLogSchema = new mongoose.Schema({
  logId: { type: Number, required: true, unique: true },
  orgId: { type: Number, required: true },
  target_userId: { type: Number, required: true },
  action_type: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  details: { type: String },
});

module.exports = {
  User: mongoose.model("User", userSchema),
  SurveyResult: mongoose.model("SurveyResult", SurveyResultSchema),
  Report: mongoose.model("Report", ReportSchema),
  Organization: mongoose.model("Organization", OrganizationSchema),
  OrgLog: mongoose.model("OrgLog", OrgLogSchema),
};
