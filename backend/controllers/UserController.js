const express = require("express");
const app = express();
const UserModel = require("../models/UserModel");
const { Op } = require("sequelize");

// CREATE
app.post("/", async (req, res) => {
  try {
    const { username, lastname, employee, password, permissions, typemc,process } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "username และ password จำเป็นต้องมี" });
    }
    const created = await UserModel.create({
      username, lastname, employee, password, permissions, typemc,process,
      password_input: null,
    });
    const { password: _omit, ...safe } = created.toJSON();
    return res.status(201).json(safe);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "สร้างผู้ใช้ไม่สำเร็จ" });
  }
});

// READ list (รองรับค้นหาเบื้องต้น)
app.get("/", async (req, res) => {
  try {
    const { q, include_inactive , process: proc } = req.query;
    const where = {};
    if (!include_inactive) where.isActive = true;
    if (proc) where.process = proc;                 // 👈 กรองด้วย process
    if (q) {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${q}%` } },
        { lastname: { [Op.iLike]: `%${q}%` } },
        { employee: { [Op.iLike]: `%${q}%` } },
        { typemc: { [Op.like]: `%${q}%` } },
      ];
    }
    const list = await UserModel.findAll({
      where,
      order: [["id", "ASC"]],
      attributes: { exclude: ["password"] },
    });
    return res.json(list);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "ดึงผู้ใช้ไม่สำเร็จ" });
  }
});

// ✅ ต้องอยู่บนสุดก่อน /:id
// app.get("/list", async (req, res) => {
//   try {
//     const result = await UserModel.findAll({
//       where: { isActive: true },
//       attributes: ["id", "employee", "username", "lastname", "typemc"],
//       order: [["employee", "ASC"]],
//     });
//     res.json({ message: "success", result });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ message: e.message });
//   }
// });

// ✅ ต้องอยู่ก่อน route /:id
app.get("/list", async (req, res) => {
  try {
    const { process } = req.query; // ✅ รับค่า typemc จาก query ถ้ามี

    const where = { isActive: true };
    if (process) where.process = process; // ✅ ถ้ามี typemc ใน query ให้กรองด้วย

    const result = await UserModel.findAll({
      where,
      attributes: ["id", "employee", "username", "lastname", "typemc"],
      order: [["employee", "ASC"]],
    });

    res.json({ message: "success", result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});
// ✅ ดึงข้อมูลผู้ใช้งาน พร้อมกรองตาม typemc ถ้ามี
app.get("/list/gauge", async (req, res) => {
  try {
    const { typemc } = req.query; // ✅ ใช้ typemc แทน process

    const where = { isActive: true };

    // ✅ ถ้ามีการส่ง typemc มาใน query ให้กรองข้อมูลเฉพาะนั้น
    if (typemc) where.typemc = typemc;

    const result = await UserModel.findAll({
      where,
      attributes: ["id", "employee", "username", "lastname", "typemc"],
      order: [["employee", "ASC"]],
    });

    res.json({ message: "success", result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

// READ one
app.get("/:id", async (req, res) => {
  try {
    const u = await UserModel.findByPk(Number(req.params.id), {
      attributes: { exclude: ["password"] },
    });
    if (!u) return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    return res.json(u);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "ดึงผู้ใช้ไม่สำเร็จ" });
  }
});

// UPDATE (ทั่วไป)
app.patch("/:id", async (req, res) => {
  try {
    const u = await UserModel.findByPk(Number(req.params.id));
    if (!u) return res.status(404).json({ message: "ไม่พบผู้ใช้" });

    const { username, lastname, employee, permissions, typemc , process} = req.body;
    if (username !== undefined) u.username = username;
    if (lastname !== undefined) u.lastname = lastname;
    if (employee !== undefined) u.employee = employee;
    if (permissions !== undefined) u.permissions = permissions;
    if (typemc !== undefined) u.typemc = typemc;
    if (process !== undefined) u.process = process;


    await u.save();
    const { password: _omit, ...safe } = u.toJSON();
    return res.json(safe);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "username นี้ถูกใช้งานแล้ว" });
    }
    console.error(err);
    return res.status(500).json({ message: "แก้ไขผู้ใช้ไม่สำเร็จ" });
  }
});

// UPDATE password
app.patch("/:id/password", async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ message: "ต้องระบุ newPassword" });
    const u = await UserModel.findByPk(Number(req.params.id));
    if (!u) return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    u.password = newPassword; // hook จะ hash ให้
    await u.save();
    return res.json({ message: "เปลี่ยนรหัสผ่านสำเร็จ" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "เปลี่ยนรหัสผ่านไม่สำเร็จ" });
  }
});

// DELETE (soft delete)
app.delete("/:id", async (req, res) => {
  try {
    const u = await UserModel.findByPk(Number(req.params.id));
    if (!u) return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    u.isActive = false;
    await u.save();
    return res.json({ message: "ลบผู้ใช้สำเร็จ (soft delete)" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "ลบผู้ใช้ไม่สำเร็จ" });
  }
});



module.exports = app;