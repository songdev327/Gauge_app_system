// models/GaugeRequestModel.js
const { DataTypes } = require("sequelize");
const conn = require("../connect"); // ใช้ไฟล์เชื่อมต่อฐานข้อมูลของคุณ

const GaugeRequestModel = conn.define(
  "gauge_requests",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    docNo: DataTypes.STRING,
    division: DataTypes.STRING,
    date: DataTypes.STRING,
    requestBy: DataTypes.STRING,
    partName: DataTypes.STRING,
    model: DataTypes.STRING,
    partNo: DataTypes.STRING,
    mc: DataTypes.STRING,
    rev: DataTypes.STRING,
    issueBy: DataTypes.STRING,
    receivedBy: DataTypes.STRING,
    section: DataTypes.STRING,
    name: DataTypes.STRING,
    lastname: DataTypes.STRING,
    name_issue: DataTypes.STRING,
    lastname_issue: DataTypes.STRING,
    typemc_issue: DataTypes.STRING,
    name_received: DataTypes.STRING,
    lastname_received: DataTypes.STRING,
    typemc_received: DataTypes.STRING,

  },
  {
    tableName: "gauge_requests",
    timestamps: true, // เพิ่ม createdAt / updatedAt
  }
);

module.exports = GaugeRequestModel;
