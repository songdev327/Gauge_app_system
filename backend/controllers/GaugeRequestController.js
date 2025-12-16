const express = require("express");
const app = express();
const ExcelJS = require("exceljs");
const GaugeRequestModel = require("../models/GaugeRequestModel");
const BorrowGaugeDetailModel = require("../models/BorrowGaugeDetailModel");
const DetailModel =  require("../models/DetailModel");

const { Op } = require("sequelize");

// ✅ บันทึกข้อมูลใหม่
app.post("/gauge-request/create", async (req, res) => {
  try {
    const data = req.body;
    const result = await GaugeRequestModel.create(data);
    res.send({ message: "success", result });
  } catch (e) {
    res.send({ message: e.message });
  }
});

app.get("/gauge-request/check-docno", async (req, res) => {
  try {
    const { docNo } = req.query;

    const exists = await GaugeRequestModel.findOne({
      where: { docNo }
    });

    res.send({ exists: !!exists });
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
});

app.put("/gauge-request/update-mc", async (req, res) => {
  try {
    const { id, mc } = req.body;

    await GaugeRequestModel.update(
      { mc },
      { where: { id } }
    );

    res.json({ message: "success" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "error" });
  }
});


// ✅ ดึงรายการทั้งหมด
app.get("/gauge-request/list", async (req, res) => {
  try {
    const result = await GaugeRequestModel.findAll({
      order: [["id", "DESC"]],
    });
    res.send({ message: "success", result });
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
});


// ✅ Export Excel รวมข้อมูล Header + Detail
app.get("/gauge-request/export-return", async (req, res) => {
  try {
    const docNoStr = String(req.query.docNo || "").trim();
    if (!docNoStr) return res.status(400).json({ message: "ต้องระบุ docNo" });

    const header = await GaugeRequestModel.findOne({
      where: { docNo: docNoStr },
    });

    if (!header)
      return res.status(404).json({ message: "ไม่พบข้อมูลหัวเอกสาร" });

    const details = await BorrowGaugeDetailModel.findAll({
      where: { doc_No: docNoStr },
    });

    if (!details || details.length === 0)
      return res.status(404).json({ message: "ไม่พบรายการยืม/คืน" });

    // ✅ สร้าง Excel
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Return Gauge");

    sheet.mergeCells("A1", "J1");
    sheet.getCell("A1").value = `Return Gauge Report — Doc No: ${docNoStr}`;
    sheet.getCell("A1").font = { bold: true, size: 16 };
    sheet.getCell("A1").alignment = { horizontal: "center" };

    const headerInfo = [
      ["Division", header.division],
      ["Date", header.date],
      ["Part Name", header.partName],
      ["Model", header.model],
      ["Part No", header.partNo],
      ["Machine", header.mc],
      ["Rev", header.rev],
      ["Request By", `${header.name || ""} ${header.lastname || ""}`],
    ];

    let rowStart = 3;
    headerInfo.forEach(([k, v], i) => {
      const r = rowStart + i;
      sheet.getCell(`A${r}`).value = k;
      sheet.getCell(`A${r}`).font = { bold: true };
      sheet.getCell(`B${r}`).value = v || "-";
    });

    const startTable = rowStart + headerInfo.length + 2;

    // ✅ ตั้งค่าชื่อ column และ key ที่ใช้ใน addRow
    sheet.columns = [
      { header: "No.", key: "no", width: 6 },
      { header: "Item No", key: "item_no", width: 10 },
      { header: "Item Name", key: "item_name", width: 35 },
      { header: "Qty", key: "qty", width: 8 },
      { header: "Serial", key: "serial", width: 15 },
      { header: "Control No", key: "control", width: 20 },
      { header: "Model", key: "model", width: 15 },
      { header: "Emp", key: "rec_return", width: 12 },
      { header: "Return", key: "return", width: 8 },
      { header: "Date Return", key: "date_re", width: 15 },
    ];

    // ✅ เพิ่ม header แถวแรกของตาราง
    sheet.getRow(startTable).values = sheet.columns.map(c => c.header);
    sheet.getRow(startTable).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(startTable).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF007BFF" },
    };
    sheet.getRow(startTable).alignment = { horizontal: "center" };

    // ✅ เพิ่มข้อมูลแถวรายละเอียด
    details.forEach((d, i) => {
      sheet.addRow({
        no: i + 1,
        item_no: d.item_no,
        item_name: d.item_name,
        qty: d.qty,
        serial: d.serial,
        control: d.control,
        model: d.model,
        rec_return: d.rec_return,
        return: d.return,
        date_re: d.date_re
          ? new Date(d.date_re).toLocaleDateString("th-TH")
          : "-",
      });
    });


    sheet.columns.forEach((col) => {
      let max = 0;
      col.eachCell({ includeEmpty: true }, (c) => {
        max = Math.max(max, c.value ? c.value.toString().length : 10);
      });
      col.width = max + 2;
    });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=ReturnGauge_${docNoStr}.xlsx`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (e) {
    console.error("❌ Export error:", e);
    res.status(500).json({
      message: "เกิดข้อผิดพลาดในการส่งออก",
      detail: e.message,
    });
  }
});

// ✅ แก้ไขข้อมูลตาม ID
app.put("/gauge-request/update/:id", async (req, res) => {
  try {
    const result = await GaugeRequestModel.update(req.body, {
      where: {
        id: req.params.id,
      },
    });

    if (result[0] > 0) {
      res.send({ message: "success" });
    } else {
      res.status(404).send({ message: "not found or no changes" });
    }
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
});

// ✅ ลบข้อมูลตาม ID
// app.delete("/gauge-request/delete/:id", async (req, res) => {
//   try {
//     await GaugeRequestModel.destroy({
//       where: {
//         id: req.params.id,
//       },
//     });
//     res.send({ message: "success" });
//   } catch (e) {
//     res.status(500).send({ message: e.message });
//   }
// });



// ✅ ลบข้อมูลตาม ID + ลบ BorrowGaugeDetail ที่เกี่ยวข้อง
app.delete("/gauge-request/delete/:id", async (req, res) => {
  try {
    const id = req.params.id;

    // 1️⃣ ดึงข้อมูล gauge ก่อน
    const gauge = await GaugeRequestModel.findByPk(id);

    if (!gauge) {
      return res.status(404).send({ message: "ไม่พบข้อมูลใน GaugeRequestModel" });
    }

    const docNo = gauge.docNo;

    // 2️⃣ ลบข้อมูลใน BorrowGaugeDetailModel
    await BorrowGaugeDetailModel.destroy({
      where: { doc_No: docNo },
    });

    // 3️⃣ อัปเดต DetailModel → ตั้งค่า doc_no ให้เป็น null
    await DetailModel.update(
      { doc_no: null },
      {
        where: { doc_no: docNo }
      }
    );

    // 4️⃣ ลบข้อมูลใน GaugeRequestModel
    await GaugeRequestModel.destroy({
      where: { id },
    });

    res.send({
      message: "success",
      deletedDocNo: docNo,
    });

  } catch (e) {
    console.error(e);
    res.status(500).send({ message: e.message });
  }
});



app.get("/gauge-request/detail/:id", async (req, res) => {
  try {
    const result = await GaugeRequestModel.findByPk(req.params.id);
    res.send({ message: "success", result });
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
});


app.get("/gauge-request/return/:docNo", async (req, res) => {
  try {
    const { docNo } = req.params;

    // ดึงข้อมูลหัวเอกสารจาก gauge_requests
    const header = await GaugeRequestModel.findOne({
      where: { docNo: docNo },
    });

    if (!header) {
      return res.status(404).json({ message: "not found" });
    }

    // ✅ ตรวจสอบ date แล้วแปลงถ้าเป็น string "dd/MM/yyyy"
    let formattedDate = null;
    if (header.date) {
      if (typeof header.date === "string" && header.date.includes("/")) {
        const [day, month, year] = header.date.split("/");
        formattedDate = `${year}-${month}-${day}`; // → 2025-10-18
      } else {
        formattedDate = header.date; // กรณีเป็น Date object หรือ ISO string อยู่แล้ว
      }
    }

    // ดึงข้อมูลรายการย่อยจาก borrow_gauge_detail
    const BorrowGaugeDetailModel = require("../models/BorrowGaugeDetailModel");
    const details = await BorrowGaugeDetailModel.findAll({
      where: { doc_No: docNo },
      order: [["id", "ASC"]],
    });

    res.json({
      message: "success",
      header: {
        ...header.toJSON(),
        date: formattedDate,
      },
      details,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});



module.exports = app;
