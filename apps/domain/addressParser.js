const { MongoClient, ServerApiVersion } = require("mongodb");
// ENV에 넣은 DB URI
const URI = process.env.MONGODB_URI;

async function parseAndMatchAddress(rawAddress) {
  // 1) 주소 파싱
  const parts = rawAddress.split(" ");
  const city = parts[0] || "";
  const district = parts[1] || "";
  const detail = parts.slice(2).join(" ") || "";

  // 2) MongoDB에서 city, district에 해당하는 기관 조회
  const client = new MongoClient(URI, { serverApi: ServerApiVersion.v1 });
  try {
    await client.connect();
    const db = client.db("dmnta0322");
    const org = await db
      .collection("Organizations")
      .findOne({ city, district });
    const local = org ? org.orgId : null; // 예: orgId 필드가 local ID라면

    return { city, district, detail, local };
  } finally {
    await client.close();
  }
}

module.exports = { parseAndMatchAddress };
