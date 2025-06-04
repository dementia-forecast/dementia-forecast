const { MongoClient, ServerApiVersion } = require("mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ENV에 넣어둔 DB URI와 JWT 시크릿
const URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

async function login(email, password) {
  const client = new MongoClient(URI, { serverApi: ServerApiVersion.v1 });
  try {
    await client.connect();
    const db = client.db("dmnta0322");

    // 1) 사용자 조회 (Users 컬렉션)
    const user = await db.collection("Users").findOne({ email });
    if (!user) {
      return { statusCode: 401, message: "잘못된 이메일 또는 비밀번호입니다." };
    }
    // 2) 비밀번호 검사
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return { statusCode: 401, message: "잘못된 이메일 또는 비밀번호입니다." };
    }

    // 3) Organization DB에 이메일이 있는지 확인 (Organization 컬렉션 예시)
    const org = await db.collection("Organizations").findOne({ email });
    const role = org ? "temp" : "user";

    // 4) JWT 발급
    const accessToken = jwt.sign({ id: user._id, email, role }, JWT_SECRET, {
      expiresIn: role === "temp" ? "2m" : "1h",
    });
    const refreshToken = jwt.sign({ id: user._id, email, role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return {
      statusCode: 200,
      message: "로그인 성공",
      accessToken,
      refreshToken,
      role,
    };
  } finally {
    await client.close();
  }
}

module.exports = login;
