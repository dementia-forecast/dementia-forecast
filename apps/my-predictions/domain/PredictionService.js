const ReportRepository = require("../data-access/ReportRepository");
const axios = require("axios");

const { rethrowAppErr } = require("../libraries/error-handling/src/rethrowErr");

const path = require("path");
const fs = require("fs");

const filePath = path.resolve(__dirname, "../resources/met_values.json");
const raw = fs.readFileSync(filePath, "utf-8");
const metData = JSON.parse(raw);

/****************      AWS KSM           **************/
const {
  KmsKeyringNode,
  buildClient,
  CommitmentPolicy,
} = require("@aws-crypto/client-node");
const {
  KMSClient,
  GenerateDataKeyCommand,
  EncryptCommand,
  DecryptCommand,
} = require("@aws-sdk/client-kms");

const { encrypt, decrypt } = buildClient(
  CommitmentPolicy.REQUIRE_ENCRYPT_REQUIRE_DECRYPT
);

const kmsClient = new KMSClient({ region: "ap-northeast-2" });

require("dotenv").config();
const generatorKeyId = process.env.KMSARN;
const keyId = process.env.KEYID;

const keyIds = [keyId];

const keyring = new KmsKeyringNode({
  generatorKeyId,
  keyIds,
  clientProvider: () => ({
    generateDataKey: async (args) =>
      kmsClient.send(new GenerateDataKeyCommand(args)),
    encrypt: async (args) => kmsClient.send(new EncryptCommand(args)),
    decrypt: async (args) => kmsClient.send(new DecryptCommand(args)),
  }),
});

const context = {
  stage: "demo",
  purpose: "simple demonstration app",
  origin: "ap-northeast-2",
};

/** ********************************************************************/

/********************  physical key  ******************************** */
/*
const crypto = require("crypto");

require("dotenv").config();
const key = Buffer.from(process.env.ENCRYPTION_KEY, "base64");
const iv = Buffer.from(process.env.IV, "base64");

function encrypt(text) {
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");
  return { encryptedData: encrypted, iv: iv.toString("base64") };
}

function decrypt(encryptedData, ivBase64) {
  const ivBuffer = Buffer.from(ivBase64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, ivBuffer);
  let decrypted = decipher.update(encryptedData, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}*/
/*************************************************************** */

// prediction하기
async function makePrediction(userId, parsedData) {
  try {
    // surveyResult, lifestyle DB에서 가져오기
    const surveyResult = await ReportRepository.findByUserId(userId);

    // AI단의 예측값 받아오기
    // user 정보 받아오기
    const user = await ReportRepository.findUserByUserId(userId);
    console.log(user);

    const [riskScore, lifelogValues] = await makePredictionRequest(
      parsedData,
      surveyResult,
      user
    );
    console.log("예측된 리스크 점수:", riskScore);

    // lifelogValues 배열을 암호화해서 저장
    const biometric_list = [];
    for (const [index, value] of lifelogValues.entries()) {
      biometric_list.push({
        feature_id: index + 1,
        value: Number(value),
      });
    }
    const encryptedLifelogs = await encrypt(
      keyring,
      JSON.stringify(lifelogValues),
      {
        encryptionContext: context,
      }
    );

    /*
    const encryptedLifelogs = [];
    const biometric_list = [];
    console.log(lifelogValues);
    for (const [index, value] of lifelogValues.entries()) {
      const encrypted = encrypt(value.toString());
      biometric_list.push({
        feature_id: index,
        value: value,
      });
      encryptedLifelogs.push({
        feature_id: index,
        value: JSON.stringify(encrypted),
      });
    }*/

    console.log("lifelog 저장");

    // lifelogValues 배열을 암호화해서 저장
    // lifestyles 암호화
    const Lifestyles = [];
    for (const item of surveyResult.question_list) {
      Lifestyles.push(item.answer);
    }
    console.log(Lifestyles);
    const encryptedLifestyles = await encrypt(
      keyring,
      JSON.stringify(Lifestyles),
      {
        encryptionContext: context,
      }
    );

    /*
    const encryptedLifestyles = [];
    for (const item of surveyResult.question_list) {
      const encryptedAnswer = encrypt(item.answer);
      encryptedLifestyles.push({
        question_id: item.question_id,
        value: JSON.stringify(encryptedAnswer),
      });
    }*/

    console.log("lifestyle 저장");

    const encryptedEmail = await encrypt(keyring, user.email.toString(), {
      encryptionContext: context.result,
    });
    //const encryptedEmail = JSON.stringify(encrypt(user.email.toString()));

    console.log("encryptedEmail 저장");

    const reportData = {
      userId,
      orgid: user.local,
      email: encryptedEmail.result.toString("base64"),
      riskScore,
      consent: user.consent,
      lifelogs: encryptedLifelogs.result.toString("base64"),
      lifestyles: encryptedLifestyles.result.toString("base64"),
    };

    console.log(reportData);

    const latest_report = await ReportRepository.getLatestReport(userId);
    const todayDate = new Date().toISOString().slice(0, 10); // 현재 UTC 기준 'YYYY-MM-DD'

    if (latest_report) {
      const reportDate = latest_report.createdAt.toISOString().slice(0, 10);

      if (reportDate === todayDate) {
        // 오늘 작성된 레포트가 있다면, 해당 레포트를 업데이트
        await ReportRepository.updateReport(userId, reportData);
        console.log("레포트가 업데이트되었습니다.");
      } else {
        // 새 레포트 작성
        await ReportRepository.saveReport(reportData);
        console.log("새 레포트를 저장했습니다.");
      }
    } else {
      // 해당 userId에 대한 기존 레포트 없음 → 새로 저장
      await ReportRepository.saveReport(reportData);
      console.log("첫 레포트를 저장했습니다.");
    }

    return [riskScore, biometric_list, surveyResult.question_list]; // 암호화되지 않은 데이터 전송
  } catch (err) {
    console.log(err.stack);
    rethrowAppErr(err, {
      name: "Unexpected PredictionService error",
      statusCode: 500,
      description: err.stack,
    });
  }
}

// activity 관련 피쳐 조정 함수
function processActivityFeatures(dataList, height, weight, user) {
  // user 관련 변수
  const age =
    new Date().getFullYear() -
    new Date(user.dob).getFullYear() -
    (new Date() <
    new Date(new Date(user.dob).setFullYear(new Date().getFullYear()))
      ? 1
      : 0);

  console.log("age: ", age);

  const exercise = dataList.find(
    (item) => item.biometric_data_type === "exercise"
  );
  const exercises = exercise ? exercise.biometric_data_value : [];

  const walk = dataList.find((item) => item.biometric_data_type === "walk");
  const walkSummary = walk?.biometric_data_value?.summary || {};
  const stepLogs = walk?.biometric_data_value?.step_logs || [];

  // 중요 feature 초기화
  let totalCal = 0;
  let totalDuration = 0; // 밀리초 누적
  let metDuration = 0; // 밀리초 누적
  let totalMet = 0;
  let startTimes = [],
    endTimes = [];

  let highDuration = 0,
    mediumDuration = 0,
    lowDuration = 0; // 밀리초 누적
  let metMinHigh = 0,
    metMinMedium = 0,
    metMinLow = 0;

  exercises.forEach((ex) => {
    totalCal += ex.calorie;
    totalDuration += ex.duration;

    if (ex.type !== 0) {
      metDuration += ex.duration;
      totalMet += metData[ex.type] * (ex.duration / 60000); // MET 계산 시 분 단위 사용
    }
    startTimes.push(new Date(ex.start_time.replace(" ", "T")));
    endTimes.push(new Date(ex.end_time.replace(" ", "T")));

    const hr = ex.average_heart_rate;
    const durationMin = ex.duration / 60000; // 분 단위 변환

    if (hr >= 120) {
      highDuration += ex.duration;
      metMinHigh += 8 * durationMin;
    } else if (hr >= 100) {
      mediumDuration += ex.duration;
      metMinMedium += 4 * durationMin;
    } else {
      lowDuration += ex.duration;
      metMinLow += 2 * durationMin;
    }
  });

  // 1. activity_average_met
  const activity_average_met =
    metDuration > 0
      ? parseFloat((totalMet / (metDuration / 60000)).toFixed(2))
      : 0;

  // 2. activity_cal_active
  // calActive

  // 3. activity_cal_total
  const BMR =
    user.gender === "m"
      ? 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age
      : 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;
  const activity_cal_total = BMR + totalCal;

  // 4. activity_daily_movement
  const activity_daily_movement = walkSummary.total_distance || 0;

  // 5. activity_high (밀리초 → 분)
  const activity_high = highDuration / 60000;

  // 6. activity_inactive
  const totalActiveDuration = highDuration + mediumDuration + lowDuration;
  const totalPeriod = 24 * 60 * 60 * 1000 - 10 * 60 * 60 * 1000;
  const activity_inactive = (totalPeriod - totalActiveDuration) / 60000;

  console.log(totalPeriod / 60000);
  // 7. activity_low (밀리초 → 분)
  const activity_low = lowDuration / 60000;

  // 8. activity_medium (밀리초 → 분)
  const activity_medium = mediumDuration / 60000;

  // 9. activity_met_min_high
  // metMinHigh 는 이미 분 단위 곱해서 계산됨

  // 10. activity_met_min_inactive
  const inactiveMin = activity_inactive > 0 ? activity_inactive : 0;
  const activity_met_min_inactive = inactiveMin / 50;

  // 11. activity_met_min_low
  // metMinLow

  // 12. activity_met_min_medium
  // metMinMedium

  // 13. activity_non_wear (밀리초 누적 → 분 단위 변환)
  let activity_non_wear = 0;
  for (let i = 1; i < stepLogs.length; i++) {
    const prevEnd = new Date(stepLogs[i - 1].end_time);
    const currStart = new Date(stepLogs[i].start_time);
    const gap = currStart - prevEnd;
    if (gap >= 2 * 60 * 60 * 1000) {
      activity_non_wear += gap;
    }
  }
  activity_non_wear = activity_non_wear / 60000; // 분 단위 변환

  // 14. activity_steps
  const activity_steps = walkSummary.total_step_count || 0;

  // 15. activity_total (밀리초 → 분) * exercise에 걷기도 포함되어 있음
  const activity_total = totalDuration / 60000;

  return [
    activity_average_met, // 1
    totalCal, //2
    activity_cal_total, // 3
    activity_daily_movement, // 4
    activity_high, // 5
    activity_inactive, // 6
    activity_low, // 7
    activity_medium, // 8
    metMinHigh, // 9
    activity_met_min_inactive, // 10
    metMinLow, // 11
    metMinMedium, // 12
    activity_non_wear, // 13
    activity_steps, // 14
    activity_total, // 15
  ];
}

function getTimeOnlyMidpoint(start_time, end_time) {
  const start = new Date(start_time);
  const end = new Date(end_time);

  // 시, 분, 초를 초 단위로 환산
  const startSeconds =
    start.getHours() * 3600 + start.getMinutes() * 60 + start.getSeconds();
  const endSeconds =
    end.getHours() * 3600 + end.getMinutes() * 60 + end.getSeconds();

  // 중간 지점 (초 단위)
  const midSeconds = Math.floor((startSeconds + endSeconds) / 2);

  return midSeconds;
}

function processSleepFeatures(biometric_data_list) {
  const sleep = biometric_data_list.find(
    (d) => d.biometric_data_type === "sleep"
  );
  console.log("sleep", sleep);
  const heartRate = biometric_data_list.find(
    (d) => d.biometric_data_type === "heart_rate"
  );

  const summary = sleep?.biometric_data_value?.summary || {};
  const h_summary = heartRate?.biometric_data_value?.summary || {};
  const logs = sleep?.biometric_data_value?.sleep_logs || [];
  const rmssdLogs = heartRate?.biometric_data_value?.rmssd_logs || [];

  const {
    start_time,
    end_time,
    total_light_duration = 0,
    total_deep_duration = 0,
    total_rem_duration = 0,
    total_duration = 0,
    efficiency = 0,
  } = summary;

  const { average_heart_rate } = h_summary;

  // 16. sleep_awake
  const start = new Date(start_time);
  const end = new Date(end_time);
  const diffInMs = end - start;

  const sleep_awake = Math.abs(
    (diffInMs / 60000 -
      (total_light_duration + total_deep_duration + total_rem_duration)) *
      60
  ); // 초 단위

  // 17. sleep_deep
  const sleep_deep = total_deep_duration * 60; // 초 단위

  // 18. sleep_duration
  const sleep_duration = total_duration * 60;

  // 19. sleep_efficiency
  const sleep_efficiency = efficiency;

  // 20. sleep_hr_average
  // average_heart_rate

  // 21. sleep_is_longest
  const sleep_is_longest = 1;

  // 22. sleep_light
  const sleep_light = total_light_duration * 60; //초단위

  // 23. sleep_midpoint_at_delta
  let sleep_midpoint_at_delta = 0;
  if (logs.length >= 2) {
    const midpoint1 =
      (new Date(logs[0].start_time).getTime() +
        new Date(logs[0].end_time).getTime()) /
      2;
    const midpoint2 =
      (new Date(logs[1].start_time).getTime() +
        new Date(logs[1].end_time).getTime()) /
      2;
    sleep_midpoint_at_delta = getTimeOnlyMidpoint(
      new Date(midpoint1),
      new Date(midpoint2)
    ); // 초 단위
  }

  // 24. sleep_midpoint_time
  const midpointTimeMs = getTimeOnlyMidpoint(
    new Date(start_time).getTime(),
    new Date(end_time).getTime()
  ); // 초 단위

  // 25. sleep_period_id - 제외
  const sleep_period_id = 3;

  // 26. sleep_rem
  const sleep_rem = total_rem_duration * 60;

  // 27. sleep_rmssd
  let sleep_rmssd = 0;
  if (rmssdLogs.length) {
    const sumRmssd = rmssdLogs.reduce((acc, item) => acc + item.rmssd, 0);
    sleep_rmssd = sumRmssd / rmssdLogs.length;
  }

  // 28. sleep_total
  const sleep_total = total_duration * 60;

  return [
    sleep_awake, //16
    sleep_deep, //17
    sleep_duration, //18
    sleep_efficiency, //19
    average_heart_rate, //20
    sleep_is_longest, //21
    sleep_light, //22
    sleep_midpoint_at_delta, //23
    midpointTimeMs, //24
    sleep_period_id, // 제외 필요 25
    sleep_rem, //26
    sleep_rmssd, //27
    sleep_total, //28
  ];
}

async function makePredictionRequest(parsedData, surveyResult, user) {
  try {
    const lifelogValues = [];

    parsedData.biometric_data_by_date.forEach((entry) => {
      const dataList = entry.biometric_data_list;

      const activityFeatures = processActivityFeatures(
        dataList,
        parsedData.height,
        parsedData.weight,
        user
      );

      const sleepFeatures = processSleepFeatures(dataList);

      lifelogValues.push(...activityFeatures);
      lifelogValues.push(...sleepFeatures);
    });

    console.log("lifelogValues", lifelogValues);

    const lifestyleValues = surveyResult.question_list.map(({ answer }) =>
      parseFloat(answer)
    );

    const requestBody = {
      lifelog: lifelogValues.map(Number),
      lifestyle: lifestyleValues,
    };

    console.log(requestBody);

    const response = await axios.post(
      "http://13.209.72.104/prediction/multimodal",
      requestBody
    );
    //const response = { data: { risk_score: 1 } };

    return [response.data.risk_score, lifelogValues];
  } catch (err) {
    console.error("서버 응답 데이터:", err.response.data);
    console.log(err.stack);
    rethrowAppErr(err, {
      name: "Unexpected PredictionService error",
      statusCode: 500,
      description: err.stack,
    });
  }
}

// Date에 따른 Report 조회
async function findReportByDate(userId, dateParam) {
  try {
    // dateInt를 문자열로 변환 (예: 20250601)
    const dateString = dateParam.toString();

    // 연, 월, 일 분리
    const year = Number(dateString.slice(0, 4));
    const month = Number(dateString.slice(4, 6));
    const day = Number(dateString.slice(6, 8));
    const hour = 0;
    const minute = 0;
    const second = 0;
    const contrastDate = new Date(
      Date.UTC(year, month - 1, day, hour, minute, second)
    );

    const report = await ReportRepository.findReportByUserIdAndDate(
      userId,
      contrastDate
    );

    // riskScore는 숫자형이므로 바로 가져오기
    const riskScore = report.riskScore;

    // lifelogs 복호화
    const lifelogValues = [];
    const awsdecLifelogs = await decrypt(
      keyring,
      Buffer.from(report.lifelogs, "base64")
    );
    const decryptedLifeLogs = JSON.parse(
      awsdecLifelogs.plaintext.toString("utf-8")
    );
    for (const [index, value] of decryptedLifeLogs.entries()) {
      lifelogValues.push({
        feature_id: index + 1,
        value: Number(value),
      });
    }

    /*
    const lifelogValues = [];
    for (const lifelog of report.lifelogs) {
      const decrypted = decrypt(JSON.parse(lifelog.value));
      lifelogValues.push({
        feature_id: lifelog.feature_id,
        value: Number(decrypted.encryptedData),
      });
    }*/

    // lifestyles 복호화
    const lifeStyleValues = [];
    const awsdecLifeStyles = await decrypt(
      keyring,
      Buffer.from(report.lifestyles, "base64")
    );
    const decryptedAnswer = JSON.parse(
      awsdecLifeStyles.plaintext.toString("utf-8")
    );

    for (const [index, value] of decryptedAnswer.entries()) {
      lifeStyleValues.push({
        question_id: index + 1,
        answer: Number(value),
      });
    }
    /*
    const lifeStyleValues = [];
    for (const lifestyle of report.lifestyles) {
      const decryptedAnswer = await decrypt(JSON.parse(lifestyle.value));
      lifeStyleValues.push({
        question_id: lifestyle.question_id,
        answer: decryptedAnswer,
      });
    }*/

    return [riskScore, lifelogValues, lifeStyleValues];
  } catch (err) {
    console.log(err.stack);
    rethrowAppErr(err, {
      name: "Unexpected lifestyleRepository error",
      statusCode: 500,
      description: "레포트 조회에 실패하였습니다.",
    });
  }
}

async function delReport(userId) {
  try {
    if (!userId) {
      throw new AppError("Invalid Input", 400, "userId가 존재하지 않습니다.");
    }

    return await ReportRepository.deleteByUserId(userId);
  } catch (err) {
    rethrowAppErr(err, {
      name: "Unexpected PredictionService error",
      statusCode: 500,
      description: "PredictionService에서 예기치 못한 오류가 발생했습니다.",
    });
  }
}

module.exports = {
  makePrediction,
  findReportByDate,
  delReport,
};
