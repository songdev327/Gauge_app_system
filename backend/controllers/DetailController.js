const express = require("express");
const app = express();
const DetailModel = require("../models/DetailModel");
const ExcelJS = require("exceljs");
const { Op } = require("sequelize");


app.get("/detail/search/:type/:keyword", async (req, res) => {
  try {

    const { type, keyword } = req.params;

    // 🧩 เงื่อนไขค้นหา
    let whereCondition = {};
    if (type === "sn") whereCondition = { Serial: keyword };
    else if (type === "item") whereCondition = { name: keyword };
    else if (type === "control") whereCondition = { control: keyword };
    else return res.status(400).send({ message: "invalid search type" });

    // ✅ ต้องใช้ Op.and เพื่อไม่ให้ [Op.or] ทับกัน
    const result = await DetailModel.findOne({
      where: {
        ...whereCondition,
        [Op.and]: [
          {
            [Op.or]: [{ scrap: null }, { scrap: "" }],
          },
          {
            [Op.or]: [{ doc_no: null }, { doc_no: "" }],
          },
        ],
      },

      // limit: 100,

    });

    // ❌ ไม่พบข้อมูล
    if (!result) {
      // ลองค้นอีกครั้งแบบไม่กรอง เพื่อเช็กว่ามีอยู่แต่ถูกยืมหรือ scrap แล้ว
      const existing = await DetailModel.findOne({ where: whereCondition });

      if (existing) {
        if (existing.scrap && existing.scrap.trim() !== "") {
          return res.status(200).send({
            message: "scrapped",
            scrap: existing.scrap,
          });
        }

        if (existing.doc_no && existing.doc_no.trim() !== "") {
          return res.status(200).send({
            message: "issued",
            doc_no: existing.doc_no,
          });
        }
      }

      return res.status(404).send({ message: "not found" });
    }

    // ✅ ถ้าเจอและผ่านทุกเงื่อนไข
    res.send({ message: "success", result });

  } catch (e) {
    console.error("❌ Error:", e);
    res.status(500).send({ message: e.message });
  }
});




app.get("/detail/autocomplete/sn/:keyword", async (req, res) => {
  try {
    const keyword = req.params.keyword;
    const result = await DetailModel.findAll({
      where: {
        Serial: { [Op.iLike]: `%${keyword}%` },
      },
      attributes: ["Serial"],
      //limit: 100,
    });
    res.json({ message: "success", result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "error" });
  }
});

app.get("/detail/autocomplete/control/:keyword", async (req, res) => {
  try {
    const keyword = req.params.keyword;
    const result = await DetailModel.findAll({
      where: {
        control: { [Op.iLike]: `%${keyword}%` },
      },
      attributes: ["control"],
      //limit: 100,
    });
    res.json({ message: "success", result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "error" });
  }
});


// ✅ ดึงข้อมูลพร้อม pagination + ค้นหา
app.get("/details", async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = search
      ? {
        [Op.or]: [
          { code: { [Op.like]: `%${search}%` } },
          { name: { [Op.like]: `%${search}%` } },
          { Serial: { [Op.like]: `%${search}%` } },
          { control: { [Op.like]: `%${search}%` } },
          { model: { [Op.like]: `%${search}%` } },
        ],
      }
      : {};

    const { count, rows } = await DetailModel.findAndCountAll({
      where: whereClause,
      order: [["id", "DESC"]],
      offset: parseInt(offset),
      limit: parseInt(limit),
    });

    res.json({
      message: "success",
      result: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

app.get("/details/export", async (req, res) => {
  try {
    const { search } = req.query;

    let where = {};
    if (search && search.trim() !== "") {
      where = {
        [Op.or]: [
          { code: { [Op.iLike]: `%${search}%` } },
          { name: { [Op.iLike]: `%${search}%` } },
          { Serial: { [Op.iLike]: `%${search}%` } },
          { control: { [Op.iLike]: `%${search}%` } },
          { model: { [Op.iLike]: `%${search}%` } },
        ],
      };
    }

    const details = await DetailModel.findAll({ where });

    if (!details.length) {
      return res.status(404).json({ message: "ไม่พบข้อมูลที่ค้นหา" });
    }

    const ExcelJS = require("exceljs");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Details");

    sheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Code", key: "code", width: 15 },
      { header: "Name", key: "name", width: 25 },
      { header: "Date_Rec", key: "date_rec", width: 15 },
      { header: "Serial", key: "Serial", width: 20 },
      { header: "Control", key: "control", width: 20 },
      { header: "Invoice", key: "invoice", width: 20 },
      { header: "Scrap", key: "scrap", width: 15 },
      { header: "Model", key: "model", width: 20 },
      { header: "Sheet", key: "sheet", width: 20 },
      { header: "Doc_No", key: "doc_no", width: 20 },
      { header: "Fixasset", key: "fixasset", width: 20 },
      { header: "Price", key: "price", width: 15 },
      { header: "Maker", key: "maker", width: 20 },
    ];

    details.forEach((d) => sheet.addRow(d.dataValues));

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Details_${Date.now()}.xlsx`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("❌ Export Error:", err);
    res.status(500).json({
      error: "เกิดข้อผิดพลาดในการดึงข้อมูล",
      detail: err.message,
    });
  }
});


// ✅ เพิ่มข้อมูล
app.post("/details", async (req, res) => {
  try {
    const newDetail = await DetailModel.create(req.body);
    res.json({ message: "success", result: newDetail });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ แก้ไขข้อมูล
app.put("/details/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await DetailModel.update(req.body, { where: { id } });
    res.json({ message: "success", result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ ลบข้อมูล
app.delete("/details/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await DetailModel.destroy({ where: { id } });
    res.json({ message: "success" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = app;
