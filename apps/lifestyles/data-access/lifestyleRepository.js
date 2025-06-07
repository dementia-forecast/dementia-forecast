const SurveyResult = require("../models/SurveyResult");
const { rethrowAppErr } = require("../libraries/error-handling/src/rethrowErr");

async function findByUserIdAndQuestionId(userId, questionId) {
  try {
    return await SurveyResult.findOne({
      userId,
      "question_list.question_id": questionId,
    });
  } catch (err) {
    rethrowAppErr(err, {
      name: "Unexpected lifestyleRepository error",
      statusCode: 500,
      description: "lifestyleRepository에서 예기치 못한 오류가 발생했습니다.",
    });
  }
}

async function saveLifestyle(userId, questionId, answer) {
  try {
    return await SurveyResult.updateOne(
      { userId },
      { $push: { question_list: { question_id: questionId, answer } } },
      { upsert: true }
    );
  } catch (err) {
    rethrowAppErr(err, {
      name: "Unexpected lifestyleRepository error",
      statusCode: 500,
      description: "lifestyleRepository에서 예기치 못한 오류가 발생했습니다.",
    });
  }
}

async function updateLifestyle(userId, questionId, answer) {
  try {
    return await SurveyResult.updateOne(
      { userId, "question_list.question_id": questionId },
      { $set: { "question_list.$.answer": answer } }
    );
  } catch (err) {
    rethrowAppErr(err, {
      name: "Unexpected lifestyleRepository error",
      statusCode: 500,
      description: "lifestyleRepository에서 예기치 못한 오류가 발생했습니다.",
    });
  }
}

async function findByUserId(userId) {
  try {
    return await SurveyResult.findOne({ userId });
  } catch (err) {
    rethrowAppErr(err, {
      name: "Unexpected lifestyleRepository error",
      statusCode: 500,
      description: "lifestyleRepository에서 예기치 못한 오류가 발생했습니다.",
    });
  }
}

async function deleteByUserId(userId) {
  try {
    return await SurveyResult.findOneAndDelete({ userId });
  } catch (err) {
    rethrowAppErr(err, {
      name: "Unexpected lifestyleRepository error",
      statusCode: 500,
      description: "lifestyleRepository에서 예기치 못한 오류가 발생했습니다.",
    });
  }
}

module.exports = {
  findByUserIdAndQuestionId,
  saveLifestyle,
  updateLifestyle,
  findByUserId,
  deleteByUserId,
};
