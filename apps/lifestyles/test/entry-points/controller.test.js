const { expect } = require("chai");
const config = require("config");
const apiKey = config.get("apiKey");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const app = require("../../index.js");

describe("라이프 스타일 Controller", () => {
  const token = jwt.sign({ userId: 1 }, apiKey);

  it("lifestyle 저장이 정상적으로 작동한다.", async () => {
    const res = await request(app)
      .post("/lifestyle/save")
      .set("Authorization", `Bearer ${token}`)
      .send({
        question_list: [{ question_id: 1, answer: "A" }],
      });

    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal("라이프스타일 저장 성공");
  });

  it("question list가 비었다면 AppError를 던진다.", async () => {
    const res = await request(app)
      .post("/lifestyle/save")
      .send({ question_list: [] });

    expect(res.status).to.equal(401);
  });
});
