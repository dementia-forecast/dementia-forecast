const nodemailer = require("nodemailer");
const config = require("config");
const user = config.get("nodemailer-user");
const pass = config.get("nodemailer-pass");
const orgRepository = require("../data-access/orgRepository");
const AppError = require("../../../libraries/error-handling/src/AppError");
const {
  rethrowAppErr,
} = require("../../../libraries/error-handling/src/rethrowErr");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: user,
    pass: pass,
  },
});

function createMailOptions(toEmail, code) {
  return {
    from: user,
    to: toEmail,
    subject: "치매예보 2차 인증코드 안내",
    html: `
  <p>2차 인증 코드는 다음과 같습니다.</p>
  <pre style="padding: 10px; background-color: #f4f4f4; border: 1px solid #ddd; font-size: 18px;">
${String(code)}
  </pre>
`,
  };
}

async function getOrgMail(orgId) {
  try {
    const existingData = await orgRepository.findByOrgId(orgId);
    if (!existingData) {
      throw new AppError("Invalid Input", 400, "orgId가 존재하지 않습니다.");
    }
    return existingData.email;
  } catch (err) {
    rethrowAppErr(err, {
      name: "getOrgMail failure",
      statusCode: 500,
      description: "getOrgMail시 예기치 못한 에러가 발생하였습니다.",
    });
  }
}

module.exports = {
  transporter,
  createMailOptions,
  getOrgMail,
};
