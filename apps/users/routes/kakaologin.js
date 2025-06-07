const express = require("express");
const router = express.Router();
const axios = require("axios");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

require("dotenv").config();

const qs = require("querystring");

const User = require("../models/user"); // Mongoose User 모델 import

const path = require("path");
const fs = require("fs");
const filePath = path.resolve(__dirname, "../resources/orgIds.json");
const raw = fs.readFileSync(filePath, "utf-8");
const orgIds = JSON.parse(raw);

// 환경 설정
//const JWT_SECRET = config.get("jwtSecret");
const JWT_SECRET = process.env.JWTSECRET;
//const ACCESS_EXPIRE = config.get("jwtAccessExpiresIn");
const ACCESS_EXPIRE = process.env.jwtAccessExpiresIn;
//const REFRESH_EXPIRE = config.get("jwtRefreshExpiresIn");
const REFRESH_EXPIRE = process.env.jwtRefreshExpiresIn;
//const CLIENT_ID = config.get("kakao.clientId");
const CLIENT_ID = process.env.kakaoclientId;
//const REDIRECT_URI = config.get("kakao.redirectUri");
const REDIRECT_URI = process.env.kakaoredirectUri;

// 1. 카카오 로그인 시작
router.get("/kakao", (req, res) => {
  const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI,
  )}&response_type=code`;
  res.redirect(kakaoAuthUrl);
});

// 2. 카카오 로그인 콜백
router.get("/kakao/callback", async (req, res) => {
  const { code, platform } = req.query;

  try {
    // 1️⃣ 토큰 요청
    const tokenRes = await axios.post(
      "https://kauth.kakao.com/oauth/token",
      qs.stringify({
        grant_type: "authorization_code",
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        code,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        },
      },
    );

    const kakaoAccessToken = tokenRes.data.access_token;

    // 2️⃣ 사용자 정보 요청
    const userRes = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${kakaoAccessToken}` },
    });

    const kakaoId = userRes.data.id;
    const email = userRes.data.kakao_account?.email || "";
    const nickname = userRes.data.properties?.nickname || "";

    // 3️⃣ 사용자 DB 조회 및 등록
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        email: "kakao@example.com", ////
        name: nickname,
        kakaoId: "123", ////
        password: "", // 카카오 유저는 비밀번호 없으니 빈 문자열로 둬도 됨
        contact: "", // 기본값 세팅
        address: "", // 기본값 세팅
        consent: 0, // 동의 안 한 상태로 기본값 주기 (필요시)
        created_at: new Date(),
      });
      await user.save();
    } else if (!user.kakaoId) {
      user.kakaoId = kakaoId;
      await user.save();
    }

    // 4️⃣ JWT 발급
    const accessToken = jwt.sign(
      { id: user._id, email: user.email, userId: user.userId },
      JWT_SECRET,
      {
        expiresIn: ACCESS_EXPIRE,
      },
    );
    const refreshToken = jwt.sign(
      { id: user._id, email: user.email, userId: user.userId },
      JWT_SECRET,
      {
        expiresIn: REFRESH_EXPIRE,
      },
    );

    if (platform === "app") {
      return res.redirect(
        `myapp://login-callback?accessToken=${accessToken}&refreshToken=${refreshToken}`,
      );
    }

    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "로그인 성공",
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("카카오 로그인 에러:", err);
    res.status(500).json({ error: "서버 에러 발생" });
  }
});

// 3. 회원가입
router.post("/register", async (req, res) => {
  const { password, name, dob, gender, contact, email, address } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "이미 가입된 이메일입니다." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // local 확인
    let local = 0;
    const parts = address.split(" ");
    if (orgIds[parts[0]]) {
      local = orgIds[parts[0]];
    }

    // dob Date 타입으로 변경
    const dobStr = dob.toString(); // "19950312"
    const year = dobStr.slice(0, 4);
    const month = dobStr.slice(4, 6);
    const day = dobStr.slice(6, 8);

    // UTC 기준으로 날짜 객체 생성
    const birthdate = new Date(
      Date.UTC(Number(year), Number(month) - 1, Number(day)),
    );
    await User.create({
      email: email,
      password: hashedPassword,
      name: name,
      dob: birthdate,
      gender: gender,
      contact: contact,
      address: address,
      local: local,
      consent: 0,
      created_at: new Date(),
    });

    res.status(201).json({ message: "회원가입 완료" });
  } catch (err) {
    console.error("회원가입 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 4. 로그인
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "이메일이 존재하지 않습니다." });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
    }

    const accessToken = jwt.sign(
      { id: user._id, email: user.email, userId: user.userId },
      JWT_SECRET,
      {
        expiresIn: ACCESS_EXPIRE,
      },
    );
    const refreshToken = jwt.sign(
      { id: user._id, email: user.email, userId: user.userId },
      JWT_SECRET,
      {
        expiresIn: REFRESH_EXPIRE,
      },
    );

    res.status(200).json({
      message: "로그인 성공",
      accessToken,
      refreshToken,
      name: user.name,
    });
  } catch (err) {
    console.error("로그인 오류:", err);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

// 5. 리프레시 토큰으로 재발급
router.post("/refresh-token", (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: "리프레시 토큰이 필요합니다." });
  }

  try {
    const { id, email, userId } = jwt.verify(refreshToken, JWT_SECRET);

    const newAccessToken = jwt.sign({ id, email, userId }, JWT_SECRET, {
      expiresIn: ACCESS_EXPIRE,
    });
    const newRefreshToken = jwt.sign({ id, email, userId }, JWT_SECRET, {
      expiresIn: REFRESH_EXPIRE,
    });

    res.json({
      message: "토큰 재발급 성공",
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    console.error("리프레시 토큰 오류:", err);
    res.status(403).json({ message: "유효하지 않은 토큰입니다." });
  }
});

module.exports = router;
