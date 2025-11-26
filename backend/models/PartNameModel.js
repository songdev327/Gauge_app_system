// models/PartNameModel.js
const conn = require("../connect");
const { DataTypes } = require("sequelize");

const PartNameModel = conn.define("part_name", {
id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },  
  part_name: DataTypes.STRING,

 
}, {
  tableName: "part_name",
  timestamps: true, // ✅ ถ้าคุณต้องการ createdAt / updatedAt
});

module.exports = PartNameModel;