// test-index.js

// --- 1) 로그인 처리 테스트 ---
const login = require("./apps/domain/loginStub");

console.log("==== [TEST] 로그인 처리 ====");
const orgResult = login("user1@org.com", "anyPassword");
console.log("Organization 계정:", orgResult);

const normalResult = login("normal@domain.com", "anyPassword");
console.log("일반 계정:", normalResult);

const failResult = login("nope@none.com", "anyPassword");
console.log("예상 실패:", failResult);

// --- 2) 주소 파싱 & local 매칭 테스트 ---
const { parseAddress, getLocalId } = require("./apps/domain/addressParser");

console.log("\n==== [TEST] 주소 파싱 & local 매칭 ====");
const addressString = "서울특별시 강남구 논현동 테헤란로 123";
const parsed = parseAddress(addressString);
console.log("Parsed:", parsed);

const localId = getLocalId(parsed);
console.log("Matched local ID:", localId);

console.log("\n==== [INFO] 테스트 종료 ====");
