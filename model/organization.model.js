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

const Organization = mongoose.model("Organization", OrganizationSchema);

module.exports = Organization;
