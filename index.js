const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const Batch = require("./models/Batch");
const Customer = require("./models/Customer");
const fs = require("fs");
const archiver = require("archiver");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

mongoose.connect("mongodb+srv://dbone:dbone@cluster0.1vljvnr.mongodb.net/umrahdata", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// File upload config
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

// Routes
app.get("/api/batches", async (req, res) => {
  const batches = await Batch.find();
  res.json(batches);
});

app.post("/api/batch-details", async (req, res) => {
  const { branch, batchNumber } = req.body;
  const batch = await Batch.findOne({ branch, batchNumber });
  if (!batch) return res.status(404).json({ message: "Batch not found" });
  res.json({ plan: batch.plan, umrahdate: batch.umrahdate });
});

app.post("/api/customer/create", upload.fields([
  { name: "passportfile", maxCount: 1 },
  { name: "photo", maxCount: 1 },
  { name: "visa", maxCount: 1 }
]), async (req, res) => {
  const data = req.body;
  const customer = new Customer({
    ...data,
    passportfile: req.files["passportfile"]?.[0]?.filename,
    photo: req.files["photo"]?.[0]?.filename,
    visa: req.files["visa"]?.[0]?.filename
  });
  await customer.save();
  res.json({ message: "Customer created" });
});
app.post("/api/customer/search", async (req, res) => {
  const { customerid, branch, batchNumber } = req.body;

  try {
    const customer = await Customer.findOne({ customerid, branch, batchNumber });
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});



app.get("/api/customer/download/:id", async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    // Set response headers
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename=${customer.customerid}_data.zip`);

    // Create zip archive
    const archive = archiver("zip");
    archive.pipe(res);

    // Add JSON customer data
    const customerInfo = {
      customerid: customer.customerid,
      name: customer.customername,
      age: customer.age,
      dob: customer.dob,
      address: customer.address,
      branch: customer.branch,
      batchNumber: customer.batchNumber,
      plan: customer.plan,
      umrahdate: customer.umrahdate
    };
    archive.append(JSON.stringify(customerInfo, null, 2), { name: "customer.json" });

    // Add passport file
    if (customer.passportfile) {
      archive.file(`uploads/${customer.passportfile}`, { name: `passport_${customer.passportfile}` });
    }

    // Add photo file
    if (customer.photo) {
      archive.file(`uploads/${customer.photo}`, { name: `photo_${customer.photo}` });
    }

    archive.finalize();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create ZIP" });
  }
});
app.post("/api/customer/login", async (req, res) => {
  const { branch, batchNumber, customerid } = req.body;

  try {
    const customer = await Customer.findOne({ branch, batchNumber, customerid });
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    res.json(customer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
