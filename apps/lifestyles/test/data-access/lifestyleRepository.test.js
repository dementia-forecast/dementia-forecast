const { expect } = require("chai");
const SurveyResult = require("../../models/SurveyResult.js");
const {
  findByUserIdAndQuestionId,
  saveLifestyle,
  updateLifestyle,
  findByUserId,
} = require("../../data-access/lifestyleRepository.js");

// 목표: crud 함수 검증
describe("라이프 스타일 데이터", () => {
  const userId = 1;
  const question_id = 1;
  const answer = "yes";

  beforeEach(async () => {
    await SurveyResult.deleteMany();
  });

  it("새 데이터를 추가시킨다.(새 userid, 새로운 1개의 question)", async () => {
    await saveLifestyle(userId, question_id, answer);
    const result = await findByUserId(userId);

    expect(result).to.not.be.null;
    expect(result.question_list).to.have.lengthOf(1);
    expect(result.question_list[0].answer).to.equal(answer);
  });

  it("새 데이터를 추가시킨다.(기존 user, 새로운 1개의 question)", async () => {
    await saveLifestyle(userId, question_id, answer);
    await saveLifestyle(userId, 2, "no");

    const result = await findByUserId(userId);

    expect(result.question_list).to.have.lengthOf(2);
    expect(result.question_list[1].question_id).to.equal(2);
    expect(result.question_list[1].answer).to.equal("no");
  });

  it("기존의 answer를 수정한다.", async () => {
    await saveLifestyle(userId, question_id, answer);
    await updateLifestyle(userId, question_id, "no");

    const result = await findByUserIdAndQuestionId(userId, question_id);
    expect(result.question_list[0].answer).to.equal("no");
  });
});
