const { expect } = require("chai");
const SurveyResult = require("../../models/SurveyResult.js");
const {
  findByUserIdAndQuestionId,
  saveLifestyle,
  updateLifestyle,
  findByUserId,
} = require("../../data-access/lifestyleRepository.js");

describe("lifestyleREpository 에러 작동 테스트", () => {
  beforeEach(async () => {
    await SurveyResult.deleteMany();
  });

  it("DB에 없는 userId 데이터를 조회하면 null을 반환한다.", async () => {
    const result = await findByUserId(999);
    expect(result).to.be.null;
  });

  it("DB에 없는 userId 데이터를 업데이트하면 matchedCount는 0이다.", async () => {
    const result = await updateLifestyle(999, 101, "new answer");
    expect(result.matchedCount).to.equal(0);
  });
});

describe("lifestyleREpository 정상 작동 테스트", () => {
  const userId = 1;
  const question_id = 1;
  const answer = "1";

  beforeEach(async () => {
    await SurveyResult.deleteMany();
  });

  /** findByUserIdAndQuestionId 작동 테스트 */
  it("userid가 없을 때 findByUserIdAndQuestionId를 호출하면 null을 반환한다.", async () => {
    const result = await findByUserIdAndQuestionId(userId, question_id);

    expect(result).to.be.null;
  });

  it("userid와 그에 맞는 question_id가 있을 때 findByUserIdAndQuestionId을 호출한다.", async () => {
    await saveLifestyle(userId, question_id, answer);
    await saveLifestyle(userId, 2, "2");

    const result = await findByUserIdAndQuestionId(userId, question_id);

    expect(result.question_list).to.have.lengthOf(2);
    expect(result.question_list[0].question_id).to.equal(1);
    expect(result.question_list[0].answer).to.equal("1");
    expect(result.question_list[1].question_id).to.equal(2);
    expect(result.question_list[1].answer).to.equal("2");
  });

  it("userid는 있지만 question_id가 없을 때 findByUserIdAndQuestionId을 호출하면 null을 반환한다.", async () => {
    await saveLifestyle(userId, question_id, answer);
    await saveLifestyle(userId, 2, "2");

    const result = await findByUserIdAndQuestionId(userId, 3);

    expect(result).to.be.null;
  });

  /** saveLifestyle 및 findByUserId 작동 테스트 */
  it("새 데이터를 추가 후 조회한다.(새 userid, 새로운 1개의 question)", async () => {
    await saveLifestyle(userId, question_id, answer);
    const result = await findByUserId(userId);

    expect(result).to.not.be.null;
    expect(result.question_list).to.have.lengthOf(1);
    expect(result.question_list[0].answer).to.equal(answer);
  });

  it("새 데이터를 추가 후 조회한다.(기존 user, 새로운 1개의 question)", async () => {
    await saveLifestyle(userId, question_id, answer);
    await saveLifestyle(userId, 2, "2");

    const result = await findByUserId(userId);

    expect(result.question_list).to.have.lengthOf(2);
    expect(result.question_list[1].question_id).to.equal(2);
    expect(result.question_list[1].answer).to.equal("2");
  });

  /** updateLifestyle 및 findByUserId 작동 테스트 */
  it("기존의 answer를 수정 후 조회한다.", async () => {
    await saveLifestyle(userId, question_id, answer);
    await saveLifestyle(userId, 2, "2");
    await updateLifestyle(userId, question_id, "11");

    const result = await findByUserIdAndQuestionId(userId, question_id);
    expect(result.question_list[0].answer).to.equal("11");
  });
});
