
const express = require("express");
const MasterIndexModel = require("../models/MasterIndexModel");
const ExcelJS = require("exceljs");
const app = express();

const { Op } = require("sequelize")

// 🔍 ดึงทั้งหมด
app.get("/masterIndexListAll", async (req, res) => {
  try {
    const result = await MasterIndexModel.findAll({ order: [["id", "DESC"]] });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล", detail: err.message });
  }
});


// app.get("/masterIndexListPaginate", async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const offset = (page - 1) * limit;
//     const fileName = req.query.fileName || "";
//     const sheetName = req.query.sheetName || "";

//     const whereClause = {};
//     if (fileName) whereClause.FILE_NAME = { [Op.iLike]: `%${fileName}%` };
//     if (sheetName) whereClause.SHEET_NAME = { [Op.iLike]: `%${sheetName}%` };

//     const { count, rows } = await MasterIndexModel.findAndCountAll({
//       where: whereClause,
//       offset,
//       limit,
//       order: [["id", "ASC"]],
//     });

//     const totalPages = Math.ceil(count / limit);

//     res.json({
//       results: rows,
//       totalPages,
//       currentPage: page,
//       totalCount: count,
//     });
//   } catch (err) {
//     res.status(500).json({ error: "ดึงข้อมูลแบบแบ่งหน้าไม่สำเร็จ", detail: err.message });
//   }
// });

app.get("/masterIndexListPaginate", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const fileName = req.query.fileName || "";
    const sheetName = req.query.sheetName || "";
    const sn = req.query.sn || "";   // ✅ เพิ่มรับค่า S_N

    const whereClause = {};

    // เงื่อนไข FILE_NAME
    if (fileName) {
      whereClause.FILE_NAME = { [Op.iLike]: `%${fileName}%` };
    }

    // เงื่อนไข SHEET_NAME
    if (sheetName) {
      whereClause.SHEET_NAME = { [Op.iLike]: `%${sheetName}%` };
    }

    // ✅ เพิ่มเงื่อนไขค้นหา S_N (รองรับตัวเล็ก/ตัวใหญ่)
    if (sn) {
      whereClause.S_N = { [Op.iLike]: `%${sn}%` };
    }

    const { count, rows } = await MasterIndexModel.findAndCountAll({
      where: whereClause,
      offset,
      limit,
      order: [["id", "ASC"]],
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      results: rows,
      totalPages,
      currentPage: page,
      totalCount: count,
    });
  } catch (err) {
    res.status(500).json({
      error: "ดึงข้อมูลแบบแบ่งหน้าไม่สำเร็จ",
      detail: err.message,
    });
  }
});

app.get("/masterIndexAllFileNames", async (req, res) => {
  try {
    const data = await MasterIndexModel.findAll({
      attributes: ["FILE_NAME"],
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "ไม่สามารถดึง FILE_NAME ทั้งหมดได้", detail: err.message });
  }
});

// 🔍 ดึง SHEET_NAME ที่ตรงกับ FILE_NAME ที่เลือก
app.get("/masterIndexSheetNamesByFile", async (req, res) => {
  try {
    const { fileName } = req.query;
    if (!fileName) return res.json([]);

    const data = await MasterIndexModel.findAll({
      where: { FILE_NAME: { [Op.iLike]: `%${fileName}%` } },
      attributes: ["SHEET_NAME"],
      group: ["SHEET_NAME"],
      order: [["SHEET_NAME", "ASC"]],
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "ดึง SHEET_NAME ไม่สำเร็จ", detail: err.message });
  }
});

app.get("/masterIndex/export", async (req, res) => {
  try {
    const { fileName, sheetName } = req.query;
    let where = {};

    if (fileName) where.FILE_NAME = fileName;
    if (sheetName) where.SHEET_NAME = sheetName;

    const data = await MasterIndexModel.findAll({ where });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Master Index");

    worksheet.columns = [
      // { header: "ID", key: "id", width: 10 },
      { header: "FILE_NAME", key: "FILE_NAME", width: 25 },
      { header: "SHEET_NAME", key: "SHEET_NAME", width: 25 },
      { header: "DATE_RECEIVED", key: "DATE_RECEIVED", width: 20 },
      { header: "FIXASSET", key: "FIXASSET", width: 20 },
      { header: "PRICE", key: "PRICE", width: 15 },
      { header: "TYPE_MODEL", key: "TYPE_MODEL", width: 20 },
      { header: "MAKER", key: "MAKER", width: 20 },
      { header: "S_N", key: "S_N", width: 15 },
      { header: "CONTROL_NO", key: "CONTROL_NO", width: 20 },
      { header: "INVOICE_NO", key: "INVOICE_NO", width: 20 },
      { header: "SCRAP_DATE", key: "SCRAP_DATE", width: 20 },
      { header: "REMARK", key: "REMARK", width: 25 },
    ];

    data.forEach((d) => worksheet.addRow(d.dataValues));

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=MasterIndex_${Date.now()}.xlsx`
    );
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    await workbook.xlsx.write(res);
    res.end();
  } catch (e) {
    console.error(e);
    res.status(500).send({ message: e.message });
  }
});

app.get("/masterIndex/summary", async (req, res) => {
  try {
    const records = await MasterIndexModel.findAll();

    const total = records.length;

    // ✅ กลุ่มตาม FILE_NAME
    const fileGroups = {};
    records.forEach((r) => {
      if (!fileGroups[r.FILE_NAME]) {
        fileGroups[r.FILE_NAME] = {
          sheets: new Set(),
          okCount: 0,
          scrapCount: 0,
        };
      }

      // ✅ เก็บ SHEET_NAME
      fileGroups[r.FILE_NAME].sheets.add(r.SHEET_NAME);

      // ✅ แยกนับ SCRAP / OK
      if (r.SCRAP_DATE) fileGroups[r.FILE_NAME].scrapCount++;
      else fileGroups[r.FILE_NAME].okCount++;
    });

    // ✅ สร้างข้อมูลสำหรับ dashboard
    const fileDetails = Object.keys(fileGroups).map((file) => ({
      FILE_NAME: file,
      sheetCount: fileGroups[file].sheets.size,
      okCount: fileGroups[file].okCount,
      scrapCount: fileGroups[file].scrapCount,
    }));

    // ✅ รวมค่า scrap ทั้งหมด
    const scrapCountTotal = records.filter((r) => r.SCRAP_DATE !== null).length;

    res.json({
      total,
      fileCount: Object.keys(fileGroups).length,
      fileDetails,
      scrapCount: scrapCountTotal,
    });
  } catch (err) {
    console.error("Error in summary:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล", detail: err.message });
  }
});

// ✅ รายการ OK SHEET (SCRAP_DATE = null)
app.get("/masterIndex/list-ok", async (req, res) => {
  try {
    const { fileName } = req.query;
    const list = await MasterIndexModel.findAll({
      where: { FILE_NAME: fileName, SCRAP_DATE: null },
      order: [["SHEET_NAME", "ASC"]],
    });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ รายการ SCRAP SHEET (SCRAP_DATE not null)
app.get("/masterIndex/list-scrap", async (req, res) => {
  try {
    const { fileName } = req.query;
    const list = await MasterIndexModel.findAll({
      where: {
        FILE_NAME: fileName,
        SCRAP_DATE: { [require("sequelize").Op.not]: null },
      },
      order: [["SHEET_NAME", "ASC"]],
    });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// ✅ ดึงรายการทั้งหมดของไฟล์ (OK + SCRAP)
app.get("/masterIndex/list-total", async (req, res) => {
  try {
    const { fileName } = req.query;
    const list = await MasterIndexModel.findAll({
      where: { FILE_NAME: fileName },
      order: [["SHEET_NAME", "ASC"]],
    });
    res.json(list);
  } catch (err) {
    console.error("Error fetching total list:", err);
    res.status(500).json({ error: err.message });
  }
});


// 🔍 ดึงตาม ID
app.get("/masterIndex/:id", async (req, res) => {
  try {
    const result = await MasterIndexModel.findByPk(req.params.id);
    if (!result) return res.status(404).json({ error: "ไม่พบข้อมูล" });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล", detail: err.message });
  }
});


// ➕ เพิ่มข้อมูล
app.post("/addMasterIndex", async (req, res) => {
  try {
    const created = await MasterIndexModel.create(req.body);
    res.json(created);
  } catch (err) {
    res.status(500).json({ error: "เพิ่มข้อมูลไม่สำเร็จ", detail: err.message });
  }
});

// 📝 แก้ไขข้อมูล
app.put("/editMasterIndex/:id", async (req, res) => {
  try {
    const updated = await MasterIndexModel.update(req.body, {
      where: { id: req.params.id },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "แก้ไขข้อมูลไม่สำเร็จ", detail: err.message });
  }
});

// ❌ ลบข้อมูล
app.delete("/deleteMasterIndex/:id", async (req, res) => {
  try {
    const deleted = await MasterIndexModel.destroy({
      where: { id: req.params.id },
    });
    res.json({ message: "ลบข้อมูลสำเร็จ", count: deleted });
  } catch (err) {
    res.status(500).json({ error: "ลบข้อมูลไม่สำเร็จ", detail: err.message });
  }
});






module.exports = app;
