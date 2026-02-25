// // controllers/DetailExcelController.js แก้ชื่อตารางในไฟล์นี้ด้วย
// const express = require("express");
// const multer = require("multer");
// const ExcelJS = require("exceljs");
// const XLSX = require("xlsx"); // ✅ เพิ่ม lib สำหรับ .xls
// const DetailModel = require("../models/DetailModel");
// const path = require("path");

// const app = express.Router();
// const upload = multer({ dest: "uploads/" });

// app.post("/upload-excel-detail", upload.single("file"), async (req, res) => {
//   try {
//     const filePath = req.file.path;
//     const ext = path.extname(req.file.originalname).toLowerCase();

//     let rows = [];

//     if (ext === ".xlsx") {
//       // ✅ อ่านไฟล์ .xlsx ด้วย ExcelJS
//       const workbook = new ExcelJS.Workbook();
//       await workbook.xlsx.readFile(filePath);
//       const sheet = workbook.worksheets[0];

//       const parseCell = (cell) => {
//         if (!cell || cell.value == null) return null;
//         if (typeof cell.value === "object" && cell.value.richText)
//           return cell.value.richText.map((rt) => rt.text).join("");
//         return String(cell.value).trim();
//       };

//       const parseDateCell = (cell) => {
//         if (!cell || !cell.value) return null;
//         if (cell.type === ExcelJS.ValueType.Date && cell.value instanceof Date)
//           return cell.value.toISOString();
//         const str = String(cell.value).trim();
//         if (!str || str.toLowerCase().includes("invalid")) return null;
//         const parsed = new Date(str);
//         return isNaN(parsed.getTime()) ? null : parsed.toISOString();
//       };

//       sheet.eachRow((row, rowNumber) => {
//         if (rowNumber === 1) return;
//         rows.push({
//           code: parseCell(row.getCell(1)),
//           name: parseCell(row.getCell(2)),
//           date_rec: parseDateCell(row.getCell(3)),
//           Serial: parseCell(row.getCell(4)),
//           control: parseCell(row.getCell(5)),
//           invoice: parseCell(row.getCell(6)),
//           scrap: parseCell(row.getCell(7)),
//           model: parseCell(row.getCell(8)),
//           sheet: parseCell(row.getCell(9)),
//           doc_no: parseCell(row.getCell(10)),
//           fixasset: parseCell(row.getCell(11)),
//           price: parseCell(row.getCell(12)),
//           maker: parseCell(row.getCell(13)),
//         });
//       });
//     } else if (ext === ".xls") {
//       // ✅ อ่านไฟล์ .xls ด้วย xlsx (อ่านได้ทั้ง .xls และ .xlsx)
//       const workbook = XLSX.readFile(filePath);
//       const sheetName = workbook.SheetNames[0];
//       const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });

//       rows = sheet.map((r) => ({
//         code: r["code"] || null,
//         name: r["name"] || null,
//         date_rec: r["date_rec"] ? new Date(r["date_rec"]).toISOString() : null,
//         Serial: r["Serial"] || null,
//         control: r["control"] || null,
//         invoice: r["invoice"] || null,
//         scrap: r["scrap"] || null,
//         model: r["model"] || null,
//         sheet: r["sheet"] || null,
//         doc_no: r["doc_no"] || null,
//         fixasset: r["fixasset"] || null,
//         price: r["price"] || null,
//         maker: r["maker"] || null,
//       }));
//     } else {
//       return res.status(400).json({ message: "รองรับเฉพาะไฟล์ .xls และ .xlsx เท่านั้น" });
//     }

//     if (rows.length === 0) {
//       return res.status(400).json({ message: "ไม่มีข้อมูลในไฟล์ Excel" });
//     }

//     // ลบข้อมูลเก่า
//     await DetailModel.destroy({ where: {} });
//     await DetailModel.sequelize.query(`ALTER SEQUENCE detail_gauges_id_seq RESTART WITH 1;`);

//     await DetailModel.bulkCreate(rows);

//     res.status(200).json({
//       message: `✅ นำเข้าไฟล์สำเร็จ (${rows.length} แถว, id เริ่มจาก 1 ใหม่)`,
//     });
//   } catch (error) {
//     console.error("❌ Error importing Excel (detail):", error);
//     res.status(500).json({ message: "เกิดข้อผิดพลาดในการนำเข้า Excel" });
//   }
// });

// module.exports = app;

// controllers/DetailExcelController.js
const express = require("express");
const multer = require("multer");
const ExcelJS = require("exceljs");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs/promises");

const DetailModel = require("../models/DetailModel");

const app = express.Router();
const upload = multer({ dest: "uploads/" });

// ====== HEADER CHECK HELPERS ======
const EXCLUDE_DB_COLS = ["id", "createdAt", "updatedAt"];

function normalizeHeader(h) {
  return String(h ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getDbHeaders() {
  // ดึงชื่อคอลัมน์จาก Sequelize Model (ยกเว้น id/createdAt/updatedAt)
  return Object.keys(DetailModel.rawAttributes).filter(
    (k) => !EXCLUDE_DB_COLS.includes(k)
  );
}

function diffHeaders(excelHeaders, dbHeaders) {
  const excelNorm = excelHeaders.map(normalizeHeader).filter(Boolean);
  const dbNorm = dbHeaders.map(normalizeHeader).filter(Boolean);

  const missingInExcel = dbNorm.filter((h) => !excelNorm.includes(h));
  const extraInExcel = excelNorm.filter((h) => !dbNorm.includes(h));

  return { excelNorm, dbNorm, missingInExcel, extraInExcel };
}

function parseCellValue(val) {
  if (val == null) return null;
  if (typeof val === "object" && val.richText) {
    return val.richText.map((rt) => rt.text).join("").trim();
  }
  return String(val).trim();
}

app.post("/upload-excel-detail", upload.single("file"), async (req, res) => {
  const filePath = req.file?.path;
  const ext = path.extname(req.file?.originalname || "").toLowerCase();

  try {
    if (!filePath) return res.status(400).json({ message: "⚠️ ไม่พบไฟล์ที่อัปโหลด" });

    if (ext !== ".xlsx" && ext !== ".xls") {
      return res.status(400).json({ message: "⚠️ รองรับเฉพาะไฟล์ .xls และ .xlsx เท่านั้น" });
    }

    const dbHeaders = getDbHeaders(); // เช่น code, name, date_rec, Serial, ...

    let excelHeaders = [];
    let rows = [];

    // =======================
    // ✅ .xlsx
    // =======================
    if (ext === ".xlsx") {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const sheet = workbook.worksheets[0];

      // 1) อ่านหัวตาราง (แถวแรก)
      const headerRow = sheet.getRow(1);
      excelHeaders = [];
      for (let c = 1; c <= headerRow.cellCount; c++) {
        excelHeaders.push(parseCellValue(headerRow.getCell(c).value));
      }

      // 2) ตรวจหัวตาราง
      const { missingInExcel, extraInExcel } = diffHeaders(excelHeaders, dbHeaders);
      if (missingInExcel.length || extraInExcel.length) {
        return res.status(400).json({
          message: "⚠️ หัวตารางในไฟล์ Excel ไม่ตรงกับหัวตารางในฐานข้อมูล (DETAIL)",
          details: {
            expected: dbHeaders,
            found: excelHeaders,
            missingInExcel,
            extraInExcel,
            ignoreDbColumns: EXCLUDE_DB_COLS,
          },
        });
      }

      // 3) ทำ map header -> column index (อ่านข้อมูลตามชื่อหัวตาราง ไม่ยึดตำแหน่ง)
      const headerMap = {};
      for (let c = 1; c <= headerRow.cellCount; c++) {
        const key = normalizeHeader(parseCellValue(headerRow.getCell(c).value));
        if (key) headerMap[key] = c;
      }

      const getCellByHeader = (row, headerName) => {
        const idx = headerMap[normalizeHeader(headerName)];
        if (!idx) return null;
        return row.getCell(idx);
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

      // 4) อ่านข้อมูล
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        rows.push({
          code: parseCellValue(getCellByHeader(row, "code")?.value),
          name: parseCellValue(getCellByHeader(row, "name")?.value),
          date_rec: parseDateCell(getCellByHeader(row, "date_rec")),
          Serial: parseCellValue(getCellByHeader(row, "Serial")?.value), // เคสตัวใหญ่ตาม DB
          control: parseCellValue(getCellByHeader(row, "control")?.value),
          invoice: parseCellValue(getCellByHeader(row, "invoice")?.value),
          scrap: parseCellValue(getCellByHeader(row, "scrap")?.value),
          model: parseCellValue(getCellByHeader(row, "model")?.value),
          sheet: parseCellValue(getCellByHeader(row, "sheet")?.value),
          doc_no: parseCellValue(getCellByHeader(row, "doc_no")?.value),
          fixasset: parseCellValue(getCellByHeader(row, "fixasset")?.value),
          price: parseCellValue(getCellByHeader(row, "price")?.value),
          maker: parseCellValue(getCellByHeader(row, "maker")?.value),
        });
      });
    }

    // =======================
    // ✅ .xls
    // =======================
    if (ext === ".xls") {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const ws = workbook.Sheets[sheetName];

      // 1) อ่านหัวตารางจากแถวแรก
      const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
      excelHeaders = (aoa[0] || []).map((h) => String(h).trim());

      // 2) ตรวจหัวตาราง
      const { missingInExcel, extraInExcel } = diffHeaders(excelHeaders, dbHeaders);
      if (missingInExcel.length || extraInExcel.length) {
        return res.status(400).json({
          message: "⚠️ หัวตารางในไฟล์ Excel ไม่ตรงกับหัวตารางในฐานข้อมูล (DETAIL)",
          details: {
            expected: dbHeaders,
            found: excelHeaders,
            missingInExcel,
            extraInExcel,
            ignoreDbColumns: EXCLUDE_DB_COLS,
          },
        });
      }

      // 3) อ่านข้อมูลตาม header
      const data = XLSX.utils.sheet_to_json(ws, { defval: null });
      rows = data.map((r) => ({
        code: r["code"] ?? null,
        name: r["name"] ?? null,
        date_rec: r["date_rec"] ? new Date(r["date_rec"]).toISOString() : null,
        Serial: r["Serial"] ?? null,
        control: r["control"] ?? null,
        invoice: r["invoice"] ?? null,
        scrap: r["scrap"] ?? null,
        model: r["model"] ?? null,
        sheet: r["sheet"] ?? null,
        doc_no: r["doc_no"] ?? null,
        fixasset: r["fixasset"] ?? null,
        price: r["price"] ?? null,
        maker: r["maker"] ?? null,
      }));
    }

    if (!rows.length) {
      return res.status(400).json({ message: "⚠️ ไม่มีข้อมูลในไฟล์ Excel" });
    }

    // ✅ ผ่าน header-check แล้วค่อยทำลบ/รีเซ็ต/เพิ่ม
    await DetailModel.destroy({ where: {} });
    await DetailModel.sequelize.query(`ALTER SEQUENCE detail_gauges_id_seq RESTART WITH 1;`);
    await DetailModel.bulkCreate(rows);

    return res.status(200).json({
      message: `✅ นำเข้าไฟล์สำเร็จ (${rows.length} แถว, id เริ่มจาก 1 ใหม่)`,
    });
  } catch (error) {
    console.error("❌ Error importing Excel (detail):", error);
    return res.status(500).json({ message: "เกิดข้อผิดพลาดในการนำเข้า Excel" });
  } finally {
    if (filePath) {
      try { await fs.unlink(filePath); } catch (_) {}
    }
  }
});

module.exports = app;

