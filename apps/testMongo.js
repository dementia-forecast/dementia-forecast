const {
  connectMongoose,
  disconnectMongoose,
} = require("../libraries/data-access/src");

/* async function testMongoConnection() {
  try {
    await connectToDB();
    console.log("Native Driver MongoDB 연결 성공!");
  } catch (error) {
    console.error("Native Driver 테스트 실패:", error);
  } finally {
    await closeDB();
  }
}*/

async function testMongooseConnection() {
  try {
    await connectMongoose();
    console.log("Mongoose MongoDB 연결 성공!");
  } catch (error) {
    console.error("Mongoose 테스트 실패:", error);
  } finally {
    await disconnectMongoose();
  }
}

// testMongoConnection(); // Native Driver 연결 테스트
testMongooseConnection(); // mongoose 연결 테스트
