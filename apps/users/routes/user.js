const express = require("express");
const router = express.Router();
const verifyToken = require("./middlewares/verifyTokens");
const User = require("../models/user"); // Mongoose 모델

const path = require("path");
const fs = require("fs");

const filePath = path.resolve(__dirname, "../resources/orgIds.json");
const raw = fs.readFileSync(filePath, "utf-8");
const orgIds = JSON.parse(raw);

router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email }).select(
      "-password",
    );

    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    res.json({ user });
  } catch (err) {
    console.error("프로필 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

router.put("/update", verifyToken, async (req, res) => {
  const { password, name, dob, gender, contact, address, consent } = req.body;

  // dob Date 타입으로 변경
  const dobStr = dob.toString(); // "19950312"
  const year = dobStr.slice(0, 4);
  const month = dobStr.slice(4, 6);
  const day = dobStr.slice(6, 8);

  // UTC 기준으로 날짜 객체 생성
  const birthdate = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day)),
  );

  try {
    const updateData = {};
    if (password) updateData.password = password;
    if (name) updateData.name = name;
    if (dob) updateData.dob = birthdate;
    if (gender) updateData.gender = gender;
    if (contact) updateData.contact = contact;
    if (address) {
      updateData.address = address;
      const parts = address.split(" ");
      if (orgIds[parts[0]]) {
        updateData.local = orgIds[parts[0]];
      } else {
        updateData.local = 0;
      }
    }
    if (typeof consent === "number") updateData.consent = consent;

    const user = await User.findOneAndUpdate(
      { email: req.user.email },
      { $set: updateData },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    res.json({ message: "회원 정보가 수정되었습니다.", user });
  } catch (err) {
    console.error("회원 정보 수정 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

router.delete("/delete", verifyToken, async (req, res) => {
  try {
    const result = await User.deleteOne({ email: req.user.email });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    res.json({ message: "회원 탈퇴가 완료되었습니다." });
  } catch (err) {
    console.error("회원 탈퇴 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;
