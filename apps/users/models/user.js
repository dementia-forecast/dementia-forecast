const mongoose = require("mongoose");
const Counter = require("./counter"); // 위에서 만든 counter 모델

const userSchema = new mongoose.Schema({
  userId: {
    type: Number,
    unique: true,
  },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  name: { type: String },
  kakaoId: { type: String },
  dob: { type: Date },
  gender: { type: String },
  contact: { type: String },
  address: { type: String },
  local: { type: Number },
  consent: { type: Number },
  created_at: { type: Date, default: Date.now },
});

// userId 자동 증가 로직
userSchema.pre("save", async function (next) {
  if (this.isNew && this.userId == null) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: "userId" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true },
      );
      this.userId = counter.seq;
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

module.exports = mongoose.model("User", userSchema);
