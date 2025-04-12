const express = require("express");
const app = express();

app.use(express.json());

const LoginRouter = require("./routes/kakaologin");

app.use("/auth", LoginRouter);

app.listen(8080, () => {
  console.log("8080 success");
});
