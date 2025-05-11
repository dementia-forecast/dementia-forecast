const { createClient } = require("redis");

const redisClient = createClient({
  url: "redis://localhost:6379",
});

module.exports = redisClient;
