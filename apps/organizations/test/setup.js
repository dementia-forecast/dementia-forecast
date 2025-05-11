const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const redisClient = require("../../../libraries/cache-store/redisClient");

let mongoServer;

before(async function () {
  this.timeout(10000);

  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

after(async () => {
  await redisClient.quit();
  await mongoose.disconnect();
  await mongoServer.stop();
});
