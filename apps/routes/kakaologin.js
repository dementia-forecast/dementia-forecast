const express = require("express");
const router = express.Router();
const axios = require("axios");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const config = require("config");
const qs = require("querystring");
const { MongoClient, ServerApiVersion } = require("mongodb");

// config에서 값 가져오기
const uri = config.get("dbUrl");
const JWT_SECRET = config.get("jwtSecret");
const ACCESS_EXPIRE = config.get("jwtAccessExpiresIn");
const REFRESH_EXPIRE = config.get("jwtRefreshExpiresIn");
const CLIENT_ID = config.get("kakao.clientId");
const REDIRECT_URI = config.get("kakao.redirectUri");

// 카카오 로그인 페이지로 리다이렉트
router.get("/kakao", (req, res) => {
  const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&response_type=code`;
  res.redirect(kakaoAuthUrl);
});

// 카카오 로그인 콜백
router.get("/kakao/callback", async (req, res) => {
  const { code } = req.query;
  try {
    const data = qs.stringify({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      code: code,
    });

    const tokenResponse = await axios.post(
      "https://kauth.kakao.com/oauth/token",
      data,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        },
      }
    );
    const accessToken = tokenResponse.data.access_token;

    const userResponse = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const kakaoUser = {
      id: userResponse.data.id,
      nickname: userResponse.data.properties?.nickname || "",
    };

    const token = jwt.sign(kakaoUser, JWT_SECRET, { expiresIn: ACCESS_EXPIRE });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    });

    res.json({
      message: "로그인 성공",
      token: token,
    });
  } catch (error) {
    console.error("카카오 로그인 오류:", error);
    res.status(500).json({ error: "서버 에러 발생" });
  }
});

//  회원가입
router.post("/register", async (req, res) => {
  const { password, name, dob, gender, contact, email, adress } = req.body;
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
  try {
    await client.connect();
    const db = client.db("dmnta0322");

    const existingUser = await db.collection("Users").findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        statusCode: 409,
        message: "이미 가입된 이메일입니다.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      password: hashedPassword,
      name,
      dob: dob ? new Date(dob) : null,
      gender,
      contact,
      email,
      adress,
      created_at: new Date(),
    };

    await db.collection("Users").insertOne(newUser);

    res.status(201).json({
      statusCode: 201,
      message: "회원가입이 완료되었습니다.",
    });
  } catch (error) {
    console.error("회원가입 중 오류 발생:", error);
    res.status(500).json({
      statusCode: 500,
      message: "서버 오류 발생",
    });
  } finally {
    await client.close();
  }
});

//  로그인
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const client = new MongoClient(uri, {
    serverApi: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  });

  try {
    await client.connect();
    const db = client.db("dmnta0322");

    const user = await db.collection("Users").findOne({ email });

    if (!user) {
      return res.status(400).json({
        statusCode: 400,
        message: "잘못된 이메일입니다.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        statusCode: 401,
        message: "잘못된 비밀번호입니다.",
      });
    }

    const accessToken = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: ACCESS_EXPIRE }
    );

    const refreshToken = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: REFRESH_EXPIRE }
    );

    res.status(200).json({
      statusCode: 200,
      message: "로그인 성공",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("로그인 중 오류:", error);
    res.status(500).json({
      statusCode: 500,
      message: "서버 오류 발생",
    });
  } finally {
    await client.close();
  }
});

//  리프레시 토큰으로 access 토큰 재발급
router.post("/refresh-token", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      statusCode: 400,
      message: "리프레시 토큰이 필요합니다.",
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);

    const { email, name } = decoded;

    const newAccessToken = jwt.sign({ email, name }, JWT_SECRET, {
      expiresIn: ACCESS_EXPIRE,
    });

    const newRefreshToken = jwt.sign({ email, name }, JWT_SECRET, {
      expiresIn: REFRESH_EXPIRE,
    });

    res.json({
      statusCode: 200,
      message: "토큰 재발급 성공",
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    console.error("리프레시 토큰 오류:", err);
    res.status(403).json({
      statusCode: 403,
      message: "유효하지 않은 리프레시 토큰입니다.",
    });
  }
});

module.exports = router;
