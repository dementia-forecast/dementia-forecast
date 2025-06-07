require("dotenv").config();
const uri = process.env.DBURL;

const mongoose = require("mongoose");
const { MongoClient, ServerApiVersion } = require("mongodb");

const MAX_RETRIES = 10;
let retries = 0;

/** Native Driver */
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function connectToDB() {
  try {
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
}

async function closeDB() {
  try {
    if (client) {
      await client.close();
      console.log("MongoDB connection closed");
    }
  } catch (error) {
    console.error("Error closing MongoDB connection:", error);
  }
}

/** Mongoose */
async function connectMongoose() {
  while (retries < MAX_RETRIES) {
    try {
      await mongoose.connect(uri);
      console.log("Mongoose로 MongoDB 연결 성공!");
      break; // 연결 성공하면 반복 종료
    } catch (error) {
      retries += 1;
      console.error(
        `MongoDB 연결 실패 (시도 ${retries}/${MAX_RETRIES}):`,
        error,
      );

      if (retries >= MAX_RETRIES) {
        console.error("최대 재시도 횟수를 초과했습니다. 서버를 종료합니다.");
        process.exit(1); // 최종 실패 시 서버 종료 -> 도커 또는 EC2의 재시작 정책 필요
      }

      // 5초 후 재시도
      console.log("5초 후 다시 시도합니다.");
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

async function disconnectMongoose() {
  try {
    await mongoose.disconnect();
    console.log("MongoDB 연결 종료");
  } catch (error) {
    console.error("MongoDB 연결 종료 실패:", error);
  }
}

module.exports = { connectToDB, closeDB, connectMongoose, disconnectMongoose };
