const { expect } = require("chai");
const sinon = require("sinon");

const lifestyleService = require("../../domain/lifestyleService.js");
const lifestyleRepository = require("../../data-access/lifestyleRepository.js");
const AppError = require("../../../../libraries/error-handling/src/AppError.js");

describe("라이프 스타일 Service", () => {
  afterEach(() => {
    sinon.restore();
  });

  // 목표: saveOrUpdateLifestyle 작동 검증
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
      const userId = null;
      const questionList = [{ question_id: null, answer: "yes" }];

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
      const questionList = [{ question_id: 1, answer: "yes" }];

      sinon
        .stub(lifestyleRepository, "findByUserIdAndQuestionId")
        .resolves(null);
      sinon
        .stub(lifestyleRepository, "saveLifestyle")
        .resolves({ id: 1, answer: "yes" });

      const result = await lifestyleService.saveOrUpdateLifestyle(
        userId,
        questionList,
      );

      expect(result).to.be.an("array").with.length(1);
      expect(result[0].answer).to.equal("yes");
    });

    it("기존 lifestyle data를 수정한다.", async () => {
      const userId = 1;
      const questionList = [{ question_id: 1, answer: "no" }];

      sinon
        .stub(lifestyleRepository, "findByUserIdAndQuestionId")
        .resolves({ id: 1 });
      sinon
        .stub(lifestyleRepository, "updateLifestyle")
        .resolves({ id: 1, answer: "no" });

      const result = await lifestyleService.saveOrUpdateLifestyle(
        userId,
        questionList,
      );

      expect(result).to.be.an("array").with.length(1);
      expect(result[0].answer).to.equal("no");
    });
  });

  // 목표: getLifestyle 작동 검증
  describe("getLifestyle 에러 작동 테스트", () => {
    it("userId가 null이라면 AppError를 던진다.", async () => {
      try {
        await lifestyleService.getLifestyle(null);
      } catch (error) {
        expect(error).to.be.instanceOf(AppError);
        expect(error.statusCode).to.equal(401);
      }
    });
  });

  describe("getLifestyle 에러 작동 테스트", () => {
    it("userId가 null이라면 AppError를 던진다.", async () => {
      const userId = 1;
      const questionList = [{ question_id: 1, answer: "yes" }];

      sinon.stub(lifestyleRepository, "findByUserId").resolves(questionList);

      const result = await lifestyleService.getLifestyle(userId);

      expect(result).to.deep.equal(questionList);
    });
  });
});
