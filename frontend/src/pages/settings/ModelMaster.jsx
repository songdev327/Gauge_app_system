import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import config from "../../config";
import TemplatePro from "../../home/TemplatePro";
import { Link } from "react-router-dom";
import UndoIcon from '@mui/icons-material/Undo';
import ExcelJS from "exceljs"; // เพิ่มการใช้งาน ExcelJS
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';

export default function ModelMaster() {
    const [models, setModels] = useState([]);
    const [form, setForm] = useState({ madel: "" });
    const [editingId, setEditingId] = useState(null);
    const [q, setQ] = useState(""); // ค่าการค้นหา

    // ✅ โหลดข้อมูลจาก backend
    const fetchData = async (searchQuery = "") => {
        try {
            const res = await axios.get(`${config.api_path}/model-master/list`, { params: { q: searchQuery } });
            if (res.data.message === "success") {
                setModels(res.data.result);
            } else {
                setModels([]);
            }
        } catch (err) {
            console.error(err);
            Swal.fire("เกิดข้อผิดพลาด!", "ไม่สามารถโหลดข้อมูลได้", "error");
        }
    };

    // ✅ ฟังก์ชันค้นหาทันทีเมื่อพิมพ์
    useEffect(() => {
        fetchData(q);
    }, [q]); // เมื่อ q เปลี่ยนแปลงจะเรียกฟังก์ชัน fetchData

    // ✅ บันทึกข้อมูล (เพิ่ม / แก้ไข)
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.madel.trim()) {
            Swal.fire({
                title: "ข้อมูลไม่ครบ!",
                text: "กรุณากรอกชื่อ Model ก่อนบันทึก",
                icon: "warning",
                confirmButtonText: "ตกลง",
            });
            return;
        }

        try {
            if (editingId) {
                // 🟡 แก้ไข
                await axios.put(`${config.api_path}/model-master/update/${editingId}`, form);
                Swal.fire("สำเร็จ!", "แก้ไขข้อมูลเรียบร้อยแล้ว", "success");
            } else {
                // 🟢 เพิ่มใหม่
                await axios.post(`${config.api_path}/model-master/create`, form);
                Swal.fire("สำเร็จ!", "เพิ่มข้อมูลเรียบร้อยแล้ว", "success");
            }

            setForm({ madel: "" });
            setEditingId(null);
            fetchData();
        } catch (err) {
            console.error(err);
            Swal.fire("เกิดข้อผิดพลาด!", "ไม่สามารถบันทึกข้อมูลได้", "error");
        }
    };

    // ✏️ กดปุ่มแก้ไข
    const handleEdit = (item) => {
        setForm({ madel: item.madel });
        setEditingId(item.id);
    };

    // ❌ กดปุ่มลบ
    const handleDelete = async (id) => {
        const confirm = await Swal.fire({
            title: "คุณแน่ใจหรือไม่?",
            text: "ต้องการลบข้อมูลนี้ใช่หรือไม่?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "ลบข้อมูล",
            cancelButtonText: "ยกเลิก",
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
        });

        if (!confirm.isConfirmed) return;

        try {
            await axios.delete(`${config.api_path}/model-master/delete/${id}`);
            Swal.fire("ลบข้อมูลสำเร็จ!", "", "success");
            fetchData();
        } catch (err) {
            console.error(err);
            Swal.fire("เกิดข้อผิดพลาด!", "ไม่สามารถลบข้อมูลได้", "error");
        }
    };

    // ✅ ฟังก์ชันสำหรับการส่งออกไฟล์ Excel
    const handleExportExcel = async () => {
        try {
            const res = await axios.get(`${config.api_path}/model-master/list`);
            if (res.data.message !== "success") {
                Swal.fire("Error", "ไม่พบข้อมูลสำหรับส่งออก", "error");
                return;
            }

            const data = res.data.result;
            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet("Model Master");

            // กำหนดคอลัมน์ใน Excel
            ws.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Model', key: 'madel', width: 20 },
            ];

            // เติมข้อมูลใน Excel
            data.forEach((row) => {
                ws.addRow({ id: row.id, madel: row.madel });
            });

            // สร้างลิงก์ดาวน์โหลดไฟล์ Excel
            ws.eachRow((row) => {
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: "thin" },
                        left: { style: "thin" },
                        bottom: { style: "thin" },
                        right: { style: "thin" },
                    };
                });
            });

            const fileName = `Model_Master_List_${new Date().toLocaleDateString("en-GB")}.xlsx`;
            const buffer = await wb.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            link.click();

        } catch (err) {
            console.error(err);
            Swal.fire("Error", "ไม่สามารถสร้างไฟล์ Excel ได้", "error");
        }
    };

    return (
        <>
            <TemplatePro>
                <div className="content-wrapper">
                    <Link to="/settings">
                        <button
                            type="button"
                            className="btn btn-danger"
                        >
                            <UndoIcon className="ml-1" /> BACK
                        </button>
                    </Link>
                    <h3 className="fw-bold text-dark mb-3 mt-3">⚙️ MASTER MODEL MANAGEMENT</h3>
                     {/* ช่องค้นหาสำหรับค้นหาชื่อ Model */}
                    <div className="mb-4">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="ค้นหา Model"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                    </div>

                    {/* 🟩 ฟอร์มเพิ่ม/แก้ไข */}
                    <form onSubmit={handleSubmit} className="mb-4 border rounded p-3 bg-light">
                        <div className="row">
                            <div className="col-md-6">
                                <label className="fw-bold mb-1">Model</label>
                                <input
                                    type="text"
                                    className="form-control text-primary"
                                    placeholder="กรอกชื่อ Model"
                                    value={form.madel}
                                    onChange={(e) => setForm({ ...form, madel: e.target.value })}
                                />
                            </div>

                            <div className="col-md-6 d-flex align-items-end">
                                <button type="submit" className="btn btn-success">
                                    {editingId ? "UPDATE" : "CREATE"}
                                </button>
                                {editingId && (
                                    <button
                                        type="button"
                                        className="btn btn-danger ml-3"
                                        onClick={() => {
                                            setForm({ madel: "" });
                                            setEditingId(null);
                                        }}
                                    >
                                        CANCEL
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>


                    <button 
                        className="btn btn-success ml-2 mb-3" 
                        onClick={handleExportExcel}
                    >
                        <SystemUpdateAltIcon className="mr-1"/> EXPORT EXCEL
                    </button>

                    {/* 📋 ตารางข้อมูล */}
                    <table className="table table-bordered table-striped text-center table-bordered-black">
                        <thead className="table-dark">
                            <tr>
                                <th style={{ width: "10%" }}>#</th>
                                <th>Model</th>
                                <th style={{ width: "20%" }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {models.length > 0 ? (
                                models.map((item, index) => (
                                    <tr key={item.id}>
                                        <td>{index + 1}</td>
                                        <td>{item.madel}</td>
                                        <td>
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => handleEdit(item)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="btn btn-danger ml-2"
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="text-muted">
                                        ไม่พบข้อมูล
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </TemplatePro>
        </>
    );
}
