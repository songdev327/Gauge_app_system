import React, { useEffect, useState } from "react";
import axios from "axios";
import config from "../../config";
import TemplatePro from "../../home/TemplatePro";
import Modal from "../modals/Modal";
import "./manu.css"
import Swal from "sweetalert2";
import FileDownloadDoneIcon from '@mui/icons-material/FileDownloadDone';
import CloseIcon from '@mui/icons-material/Close';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';
import BorderColorIcon from '@mui/icons-material/BorderColor';
import ForwardIcon from '@mui/icons-material/Forward';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ListAltIcon from '@mui/icons-material/ListAlt';


export default function GaugeList() {
    const [gauges, setGauges] = useState([]);
    const [filter, setFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedGauge, setSelectedGauge] = useState(null); // ✅ เก็บข้อมูลที่เลือก
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [searchType, setSearchType] = useState(""); // "item" | "sn" | "control"
    const [snInput, setSnInput] = useState("");
    // const [itemInput, setItemInput] = useState("");
    const [controlInput, setControlInput] = useState("");
    const [scrapValue, setScrapValue] = useState("");
    const [detailData, setDetailData] = useState(null);
    const [detailItems, setDetailItems] = useState([]);

    const [returnData, setReturnData] = useState(null);
    const [updatedDetails, setUpdatedDetails] = useState([]);

    const [gaugeUsers, setGaugeUsers] = useState([]); // ✅ เฉพาะ typemc = "Gauge Control"


    const [snSuggestions, setSnSuggestions] = useState([]);
    const [controlSuggestions, setControlSuggestions] = useState([]);

    const [selectedGaugeMC, setSelectedGaugeMC] = useState(null);
    const [newMC, setNewMC] = useState("");

    // const [countdown, setCountdown] = useState(300); // 300 วินาที = 5 นาที

    // useEffect(() => {
    //     const interval = setInterval(() => {
    //         setCountdown(prev => {
    //             if (prev <= 1) {
    //                 window.location.reload(); // 🔥 Reload หน้า
    //                 return 300; // 🔄 รีเซ็ตใหม่ 5 นาที
    //             }
    //             return prev - 1;
    //         });
    //     }, 1000);

    //     return () => clearInterval(interval);
    // }, []);


    const [formData, setFormData] = useState({
        rec_return: "",
        name_rec: "",
        lastname_rec: "",
        typemc_rec: "",
        date_re: "",
    });

    // const formatTime = (seconds) => {
    //     const min = Math.floor(seconds / 60).toString().padStart(2, '0');
    //     const sec = (seconds % 60).toString().padStart(2, '0');
    //     return `${min}:${sec}`;
    // };

    // ✅ ดึงข้อมูลทั้งหมด
    const fetchData = async () => {
        try {
            const res = await axios.get(`${config.api_path}/gauge-request/list`);
            if (res.data.message === "success") {
                setGauges(res.data.result || []);
            } else {
                setGauges([]);
            }
        } catch (error) {
            console.error("Error fetching gauges:", error);
            setGauges([]);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (returnData?.details) {
            setUpdatedDetails(returnData.details);
        }
    }, [returnData]);

    useEffect(() => {
        if (selectedGauge) {
            const modal = new window.bootstrap.Modal(
                document.getElementById("modalIssueRecord")
            );
            modal.show();
        }
    }, [selectedGauge]);

    useEffect(() => {

        const fetchGaugeUsers = async () => {
            try {
                const res = await axios.get(`${config.api_path}/users/list/gauge?typemc=Gauge Control`);
                if (res.data.message === "success") setGaugeUsers(res.data.result);
            } catch (e) {
                console.error("❌ Error fetching Gauge Control users:", e);
            }
        };

        fetchGaugeUsers();

    }, []);

    // ✅ ฟังก์ชันเปิด Modal Return Gauge
    const handleReturnGauge = async (docNo) => {
        try {
            const res = await axios.get(`${config.api_path}/gauge-request/return/${docNo}`);
            if (res.data.message === "success") {
                setReturnData(res.data);
                // เปิด Modal ด้วย Bootstrap event
                const modal = new window.bootstrap.Modal(document.getElementById("modalReturnGauge"));
                modal.show();
            } else {
                alert("ไม่พบข้อมูลสำหรับเอกสารนี้");
            }
        } catch (e) {
            console.error(e);
            alert("เกิดข้อผิดพลาดในการดึงข้อมูล");
        }
    };


    // ✅ Filter
    const filteredGauges = gauges.filter(
        (g) =>
            g?.docNo?.toLowerCase().includes(filter.toLowerCase()) ||
            g?.model?.toLowerCase().includes(filter.toLowerCase()) ||
            g?.mc?.toLowerCase().includes(filter.toLowerCase())
    );

    const totalPages = Math.ceil(filteredGauges.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedGauges = filteredGauges.slice(
        startIndex,
        startIndex + itemsPerPage
    );


    const handleDelete = async (id) => {
        // 🔹 ยืนยันก่อนลบ
        const result = await Swal.fire({
            title: "คุณแน่ใจหรือไม่?",
            text: "รายการนี้จะถูกลบออกจากระบบ และไม่สามารถกู้คืนได้!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "ลบข้อมูล",
            cancelButtonText: "ยกเลิก",
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            reverseButtons: true, // 🔄 ปุ่มสลับตำแหน่ง
        });

        if (!result.isConfirmed) return; // ❌ ถ้ายกเลิกให้หยุดการทำงาน

        try {
            const res = await axios.delete(`${config.api_path}/gauge-request/delete/${id}`);

            if (res.status === 200) {
                Swal.fire({
                    icon: "success",
                    title: "ลบข้อมูลสำเร็จ!",
                    text: "ข้อมูลได้ถูกลบออกจากระบบแล้ว",
                    timer: 1500,
                    showConfirmButton: false,
                });
                fetchData(); // 🔄 โหลดข้อมูลใหม่
            } else {
                Swal.fire({
                    icon: "error",
                    title: "ไม่สามารถลบข้อมูลได้!",
                    text: "กรุณาลองใหม่อีกครั้ง",
                });
            }
        } catch (e) {
            console.error(e);
            Swal.fire({
                icon: "error",
                title: "เกิดข้อผิดพลาด!",
                text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
            });
        }
    };


    const handleOpenModal = async (id) => {
        try {
            const res = await axios.get(`${config.api_path}/gauge-request/detail/${id}`);
            if (res.data.message === "success") {
                setSelectedGauge(res.data.result);
            } else {
                Swal.fire({
                    icon: "info",
                    title: "ไม่พบข้อมูล",
                    text: "ไม่พบรายละเอียดของ Gauge ที่เลือก",
                });
            }
        } catch (e) {
            Swal.fire({
                icon: "error",
                title: "โหลดข้อมูลไม่สำเร็จ",
                text: "เกิดข้อผิดพลาดในการดึงข้อมูลจากเซิร์ฟเวอร์",
            });
        }
    };


    const handleSelectIssueUser = (e) => {
        const emp = e.target.value;
        const user = gaugeUsers.find((u) => u.employee === emp);
        if (user) {
            setFormData({
                ...formData,
                rec_return: emp,
                name_rec: user.username,
                lastname_rec: user.lastname,
                typemc_rec: user.typemc,
            });
        } else {
            setFormData({
                ...formData,
                rec_return: emp,
                name_rec: "",
                lastname_rec: "",
                typemc_rec: "",
            });
        }
    };

    // ✅ ปิด modal
    // const handleCloseModal = () => setSelectedGauge(null);

    const ResetPage = () => {
        window.location.reload()
    }

    // 🔍 ดึงรายการ S/N ที่ตรงกับสิ่งที่พิมพ์
    const fetchSnSuggestions = async (keyword) => {
        if (!keyword || keyword.trim() === "") {
            setSnSuggestions([]);
            return;
        }
        try {
            const res = await axios.get(`${config.api_path}/detail/autocomplete/sn/${keyword}`);
            if (res.data.message === "success") {
                setSnSuggestions(res.data.result || []);
            } else {
                setSnSuggestions([]);
            }
        } catch (err) {
            console.error("❌ Error fetching S/N suggestions:", err);
        }
    };

    // 🔍 ดึงรายการ Control No.
    const fetchControlSuggestions = async (keyword) => {
        if (!keyword || keyword.trim() === "") {
            setControlSuggestions([]);
            return;
        }
        try {
            const res = await axios.get(`${config.api_path}/detail/autocomplete/control/${keyword}`);
            if (res.data.message === "success") {
                setControlSuggestions(res.data.result || []);
            } else {
                setControlSuggestions([]);
            }
        } catch (err) {
            console.error("❌ Error fetching Control suggestions:", err);
        }
    };

    // ⌨️ Event เมื่อพิมพ์ในช่อง S/N
    const handleSnChange = (e) => {
        const value = e.target.value;
        setSnInput(value);
        fetchSnSuggestions(value);
    };

    // ⌨️ Event เมื่อพิมพ์ในช่อง Control No.
    const handleControlChange = (e) => {
        const value = e.target.value;
        setControlInput(value);
        fetchControlSuggestions(value);
    };

    const openChangeMCModal = (gauge) => {
        setSelectedGaugeMC(gauge);       // เก็บข้อมูลทั้งหมด
        setNewMC(gauge.mc);             // ใส่ค่า M/C เดิมใน input
        window.$("#modalChangMC").modal("show"); // เปิด Modal
    };

    const handleUpdateMC = async () => {
        if (!selectedGaugeMC) return;

        try {
            await axios.put(`${config.api_path}/gauge-request/update-mc`, {
                id: selectedGaugeMC.id,
                mc: newMC
            });

            Swal.fire("สำเร็จ!", "อัปเดต M/C เรียบร้อยแล้ว", "success");
            window.location.reload();
        } catch (err) {
            Swal.fire("ผิดพลาด!", "ไม่สามารถอัปเดตได้", "error");
        }
    };


    const removeItem = (index) => {
        Swal.fire({
            title: "ต้องการลบรายการนี้หรือไม่?",
            text: "เมื่อลบแล้วต้องค้นหาใหม่หากต้องการเพิ่มอีกครั้ง",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "ลบรายการ",
            cancelButtonText: "ยกเลิก",
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
        }).then((result) => {
            if (result.isConfirmed) {
                setDetailItems((prev) => prev.filter((_, i) => i !== index));

                Swal.fire({
                    title: "ลบสำเร็จ",
                    text: "รายการถูกลบออกแล้ว",
                    icon: "success",
                    timer: 1200,
                    showConfirmButton: false
                });
            }
        });
    };

    return (
        <TemplatePro>

            <div className="content-wrapper">

                <h2 className="fw-bold mb-4"> <ListAltIcon id="icon-list" /> รายการขอยืม Gauge ( LIST REQUEST )
                    {/* <span style={{ color: "rgba(244, 244, 244, 1)" }}>{formatTime(countdown)}</span> */}
                </h2>

                {/* 🔍 Filter */}
                <input
                    className="form-control mb-3"
                    placeholder="ค้นหาด้วย Doc No / Model / M/C"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />

                {/* 📄 Table */}
                <table className="table table-bordered table-striped table-bordered-black">
                    <thead className="table-dark text-center">
                        <tr>
                            <th>Doc No.</th>
                            <th>Part Name</th>
                            <th>Model</th>
                            <th>Part No.</th>
                            <th>M/C</th>
                            <th>Rev</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedGauges.length > 0 ? (
                            paginatedGauges.map((gauge) => (
                                <tr key={gauge.id}>
                                    <td>{gauge.docNo}</td>
                                    <td>{gauge.partName}</td>
                                    <td>{gauge.model}</td>
                                    <td>{gauge.partNo}</td>

                                    <td
                                        style={{ cursor: "pointer", color: "blue", fontWeight: "bold" }}
                                        onClick={() => openChangeMCModal(gauge)}
                                    >
                                        {gauge.mc}
                                    </td>

                                    <td>{gauge.rev}</td>
                                    <td className="text-center">
                                        <button
                                            className="btn btn-success mr-2"
                                            // data-toggle="modal"
                                            // data-target="#modalIssueRecord"
                                            onClick={() => handleOpenModal(gauge.id)}
                                        >
                                            <BorderColorIcon />Gauge Issue Detail
                                        </button>
                                        <button
                                            className="btn btn-primary mr-2 text-white"
                                            onClick={() => handleReturnGauge(gauge.docNo)}
                                        >
                                            <ForwardIcon />Return Gauge
                                        </button>
                                        <button
                                            className="btn btn-danger ml-2"
                                            onClick={() => handleDelete(gauge.id)}
                                        >
                                            <DeleteOutlineIcon />Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="text-center text-muted">
                                    ไม่พบข้อมูล
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* 📑 Pagination */}
                {/* 📑 Pagination */}
                {filteredGauges.length > 0 && (
                    <div className="d-flex justify-content-between align-items-center mt-4 mb-3">
                        {/* ▼ เลือกจำนวนแถวต่อหน้า */}
                        <div className="d-flex align-items-center">
                            <span className="ml-2 fw-bold text-primary">Show Rows / Pages:</span>
                            <select
                                className="form-select fw-bold text-primary ml-3"
                                style={{ width: "90px" }}
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setCurrentPage(1);
                                    const newVal = parseInt(e.target.value);
                                    if (!isNaN(newVal)) setItemsPerPage(newVal);
                                }}
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>

                        {/* ▼ ปุ่ม ก่อนหน้า / หน้าปัจจุบัน / ถัดไป */}
                        <div className="d-flex align-items-center">
                            <button
                                className="btn btn-outline-primary mr-2"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            >
                                « Previous
                            </button>

                            <span className="fw-bold text-primary">
                                Page {currentPage} To {totalPages}
                            </span>

                            <button
                                className="btn btn-outline-primary ml-2"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            >
                                Next »
                            </button>
                        </div>
                    </div>
                )}

            </div>


            <Modal id="modalChangMC" title="CHANGE MACHINE" modalSize="modal-lg">

                <div className="row">
                    <div className="col-3">
                        <label className="ml-2">Doc No.</label>
                        <input
                            className="form-control text-primary"
                            value={selectedGaugeMC?.docNo || ""}
                            readOnly
                        />
                    </div>
                    <div className="col-5">
                        <label className="ml-2">M/C</label>
                        <input
                            className="form-control text-primary"
                            value={newMC}
                            onChange={(e) => setNewMC(e.target.value)}
                        />
                    </div>
                </div>

                <div className="mt-4">
                    <button
                        type="button"
                        className="btn btn-success col-4"
                        onClick={handleUpdateMC}
                    >
                        CHANGE M/C
                    </button>
                </div>
            </Modal>

            {/* ✅ Modal ฟอร์มแสดงข้อมูล */}
            {selectedGauge && (
                <Modal id="modalIssueRecord" title="" modalSize="modal-dialog-custom-xlll">
                    <>
                        <h4 className="fw-bold text-center">
                            Gauge Issue Detail — Doc No:{" "}
                            <span className="text-danger">{selectedGauge.docNo}</span>
                        </h4>

                        {/* ฟอร์มเหมือนในภาพ */}
                        <div className="border p-3 rounded" style={{ backgroundColor: "rgba(255, 243, 184, 1)" }}>

                            <div className="border p-3 rounded mb-2">
                                <div className="row mb-2">
                                    <div className="d-flex align-items-center mr-3">
                                        <input
                                            type="radio"
                                            name="searchType"
                                            checked={searchType === "sn"}
                                            onChange={() => setSearchType("sn")}
                                            className="mr-2"
                                            style={{ transform: "scale(1.5)", accentColor: "#0d6efd", cursor: "pointer" }} // ✅ ขยาย + กำหนดสี
                                        />
                                        <label className="fw-semibold">S/N</label>

                                        <div className="position-relative" style={{ marginRight: "20px" }}>
                                            <input
                                                type="text"
                                                className="form-control text-primary"
                                                style={{ width: "250px" }}
                                                placeholder="กรอก S/N"
                                                value={snInput}
                                                onChange={handleSnChange}
                                            />
                                            {snSuggestions.length > 0 && (
                                                <ul
                                                    className="list-group position-absolute"
                                                    style={{ zIndex: 1000, maxHeight: "200px", overflowY: "auto" }}
                                                >
                                                    {snSuggestions.map((item, i) => (
                                                        <li
                                                            key={i}
                                                            className="list-group-item list-group-item-action"
                                                            onClick={() => {
                                                                setSnInput(item.Serial);
                                                                setSnSuggestions([]);
                                                            }}
                                                            style={{ cursor: "pointer" }}
                                                        >
                                                            {item.Serial}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>

                                        <input
                                            type="radio"
                                            name="searchType"
                                            checked={searchType === "control"}
                                            onChange={() => setSearchType("control")}
                                            className="ml-4"
                                            style={{ transform: "scale(1.5)", accentColor: "#0d6efd", cursor: "pointer" }} // ✅ ขยาย + กำหนดสี
                                        />
                                        <label className="fw-semibold ml-2">Control No.</label>


                                        {/* ▼ ช่อง Control No. */}
                                        <div className="position-relative">
                                            <input
                                                type="text"
                                                className="form-control text-primary"
                                                style={{ width: "280px" }}
                                                placeholder="กรอก Control No."
                                                value={controlInput}
                                                onChange={handleControlChange}
                                            />
                                            {controlSuggestions.length > 0 && (
                                                <ul
                                                    className="list-group position-absolute"
                                                    style={{ zIndex: 1000, maxHeight: "200px", overflowY: "auto" }}
                                                >
                                                    {controlSuggestions.map((item, i) => (
                                                        <li
                                                            key={i}
                                                            className="list-group-item list-group-item-action"
                                                            onClick={() => {
                                                                setControlInput(item.control);
                                                                setControlSuggestions([]);
                                                            }}
                                                            style={{ cursor: "pointer" }}
                                                        >
                                                            {item.control}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            className="btn btn-primary col-2 ml-5"
                                            onClick={async () => {
                                                let keyword = "";
                                                if (searchType === "sn") keyword = snInput.trim();
                                                if (searchType === "control") keyword = controlInput.trim();

                                                // ❌ ไม่เลือกประเภทหรือไม่กรอกข้อมูล
                                                if (!searchType || keyword === "") {
                                                    Swal.fire({
                                                        title: "ข้อมูลไม่ครบ!",
                                                        text: "กรุณาเลือกประเภทค้นหาและกรอกข้อมูลให้ครบ",
                                                        icon: "warning",
                                                        confirmButtonText: "ตกลง",
                                                    });
                                                    return;
                                                }

                                                try {
                                                    const res = await axios.get(`${config.api_path}/detail/search/${searchType}/${keyword}`);

                                                    // ✅ กรณีค้นหาสำเร็จ
                                                    if (res.data.message === "success") {
                                                        const data = res.data.result;
                                                        setDetailData(data);
                                                        setScrapValue(data.scrap || "");

                                                        // ✅ เพิ่มข้อมูลเข้า table ด้านล่าง (ถ้าไม่ซ้ำ)
                                                        setDetailItems((prev) => {
                                                            if (prev.some((p) => p.serial === data.Serial)) return prev;
                                                            return [
                                                                ...prev,
                                                                {
                                                                    itemNo: data.code || "-",
                                                                    itemName: data.name || "-",
                                                                    qty: 1,
                                                                    serial: data.Serial || "-",
                                                                    controlNo: data.control || "-",
                                                                    typeModel: data.model || "-",
                                                                },
                                                            ];
                                                        });

                                                        // ✅ แสดงผลสำเร็จ
                                                        Swal.fire({
                                                            title: "สำเร็จ!",
                                                            html: `
            <div style="font-size: 1.1rem;">
              พบข้อมูล Gauge ที่ค้นหาแล้ว<br/>
              <b>Serial:</b> ${data.Serial || "-"}<br/>
              <b>Control No:</b> ${data.control || "-"}
            </div>
          `,
                                                            icon: "success",
                                                            timer: 1500,
                                                            showConfirmButton: false,
                                                        });
                                                    }

                                                    // ⚠️ ถ้าถูก Scrap แล้ว
                                                    else if (res.data.message === "scrapped") {
                                                        setScrapValue(res.data.scrap || "-");
                                                        setDetailData(null);
                                                        Swal.fire({
                                                            title: "ไม่สามารถเบิกได้!",
                                                            text: "⚠️ Gauge นี้ถูก Scrap แล้ว",
                                                            icon: "error",
                                                            confirmButtonText: "ตกลง",
                                                        });
                                                    }

                                                    // ⚠️ ถ้ามี Doc No แล้ว (ถูกเบิกไปแล้ว)
                                                    else if (res.data.message === "issued") {
                                                        setDetailData(null);
                                                        setScrapValue("");
                                                        Swal.fire({
                                                            title: "ไม่สามารถเบิกได้!",
                                                            text: `Gauge นี้ถูกเบิกไปแล้ว (Doc No: ${res.data.doc_no})`,
                                                            icon: "warning",
                                                            confirmButtonText: "ตกลง",
                                                        });
                                                    }

                                                    // ❌ ไม่พบข้อมูล
                                                    else if (res.data.message === "not found") {
                                                        setDetailData(null);
                                                        setScrapValue("");
                                                        Swal.fire({
                                                            title: "ไม่พบข้อมูล!",
                                                            text: "ไม่พบข้อมูลที่ค้นหาในระบบ",
                                                            icon: "info",
                                                            confirmButtonText: "ตกลง",
                                                        });
                                                    }

                                                    // ❌ อื่น ๆ
                                                    else {
                                                        setDetailData(null);
                                                        setScrapValue("");
                                                        Swal.fire({
                                                            title: "เกิดข้อผิดพลาด!",
                                                            text: "ไม่สามารถค้นหาข้อมูลได้",
                                                            icon: "error",
                                                            confirmButtonText: "ตกลง",
                                                        });
                                                    }
                                                } catch (e) {
                                                    console.error(e);
                                                    setDetailData(null);
                                                    setScrapValue("");
                                                    Swal.fire({
                                                        title: "เกิดข้อผิดพลาด!",
                                                        text: "❌ ไม่พบรายการที่ค้นหา",
                                                        icon: "error",
                                                        confirmButtonText: "ตกลง",
                                                    });
                                                }
                                            }}
                                        >
                                            Search
                                        </button>

                                    </div>
                                </div>

                            </div>

                            <div className="border p-3 rounded">
                                <div className="row gy-2">
                                    {/* Item No / Item Name */}
                                    <div className="col-6 d-flex align-items-center">
                                        <label className="mr-2" style={{ width: "9.125rem", textAlign: "left" }}>
                                            Item No :
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control text-primary"
                                            value={detailData?.code || ""}
                                            readOnly
                                        />
                                    </div>
                                    <div className="col-6 d-flex align-items-center">
                                        <label className="me-2" style={{ width: "9.125rem", textAlign: "left" }}>
                                            Item Name :
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control text-primary"
                                            value={detailData?.name || ""}
                                            readOnly
                                        />
                                    </div>


                                    <div className="col-6 d-flex align-items-center">
                                        <label className="me-2" style={{ width: "9.125rem", textAlign: "left" }}>
                                            S/N :
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control text-primary"
                                            value={detailData?.Serial || ""}
                                            readOnly
                                        />
                                    </div>
                                    <div className="col-6 d-flex align-items-center">
                                        <label className="me-2" style={{ width: "9.125rem", textAlign: "left" }}>
                                            Control No :
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control text-primary"
                                            value={detailData?.control || ""} readOnly
                                        />
                                    </div>


                                    {/* Type / Qty */}
                                    <div className="col-6 d-flex align-items-center">
                                        <label className="me-2" style={{ width: "9.125rem", textAlign: "left" }}>
                                            Type/Model :
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control text-primary"
                                            value={detailData?.model || ""}
                                            readOnly
                                        />
                                    </div>
                                    <div className="col-6 d-flex align-items-center">
                                        <label className="me-2" style={{ width: "9.125rem", textAlign: "left" }}>
                                            Qty :
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control text-center text-primary"
                                            value={selectedGauge.qty || 1}
                                            readOnly
                                        />
                                    </div>

                                    {/* Remark / Select */}
                                    <div className="col-6 d-flex align-items-center">
                                        <label className="me-2" style={{ width: "9.125rem", textAlign: "left" }}>
                                            Remark :
                                        </label>
                                        <input type="text" className="form-control" />
                                    </div>
                                    <div className="col-6 d-flex align-items-center">
                                        <label className="me-2" style={{ width: "9.125rem", textAlign: "left" }}>
                                            scrap :
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control text-danger"
                                            value={scrapValue}
                                            readOnly
                                        />
                                    </div>

                                </div>
                            </div>


                            <div className="mt-4">
                                <table className="table table-bordered table-striped text-center return-table">
                                    <thead className="table-dark">
                                        <tr>
                                            <th style={{ width: "50px" }}>No.</th>
                                            <th style={{ width: "60px" }}>Item No.</th>
                                            <th style={{ width: "180px" }}>Item Name</th>
                                            <th style={{ width: "50px" }}>Qty</th>
                                            <th style={{ width: "80px" }}>Serial</th>
                                            <th style={{ width: "120px" }}>Control No.</th>
                                            <th style={{ width: "120px" }}>Type / Model</th>
                                            <th style={{ width: "80px" }}>Action</th>   {/* ✅ เพิ่มตรงนี้ */}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detailItems.length > 0 ? (
                                            detailItems.map((item, index) => (
                                                <tr key={index}>
                                                    <td style={{ color: "blue" }}>{index + 1}</td>
                                                    <td style={{ color: "blue" }}>{item.itemNo}</td>
                                                    <td style={{ color: "blue" }}>{item.itemName}</td>
                                                    <td style={{ color: "blue" }}>{item.qty}</td>
                                                    <td style={{ color: "blue" }}>{item.serial}</td>
                                                    <td style={{ color: "blue" }}>{item.controlNo}</td>
                                                    <td style={{ color: "blue" }}>{item.typeModel}</td>
                                                    {/* ปุ่มลบ */}
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => removeItem(index)}
                                                        >
                                                            ❌
                                                        </button>
                                                    </td>

                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className="text-muted">
                                                    ไม่มีข้อมูลรายการ
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* ปุ่ม */}
                            <div className="d-flex justify-content-between mt-4">
                                <button
                                    className="btn btn-success"
                                    onClick={async () => {
                                        if (!selectedGauge?.docNo) {
                                            Swal.fire({
                                                title: "ไม่พบเลขที่เอกสาร!",
                                                text: "กรุณาตรวจสอบ Doc No ก่อนทำรายการ",
                                                icon: "warning",
                                                confirmButtonText: "ตกลง",
                                                confirmButtonColor: "#3085d6",
                                            });
                                            return;
                                        }

                                        if (detailItems.length === 0) {
                                            Swal.fire({
                                                title: "ยังไม่มีรายการ!",
                                                text: "กรุณาเพิ่มรายการในตารางก่อนบันทึก",
                                                icon: "info",
                                                confirmButtonText: "ตกลง",
                                                confirmButtonColor: "#3085d6",
                                            });
                                            return;
                                        }

                                        try {
                                            const payload = {
                                                doc_No: selectedGauge.docNo,
                                                items: detailItems,
                                            };

                                            const res = await axios.post(`${config.api_path}/addMany`, payload);

                                            if (res.data.message === "เพิ่มข้อมูลสำเร็จ") {
                                                Swal.fire({
                                                    title: "บันทึกสำเร็จ!",
                                                    text: `เพิ่มข้อมูลสำเร็จทั้งหมด ${res.data.count} รายการ`,
                                                    icon: "success",
                                                    confirmButtonText: "ตกลง",
                                                    confirmButtonColor: "#198754",
                                                    timer: 1500,
                                                }).then(() => {
                                                    setDetailItems([]); // ✅ เคลียร์ตารางหลังบันทึก
                                                });
                                                window.location.reload();
                                            } else {
                                                Swal.fire({
                                                    title: "เกิดข้อผิดพลาด!",
                                                    text: "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
                                                    icon: "error",
                                                    confirmButtonText: "ตกลง",
                                                    confirmButtonColor: "#d33",
                                                });
                                            }
                                        } catch (err) {
                                            console.error(err);
                                            Swal.fire({
                                                title: "เกิดข้อผิดพลาด!",
                                                text: "❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
                                                icon: "error",
                                                confirmButtonText: "ตกลง",
                                                confirmButtonColor: "#d33",
                                            });
                                        }
                                    }}
                                >
                                    ✅ Issue Gauge
                                </button>

                                <div>
                                    <button className="btn btn-danger me-2" onClick={ResetPage}>
                                        <CloseIcon className="mr-1" />Close
                                    </button>
                                </div>
                            </div>
                        </div>

                    </>
                </Modal>

            )}

            <Modal id="modalReturnGauge" title="" modalSize="modal-dialog-custom-xlll">
                {returnData ? (
                    <>
                        <h4 className="fw-bold text-center mb-3">
                            Return Gauge — Doc No:{" "}
                            <span className="text-danger">{returnData.header.docNo}</span>
                        </h4>

                        <div className="border rounded p-3 mb-3" style={{ backgroundColor: "rgba(255, 243, 184, 1)" }}>
                            <div className="row gy-2">
                                <div className="col-6">
                                    <strong>Division:</strong> {returnData.header.division || "-"}
                                </div>
                                <div className="col-6">
                                    <strong>Date:</strong> {new Date(returnData.header.date).toLocaleDateString("th-TH")}
                                </div>
                                <div className="col-3">
                                    <strong>Request Gauge By:</strong> {returnData.header.requestBy || "-"}
                                </div>
                                <div className="col-3">
                                    {returnData.header.name || "-"}
                                </div>
                                <div className="col-3">
                                    {returnData.header.lastname || "-"}
                                </div>
                                <div className="col-3">
                                    {returnData.header.section || "-"}
                                </div>
                                <div className="col-3">
                                    <strong>Part Name:</strong> {returnData.header.partName || "-"}
                                </div>
                                <div className="col-3">
                                    <strong>Model:</strong> {returnData.header.model || "-"}
                                </div>
                                <div className="col-3">
                                    <strong>Part No.:</strong> {returnData.header.partNo || "-"}
                                </div>
                                <div className="col-3">
                                    <strong>MC:</strong> {returnData.header.mc || "-"}
                                </div>
                                <div className="col-3">
                                    <strong>Rev:</strong> {returnData.header.rev || "-"}
                                </div>
                            </div>
                        </div>

                        <div className="border rounded p-2 mb-2" style={{ backgroundColor: "rgba(255, 243, 184, 1)" }}>
                            <h5 className="fw-bold mb-3">รายการยืม / คืน Gauge</h5>
                            <table className="table table-bordered table-striped text-center return-table">
                                <thead className="table-dark">
                                    <tr>
                                        <th>Return</th>
                                        <th>No.</th>
                                        <th>Item No</th>
                                        <th>Item Name</th>
                                        <th>Qty</th>
                                        <th>Serial</th>
                                        <th>Control No</th>
                                        <th>Model</th>
                                        <th>Emp</th>

                                    </tr>
                                </thead>
                                <tbody>
                                    {returnData.details.length > 0 ? (
                                        returnData.details.map((d, i) => (
                                            <tr key={i}>
                                                <td style={{ width: "4rem" }}>
                                                    <input
                                                        type="text"
                                                        className="form-control text-center text-primary fw-bold"
                                                        value={updatedDetails[i]?.return || ""}
                                                        onChange={(e) => {
                                                            const newDetails = [...updatedDetails];
                                                            newDetails[i].return = e.target.value.toUpperCase(); // ✅ แปลงเป็นตัวใหญ่
                                                            setUpdatedDetails(newDetails);
                                                        }}
                                                    />
                                                </td>
                                                <td style={{ width: "3rem" }}>{i + 1}</td>
                                                <td style={{ width: "4rem" }}>{d.item_no}</td>
                                                <td style={{ width: "15rem" }}>{d.item_name}</td>
                                                <td style={{ width: "3.5rem" }}>{d.qty}</td>
                                                <td style={{ width: "8rem" }}>{d.serial}</td>
                                                <td style={{ width: "15rem" }}>{d.control}</td>
                                                <td style={{ width: "15rem" }}>{d.model}</td>
                                                <td style={{ width: "5rem" }}>{d.rec_return}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className="text-muted">ไม่มีข้อมูล</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="border rounded p-3" style={{ backgroundColor: "rgba(255, 243, 184, 1)" }}>
                            <div className="row ml-1">
                                <div className="col-3">
                                    <span className="ml-2 fw-bold">Received Return By:</span>
                                    <select
                                        className="form-control text-primary"
                                        name="rec_return"
                                        onChange={handleSelectIssueUser}
                                        value={formData.rec_return}
                                    >
                                        <option value="">Select...</option>
                                        {gaugeUsers.map((user) => (
                                            <option key={user.id} value={user.employee}>
                                                {user.employee}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-2">
                                    <span style={{ color: "rgba(255, 245, 154, 1)" }}>-</span>
                                    <input id="name_rec" className="form-control text-primary" value={formData.name_rec} readOnly />
                                </div>

                                <div className="col-2">
                                    <span style={{ color: "rgba(255, 245, 154, 1)" }}>-</span>
                                    <input id="lastname_rec" className="form-control text-primary" value={formData.lastname_rec} readOnly />
                                </div>

                                <div className="col-4">
                                    <span style={{ color: "rgba(255, 245, 154, 1)" }}>-</span>
                                    <input id="typemc_rec" className="form-control text-primary" value={formData.typemc_rec} readOnly />
                                </div>
                            </div>

                            <div className="col-3 mt-3">
                                <span className="ml-2 fw-bold">Date Received Return:</span>
                                <input
                                    type="date"
                                    id="receivedDate"
                                    className="form-control text-primary"
                                    value={formData.date_re}
                                    onChange={(e) => setFormData({ ...formData, date_re: e.target.value })}
                                />
                            </div>

                            <div className="d-flex justify-content-between mt-4">
                                <button
                                    type="button"
                                    className="btn btn-success ml-2"
                                    onClick={async () => {
                                        try {
                                            const itemsToUpdate = updatedDetails.filter((d) => d.return === "Y");
                                            if (itemsToUpdate.length === 0) {
                                                Swal.fire({
                                                    title: "แจ้งเตือน",
                                                    text: "กรุณาใส่ค่า Return = 'Y' อย่างน้อยหนึ่งรายการก่อนบันทึก",
                                                    icon: "warning",
                                                    confirmButtonText: "ตกลง",
                                                });
                                                return;
                                            }

                                            if (!formData.rec_return || !formData.date_re) {
                                                Swal.fire({
                                                    title: "ข้อมูลไม่ครบ!",
                                                    text: "กรุณาเลือกผู้รับและวันที่รับคืนก่อนบันทึก",
                                                    icon: "warning",
                                                    confirmButtonText: "ตกลง",
                                                });
                                                return;
                                            }

                                            const payload = {
                                                doc_No: returnData.header.docNo,
                                                items: itemsToUpdate,
                                                rec_return: formData.rec_return,
                                                name_rec: formData.name_rec,
                                                lastname_rec: formData.lastname_rec,
                                                typemc_rec: formData.typemc_rec,
                                                date_re: formData.date_re,
                                            };

                                            const res = await axios.put(`${config.api_path}/borrow/update-return`, payload);

                                            if (res.data.message === "success") {
                                                Swal.fire({
                                                    title: "บันทึกสำเร็จ!",
                                                    text: `อัปเดตข้อมูลคืนเกจ ${res.data.count} รายการเรียบร้อยแล้ว`,
                                                    icon: "success",
                                                    timer: 1500,
                                                    showConfirmButton: false,
                                                });
                                                window.location.reload();
                                            } else {
                                                Swal.fire("เกิดข้อผิดพลาด!", "ไม่สามารถบันทึกข้อมูลได้", "error");
                                            }
                                        } catch (err) {
                                            console.error(err);
                                            Swal.fire("ข้อผิดพลาด!", "เกิดข้อผิดพลาดในการบันทึก", "error");
                                        }
                                    }}
                                >
                                    <FileDownloadDoneIcon className="mr-1" />
                                    Return Gauge
                                </button>

                                <button className="btn btn-danger ml-5" onClick={ResetPage}>
                                    <CloseIcon className="mr-1" />Close
                                </button>
                                <button
                                    className="btn btn-success"
                                    onClick={async () => {
                                        if (!returnData?.header?.docNo) {
                                            Swal.fire("ไม่พบ Doc No!", "ไม่สามารถส่งออกได้", "warning");
                                            return;
                                        }

                                        try {
                                            Swal.fire({
                                                title: "กำลังสร้างไฟล์...",
                                                text: "โปรดรอสักครู่ ระบบกำลังสร้างไฟล์ Excel",
                                                allowOutsideClick: false,
                                                didOpen: () => Swal.showLoading(),
                                            });

                                            const response = await axios.get(
                                                `${config.api_path}/gauge-request/export-return?docNo=${returnData.header.docNo}`,
                                                { responseType: "blob" }
                                            );

                                            const blob = new Blob([response.data], {
                                                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                                            });
                                            const url = window.URL.createObjectURL(blob);
                                            const link = document.createElement("a");
                                            link.href = url;
                                            link.setAttribute(
                                                "download",
                                                `ReturnGauge_${returnData.header.docNo}.xlsx`
                                            );
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);

                                            Swal.fire({
                                                icon: "success",
                                                title: "ดาวน์โหลดสำเร็จ!",
                                                text: "ไฟล์ Excel ถูกสร้างและดาวน์โหลดแล้ว",
                                                timer: 1500,
                                                showConfirmButton: false,
                                            });
                                        } catch (error) {
                                            console.error("Export Excel Error:", error);
                                            Swal.fire("เกิดข้อผิดพลาด!", "ไม่สามารถดาวน์โหลดไฟล์ได้", "error");
                                        }
                                    }}
                                >
                                    <SystemUpdateAltIcon className="mr-1" />
                                    Export Excel
                                </button>


                            </div>
                        </div>

                    </>
                ) : (
                    <div className="text-center py-5">กำลังโหลดข้อมูล...</div>
                )}
            </Modal>


        </TemplatePro>
    );
}
