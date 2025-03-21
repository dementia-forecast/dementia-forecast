const { connectToDB, closeDB } = require("../libraries/data-access/src");

async function testMongoConnection() {
  try {
    await connectToDB();
    console.log("MongoDB 연결 성공!");
  } catch (error) {
    console.error("테스트 실패:", error);
  } finally {
    await closeDB();
  }
}

testMongoConnection();
