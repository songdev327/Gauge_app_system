// app/ModelMasterController.js
const express = require("express");
const app = express.Router();
const ModelMasterModel = require("../models/ModelMasterModel");
const { Op } = require("sequelize");

// ✅ ดึงข้อมูลทั้งหมด
// app.get("/model-master/list", async (req, res) => {
//   try {
//     const result = await ModelMasterModel.findAll({ order: [["id", "ASC"]] });
//     res.json({ message: "success", result });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "error" });
//   }
// });

app.get("/model-master/list", async (req, res) => {
  try {
    const { q } = req.query; // รับค่า q ที่ผู้ใช้งานพิมพ์
    const where = {};

    // หากมีค่าค้นหา
    if (q) {
      where.madel = {
        [Op.iLike]: `%${q}%` // ใช้ ILIKE เพื่อค้นหาไม่สนใจตัวพิมพ์ใหญ่หรือตัวพิมพ์เล็ก
      };
    }

    const result = await ModelMasterModel.findAll({
      where,
      order: [["id", "ASC"]], // เรียงลำดับจาก ID
    });

    res.json({ message: "success", result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "error" });
  }
});


// ✅ เพิ่มข้อมูลใหม่
app.post("/model-master/create", async (req, res) => {
  try {
    const { madel } = req.body;
    const result = await ModelMasterModel.create({ madel });
    res.json({ message: "success", result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "error" });
  }
});

// ✅ แก้ไขข้อมูล
app.put("/model-master/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { madel } = req.body;
    const result = await ModelMasterModel.update({ madel }, { where: { id } });
    res.json({ message: "success", result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "error" });
  }
});

// ✅ ลบข้อมูล
app.delete("/model-master/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await ModelMasterModel.destroy({ where: { id } });
    res.json({ message: "success" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "error" });
  }
});

module.exports = app;
