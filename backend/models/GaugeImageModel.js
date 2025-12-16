const { DataTypes } = require("sequelize");
const conn = require("../connect"); // ใช้ไฟล์เชื่อมต่อฐานข้อมูลของคุณ

const GaugeImageModel = conn.define(
    "gauge_image",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },

        imageName: {
            type: DataTypes.STRING,
        },
        gaugeName: {
            type: DataTypes.STRING,
        },
        remark: {
            type: DataTypes.STRING,
        },

    },
    {
        tableName: "gauge_image",
        timestamps: true, // เพิ่ม createdAt / updatedAt
    }
);

module.exports = GaugeImageModel;