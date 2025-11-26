// models/BorrowGaugeDetailModel.js
const { DataTypes } = require("sequelize");
const conn = require("../connect"); // ใช้ไฟล์เชื่อมต่อฐานข้อมูลของคุณ

const BorrowGaugeDetailModel = conn.define(
  "borrow_gauge_detail",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    doc_No: DataTypes.STRING,
    item_no: DataTypes.STRING,
    item_name: DataTypes.STRING,
    qty: DataTypes.BIGINT,
    serial: DataTypes.STRING,
    Field1: DataTypes.STRING,
    control: DataTypes.STRING,
    model: DataTypes.STRING,
    remark: DataTypes.STRING,
    rec_return: DataTypes.STRING,
    date_re: DataTypes.DATE,
    return: DataTypes.STRING,
    name_rec: DataTypes.STRING,
    lastname_rec: DataTypes.STRING,
    typemc_rec: DataTypes.STRING,

    
  },
  {
    tableName: "borrow_gauge_detail",
    timestamps: true, // เพิ่ม createdAt / updatedAt
  }
);

module.exports = BorrowGaugeDetailModel;