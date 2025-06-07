const express = require("express");
const app = express();
const mongoose = require("mongoose");
require("dotenv").config();
const dbUrl = process.env.DBURL;
const port = process.env.PORT;

mongoose
  .connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use(express.json());

const LoginRouter = require("./routes/kakaologin");
const UserRouter = require("./routes/user");

app.use("/auth", LoginRouter);

app.use("/user", UserRouter);

app.listen(port, () => {
  console.log("8080 success");
});
