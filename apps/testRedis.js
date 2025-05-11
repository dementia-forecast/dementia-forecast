const redisClient = require("../libraries/cache-store/redisClient");

async function testRedis() {
  // 에러 핸들링
  redisClient.on("error", (err) => console.error("Redis Client Error", err));

  // 연결
  await redisClient.connect();
  console.log("Redis 연결 성공!");

  // SET 테스트
  await redisClient.set("testKey", "Hello, Redis!");
  console.log("testKey 저장 완료");

  // GET 테스트
  const value = await redisClient.get("testKey");
  console.log("testKey 가져오기 성공:", value);

  // 연결 종료
  await redisClient.quit();
  console.log("Redis 연결 종료");
}

testRedis();
