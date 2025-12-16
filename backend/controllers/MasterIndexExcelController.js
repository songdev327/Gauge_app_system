// const express = require("express");
// const multer = require("multer");
// const ExcelJS = require("exceljs");
// const MasterIndexModel = require("../models/MasterIndexModel"); // 👈 ตามที่คุณตั้งชื่อไว้
// const app = express.Router();

// const upload = multer({ dest: "uploads/" }); // 📁 ที่เก็บไฟล์ชั่วคราว



// app.post("/upload-excel", upload.single("file"), async (req, res) => {
//   try {
//     const filePath = req.file.path;
//     const workbook = new ExcelJS.Workbook();
//     await workbook.xlsx.readFile(filePath);
//     const sheet = workbook.worksheets[0];

//     const parseCell = (cell) => {
//       if (!cell || cell.value == null) return null;
//       if (typeof cell.value === "object" && cell.value.richText)
//         return cell.value.richText.map((rt) => rt.text).join("");
//       return String(cell.value).trim();
//     };

//     const parseDateCell = (cell) => {
//       if (!cell || !cell.value) return null;
//       if (cell.type === ExcelJS.ValueType.Date && cell.value instanceof Date)
//         return cell.value.toISOString();
//       const str = String(cell.value).trim();
//       if (!str || str.toLowerCase().includes("invalid")) return null;
//       const parsed = new Date(str);
//       return isNaN(parsed.getTime()) ? null : parsed.toISOString();
//     };

//     // ✅ อ่านข้อมูลจาก Excel
//     const rows = [];
//     sheet.eachRow((row, rowNumber) => {
//       if (rowNumber === 1) return;
//       rows.push({
//         FILE_NAME: parseCell(row.getCell(1)),
//         SHEET_NAME: parseCell(row.getCell(2)),
//         DATE_RECEIVED: parseDateCell(row.getCell(3)),
//         FIXASSET: parseCell(row.getCell(4)),
//         PRICE: parseCell(row.getCell(5)),
//         TYPE_MODEL: parseCell(row.getCell(6)),
//         MAKER: parseCell(row.getCell(7)),
//         S_N: parseCell(row.getCell(8)),
//         CONTROL_NO: parseCell(row.getCell(9)),
//         INVOICE_NO: parseCell(row.getCell(10)),
//         SCRAP_DATE: parseDateCell(row.getCell(11)),
//         REMARK: parseCell(row.getCell(12)),
//       });
//     });

//     if (rows.length === 0) {
//       return res.status(400).json({ message: "ไม่มีข้อมูลในไฟล์ Excel" });
//     }

//     // 🧹 ลบข้อมูลเก่าทั้งหมด
//     await MasterIndexModel.destroy({ where: {} });

//     // 🔁 รีเซ็ตลำดับ id ให้เริ่มใหม่จาก 1
//     await MasterIndexModel.sequelize.query(
//       `ALTER SEQUENCE master_indexs_id_seq RESTART WITH 1;`
//     );

//     // ➕ เพิ่มข้อมูลใหม่ทั้งหมด
//     await MasterIndexModel.bulkCreate(rows);

//     res.status(200).json({
//       message: `✅ ลบข้อมูลเก่าทั้งหมดและนำเข้าใหม่สำเร็จ (${rows.length} แถว, id เริ่มใหม่จาก 1)`,
//     });
//   } catch (error) {
//     console.error("❌ Error importing Excel:", error);
//     res.status(500).json({ message: "เกิดข้อผิดพลาดในการนำเข้า Excel" });
//   }
// });



// module.exports = app;


//MasterIndexExcelController.js แก้ชื่อตารางในไฟล์นี้ด้วย
const express = require("express");
const multer = require("multer");
const ExcelJS = require("exceljs");
const XLSX = require("xlsx"); // ✅ เพิ่ม library สำหรับอ่าน .xls
const path = require("path");
const MasterIndexModel = require("../models/MasterIndexModel");
const app = express.Router();

const upload = multer({ dest: "uploads/" }); // 📁 ที่เก็บไฟล์ชั่วคราว

app.post("/upload-excel", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();

    let rows = [];

    if (ext === ".xlsx") {
      // ✅ อ่านไฟล์ .xlsx ด้วย ExcelJS
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const sheet = workbook.worksheets[0];

      const parseCell = (cell) => {
        if (!cell || cell.value == null) return null;
        if (typeof cell.value === "object" && cell.value.richText)
          return cell.value.richText.map((rt) => rt.text).join("");
        return String(cell.value).trim();
      };

      const parseDateCell = (cell) => {
        if (!cell || !cell.value) return null;
        if (cell.type === ExcelJS.ValueType.Date && cell.value instanceof Date)
          return cell.value.toISOString();
        const str = String(cell.value).trim();
        if (!str || str.toLowerCase().includes("invalid")) return null;
        const parsed = new Date(str);
        return isNaN(parsed.getTime()) ? null : parsed.toISOString();
      };

      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // ข้าม header
        rows.push({
          FILE_NAME: parseCell(row.getCell(1)),
          SHEET_NAME: parseCell(row.getCell(2)),
          DATE_RECEIVED: parseDateCell(row.getCell(3)),
          FIXASSET: parseCell(row.getCell(4)),
          PRICE: parseCell(row.getCell(5)),
          TYPE_MODEL: parseCell(row.getCell(6)),
          MAKER: parseCell(row.getCell(7)),
          S_N: parseCell(row.getCell(8)),
          CONTROL_NO: parseCell(row.getCell(9)),
          INVOICE_NO: parseCell(row.getCell(10)),
          SCRAP_DATE: parseDateCell(row.getCell(11)),
          REMARK: parseCell(row.getCell(12)),
        });
      });
    } else if (ext === ".xls") {
      // ✅ อ่านไฟล์ .xls ด้วย XLSX
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });

      rows = data.map((r) => ({
        FILE_NAME: r["FILE_NAME"] || null,
        SHEET_NAME: r["SHEET_NAME"] || null,
        DATE_RECEIVED: r["DATE_RECEIVED"]
          ? new Date(r["DATE_RECEIVED"]).toISOString()
          : null,
        FIXASSET: r["FIXASSET"] || null,
        PRICE: r["PRICE"] || null,
        TYPE_MODEL: r["TYPE_MODEL"] || null,
        MAKER: r["MAKER"] || null,
        S_N: r["S_N"] || null,
        CONTROL_NO: r["CONTROL_NO"] || null,
        INVOICE_NO: r["INVOICE_NO"] || null,
        SCRAP_DATE: r["SCRAP_DATE"]
          ? new Date(r["SCRAP_DATE"]).toISOString()
          : null,
        REMARK: r["REMARK"] || null,
      }));
    } else {
      return res
        .status(400)
        .json({ message: "⚠️ รองรับเฉพาะไฟล์ .xls และ .xlsx เท่านั้น" });
    }

    if (rows.length === 0) {
      return res.status(400).json({ message: "ไม่มีข้อมูลในไฟล์ Excel" });
    }

    // 🧹 ลบข้อมูลเก่าทั้งหมด
    await MasterIndexModel.destroy({ where: {} });

    // 🔁 รีเซ็ตลำดับ id ให้เริ่มใหม่จาก 1
    await MasterIndexModel.sequelize.query(
      `ALTER SEQUENCE master_indexs_id_seq RESTART WITH 1;`
    );

    // ➕ เพิ่มข้อมูลใหม่ทั้งหมด
    await MasterIndexModel.bulkCreate(rows);

    res.status(200).json({
      message: `✅ ลบข้อมูลเก่าทั้งหมดและนำเข้าใหม่สำเร็จ (${rows.length} แถว, id เริ่มใหม่จาก 1)`,
    });
  } catch (error) {
    console.error("❌ Error importing Excel:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการนำเข้า Excel" });
  }
});

module.exports = app;
