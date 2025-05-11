const mongoose = require("mongoose");

const OrganizationSchema = new mongoose.Schema({
  orgId: { type: Number, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  address: {
    city: { type: String, required: true },
    district: { type: String, required: true },
    detail: { type: String },
  },
});

const OrgLogSchema = new mongoose.Schema({
  logId: { type: Number, required: true, unique: true },
  orgId: { type: Number, required: true },
  target_userId: { type: Number, required: true },
  action_type: { type: String, required: true }, // view_bio, ...
  timestamp: { type: Date, default: Date.now },
  details: { type: String },
});

module.exports = {
  Organization: mongoose.model("Organization", OrganizationSchema),
  OrgLog: mongoose.model("OrgLog", OrgLogSchema),
};
