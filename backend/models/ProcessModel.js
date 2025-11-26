// models/ProcessModel.js
const conn = require("../connect");
const { DataTypes } = require("sequelize");

const ProcessModel = conn.define("master_process", {
id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },  
  typemc: DataTypes.STRING,

 
}, {
  tableName: "master_process",
  timestamps: true, // ✅ ถ้าคุณต้องการ createdAt / updatedAt
});

module.exports = ProcessModel;