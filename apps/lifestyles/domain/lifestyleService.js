const lifestyleRepository = require("../data-access/lifestyleRepository");
const AppError = require("../libraries/error-handling/src/AppError");
const { rethrowAppErr } = require("../libraries/error-handling/src/rethrowErr");

async function saveOrUpdateLifestyle(userId, questionList) {
  try {
    if (!userId || !questionList || !Array.isArray(questionList)) {
      throw new AppError(
        "Invalid Input",
        400,
        "userId가 존재하지 않거나 question_list 포맷이 잘못되었습니다."
      );
    }

    const updates = [];

    // 질문 하나씩 처리
    for (const question of questionList) {
      const { question_id, answer } = question;

      if (!question_id || typeof answer !== "string") {
        throw new AppError(
          "Invalid Question Format",
          400,
          "question_id 또는 answer 포맷이 잘못되었습니다."
        );
      }

      const existingData = await lifestyleRepository.findByUserIdAndQuestionId(
        userId,
        question_id
      );

      if (existingData) {
        // 기존 데이터가 있으면 업데이트
        await lifestyleRepository.updateLifestyle(userId, question_id, answer);
      } else {
        // 기존 데이터가 없으면 새로 저장
        await lifestyleRepository.saveLifestyle(userId, question_id, answer);
      }

      updates.push({ question_id: question_id, answer: answer });
    }

    return updates;
  } catch (err) {
    rethrowAppErr(err, {
      name: "Unexpected lifestyleService error",
      statusCode: 500,
      description: "lifestyleService에서 예기치 못한 오류가 발생했습니다.",
    });
  }
}

async function getLifestyle(userId) {
  try {
    if (!userId) {
      throw new AppError("Invalid Input", 400, "userId가 존재하지 않습니다.");
    }

    return await lifestyleRepository.findByUserId(userId);
  } catch (err) {
    rethrowAppErr(err, {
      name: "Unexpected lifestyleService error",
      statusCode: 500,
      description: "lifestyleService에서 예기치 못한 오류가 발생했습니다.",
    });
  }
}

async function delLifestyle(userId) {
  try {
    if (!userId) {
      throw new AppError("Invalid Input", 400, "userId가 존재하지 않습니다.");
    }

    return await lifestyleRepository.deleteByUserId(userId);
  } catch (err) {
    rethrowAppErr(err, {
      name: "Unexpected lifestyleService error",
      statusCode: 500,
      description: "lifestyleService에서 예기치 못한 오류가 발생했습니다.",
    });
  }
}

module.exports = {
  saveOrUpdateLifestyle,
  getLifestyle,
  delLifestyle,
};
