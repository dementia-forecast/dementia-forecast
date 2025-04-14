const mongoose = require("mongoose");

const SurveyResultSchema = new mongoose.Schema({
  userId: { type: Number, required: true, unique: true },
  question_list: [
    {
      question_id: { type: Number, required: true },
      answer: { type: String, required: true },
    },
  ],
});

module.exports = mongoose.model("SurveyResult", SurveyResultSchema);
