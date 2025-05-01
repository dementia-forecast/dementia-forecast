const { expect } = require("chai");
const config = require("config");
const apiKey = config.get("apiKey");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const app = require("../../index.js");
const SurveyResult = require("../../models/SurveyResult.js");
const lifestyleRepository = require("../../data-access/lifestyleRepository.js");

describe("컨트롤러 & app", () => {
  afterEach(async () => {
    await SurveyResult.deleteMany();
  });

  // saveLifestyle
  describe("saveLifestyle 에러 작동 테스트", () => {
    const token = jwt.sign({ userId: 1 }, apiKey);

    it("question_list가 null이라면 AppError를 던진다.", async () => {
      const res = await request(app)
        .post("/lifestyle/save")
        .set("Authorization", `Bearer ${token}`)
        .send({ question_list: null });

      expect(res.status).to.equal(400);
      expect(res.body.message).to.equal("question_list가 유효하지 않습니다.");
    });
  });

  describe("saveLifestyle 정상 작동 테스트", () => {
    const token = jwt.sign({ userId: 1 }, apiKey);

    it("lifestyle 저장이 정상적으로 작동한다.", async () => {
      const res = await request(app)
        .post("/lifestyle/save")
        .set("Authorization", `Bearer ${token}`)
        .send({
          question_list: [
            { question_id: 1, answer: "1" },
            { question_id: 2, answer: "2" },
            { question_id: 3, answer: "3" },
          ],
        });

      expect(res.status).to.equal(200);
      expect(res.body.message).to.equal("라이프스타일 저장 및 수정 성공");
    });

    it("lifestyle 수정이 정상적으로 작동한다.", async () => {
      const userId = 1;

      await lifestyleRepository.saveLifestyle(userId, 1, "1");
      await lifestyleRepository.saveLifestyle(userId, 2, "2");
      await lifestyleRepository.saveLifestyle(userId, 3, "3");

      const res = await request(app)
        .post("/lifestyle/save")
        .set("Authorization", `Bearer ${token}`)
        .send({
          question_list: [
            { question_id: 1, answer: "1" },
            { question_id: 2, answer: "2" },
            { question_id: 3, answer: "3" },
          ],
        });

      expect(res.status).to.equal(200);
      expect(res.body.message).to.equal("라이프스타일 저장 및 수정 성공");
    });
  });

  // getLifestyle
  describe("getLifestyle 에러 작동 테스트", () => {
    const token = jwt.sign({ userId: 1 }, apiKey);

    it("lifestyleService의 result가 null이면 AppError를 던진다.", async () => {
      const res = await request(app)
        .post("/lifestyle/send")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).to.equal(404);
      expect(res.body.message).to.equal(
        "사용자의 라이프 스타일 정보가 존재하지 않습니다.",
      );
    });
  });

  describe("getLifestyle 정상 작동 테스트", async () => {
    const userId = 1;

    await lifestyleRepository.saveLifestyle(userId, 1, "1");
    await lifestyleRepository.saveLifestyle(userId, 2, "2");
    await lifestyleRepository.saveLifestyle(userId, 3, "3");

    const token = jwt.sign({ userId: 1 }, apiKey);

    it("lifestyle 조회가 정상적으로 작동한다.", async () => {
      const res = await request(app)
        .post("/lifestyle/send")
        .set("Authorization", `Bearer ${token}`);

      const fakeQuestionList = [
        { question_id: 1, answer: "1" },
        { question_id: 2, answer: "2" },
        { question_id: 3, answer: "3" },
      ];

      expect(res.status).to.equal(200);
      expect(res.body.question_list).to.deep.equal(fakeQuestionList);
      expect(res.body.message).to.equal("라이프스타일 조회 성공");
    });
  });
});
