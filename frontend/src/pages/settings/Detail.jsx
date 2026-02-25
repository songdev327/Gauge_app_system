import { useEffect, useState } from "react";
import axios from "axios";
import config from "../../config";
import Swal from "sweetalert2"; // ✅ เพิ่ม
import UndoIcon from '@mui/icons-material/Undo';
import "./setting.css"
import { useNavigate } from "react-router-dom";
import Modal from "../modals/Modal";
import AddIcon from '@mui/icons-material/Add';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';


const Detail = () => {
    const [details, setDetails] = useState([]);
    const [search, setSearch] = useState("");
    const [form, setForm] = useState({
        code: "",
        name: "",
        date_rec: "",
        Serial: "",
        control: "",
        invoice: "",
        scrap: "",
        model: "",
        sheet: "",
        doc_no: "",
        fixasset: "",
        price: "",
        maker: "",
    });
    const [editId, setEditId] = useState(null);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit, setLimit] = useState(10);

    const navigate = useNavigate();

    const fetchDetails = async (currentPage = 1, currentLimit = limit, currentSearch = search) => {
        const res = await axios.get(
            `${config.api_path}/details?page=${currentPage}&limit=${currentLimit}&search=${currentSearch}`
        );
        setDetails(res.data.result);
        setTotalPages(res.data.totalPages);
        setPage(res.data.currentPage);
    };

    // ✅ เพิ่มการตรวจสอบค่าก่อนส่งข้อมูล
    const handleSubmit = async () => {
        const requiredFields = [
            "code",
            "name",
            "Serial",
            "control",
            "invoice",
        ];

        const emptyFields = requiredFields.filter((key) => !form[key]);

        if (emptyFields.length > 0) {
            Swal.fire({
                icon: "warning",
                title: "กรอกข้อมูลไม่ครบ!",
                // text: `กรุณากรอกข้อมูลในช่อง: ${emptyFields.join(", ")}`,
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

        try {
            if (editId) {
                await axios.put(`${config.api_path}/details/${editId}`, form);
                Swal.fire({
                    icon: "success",
                    title: "อัปเดตข้อมูลสำเร็จ!",
                    timer: 2000,
                    showConfirmButton: false,
                });
                window.location.reload();
            } else {
                await axios.post(`${config.api_path}/details`, form);
                Swal.fire({
                    icon: "success",
                    title: "เพิ่มข้อมูลสำเร็จ!",
                    timer: 2000,
                    showConfirmButton: false,
                });
            }
            setForm({
                code: "",
                name: "",
                date_rec: "",
                Serial: "",
                control: "",
                invoice: "",
                scrap: "",
                model: "",
                sheet: "",
                doc_no: "",
                fixasset: "",
                price: "",
                maker: "",
            });
            setEditId(null);
            fetchDetails(page);
            window.location.reload();
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "เกิดข้อผิดพลาด",
                text: err.message,
            });
        }
    };

    const handleDelete = async (id) => {
        const confirm = await Swal.fire({
            title: "คุณแน่ใจหรือไม่?",
            text: "ต้องการลบข้อมูลนี้หรือไม่?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "ลบ",
            cancelButtonText: "ยกเลิก",
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
        });

        if (confirm.isConfirmed) {
            await axios.delete(`${config.api_path}/details/${id}`);
            Swal.fire({
                icon: "success",
                title: "ลบข้อมูลสำเร็จ!",
                timer: 1500,
                showConfirmButton: false,
            });
            fetchDetails(page);
        }
    };

    const handleEdit = (item) => {
        setForm(item);
        setEditId(item.id);
        Swal.fire({
            icon: "info",
            title: "โหมดแก้ไขข้อมูล",
            text: `คุณกำลังแก้ไขข้อมูลของ: ${item.name}`,
            timer: 1500,
            showConfirmButton: false,
        });
    };

    useEffect(() => {
        fetchDetails();
    }, []);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            fetchDetails(newPage);
        }
    };

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
                title: "กำลังสร้างไฟล์ Excel...",
                text: "กรุณารอสักครู่ ระบบกำลังดึงข้อมูล",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            // 🔹 ส่งคำขอไปยัง backend พร้อม query search
            const res = await axios.get(`${config.api_path}/details/export`, {
                params: { search }, // ถ้ามีคำค้นจะส่งไปด้วย
                responseType: "blob", // ให้ axios รับไฟล์เป็น binary
            });

            const blob = new Blob([res.data], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

            // สร้างลิงก์ดาวน์โหลด
            const link = document.createElement("a");
            link.href = window.URL.createObjectURL(blob);

            // ตั้งชื่อไฟล์
            link.download = search
                ? `Details_Search_${search}_${Date.now()}.xlsx`
                : `Details_All_${Date.now()}.xlsx`;

            link.click();

            Swal.fire({
                icon: "success",
                title: "ดาวน์โหลดสำเร็จ!",
                text: search
                    ? "✅ โหลดเฉพาะข้อมูลที่ค้นหาเรียบร้อยแล้ว"
                    : "✅ โหลดข้อมูลทั้งหมดเรียบร้อยแล้ว",
                timer: 2000,
                showConfirmButton: false,
            });
        } catch (error) {
            console.error("Export Excel error:", error);
            Swal.fire({
                icon: "error",
                title: "เกิดข้อผิดพลาด!",
                text: "ไม่สามารถโหลดไฟล์ได้ กรุณาลองใหม่อีกครั้ง",
            });
        }
    };

     const AddFileIndex = () => {
        navigate("/importDetail")
    }


    return (
        <>
            <div className="mt-4">

                <h2 className="ml-2 fw-bold">DETAIL MANAGEMENT</h2>
                <div className="mb-2">
                    <button className="btn btn-danger ml-2"
                        onClick={backPage}>
                        <UndoIcon className="mr-1" />
                        BACK</button>
                    {/* <button
                        data-toggle="modal"
                        data-target="#modalDetail"
                        className="btn btn-primary ml-3"
                    >
                        <AddIcon className="mr-1" /> ADD NEW DETAIL
                    </button> */}
                    <button
                        className="btn btn-primary ml-3"
                        onClick={AddFileIndex}
                    >
                        <AddIcon className="mr-1" /> ADD NEW DETAIL
                    </button>
                </div>

                <div className="d-flex justify-content mb-3">
                    <div className="col-4 mt-3">
                        <input
                            type="text"
                            className="form-control text-primary"
                            placeholder="🔍 Search.... code / name / Serial / control / model"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") fetchDetails(1, limit, e.target.value);
                            }}
                        />
                    </div>

                    <div className="col-8 mt-3">
                        <button
                            className="col-2 btn btn-primary"
                            onClick={() => fetchDetails(1, limit, search)}
                        >
                            <ManageSearchIcon className="mr-1" />SEARCH
                        </button>
                        <button className="col-2 ml-3 btn btn-danger" onClick={resetPage}>
                            <RotateLeftIcon className="mr-1" />RESET
                        </button>
                        <button className="col-3 ml-3 btn btn-success" onClick={handleExportExcel}>
                            <SystemUpdateAltIcon className="mr-1" />EXPORT EXCEL
                        </button>
                    </div>
                </div>

                <table className="table table-bordered table-striped table-bordered-black" border={1} cellPadding={10}
                    id="table-detail">
                    <thead style={{ backgroundColor: "rgba(255, 242, 59, 1)" }} id="table-detail">
                        <tr className="">
                            <th className="text-black">#</th>
                            <th className="text-black">code</th>
                            <th className="text-black">name</th>
                            <th className="text-black">date_rec</th>
                            <th className="text-black">Serial</th>
                            <th className="text-black">control</th>
                            <th className="text-black">invoice</th>
                            <th className="text-black">scrap</th>
                            <th className="text-black">model</th>
                            <th className="text-black">sheet</th>
                            <th className="text-black">doc_no</th>
                            <th className="text-black">fixasset</th>
                            <th className="text-black">price</th>
                            <th className="text-black">maker</th>
                            {/* <th className="text-black" style={{ width: "11rem" }}>Action</th> */}
                        </tr>
                    </thead>
                    <tbody style={{ border: "black"}}>
                        {details.map((d, i) => (
                            <tr key={d.id}>
                                <td>{(page - 1) * limit + i + 1}</td>
                                <td>{d.code}</td>
                                <td>{d.name}</td>
                                <td>{d.date_rec}</td>
                                <td>{d.Serial}</td>
                                <td>{d.control}</td>
                                <td>{d.invoice}</td>
                                <td>{d.scrap}</td>
                                <td>{d.model}</td>
                                <td>{d.sheet}</td>
                                <td>{d.doc_no}</td>
                                <td>{d.fixasset}</td>
                                <td>{d.price}</td>
                                <td>{d.maker}</td>
                                {/* <td>
                                    <button
                                        dat
                                        className="btn btn-primary"
                                        data-toggle="modal"
                                        data-target="#modalDetail"
                                        onClick={() => handleEdit(d)}
                                    >
                                        Edit
                                    </button>
                                    <button className="btn btn-danger ml-1" onClick={() => handleDelete(d.id)}>Delete</button>
                                </td> */}
                            </tr>
                        ))}
                    </tbody>
                </table>



                {/* Pagination */}
                <div className="d-flex justify-content-between align-items-center mt-3 mb-5">
                    <div className="d-flex align-items-center">
                        <span className="ml-2 fw-bold text-primary">Show Rows / Pages:</span>
                        <select
                            className="form-select fw-bold text-primary ml-3"
                            style={{ width: "90px" }}
                            value={limit}
                            onChange={(e) => {
                                const newLimit = parseInt(e.target.value);
                                setLimit(newLimit);
                                fetchDetails(1, newLimit, search);
                            }}
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={200}>200</option>
                        </select>
                    </div>

                    <div className="d-flex align-items-center">
                        <button
                            className="btn btn-outline-primary mr-2"
                            disabled={page === 1}
                            onClick={() => handlePageChange(page - 1)}
                        >
                            « Previous
                        </button>

                        <span className="fw-bold text-primary">
                            Page {page} To {totalPages}
                        </span>

                        <button
                            className="btn btn-outline-primary ml-2"
                            disabled={page === totalPages}
                            onClick={() => handlePageChange(page + 1)}
                        >
                            Next »
                        </button>
                    </div>
                </div>
            </div>

            <Modal id="modalDetail" title={editId ? "UPDATE DETAIL" : "CREATE DETAIL"} modalSize="modal-dialog-custom-xlll">

                <div className="row">
                    {/* <div className="border border-black p-4 mb-1" */}

                    <div className="col-3">
                        <span className="ml-2 fw-bold">code</span>
                        <input
                            placeholder="....." className="form-control text-primary"
                            value={form.code}
                            onChange={(e) => setForm({ ...form, code: e.target.value })}
                        />
                    </div>
                    <div className="col-3">
                        <span className="ml-2 fw-bold">name</span>
                        <input
                            placeholder="....." className="form-control text-primary"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                    </div>
                    <div className="col-3">
                        <span className="ml-2 fw-bold">date</span>
                        <input
                            type="date"
                            placeholder="....." className="form-control text-primary"
                            value={form.date_rec}
                            onChange={(e) => setForm({ ...form, date_rec: e.target.value })}
                        />
                    </div>
                    <div className="col-3">
                        <span className="ml-2 fw-bold">Serial</span>
                        <input
                            placeholder="....." className="form-control text-primary"
                            value={form.Serial}
                            onChange={(e) => setForm({ ...form, Serial: e.target.value })}
                        />
                    </div>
                    <div className="col-3 mt-3">
                        <span className="ml-2 fw-bold">control</span>
                        <input
                            placeholder="....." className="form-control text-primary"
                            value={form.control}
                            onChange={(e) => setForm({ ...form, control: e.target.value })}
                        />
                    </div>
                    <div className="col-3 mt-3">
                        <span className="ml-2 fw-bold">invoice</span>
                        <input
                            placeholder="....." className="form-control text-primary"
                            value={form.invoice}
                            onChange={(e) => setForm({ ...form, invoice: e.target.value })}
                        />
                    </div>
                    <div className="col-3 mt-3">
                        <span className="ml-2 fw-bold">scrap</span>
                        <input
                            placeholder="....." className="form-control text-primary"
                            value={form.scrap}
                            onChange={(e) => setForm({ ...form, scrap: e.target.value })}
                        />
                    </div>
                    <div className="col-3 mt-3">
                        <span className="ml-2 fw-bold">model</span>
                        <input
                            placeholder="....." className="form-control text-primary"
                            value={form.model}
                            onChange={(e) => setForm({ ...form, model: e.target.value })}
                        />
                    </div>
                    <div className="col-3 mt-3">
                        <span className="ml-2 fw-bold">sheet</span>
                        <input
                            placeholder="....." className="form-control text-primary"
                            value={form.sheet}
                            onChange={(e) => setForm({ ...form, sheet: e.target.value })}
                        />
                    </div>
                    <div className="col-3 mt-3">
                        <span className="ml-2 fw-bold">doc_no</span>
                        <input
                            placeholder="....." className="form-control text-primary"
                            value={form.doc_no}
                            onChange={(e) => setForm({ ...form, doc_no: e.target.value })}
                        />
                    </div>
                    <div className="col-3 mt-3">
                        <span className="ml-2 fw-bold">fixasset</span>
                        <input
                            placeholder="....." className="form-control text-primary"
                            value={form.fixasset}
                            onChange={(e) => setForm({ ...form, fixasset: e.target.value })}
                        />
                    </div>
                    <div className="col-3 mt-3">
                        <span className="ml-2 fw-bold">Price</span>
                        <input
                            placeholder="....." className="form-control text-primary"
                            type="number"
                            value={form.price}
                            onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })}
                        />
                    </div>
                    <div className="col-3 mt-3">
                        <span className="ml-2 fw-bold">maker</span>
                        <input
                            placeholder="....." className="form-control text-primary"
                            value={form.maker}
                            onChange={(e) => setForm({ ...form, maker: e.target.value })}
                        />
                    </div>
                    <div className="col-3 mt-3"></div>
                    <div className="col-3 mt-3"></div>
                    <div className="col-6 mt-3">
                        <button className="btn btn-primary ml-2" onClick={handleSubmit}>
                            {editId ? "UPDATE" : "CREATE"}
                        </button>
                        <button className="btn btn-danger ml-2" onClick={resetPage}>
                            CANCEL
                        </button>
                    </div>


                    {/* </div> */}
                </div>

            </Modal>

        </>

    );
};

export default Detail;
