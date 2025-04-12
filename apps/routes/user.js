const express = require("express");
const router = express.Router();
const { MongoClient, ServerApiVersion } = require("mongodb");
const config = require("config");
const verifyToken = require("./middlewares/verifyToken");
const uri = config.get("dbUrl");

router.get("/profile", verifyToken, async (req, res) => {
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

    const user = await db.collection("Users").findOne(
      { email: req.user.email },
      { projection: { password: 0 } } // 비밀번호 제외하고 반환
    );

    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    res.json({ user });
  } catch (err) {
    console.error("프로필 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  } finally {
    await client.close();
  }
});

router.put("/update", verifyToken, async (req, res) => {
  const { name, dob, gender, contact, address } = req.body;
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

    const result = await db.collection("Users").updateOne(
      { email: req.user.email },
      {
        $set: {
          ...(name && { name }),
          ...(dob && { dob: new Date(dob) }),
          ...(gender && { gender }),
          ...(contact && { contact }),
          ...(address && { address }),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    res.json({ message: "회원 정보가 수정되었습니다." });
  } catch (err) {
    console.error("회원 정보 수정 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  } finally {
    await client.close();
  }
});

router.delete("/delete", verifyToken, async (req, res) => {
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

    const result = await db
      .collection("Users")
      .deleteOne({ email: req.user.email });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    res.json({ message: "회원 탈퇴가 완료되었습니다." });
  } catch (err) {
    console.error("회원 탈퇴 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  } finally {
    await client.close();
  }
});

module.exports = router;
