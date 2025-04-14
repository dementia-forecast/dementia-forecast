const SurveyResult = require("../models/SurveyResult");

async function findByUserIdAndQuestionId(userId, questionId) {
  return await SurveyResult.findOne({
    userId,
    "question_list.question_id": questionId,
  });
}

async function saveLifestyle(userId, questionId, answer) {
  return await SurveyResult.updateOne(
    { userId },
    { $push: { question_list: { question_id: questionId, answer } } },
    { upsert: true },
  );
}

async function updateLifestyle(userId, questionId, answer) {
  return await SurveyResult.updateOne(
    { userId, "question_list.question_id": questionId },
    { $set: { "question_list.$.answer": answer } },
  );
}

async function findByUserId(userId) {
  return await SurveyResult.findOne({ userId });
}

module.exports = {
  findByUserIdAndQuestionId,
  saveLifestyle,
  updateLifestyle,
  findByUserId,
};
