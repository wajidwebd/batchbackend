const express = require("express");
const router = express.Router();
const Batch = require("../models/Batch");
const Customer = require("../models/Cutomer");

const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

router.post("/api/customer/create", upload.fields([
  { name: "passportfile", maxCount: 1 },
  { name: "photo", maxCount: 1 }
]), async (req, res) => {
  const data = req.body;
  const customer = new Customer({
    ...data,
    passportfile: req.files["passportfile"]?.[0]?.filename,
    photo: req.files["photo"]?.[0]?.filename
  });
  await customer.save();
  res.json({ message: "Customer created" });
});

router.post("/create", async (req, res) => {
  try {
    const { batchNumber, dateRange, branch, plan,umrahdate } = req.body;
    const newBatch = new Batch({ batchNumber, dateRange, branch, plan,umrahdate });
    await newBatch.save();
    res.status(201).json({ message: "Batch created successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get("/api/batches", async (req, res) => {
  const batches = await Batch.find();
  res.json(batches);
});
router.post("/api/batch-details", async (req, res) => {
  const { branch, batchNumber } = req.body;
  const batch = await Batch.findOne({ branch, batchNumber });
  if (!batch) return res.status(404).json({ message: "Batch not found" });
  res.json({ plan: batch.plan, umrahdate: batch.umrahdate });
});

module.exports = router;
