const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  customerid: String,
  customername: String,
  age: String,
  dob: String,
  address: String,
  batchNumber: String,
  branch: String,
  plan: String,
  umrahdate: String,
  passportfile: String,
  photo: String,
  visa: String
});

module.exports = mongoose.model("Customer", customerSchema);
