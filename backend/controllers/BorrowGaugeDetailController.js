//BorrowGaugeDetailRoute.js
const express = require("express");
const app = express.Router();
const ExcelJS = require("exceljs");
const BorrowGaugeDetailModel = require("../models/BorrowGaugeDetailModel");
const GaugeRequestModel = require("../models/GaugeRequestModel");

const DetailModel = require("../models/DetailModel"); // ✅ เพิ่ม import model นี้

const { Op } = require("sequelize");



// ✅ เพิ่มข้อมูลหลายรายการ
app.post("/addMany", async (req, res) => {
  try {
    const { doc_No, items } = req.body;

    if (!doc_No || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง" });
    }

    // ✅ สร้าง records สำหรับ insert
    const records = items.map((item) => ({
      doc_No,
      item_no: item.itemNo,
      item_name: item.itemName,
      qty: item.qty,
      serial: item.serial,
      control: item.controlNo,
      model: item.typeModel,
    }));

    // ✅ บันทึกลง BorrowGaugeDetailModel
    await BorrowGaugeDetailModel.bulkCreate(records);

    // ✅ อัปเดตตาราง DetailModel ใส่ doc_no
    let updateCount = 0;
    for (const item of items) {
      // ✅ สร้างเงื่อนไขการค้นหาแบบ Dynamic (Prioritize Control No.)
      const whereCondition = {};

      // ถ้ามี Control No. ใช้ Control No. เจาะจงไปเลย (Unique กว่า)
      if (item.controlNo && item.controlNo !== "-" && item.controlNo.trim() !== "") {
        whereCondition.control = item.controlNo;
      }
      // ถ้าไม่มี Control No. ค่อยใช้ Serial
      else if (item.serial && item.serial !== "-" && item.serial.trim() !== "") {
        whereCondition.Serial = item.serial;
      } else {
        continue;
      }

      const [affected] = await DetailModel.update(
        { doc_no: doc_No },
        {
          where: whereCondition,
        }
      );
      if (affected > 0) updateCount++;
    }

    res.json({
      message: "เพิ่มข้อมูลสำเร็จ",
      count: records.length,
      updated_detail: updateCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "ไม่สามารถเพิ่มข้อมูลได้",
      error: error.message,
    });
  }
});


app.put("/borrow/update-return", async (req, res) => {
  try {
    const { doc_No, items, rec_return, name_rec, lastname_rec, typemc_rec, date_re, } = req.body;

    if (!doc_No || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง" });
    }

    let count = 0;
    let resetCount = 0;

    for (const item of items) {
      // ✅ 1. อัปเดต BorrowGaugeDetailModel ให้ return = 'Y'
      // ใช้ id ดีที่สุด ถ้าไม่มีให้ใช้ doc_No + serial/control
      let whereClause;
      if (item.id) {
        whereClause = { id: item.id };
      } else {
        whereClause = { doc_No };
        if (item.serial) whereClause.serial = item.serial;
        if (item.control) whereClause.control = item.control;
        if (item.item_no) whereClause.item_no = item.item_no;
      }

      const isReturned = item.return && item.return.trim() !== "";

      const result = await BorrowGaugeDetailModel.update(
        {
          return: item.return,
          rec_return: isReturned ? (item.rec_return || rec_return || null) : null,
          name_rec: isReturned ? (item.name_rec || name_rec || null) : null,
          lastname_rec: isReturned ? (item.lastname_rec || lastname_rec || null) : null,
          typemc_rec: isReturned ? (item.typemc_rec || typemc_rec || null) : null,
          date_re: isReturned ? (item.date_re || date_re || null) : null,
        },
        { where: whereClause }
      );

      if (result[0] > 0) {
        count++;

        // ✅ 2. อัปเดต DetailModel (Inventory)
        // ต้องค้นหาแค่ 1 รายการแล้วอัปเดต (เพื่อป้องกันการคืนซ้ำซ้อนกรณีของเหมือนกันหลายชิ้น)
        // update 2024-01-16: ต้องเช็คว่ามีการคืนจริงๆ (isReturned) ถึงจะลบ doc_no ออก
        if (isReturned) {
          const conditions = [];
          // ถ้ามี Control No ใช้ Control No เป็นหลักในการค้นหา
          if (item.control && item.control !== "-" && item.control.trim() !== "") {
            conditions.push({ control: item.control });
          }
          // ถ้ามี Serial ใช้ Serial ในการค้นหา (Serial ควรจะ Unique กว่า)
          if (item.serial && item.serial !== "-" && item.serial.trim() !== "") {
            conditions.push({ Serial: item.serial });
          }

          if (conditions.length > 0) {
            // ค้นหา record เดียวที่ตรงกับ doc_no นี้ และเงื่อนไข item
            const targetItem = await DetailModel.findOne({
              where: {
                [Op.and]: [
                  { [Op.or]: conditions },
                  { doc_no: String(doc_No) },
                ],
              },
            });

            // ถ้าเจอ ให้เคลียร์ doc_no แค่รายการเดียว
            if (targetItem) {
              await targetItem.update({ doc_no: null });
              resetCount++;
            }
          }
        }
      }
    }

    res.json({
      message: "success",
      count,
      reset_doc_no: resetCount,
    });
  } catch (error) {
    console.error("❌ update-return error:", error);
    res.status(500).json({ message: "error", error: error.message });
  }
});



// ✅ ดึงข้อมูลทั้งหมด
app.get("/borrow-gauge-detail/list", async (req, res) => {
  try {
    const result = await BorrowGaugeDetailModel.findAll({
      order: [["id", "ASC"]],
    });
    res.json({ message: "success", result });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "error",
      error: error.message,
    });
  }
});

// ✅ ดึงข้อมูลจาก 2 ตาราง พร้อมรวมโดยใช้ doc_No = docNo
app.get("/list", async (req, res) => {
  try {
    const details = await BorrowGaugeDetailModel.findAll({
      order: [["id", "ASC"]],
    });

    const requests = await GaugeRequestModel.findAll({
      // attributes: ["docNo", "requestBy", "issueBy", "receivedBy" , "section"],
      attributes: ["docNo", "name", "name_issue", "name_received", "section"],
    });

    // รวมข้อมูลทั้งสองตาราง
    const mergedData = details.map((d) => {
      const match = requests.find((r) => r.docNo === d.doc_No);
      return {
        ...d.toJSON(),
        // requestBy: match?.requestBy || "-",
        // issueBy: match?.issueBy || "-",
        // receivedBy: match?.receivedBy || "-",
        // section: match?.section || "-",
        name: match?.name || "-",
        name_issue: match?.name_issue || "-",
        name_received: match?.name_received || "-",
        section: match?.section || "-",
      };
    });

    res.json({ message: "success", result: mergedData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "error", error: error.message });
  }
});

// ✅ ดึงข้อมูล 2 ตาราง + ส่งออก Excel
app.get("/export", async (req, res) => {
  try {
    const search = req.query.search ? req.query.search.toLowerCase() : "";

    const details = await BorrowGaugeDetailModel.findAll();
    const requests = await GaugeRequestModel.findAll({
      attributes: [
        "docNo",
        "name",
        "name_issue",
        "name_received",
        "mc",
        "section",
        "date",
      ],
    });

    // ✅ รวมข้อมูล 2 ตาราง
    const mergedData = details
      .map((d) => {
        const match = requests.find((r) => r.docNo === d.doc_No);
        return {
          date: match?.date || "-",
          item_no: d.item_no,
          item_name: d.item_name,
          serial: d.serial,
          control: d.control,
          typeModel: d.model,
          name: match?.name || "-",
          name_issue: match?.name_issue || "-",
          machine: match?.mc || "-",
          section: match?.section || "-",
          docNo: d.doc_No,
          remark: d.remark || "",
        };
      })
      .filter(
        (d) =>
          d.docNo.toLowerCase().includes(search) ||
          d.serial.toLowerCase().includes(search) ||
          d.control.toLowerCase().includes(search) ||
          d.section.toLowerCase().includes(search)
      );

    if (mergedData.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูล" });
    }

    // ✅ ดึงชื่อ SECTION จากผลลัพธ์ชุดแรก
    const processSection = mergedData[0].section || "UNKNOWN";

    // ✅ สร้าง Workbook
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Gauge Issue Report");

    // หัวรายงาน
    ws.mergeCells("A1:L1");
    ws.getCell("A1").value = "GAUGE ISSUE REPORT";
    ws.getCell("A1").font = { bold: true, size: 14 };
    ws.getCell("A1").alignment = { horizontal: "center" };

    ws.mergeCells("A2:L2");
    ws.getCell("A2").value = `PROCESS : ${processSection}`;
    ws.getCell("A2").font = { italic: true, size: 12 };
    ws.getCell("A2").alignment = { horizontal: "center" };

    ws.addRow([]);
    ws.addRow([
      "DATE",
      "ITEM NO",
      "ITEM NAME",
      "SERIAL NO",
      "CONTROL NO",
      "TYPE / MODEL",
      "REQUEST BY",
      "ISSUE BY",
      "MACHINE",
      "SECTION",
      "DOC NO",
      "REMARK",
    ]);

    // จัดหัวตาราง
    ws.getRow(4).font = { bold: true };
    ws.getRow(4).alignment = { horizontal: "center" };
    ws.getRow(4).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9D9D9" },
    };

    // ✅ เติมข้อมูล
    mergedData.forEach((r) => {
      ws.addRow([
        r.date,
        r.item_no,
        r.item_name,
        r.serial,
        r.control,
        r.typeModel,
        r.name,
        r.name_issue,
        r.machine,
        r.section,
        r.docNo,
        r.remark,
      ]);
    });

    // ✅ จัดความกว้างคอลัมน์
    ws.columns.forEach((c) => (c.width = 18));

    // ✅ จัดกรอบเส้นรอบเซลล์
    ws.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // ✅ ส่งไฟล์ออกให้ดาวน์โหลด
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Gauge_Issue_Report_${processSection.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      )}.xlsx`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    await wb.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "error", error: error.message });
  }
});


module.exports = app;
