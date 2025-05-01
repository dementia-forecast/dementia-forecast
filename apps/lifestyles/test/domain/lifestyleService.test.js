const { expect } = require("chai");
const sinon = require("sinon");

const SurveyResult = require("../../models/SurveyResult.js");
const lifestyleService = require("../../domain/lifestyleService.js");
const lifestyleRepository = require("../../data-access/lifestyleRepository.js");
const AppError = require("../../../../libraries/error-handling/src/AppError.js");

describe("라이프 스타일 Service", () => {
  afterEach(async () => {
    sinon.restore();
    await SurveyResult.deleteMany();
  });

  // saveOrUpdateLifestyle
  describe("saveOrUpdateLifestyle 에러 작동 테스트", () => {
    it("userId가 null이라면 AppError를 던진다.", async () => {
      const userId = null;
      const questionList = [{ question_id: 1, answer: "yes" }];

      try {
        await lifestyleService.saveOrUpdateLifestyle(userId, questionList);
      } catch (error) {
        expect(error).to.be.instanceOf(AppError);
        expect(error.statusCode).to.equal(400);
      }
    });

    it("questionList의 question_id가 null이라면 AppError를 던진다.", async () => {
      const userId = 1;
      const questionList = [
        { question_id: null, answer: "1" },
        { question_id: 2, answer: "2" },
        { question_id: 3, answer: "3" },
      ];

      try {
        await lifestyleService.saveOrUpdateLifestyle(userId, questionList);
      } catch (error) {
        expect(error).to.be.instanceOf(AppError);
        expect(error.statusCode).to.equal(400);
      }
    });
  });

  describe("saveOrUpdateLifestyle 정상 작동 테스트", async () => {
    it("새 lifestyle data를 저장한다.", async () => {
      const userId = 1;
      const questionList = [
        { question_id: 1, answer: "1" },
        { question_id: 2, answer: "2" },
        { question_id: 3, answer: "3" },
      ];

      sinon.stub(lifestyleRepository, "findByUserIdAndQuestionId").resolves({
        userId: 1,
        question_list: [
          { question_id: 1, answer: "1" },
          { question_id: 2, answer: "2" },
          { question_id: 3, answer: "3" },
        ],
      });

      sinon.stub(lifestyleRepository, "saveLifestyle");

      const result = await lifestyleService.saveOrUpdateLifestyle(
        userId,
        questionList,
      );

      expect(result).to.be.an("array").with.length(3);
      expect(result[0].answer).to.equal("1");
      expect(result[1].answer).to.equal("2");
      expect(result[2].answer).to.equal("3");
    });

    it("기존 lifestyle data를 수정한다.", async () => {
      const userId = 1;

      await lifestyleRepository.saveLifestyle(userId, 1, "1");
      await lifestyleRepository.saveLifestyle(userId, 2, "2");
      await lifestyleRepository.saveLifestyle(userId, 3, "2");

      const questionList = [
        { question_id: 1, answer: "11" },
        { question_id: 2, answer: "2" },
        { question_id: 3, answer: "3" },
      ];

      sinon.stub(lifestyleRepository, "findByUserIdAndQuestionId").resolves({
        userId: 1,
        question_list: [
          { question_id: 1, answer: "11" },
          { question_id: 2, answer: "2" },
          { question_id: 3, answer: "3" },
        ],
      });

      sinon.stub(lifestyleRepository, "updateLifestyle");

      const result = await lifestyleService.saveOrUpdateLifestyle(
        userId,
        questionList,
      );

      expect(result).to.be.an("array").with.length(3);
      expect(result[0].answer).to.equal("11");
      expect(result[1].answer).to.equal("2");
      expect(result[2].answer).to.equal("3");
    });
  });

  // getLifestyle
  describe("getLifestyle 에러 작동 테스트", () => {
    it("userId가 null이라면 AppError를 던진다.", async () => {
      try {
        await lifestyleService.getLifestyle(null);
      } catch (error) {
        expect(error).to.be.instanceOf(AppError);
        expect(error.statusCode).to.equal(400);
      }
    });
  });

  describe("getLifestyle 정상 작동 테스트", () => {
    it("기존 lifestyle data를 조회한다.", async () => {
      const userId = 1;

      sinon.stub(lifestyleRepository, "findByUserId").resolves({
        userId: 1,
        question_list: [
          { question_id: 1, answer: "1" },
          { question_id: 2, answer: "2" },
          { question_id: 3, answer: "3" },
        ],
      });

      const result = await lifestyleService.getLifestyle(userId);

      expect(result.question_list).to.have.lengthOf(3);
      expect(result.question_list[0].answer).to.equal("1");
      expect(result.question_list[1].answer).to.equal("2");
      expect(result.question_list[2].answer).to.equal("3");
    });
  });
});
