const lifestyleService = require("../domain/lifestyleService");
const AppError = require("../../../libraries/error-handling/src/AppError"); // AppError 추가

async function saveLifestyle(req, res, next) {
  try {
    const userId = req.userId; // authenticate 미들웨어에서 추출된 userId
    const { question_list } = req.body;

    // 유효성 검사
    if (!question_list || !Array.isArray(question_list)) {
      throw new AppError(
        "Invalid request data",
        400,
        "question_list가 유효하지 않습니다.",
      );
    }

    // 서비스 호출 (저장 또는 업데이트 수행)
    const result = await lifestyleService.saveOrUpdateLifestyle(
      userId,
      question_list,
    );

    return res
      .status(200)
      .json({ message: "라이프스타일 저장 성공", data: result });
  } catch (err) {
    next(err); // 에러를 미들웨어로 전달
  }
}

async function getLifestyle(req, res, next) {
  try {
    const userId = req.userId; // 인증된 사용자 ID
    const result = await lifestyleService.getLifestyle(userId);

    if (!result) {
      throw new AppError(
        "Lifestyle not found",
        404,
        "해당 사용자의 라이프스타일 데이터를 찾을 수 없습니다.",
      );
    }

    return res
      .status(200)
      .json({ message: "라이프스타일 조회 성공", data: result });
  } catch (err) {
    next(err); // 에러를 미들웨어로 전달
  }
}

module.exports = {
  saveLifestyle,
  getLifestyle,
};
