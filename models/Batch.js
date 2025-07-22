const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema({
  batchNumber: String,
  dateRange: String,
  branch: String,
  plan: String,
  umrahdate:String,
});

module.exports = mongoose.model("Batch", batchSchema);
