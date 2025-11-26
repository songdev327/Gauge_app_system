// models/DetailModel.js
const conn = require("../connect");
const { DataTypes } = require("sequelize");

const DetailModel = conn.define("detail", {
id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },  
  code: DataTypes.STRING,
  name: DataTypes.STRING,
  date_rec: DataTypes.DATE,
  Serial: DataTypes.STRING, 
  control: DataTypes.STRING, 
  invoice: DataTypes.STRING,
  scrap: DataTypes.STRING,
  model: DataTypes.STRING,
  sheet: DataTypes.STRING,
  doc_no: DataTypes.STRING,
  fixasset: DataTypes.STRING,
  price: DataTypes.STRING,
  maker: DataTypes.STRING,
  
}, {
  tableName: "detail",
  timestamps: true, // ✅ ถ้าคุณต้องการ createdAt / updatedAt
});

module.exports = DetailModel;