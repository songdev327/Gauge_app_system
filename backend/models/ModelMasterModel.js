// models/ModelMasterModel.js
const conn = require("../connect");
const { DataTypes } = require("sequelize");

const ModelMasterModel = conn.define("model_master", {
id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },  
  madel: DataTypes.STRING,

 
}, {
  tableName: "model_master",
  timestamps: true, // ✅ ถ้าคุณต้องการ createdAt / updatedAt
});

module.exports = ModelMasterModel;