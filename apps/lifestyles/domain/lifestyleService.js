const lifestyleRepository = require("../data-access/lifestyleRepository");
const AppError = require("../../../libraries/error-handling/src/AppError");

async function saveOrUpdateLifestyle(userId, questionList) {
  if (!userId || !questionList || !Array.isArray(questionList)) {
    throw new AppError(
      "Invalid Input",
      400,
      "Invalid userId or question_list format",
    );
  }

  const updates = [];

  for (const question of questionList) {
    const { question_id, answer } = question;

    if (!question_id || typeof answer !== "string") {
      throw new AppError(
        "Invalid Question Format",
        400,
        "question_id or answer is invalid",
      );
    }

    const existingData = await lifestyleRepository.findByUserIdAndQuestionId(
      userId,
      question_id,
    );

    let updatedData;
    if (existingData) {
      // 기존 데이터가 있으면 업데이트
      updatedData = await lifestyleRepository.updateLifestyle(
        userId,
        question_id,
        answer,
      );
    } else {
      // 기존 데이터가 없으면 새로 저장
      updatedData = await lifestyleRepository.saveLifestyle(
        userId,
        question_id,
        answer,
      );
    }

    updates.push(updatedData);
  }

  return updates;
}

async function getLifestyle(userId) {
  if (!userId) {
    throw new AppError("Unauthorized", 401, "User ID is required");
  }

  return await lifestyleRepository.findByUserId(userId);
}

module.exports = {
  saveOrUpdateLifestyle,
  getLifestyle,
};
