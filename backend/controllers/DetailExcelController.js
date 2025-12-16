// // controllers/DetailExcelController.js
// const express = require("express");
// const multer = require("multer");
// const ExcelJS = require("exceljs");
// const DetailModel = require("../models/DetailModel");
// const app = express.Router();

// const upload = multer({ dest: "uploads/" }); // 📁 เก็บไฟล์ชั่วคราว

// // ✅ Upload และ Import Excel เข้าตาราง detail
// app.post("/upload-excel-detail", upload.single("file"), async (req, res) => {
//   try {
//     const filePath = req.file.path;
//     const workbook = new ExcelJS.Workbook();
//     await workbook.xlsx.readFile(filePath);
//     const sheet = workbook.worksheets[0]; // 📄 อ่าน sheet แรก

//     // 🧩 ฟังก์ชันช่วย parse cell
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
//       if (rowNumber === 1) return; // ข้าม header
//       rows.push({
//         code: parseCell(row.getCell(1)),
//         name: parseCell(row.getCell(2)),
//         date_rec: parseDateCell(row.getCell(3)),
//         Serial: parseCell(row.getCell(4)),
//         control: parseCell(row.getCell(5)),
//         invoice: parseCell(row.getCell(6)),
//         scrap: parseCell(row.getCell(7)),
//         model: parseCell(row.getCell(8)),
//         sheet: parseCell(row.getCell(9)),
//         doc_no: parseCell(row.getCell(10)),
//         fixasset: parseCell(row.getCell(11)),
//         price: parseCell(row.getCell(12)),
//         maker: parseCell(row.getCell(13)),
//       });
//     });

//     if (rows.length === 0) {
//       return res.status(400).json({ message: "ไม่มีข้อมูลในไฟล์ Excel" });
//     }

//     // 🧹 ลบข้อมูลเก่าทั้งหมด
//     await DetailModel.destroy({ where: {} });

//     // 🔁 รีเซ็ต id ให้เริ่มจาก 1 ใหม่
//     await DetailModel.sequelize.query(
//       `ALTER SEQUENCE detail_gauges_id_seq RESTART WITH 1;`
//     );

//     // ➕ เพิ่มข้อมูลใหม่ทั้งหมด
//     await DetailModel.bulkCreate(rows);

//     res.status(200).json({
//       message: `✅ ลบข้อมูลเก่าทั้งหมดและนำเข้าใหม่สำเร็จ (${rows.length} แถว, id เริ่มจาก 1)`,
//     });
//   } catch (error) {
//     console.error("❌ Error importing Excel (detail_gauges):", error);
//     res.status(500).json({ message: "เกิดข้อผิดพลาดในการนำเข้า Excel" });
//   }
// });

// module.exports = app;

// controllers/DetailExcelController.js แก้ชื่อตารางในไฟล์นี้ด้วย
const express = require("express");
const multer = require("multer");
const ExcelJS = require("exceljs");
const XLSX = require("xlsx"); // ✅ เพิ่ม lib สำหรับ .xls
const DetailModel = require("../models/DetailModel");
const path = require("path");

const app = express.Router();
const upload = multer({ dest: "uploads/" });

app.post("/upload-excel-detail", upload.single("file"), async (req, res) => {
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
        if (rowNumber === 1) return;
        rows.push({
          code: parseCell(row.getCell(1)),
          name: parseCell(row.getCell(2)),
          date_rec: parseDateCell(row.getCell(3)),
          Serial: parseCell(row.getCell(4)),
          control: parseCell(row.getCell(5)),
          invoice: parseCell(row.getCell(6)),
          scrap: parseCell(row.getCell(7)),
          model: parseCell(row.getCell(8)),
          sheet: parseCell(row.getCell(9)),
          doc_no: parseCell(row.getCell(10)),
          fixasset: parseCell(row.getCell(11)),
          price: parseCell(row.getCell(12)),
          maker: parseCell(row.getCell(13)),
        });
      });
    } else if (ext === ".xls") {
      // ✅ อ่านไฟล์ .xls ด้วย xlsx (อ่านได้ทั้ง .xls และ .xlsx)
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });

      rows = sheet.map((r) => ({
        code: r["code"] || null,
        name: r["name"] || null,
        date_rec: r["date_rec"] ? new Date(r["date_rec"]).toISOString() : null,
        Serial: r["Serial"] || null,
        control: r["control"] || null,
        invoice: r["invoice"] || null,
        scrap: r["scrap"] || null,
        model: r["model"] || null,
        sheet: r["sheet"] || null,
        doc_no: r["doc_no"] || null,
        fixasset: r["fixasset"] || null,
        price: r["price"] || null,
        maker: r["maker"] || null,
      }));
    } else {
      return res.status(400).json({ message: "รองรับเฉพาะไฟล์ .xls และ .xlsx เท่านั้น" });
    }

    if (rows.length === 0) {
      return res.status(400).json({ message: "ไม่มีข้อมูลในไฟล์ Excel" });
    }

    // ลบข้อมูลเก่า
    await DetailModel.destroy({ where: {} });
    await DetailModel.sequelize.query(`ALTER SEQUENCE detail_gauges_id_seq RESTART WITH 1;`);

    await DetailModel.bulkCreate(rows);

    res.status(200).json({
      message: `✅ นำเข้าไฟล์สำเร็จ (${rows.length} แถว, id เริ่มจาก 1 ใหม่)`,
    });
  } catch (error) {
    console.error("❌ Error importing Excel (detail):", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการนำเข้า Excel" });
  }
});

module.exports = app;
