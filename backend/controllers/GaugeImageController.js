const express = require("express");
const app = express();
const GaugeImageModel = require("../models/GaugeImageModel");


const fileUpload = require("express-fileupload");
const fs = require("fs");

app.use(fileUpload());


app.post("/productImage/insertGaugeImage", async (req, res) => {
  try {
    const myDate = new Date();
    const y = myDate.getFullYear();
    const m = myDate.getMonth() + 1;
    const d = myDate.getDate();
    const h = myDate.getHours();
    const mm = myDate.getMinutes();
    const s = myDate.getSeconds();
    const ms = myDate.getMilliseconds();
    const productImage = req.files.productImage;
    const random = Math.random() * 1000;
    const newName =
      y +
      "-" +
      m +
      "-" +
      d +
      "-" +
      h +
      "-" +
      mm +
      "-" +
      s +
      "-" +
      ms +
      "-" +
      random;
    const arr = productImage.name.split(".");
    const ext = arr[arr.length - 1];
    const fullNewName = newName + "." + ext;
    const uploadPath = __dirname + "/../uploadproduction/" + fullNewName;

    await productImage.mv(uploadPath, async (err) => {
      if (err) throw new Error(err);
      res.send({ message: "success" });

      await GaugeImageModel.create({
        // isMain: false,
        imageName: fullNewName,
        gaugeName: req.body.gaugeName,
        remark: req.body.remark,

      });
    });
  } catch (e) {
    res.statusCode = 500;
    res.send({ message: e.message });
  }
});

app.get("/productImage/getAllGauge", async (req, res) => {
  try {
    const results = await GaugeImageModel.findAll({
      order: [["id", "ASC"]],
    });
    res.send({ message: "success", results: results });
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
});

app.get("/productImage/getUpdateGaugeImage/:id", async (req, res) => {
  try {
    const { id } = req.params; // ดึง ID จาก URL พารามิเตอร์
    const result = await GaugeImageModel.findOne({
      where: { id: id }, // กรองด้วย id ที่ได้รับ
    });

    if (result) {
      res.send({ message: "success", result: result });
    } else {
      res.status(404).send({ message: "PDF not found" });
    }
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
});


app.delete("/productImage/deleteGaugeImage/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).send({ message: "Invalid ID" });
      return;
    }

    try {
      const row = await GaugeImageModel.findByPk(id);
      if (!row) {
        res.status(404).send({ message: "Image not found" });
        return;
      }

      const imageName = row.imageName;

      await GaugeImageModel.destroy({
        where: {
          id: id,
        },
      });

      fs.unlinkSync("uploadproduction/" + imageName);

      res.send({ message: "success" });
    } catch (e) {
      console.error("Error deleting image:", e);
      res.status(500).send({ message: e.message });
    }
  }
);


app.put("/productImage/updateGaugeImage/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // ตรวจสอบว่ามีไฟล์ productImage หรือไม่
    if (req.files && req.files.productImage) {
      const productImage = req.files.productImage;

      const myDate = new Date();
      const y = myDate.getFullYear();
      const m = myDate.getMonth() + 1;
      const d = myDate.getDate();
      const h = myDate.getHours();
      const mm = myDate.getMinutes();
      const s = myDate.getSeconds();
      const ms = myDate.getMilliseconds();
      const random = Math.random() * 1000;
      const newName = `${y}-${m}-${d}-${h}-${mm}-${s}-${ms}-${random}`;
      const arr = productImage.name.split(".");
      const ext = arr[arr.length - 1];
      const fullNewName = `${newName}.${ext}`;
      const uploadPath = __dirname + "/../uploadproduction/" + fullNewName;

      // ย้ายไฟล์ที่ถูกอัปโหลดไปยังโฟลเดอร์ที่ต้องการ
      await productImage.mv(uploadPath, async (err) => {
        if (err) throw new Error(err);

        // อัปเดตข้อมูลพร้อมกับชื่อไฟล์ใหม่
        await GaugeImageModel.update(
          {
            imageName: fullNewName,
            gaugeName: req.body.gaugeName,
            remark: req.body.remark,
         
          },
          { where: { id: id } }
        );

        res.send({ message: "success" });
      });
    } else {
      // ถ้าไม่มีไฟล์ที่ถูกอัปโหลดใหม่, อัปเดตเฉพาะข้อมูลอื่น ๆ
      await GaugeImageModel.update(
        {
          gaugeName: req.body.gaugeName,
          remark: req.body.remark,
        
        },
        { where: { id: id } }
      );

      res.send({ message: "success" });
    }
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
});



module.exports = app;