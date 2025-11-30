// // models/DetailModel.js
// const conn = require("../connect");
// const { DataTypes } = require("sequelize");

// const MasterIndexExcelModel = conn.define("master_index_excel", {
// id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },  
//   FILE_NAME: DataTypes.STRING,
//   SHEET_NAME: DataTypes.STRING,
//   DATE_RECEIVED: DataTypes.DATE,
//   FIXASSET: DataTypes.STRING, 
//   PRICE: DataTypes.STRING, 
//   TYPE_MODEL: DataTypes.STRING,
//   MAKER: DataTypes.STRING,
//   S_N: DataTypes.STRING,
//   CONTROL_NO: DataTypes.STRING,
//   INVOICE_NO: DataTypes.STRING,
//   SCRAP_DATE: DataTypes.DATE,
//   REMARK: DataTypes.STRING,
  
// }, {
//   tableName: "master_index_excel",
//   timestamps: true, // ✅ ถ้าคุณต้องการ createdAt / updatedAt
// });

// module.exports = MasterIndexExcelModel;