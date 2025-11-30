// Updated MasterIndex.jsx with Modal, Create/Edit, Pagination
import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import config from "../../config";
import ModalQCInspection from "../modals/ModalQCInspection";
import { useNavigate } from "react-router-dom";
import UndoIcon from '@mui/icons-material/Undo';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';
import DashboardIcon from '@mui/icons-material/Dashboard';



export default function MasterIndexPage() {
    const [items, setItems] = useState([]);
    const [form, setForm] = useState({});
    const [editingId, setEditingId] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const [fileNameFilter, setFileNameFilter] = useState("");
    const [fileNameOptions, setFileNameOptions] = useState([]);

    const [sheetNameOptions, setSheetNameOptions] = useState([]);
    const [sheetNameFilter, setSheetNameFilter] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const navigate = useNavigate();


    useEffect(() => {
        loadFileNameOptions();
    }, []);


    const loadFileNameOptions = async () => {
        try {
            const res = await axios.get(`${config.api_path}/masterIndexAllFileNames`);
            const uniqueNames = [...new Set(res.data.map((i) => i.FILE_NAME))];
            setFileNameOptions(uniqueNames);
        } catch (err) {
            console.error("Failed to load FILE_NAME options:", err);
        }
    };


    const fetchData = async () => {
        try {
            const res = await axios.get(`${config.api_path}/masterIndexListPaginate`, {
                params: {
                    page: currentPage,
                    limit: itemsPerPage,
                    fileName: fileNameFilter,
                    sheetName: sheetNameFilter,
                },
            });
            setItems(res.data.results);
            setTotalPages(res.data.totalPages);
        } catch (err) {
            console.error("Error fetching master index:", err);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentPage, itemsPerPage]); // ← ✅ เพิ่ม dependencies

    const handleFileNameChange = async (selectedName) => {
        setFileNameFilter(selectedName);
        setSheetNameFilter(""); // reset
        if (!selectedName) {
            setSheetNameOptions([]);
            return;
        }

        try {
            const res = await axios.get(`${config.api_path}/masterIndexSheetNamesByFile`, {
                params: { fileName: selectedName },
            });
            const uniqueSheets = [...new Set(res.data.map((i) => i.SHEET_NAME))];
            setSheetNameOptions(uniqueSheets);
        } catch (err) {
            console.error("Failed to load SHEET_NAME:", err);
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleEdit = (item) => {
        setForm(item);
        setEditingId(item.id);
        setShowModal(true);
        Swal.fire({
            icon: "info",
            title: "โหมดแก้ไขข้อมูล",
            text: `คุณกำลังแก้ไขข้อมูลของ: ${item.name}`,
            timer: 1500,
            showConfirmButton: false,
        });
    };



    const handleSubmit = async () => {
        try {
            // 🔹 ตรวจสอบฟิลด์ที่ต้องกรอก
            const requiredFields = [
                "FILE_NAME",
                "SHEET_NAME",
                "DATE_RECEIVED",
                "FIXASSET",
                "PRICE",
                "TYPE_MODEL",
                "MAKER",
                "S_N",
                "CONTROL_NO",
                "INVOICE_NO",
            ];

            const emptyFields = requiredFields.filter(
                (key) => !form[key] || form[key].toString().trim() === ""
            );

            // ถ้ามีช่องว่าง ให้แจ้งเตือนและไม่ส่งข้อมูล
            if (emptyFields.length > 0) {
                Swal.fire({
                    icon: "warning",
                    title: "กรอกข้อมูลไม่ครบ!",
                    html: `
                    <div style="text-align: left">
                        กรุณากรอกข้อมูลในช่องต่อไปนี้ให้ครบถ้วน:<br>
                        <ul style="text-align: left; margin-top: 8px; color: #c0392b;">
                            ${emptyFields.map((f) => `<li><b>${f}</b></li>`).join("")}
                        </ul>
                    </div>
                `,
                    confirmButtonText: "ตกลง",
                    confirmButtonColor: "#f39c12",
                });
                return;
            }

            // 🔹 ถ้าข้อมูลครบ ให้ดำเนินการต่อ
            if (editingId) {
                await axios.put(`${config.api_path}/editMasterIndex/${editingId}`, form);
                Swal.fire({
                    icon: "success",
                    title: "อัปเดตข้อมูลสำเร็จ!",
                    text: "บันทึกการแก้ไขเรียบร้อยแล้ว",
                    timer: 2000,
                    showConfirmButton: false,
                });
                window.location.reload();
            } else {
                await axios.post(`${config.api_path}/addMasterIndex`, form);
                Swal.fire({
                    icon: "success",
                    title: "เพิ่มข้อมูลสำเร็จ!",
                    text: "บันทึกข้อมูลใหม่เรียบร้อยแล้ว",
                    timer: 2000,
                    showConfirmButton: false,
                });
            }

            // handleCancel();
            fetchData();
            window.location.reload();
        } catch (err) {
            console.error("Submit error:", err);
            Swal.fire({
                icon: "error",
                title: "เกิดข้อผิดพลาด!",
                text: "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
            });
        }
    };


    const handleDelete = async (id) => {
        const confirm = await Swal.fire({
            title: "Confirm Delete",
            text: "Are you sure you want to delete this record?",
            icon: "warning",
            showCancelButton: true,
        });
        if (confirm.isConfirmed) {
            try {
                await axios.delete(`${config.api_path}/deleteMasterIndex/${id}`);
                fetchData();
            } catch (err) {
                console.error("Delete error:", err);
                Swal.fire("Error", "Could not delete", "error");
            }
        }
    };

    // ✅ Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);


    const backPage = () => {
        navigate('/settings')
        window.location.reload();
    }

    const resetPage = () => {
        window.location.reload();
    }

    const handleExportExcel = async () => {
        try {
            Swal.fire({
                title: "กำลังโหลดข้อมูล...",
                text: "กรุณารอสักครู่ ระบบกำลังเตรียมไฟล์ Excel",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            // 🔹 ถ้ามีการค้นหา → export ตาม filter
            const params = {};
            if (fileNameFilter) params.fileName = fileNameFilter;
            if (sheetNameFilter) params.sheetName = sheetNameFilter;

            const res = await axios.get(`${config.api_path}/masterIndex/export`, {
                params,
                responseType: "blob", // ✅ รับเป็นไฟล์
            });

            const blob = new Blob([res.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            const link = document.createElement("a");
            link.href = window.URL.createObjectURL(blob);

            // 🔹 ตั้งชื่อไฟล์ตามเงื่อนไข
            if (fileNameFilter || sheetNameFilter) {
                link.download = `${fileNameFilter || "All"}_${sheetNameFilter || "All"}.xlsx`;
            } else {
                link.download = "All_MasterIndex.xlsx";
            }

            link.click();

            Swal.fire({
                icon: "success",
                title: "สำเร็จ!",
                text: fileNameFilter || sheetNameFilter
                    ? "ดาวน์โหลดข้อมูลที่ค้นหาแล้วเรียบร้อย ✅"
                    : "ดาวน์โหลดข้อมูลทั้งหมดเรียบร้อย ✅",
                timer: 2000,
                showConfirmButton: false,
            });
        } catch (err) {
            console.error("Export error:", err);
            Swal.fire({
                icon: "error",
                title: "เกิดข้อผิดพลาด!",
                text: "ไม่สามารถโหลดไฟล์ได้ กรุณาลองใหม่อีกครั้ง",
            });
        }
    };

    const AddFileIndex = () => {
        navigate("/importExcel")
    }

    return (
        <>
            <div className="mt-4">

                <h2 className="ml-2 fw-bold">INDEX MANAGEMENT</h2>

                <div className="mb-2">
                    <button className="btn btn-danger ml-2"
                        onClick={backPage}>
                        <UndoIcon />
                        BACK</button>
                    {/* <button
                        className="btn btn-primary ml-3"
                        data-toggle="modal"
                        data-target="#modalIndex"
                        onClick={() => setShowModal(true)}
                    >
                        ADD NEW INDEX
                    </button> */}
                    <button
                        className="btn btn-primary ml-3"
                        onClick={AddFileIndex}
                    >
                        ADD NEW INDEX
                    </button>


                </div>

                <div className="d-flex align-items-center mb-3">
                    <label className="ml-2">SELECT FILE_NAME:</label>
                    <select
                        className="form-control ml-2"
                        style={{ width: 300 }}
                        value={fileNameFilter}
                        onChange={(e) => handleFileNameChange(e.target.value)}
                    >
                        <option value="">-- SHOW ALL --</option>
                        {fileNameOptions.map((name, idx) => (
                            <option key={idx} value={name}>{name}</option>
                        ))}
                    </select>

                    <select
                        className="form-control ml-2"
                        style={{ width: 250 }}
                        value={sheetNameFilter}
                        onChange={(e) => setSheetNameFilter(e.target.value)}
                        disabled={!sheetNameOptions.length}
                    >
                        <option value="">-- ALL --</option>
                        {sheetNameOptions.map((sheet, idx) => (
                            <option key={idx} value={sheet}>{sheet}</option>
                        ))}
                    </select>

                    <button className="col-1 btn btn-primary ml-3" onClick={() => { setCurrentPage(1); fetchData(); }}>
                        <ManageSearchIcon className="mr-1" /> SEARCH
                    </button>
                    <button className="col-1 ml-3 btn btn-danger" onClick={resetPage}>
                        <RotateLeftIcon className="mr-1" />RESET
                    </button>
                    <button className="col-2 ml-3 btn btn-success" onClick={handleExportExcel}>
                        <SystemUpdateAltIcon className="mr-1" />EXPORT EXCEL
                    </button>
                    <button className="col-2 ml-3 btn btn-success"
                     onClick={() => navigate("/MasterIndexDashboard")}
                     >
                       <DashboardIcon className="mr-1"/>DASHBOARD
                    </button>
                </div>

                <table className="table table-bordered table-striped border-black table-bordered-black">
                    <thead style={{ backgroundColor: "rgba(255, 242, 59, 1)", border: "black" }} id="table-detail">
                        <tr>
                            <th>ID</th>
                            <th>FILE_NAME</th>
                            <th>SHEET_NAME</th>
                            <th>DATE_RECEIVED</th>
                            <th>FIXASSET</th>
                            <th>PRICE</th>
                            <th>TYPE_MODEL</th>
                            <th>MAKER</th>
                            <th>S/N</th>
                            <th>CONTROL_NO</th>
                            <th>INVOICE_NO</th>
                            <th>SCRAP_DATE</th>
                            <th>REMARK</th>
                            {/* <th className="text-black" style={{ width: "11rem" }}>ACTION</th> */}
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <tr key={item.id}>
                                <td>{item.id}</td>
                                <td>{item.FILE_NAME}</td>
                                <td>{item.SHEET_NAME}</td>
                                <td>{item.DATE_RECEIVED?.slice(0, 10)}</td>
                                <td>{item.FIXASSET}</td>
                                <td>{item.PRICE}</td>
                                <td>{item.TYPE_MODEL}</td>
                                <td>{item.MAKER}</td>
                                <td>{item.S_N}</td>
                                <td>{item.CONTROL_NO}</td>
                                <td>{item.INVOICE_NO}</td>
                                <td>{item.SCRAP_DATE?.slice(0, 10)}</td>
                                <td>{item.REMARK}</td>
                                {/* <td style={{ width: "8rem" }}>
                                    <button
                                        className="btn btn-primary"
                                        data-toggle="modal"
                                        data-target="#modalIndex"
                                        onClick={() => handleEdit(item)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="btn btn-danger ml-1"
                                        onClick={() => handleDelete(item.id)}
                                    >
                                        Delete
                                    </button>
                                </td> */}
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="d-flex justify-content-between align-items-center mt-3 mb-5">
                    <div className="d-flex align-items-center">
                        <span className="ml-2 fw-bold text-primary">Show Rows / Pages:</span>
                        <select
                            className="form-select fw-bold text-primary ml-3"
                            style={{ width: "90px" }}
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(parseInt(e.target.value));
                                setCurrentPage(1); // reset page
                            }}
                        >
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                    </div>


                    {/* ✅ Pagination controls */}
                    <div className="d-flex align-items-center mr-2">
                        <button
                            className="btn btn-outline-primary mr-2"
                            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            « Previous
                        </button>

                        <span className="fw-bold text-primary">
                            Page {currentPage} To {totalPages}
                        </span>

                        <button
                            className="btn btn-outline-primary ml-2"
                            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            Next »
                        </button>
                    </div>
                </div>
            </div>

            {showModal && (
                <ModalQCInspection
                    id="modalIndex"
                    title={editingId ? "UPDATE INDEX" : "CREATE INDEX"} modalSize="modal-dialog-custom-xlll"
                // onClose={handleCancel}
                >
                    <div className="row">
                        <div className="col-6">
                            <label className="ml-2">FILE_NAME</label>
                            <input
                                name="FILE_NAME"
                                className="form-control text-primary"
                                placeholder="....."
                                value={form.FILE_NAME || ""} onChange={handleChange}
                            />
                        </div>
                        <div className="col-6">
                            <label className="ml-2">SHEET_NAME</label>
                            <input
                                name="SHEET_NAME"
                                className="form-control text-primary"
                                placeholder="....."
                                value={form.SHEET_NAME || ""}
                                onChange={handleChange} />
                        </div>
                        <div className="col-6 mt-3">
                            <label className="ml-2">DATE_RECEIVED</label>
                            <input
                                name="DATE_RECEIVED"
                                type="date"
                                className="form-control text-primary"
                                value={
                                    form.DATE_RECEIVED
                                        ? new Date(form.DATE_RECEIVED).toISOString().slice(0, 10)
                                        : ""
                                }
                                onChange={handleChange}
                            />
                        </div>
                        <div className="col-6 mt-3">
                            <label className="ml-2">FIXASSET</label>
                            <input
                                name="FIXASSET"
                                className="form-control text-primary"
                                placeholder="....."
                                value={form.FIXASSET || ""}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="col-6 mt-3">
                            <label className="ml-2">PRICE</label>
                            <input
                                name="PRICE"
                                className="form-control text-primary"
                                placeholder="....."
                                value={form.PRICE || ""}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="col-6 mt-3">
                            <label className="ml-2">TYPE_MODEL</label>
                            <input
                                name="TYPE_MODEL"
                                className="form-control text-primary"
                                placeholder="....."
                                value={form.TYPE_MODEL || ""}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="col-6 mt-3">
                            <label className="ml-2">MAKER</label>
                            <input
                                name="MAKER"
                                className="form-control text-primary"
                                placeholder="....."
                                value={form.MAKER || ""}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="col-6 mt-3">
                            <label className="ml-2">S_N</label>
                            <input
                                name="S_N"
                                className="form-control text-primary"
                                placeholder="....."
                                value={form.S_N || ""}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="col-6 mt-3">
                            <label className="ml-2">CONTROL_NO</label>
                            <input
                                name="CONTROL_NO"
                                className="form-control text-primary"
                                placeholder="....."
                                value={form.CONTROL_NO || ""}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="col-6 mt-3">
                            <label className="ml-2">INVOICE_NO</label>
                            <input
                                name="INVOICE_NO"
                                className="form-control text-primary"
                                placeholder="....."
                                value={form.INVOICE_NO || ""}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="col-6 mt-3">
                            <label className="ml-2">SCRAP_DATE</label>
                            <input
                                name="SCRAP_DATE"
                                type="date"
                                className="form-control text-primary"
                                value={
                                    form.SCRAP_DATE
                                        ? new Date(form.SCRAP_DATE).toISOString().slice(0, 10)
                                        : ""
                                }
                                onChange={handleChange}
                            />
                        </div>

                        <div className="col-6 mt-3">
                            <label className="ml-2">REMARK</label>
                            <input
                                name="REMARK"
                                className="form-control text-primary"
                                placeholder="....."
                                value={form.REMARK || ""}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="d-flex gap-2 mt-3">
                            <button className="btn btn-primary" onClick={handleSubmit}>{editingId ? "UPDATE" : "CREATE"}</button>
                            <button className="btn btn-danger" onClick={resetPage}>CANCEL</button>
                        </div>
                    </div>
                </ModalQCInspection>
            )}
        </>
    );
}
