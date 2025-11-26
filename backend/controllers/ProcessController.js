// app/ProcessController.js
const express = require("express");
const app = express.Router();
const ProcessModel = require("../models/ProcessModel");

// ✅ ดึงข้อมูลทั้งหมด
app.get("/process-name/list", async (req, res) => {
  try {
    const result = await ProcessModel.findAll({ order: [["id", "ASC"]] });
    res.json({ message: "success", result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "error" });
  }
});


// ✅ เพิ่มข้อมูล
app.post("/process-name/create", async (req, res) => {
  try {
    const { typemc } = req.body;
    const result = await ProcessModel.create({ typemc });
    res.json({ message: "success", result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "error" });
  }
});

// ✅ แก้ไขข้อมูล
app.put("/process-name/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { typemc } = req.body;
    const result = await ProcessModel.update({ typemc }, { where: { id } });
    res.json({ message: "success", result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "error" });
  }
});

// ✅ ลบข้อมูล
app.delete("/process-name/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await ProcessModel.destroy({ where: { id } });
    res.json({ message: "success" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "error" });
  }
});

module.exports = app;