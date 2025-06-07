const lifestyleService = require("../domain/lifestyleService");
const AppError = require("../libraries/error-handling/src/AppError"); // AppError 추가

async function saveLifestyle(req, res, next) {
  try {
    const userId = req.userId; // authenticate 미들웨어에서 추출된 userId
    const { question_list } = req.body;

    // 유효성 검사
    if (!question_list || !Array.isArray(question_list)) {
      throw new AppError(
        "Invalid request data",
        400,
        "question_list가 유효하지 않습니다."
      );
    }

    // 서비스 호출 (저장 또는 업데이트 수행)
    const result = await lifestyleService.saveOrUpdateLifestyle(
      userId,
      question_list
    );

    return res.status(200).json({
      message: "라이프스타일 저장 및 수정 성공",
      data: result, // 업데이트된 데이터 반환
    });
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
        "사용자의 라이프 스타일 정보가 존재하지 않습니다."
      );
    }

    return res.status(200).json({
      message: "라이프스타일 조회 성공",
      question_list: result.question_list,
    });
  } catch (err) {
    next(err); // 에러를 미들웨어로 전달
  }
}

async function deleteLifestyle(req, res, next) {
  try {
    const userId = req.userId; // 인증된 사용자 ID
    result = await lifestyleService.delLifestyle(userId);

    return res.status(200).json({
      message: "라이프스타일 삭제 성공",
    });
  } catch (err) {
    next(err); // 에러를 미들웨어로 전달
  }
}

module.exports = {
  saveLifestyle,
  getLifestyle,
  deleteLifestyle,
};
