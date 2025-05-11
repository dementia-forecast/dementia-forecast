const verifyCodeService = require("../domain/verifyCodeService");
const mailService = require("../domain/mailService");
const AppError = require("../../../libraries/error-handling/src/AppError");

async function secAuthSend(req, res, next) {
  try {
    const userId = req.userId; // authenticate 미들웨어에서 추출된 userId
    const orgEmail = await mailService.getOrgMail(userId);

    // 1. 2차 인증 번호 발급
    const userCode = await verifyCodeService.generateCode(userId);

    // 2. 2차 인증 번호 메일 전송
    // 2-1. 메일 옵션 생성
    const mailOptions = mailService.createMailOptions(orgEmail, userCode);

    // 2-2. 메일 전송
    const info = await mailService.transporter.sendMail(mailOptions);

    if (info.accepted.length > 0) {
      res.status(200).json({ message: "2차 인증번호 전송 성공" });
    } else {
      throw new AppError("secAuthSend fail", 500, "2차 인증번호 전송 실패");
    }
  } catch (err) {
    next(err);
  }
}

async function secAuthVerify(req, res, next) {
  try {
    const userId = req.userId; // authenticate 미들웨어에서 추출된 userId
    const { code } = req.body;

    const result = await verifyCodeService.verifyCode(userId, code);
    if (result) {
      return res.status(200).json({ message: "2차 인증 성공" });
    } else {
      throw new AppError("secAuthVerify fail", 500, "2차 인증 실패");
    }
  } catch (err) {
    next(err); // 에러를 미들웨어로 전달
  }
}

module.exports = {
  secAuthSend,
  secAuthVerify,
};
