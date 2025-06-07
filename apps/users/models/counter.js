const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // 'userId', 'orgid' 같은 키
  seq: { type: Number, default: 0 },
});

module.exports = mongoose.model("Counter", counterSchema);
