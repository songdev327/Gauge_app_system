// //MasterIndexExcelController.js 
// const express = require("express");
// const multer = require("multer");
// const ExcelJS = require("exceljs");
// const XLSX = require("xlsx"); // ✅ เพิ่ม library สำหรับอ่าน .xls
// const path = require("path");
// const MasterIndexModel = require("../models/MasterIndexModel");
// const app = express.Router();

// const upload = multer({ dest: "uploads/" }); // 📁 ที่เก็บไฟล์ชั่วคราว

// app.post("/upload-excel", upload.single("file"), async (req, res) => {
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
//         if (rowNumber === 1) return; // ข้าม header
//         rows.push({
//           FILE_NAME: parseCell(row.getCell(1)),
//           SHEET_NAME: parseCell(row.getCell(2)),
//           DATE_RECEIVED: parseDateCell(row.getCell(3)),
//           FIXASSET: parseCell(row.getCell(4)),
//           PRICE: parseCell(row.getCell(5)),
//           TYPE_MODEL: parseCell(row.getCell(6)),
//           MAKER: parseCell(row.getCell(7)),
//           S_N: parseCell(row.getCell(8)),
//           CONTROL_NO: parseCell(row.getCell(9)),
//           INVOICE_NO: parseCell(row.getCell(10)),
//           SCRAP_DATE: parseDateCell(row.getCell(11)),
//           REMARK: parseCell(row.getCell(12)),
//         });
//       });
//     } else if (ext === ".xls") {
//       // ✅ อ่านไฟล์ .xls ด้วย XLSX
//       const workbook = XLSX.readFile(filePath);
//       const sheetName = workbook.SheetNames[0];
//       const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });

//       rows = data.map((r) => ({
//         FILE_NAME: r["FILE_NAME"] || null,
//         SHEET_NAME: r["SHEET_NAME"] || null,
//         DATE_RECEIVED: r["DATE_RECEIVED"]
//           ? new Date(r["DATE_RECEIVED"]).toISOString()
//           : null,
//         FIXASSET: r["FIXASSET"] || null,
//         PRICE: r["PRICE"] || null,
//         TYPE_MODEL: r["TYPE_MODEL"] || null,
//         MAKER: r["MAKER"] || null,
//         S_N: r["S_N"] || null,
//         CONTROL_NO: r["CONTROL_NO"] || null,
//         INVOICE_NO: r["INVOICE_NO"] || null,
//         SCRAP_DATE: r["SCRAP_DATE"]
//           ? new Date(r["SCRAP_DATE"]).toISOString()
//           : null,
//         REMARK: r["REMARK"] || null,
//       }));
//     } else {
//       return res
//         .status(400)
//         .json({ message: "⚠️ รองรับเฉพาะไฟล์ .xls และ .xlsx เท่านั้น" });
//     }

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

//MasterIndexExcelController.js 
const express = require("express");
const multer = require("multer");
const ExcelJS = require("exceljs");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs/promises");

const MasterIndexModel = require("../models/MasterIndexModel");
const app = express.Router();

const upload = multer({ dest: "uploads/" });

// ====== HELPERS ======
const EXCLUDE_DB_COLS = ["id", "createdAt", "updatedAt"];

function normalizeHeader(h) {
  return String(h ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")               // space -> _
    .replace(/[^A-Z0-9_]/g, "_")        // symbols เช่น / - ( ) -> _
    .replace(/_+/g, "_")                // __ -> _
    .replace(/^_+|_+$/g, "");           // trim _ หัวท้าย
}

function getDbHeaders() {
  // ดึงชื่อคอลัมน์จาก Sequelize Model
  return Object.keys(MasterIndexModel.rawAttributes).filter(
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

// ====== ROUTE ======
app.post("/upload-excel", upload.single("file"), async (req, res) => {
  const filePath = req.file?.path;
  const ext = path.extname(req.file?.originalname || "").toLowerCase();

  try {
    if (!filePath) {
      return res.status(400).json({ message: "⚠️ ไม่พบไฟล์ที่อัปโหลด" });
    }

    if (ext !== ".xlsx" && ext !== ".xls") {
      return res
        .status(400)
        .json({ message: "⚠️ รองรับเฉพาะไฟล์ .xls และ .xlsx เท่านั้น" });
    }

    const dbHeaders = getDbHeaders(); // คอลัมน์ใน DB (ยกเว้น id/createdAt/updatedAt)

    let excelHeaders = [];
    let rows = [];

    // =======================
    // 1) อ่าน HEADER + VALIDATE
    // =======================
    if (ext === ".xlsx") {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const sheet = workbook.worksheets[0];

      const headerRow = sheet.getRow(1);
      // ดึงหัวตารางทั้งหมดจากแถวที่ 1
      excelHeaders = [];
      for (let c = 1; c <= headerRow.cellCount; c++) {
        excelHeaders.push(parseCellValue(headerRow.getCell(c).value));
      }

      const { missingInExcel, extraInExcel } = diffHeaders(excelHeaders, dbHeaders);

      if (missingInExcel.length || extraInExcel.length) {
        return res.status(400).json({
          message: "⚠️ หัวตารางในไฟล์ Excel ไม่ตรงกับหัวตารางในฐานข้อมูล",
          details: {
            expected: dbHeaders,               // ที่ DB ต้องการ
            found: excelHeaders,               // ที่ Excel มี
            missingInExcel,                    // DB ต้องการ แต่ Excel ไม่มี (normalize แล้ว)
            extraInExcel,                      // Excel มีเกินจาก DB (normalize แล้ว)
            ignoreDbColumns: EXCLUDE_DB_COLS,
          },
        });
      }

      // =======================
      // 2) สร้าง HEADER MAP (ชื่อหัวตาราง -> index คอลัมน์)
      // =======================
      const headerMap = {}; // normalizedHeader -> columnIndex
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
        if (cell.type === ExcelJS.ValueType.Date && cell.value instanceof Date) {
          return cell.value.toISOString();
        }
        const str = String(cell.value).trim();
        if (!str || str.toLowerCase().includes("invalid")) return null;
        const parsed = new Date(str);
        return isNaN(parsed.getTime()) ? null : parsed.toISOString();
      };

      // =======================
      // 3) อ่าน DATA ตามชื่อหัวตาราง (ไม่ยึดตำแหน่ง)
      // =======================
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        rows.push({
          FILE_NAME: parseCellValue(getCellByHeader(row, "FILE_NAME")?.value),
          SHEET_NAME: parseCellValue(getCellByHeader(row, "SHEET_NAME")?.value),
          DATE_RECEIVED: parseDateCell(getCellByHeader(row, "DATE_RECEIVED")),
          FIXASSET: parseCellValue(getCellByHeader(row, "FIXASSET")?.value),
          PRICE: parseCellValue(getCellByHeader(row, "PRICE")?.value),
          TYPE_MODEL: parseCellValue(getCellByHeader(row, "TYPE_MODEL")?.value),
          MAKER: parseCellValue(getCellByHeader(row, "MAKER")?.value),
          S_N: parseCellValue(getCellByHeader(row, "S_N")?.value),
          CONTROL_NO: parseCellValue(getCellByHeader(row, "CONTROL_NO")?.value),
          INVOICE_NO: parseCellValue(getCellByHeader(row, "INVOICE_NO")?.value),
          SCRAP_DATE: parseDateCell(getCellByHeader(row, "SCRAP_DATE")),
          REMARK: parseCellValue(getCellByHeader(row, "REMARK")?.value),
        });
      });
    }

    if (ext === ".xls") {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // อ่าน header แถวแรกแบบ array
      const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      excelHeaders = (aoa[0] || []).map((h) => String(h).trim());

      const { missingInExcel, extraInExcel } = diffHeaders(excelHeaders, dbHeaders);

      if (missingInExcel.length || extraInExcel.length) {
        return res.status(400).json({
          message: "⚠️ หัวตารางในไฟล์ Excel ไม่ตรงกับหัวตารางในฐานข้อมูล",
          details: {
            expected: dbHeaders,
            found: excelHeaders,
            missingInExcel,
            extraInExcel,
            ignoreDbColumns: EXCLUDE_DB_COLS,
          },
        });
      }

      // อ่านข้อมูลเป็น object ตาม header
      const data = XLSX.utils.sheet_to_json(sheet, { defval: null });
      rows = data.map((r) => ({
        FILE_NAME: r["FILE_NAME"] ?? null,
        SHEET_NAME: r["SHEET_NAME"] ?? null,
        DATE_RECEIVED: r["DATE_RECEIVED"] ? new Date(r["DATE_RECEIVED"]).toISOString() : null,
        FIXASSET: r["FIXASSET"] ?? null,
        PRICE: r["PRICE"] ?? null,
        TYPE_MODEL: r["TYPE_MODEL"] ?? null,
        MAKER: r["MAKER"] ?? null,
        S_N: r["S_N"] ?? null,
        CONTROL_NO: r["CONTROL_NO"] ?? null,
        INVOICE_NO: r["INVOICE_NO"] ?? null,
        SCRAP_DATE: r["SCRAP_DATE"] ? new Date(r["SCRAP_DATE"]).toISOString() : null,
        REMARK: r["REMARK"] ?? null,
      }));
    }

    if (!rows.length) {
      return res.status(400).json({ message: "⚠️ ไม่มีข้อมูลในไฟล์ Excel" });
    }

    // ✅ ผ่านการตรวจ header แล้วค่อยลบ/นำเข้า
    await MasterIndexModel.destroy({ where: {} });

    await MasterIndexModel.sequelize.query(
      `ALTER SEQUENCE master_indexs_id_seq RESTART WITH 1;`
    );

    await MasterIndexModel.bulkCreate(rows);

    return res.status(200).json({
      message: `✅ ลบข้อมูลเก่าทั้งหมดและนำเข้าใหม่สำเร็จ (${rows.length} แถว, id เริ่มใหม่จาก 1)`,
    });
  } catch (error) {
    console.error("❌ Error importing Excel:", error);
    return res.status(500).json({ message: "เกิดข้อผิดพลาดในการนำเข้า Excel" });
  } finally {
    // ลบไฟล์ชั่วคราว
    if (filePath) {
      try { await fs.unlink(filePath); } catch (_) {}
    }
  }
});

module.exports = app;

