import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import config from "../../config";
import TemplatePro from "../../home/TemplatePro"
import { Link } from "react-router-dom";
import UndoIcon from '@mui/icons-material/Undo';
import ExcelJS from "exceljs"; // เพิ่มการนำเข้า ExcelJS
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';

export default function Process() {
    const [partNames, setPartNames] = useState([]);
    const [form, setForm] = useState({ part_name: "" });
    const [editingId, setEditingId] = useState(null);

    // ✅ ดึงข้อมูลจาก backend
    const fetchData = async () => {
        try {
            const res = await axios.get(`${config.api_path}/process-name/list`);
            if (res.data.message === "success") {
                setPartNames(res.data.result);
            } else {
                setPartNames([]);
            }
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "ไม่สามารถโหลดข้อมูลได้", "error");
        }
    };


    useEffect(() => {
        fetchData();
    }, []);

    // ✅ เมื่อกดปุ่มบันทึก
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.typemc) {
            Swal.fire({
                title: "ข้อมูลไม่ครบ!",
                text: "กรุณากรอกชื่อ Section ก่อนบันทึก",
                icon: "warning",
                confirmButtonText: "ตกลง",
            });
            return;
        }

        try {
            if (editingId) {
                // 🟡 แก้ไขข้อมูล
                await axios.put(`${config.api_path}/process-name/update/${editingId}`, form);
                Swal.fire("สำเร็จ!", "แก้ไขข้อมูลเรียบร้อยแล้ว", "success");
            } else {
                // 🟢 เพิ่มข้อมูลใหม่
                await axios.post(`${config.api_path}/process-name/create`, form);
                Swal.fire("สำเร็จ!", "เพิ่มข้อมูลเรียบร้อยแล้ว", "success");
            }

            setForm({ typemc: "" });
            setEditingId(null);
            fetchData();
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "ไม่สามารถบันทึกข้อมูลได้", "error");
        }
    };

    // 🟠 กดแก้ไข
    const handleEdit = (item) => {
        setForm({ typemc: item.typemc });
        setEditingId(item.id);
    };

    // 🔴 กดลบ
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
            await axios.delete(`${config.api_path}/process-name/delete/${id}`);
            Swal.fire("ลบข้อมูลสำเร็จ!", "", "success");
            fetchData();
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "ไม่สามารถลบข้อมูลได้", "error");
        }
    };

    const handleExportExcel = async () => {
  try {
    // ดึงข้อมูลจาก API
    const res = await axios.get(`${config.api_path}/process-name/list`);
    if (res.data.message !== "success") {
      Swal.fire("Error", "ไม่พบข้อมูลสำหรับส่งออก", "error");
      return;
    }

    const data = res.data.result;

    // ใช้ ExcelJS ในการสร้างไฟล์ Excel
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Section List");

    // ตั้งชื่อคอลัมน์
    ws.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Section', key: 'typemc', width: 20 },
    ];

    // เติมข้อมูลในแถว
    data.forEach((row) => {
      ws.addRow({
        id: row.id,
        typemc: row.typemc,
      });
    });

    // ส่งไฟล์ Excel ให้ดาวน์โหลด
    ws.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // ตั้งชื่อไฟล์
    const fileName = `Section_List_${new Date().toLocaleDateString("en-GB")}.xlsx`;

    // สร้างลิงก์ดาวน์โหลด
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
                        </button> </Link>
                    <h3 className="fw-bold text-dark mb-3 mt-3">📦 SECTION MANAGEMENT</h3>

                    <form onSubmit={handleSubmit} className="mb-4 border rounded p-3 bg-light">
                        <div className="row">
                            <div className="col-md-6">
                                <label className="fw-bold mb-1">Section</label>
                                <input
                                    type="text"
                                    className="form-control text-primary"
                                    placeholder="กรอกชื่อ Section"
                                    value={form.typemc}
                                    onChange={(e) => setForm({ ...form, typemc: e.target.value })}
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
                                            setForm({ typemc: "" });
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
                        type="button"
                        className="btn btn-success ml-2 mb-2"
                        onClick={handleExportExcel}
                    >
                        <SystemUpdateAltIcon className="mr-1"/>EXPORT EXCEL
                    </button>

                    <table className="table table-bordered table-striped text-center table-bordered-black">
                        <thead className="table-dark">
                            <tr>
                                <th style={{ width: "10%" }}>#</th>
                                <th>Section</th>
                                <th style={{ width: "20%" }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {partNames.length > 0 ? (
                                partNames.map((item, index) => (
                                    <tr key={item.id}>
                                        <td>{index + 1}</td>
                                        <td>{item.typemc}</td>
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
