// app/PartNameController.js
const express = require("express");
const app = express.Router();
const PartNameModel = require("../models/PartNameModel");

// ✅ ดึงข้อมูลทั้งหมด
app.get("/part-name/list", async (req, res) => {
  try {
    const result = await PartNameModel.findAll({ order: [["id", "ASC"]] });
    res.json({ message: "success", result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "error" });
  }
});


// ✅ เพิ่มข้อมูล
app.post("/part-name/create", async (req, res) => {
  try {
    const { part_name } = req.body;
    const result = await PartNameModel.create({ part_name });
    res.json({ message: "success", result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "error" });
  }
});

// ✅ แก้ไขข้อมูล
app.put("/part-name/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { part_name } = req.body;
    const result = await PartNameModel.update({ part_name }, { where: { id } });
    res.json({ message: "success", result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "error" });
  }
});

// ✅ ลบข้อมูล
app.delete("/part-name/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await PartNameModel.destroy({ where: { id } });
    res.json({ message: "success" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "error" });
  }
});

module.exports = app;

