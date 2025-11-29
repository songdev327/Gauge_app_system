import React, { useState, useEffect } from "react";
import TemplatePro from "../../home/TemplatePro";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import config from "../../config"; // ✅ ปรับ path ตามจริง
import UndoIcon from '@mui/icons-material/Undo';
import FileDownloadDoneIcon from '@mui/icons-material/FileDownloadDone';
import Select from "react-select";  // ✅ เพิ่มตรงนี้

import Swal from "sweetalert2";

export default function RequestGaugeForm() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]); // ✅ เก็บข้อมูล user ทั้งหมด

    const [gaugeUsers, setGaugeUsers] = useState([]);

    const [UsersReceive, setUsersReceive] = useState([]);

    // ✅ เพิ่ม state สำหรับ dropdown
    const [partOptions, setPartOptions] = useState([]);
    const [modelOptions, setModelOptions] = useState([]);

    const [formData, setFormData] = useState({
        docNo: "",
        division: "PCMS-BPI",
        date: new Date().toLocaleDateString("en-GB"),

        requestBy: "",
        name: "",
        lastname: "",
        section: "",

        partName: "",
        model: "",
        partNo: "",
        mc: "",
        rev: "",

        issueBy: "",
        name_issue: "",
        lastname_issue: "",
        typemc_issue: "",

        receivedBy: "",
        name_received: "",
        lastname_received: "",
        typemc_received: "",

    });

    // ✅ โหลด users ครั้งแรก
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await axios.get(`${config.api_path}/users/list?process=Production`);
                if (res.data.message === "success") setUsers(res.data.result);
            } catch (e) {
                console.error("❌ Error fetching users:", e);
            }
        };

        const fetchGaugeUsers = async () => {
            try {
                const res = await axios.get(`${config.api_path}/users/list/gauge?typemc=Gauge Control`);
                if (res.data.message === "success") setGaugeUsers(res.data.result);
            } catch (e) {
                console.error("❌ Error fetching Gauge Control users:", e);
            }
        };
        const fetchUsersReceive = async () => {
            try {
                const res = await axios.get(`${config.api_path}/users/list?process=Production`);
                if (res.data.message === "success") setUsersReceive(res.data.result);
            } catch (e) {
                console.error("❌ Error fetching Gauge Control users:", e);
            }
        };

        const fetchPartNames = async () => {
            try {
                const res = await axios.get(`${config.api_path}/part-name/list`);
                if (res.data.message === "success") {
                    setPartOptions(
                        res.data.result.map((p) => ({
                            value: p.part_name,
                            label: p.part_name,
                        }))
                    );
                }
            } catch (err) {
                console.error("❌ Error fetching part names:", err);
            }
        };
        const fetchModels = async () => {
            try {
                const res = await axios.get(`${config.api_path}/model-master/list`);
                if (res.data.message === "success") {
                    setModelOptions(
                        res.data.result.map((m) => ({
                            value: m.madel,
                            label: m.madel,
                        }))
                    );
                }
            } catch (err) {
                console.error("❌ Error fetching models:", err);
            }
        };

        fetchUsers();
        fetchGaugeUsers();
        fetchUsersReceive();
        fetchPartNames();
        fetchModels();

    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // ✅ เมื่อเลือก employee
    const handleSelectUser = (e) => {
        const emp = e.target.value;
        const user = users.find((u) => u.employee === emp);
        if (user) {

            setFormData({
                ...formData,
                requestBy: emp,
                name: user.username,
                lastname: user.lastname,
                section: user.typemc,   // ✅ ใส่ค่าลงใน section
            });
        } else {

            setFormData({
                ...formData,
                requestBy: emp,
                name: "",
                lastname: "",
                section: "",
            });
        }
    };

    // ✅ เมื่อเลือก Issue Gauge By
    const handleSelectIssueUser = (e) => {
        const emp = e.target.value;
        const user = gaugeUsers.find((u) => u.employee === emp);
        if (user) {
            setFormData({
                ...formData,
                issueBy: emp,
                name_issue: user.username,
                lastname_issue: user.lastname,
                typemc_issue: user.typemc,
            });
        } else {
            setFormData({
                ...formData,
                issueBy: emp,
                name_issue: "",
                lastname_issue: "",
                typemc_issue: "",
            });
        }
    };

    const handleSelectUserReceive = (e) => {
        const emp = e.target.value;
        const user = UsersReceive.find((u) => u.employee === emp);
        if (user) {
            setFormData({
                ...formData,
                receivedBy: emp,
                name_received: user.username,   // ✅ จาก username
                lastname_received: user.lastname, // ✅ จาก lastname
                typemc_received: user.typemc,
            });
        } else {
            setFormData({
                ...formData,
                receivedBy: emp,
                name_received: "",
                lastname_received: "",
                typemc_received: "",
            });
        }
    };

    const handleSubmit = async () => {
        try {
            // 🔍 ตรวจสอบว่าฟิลด์จำเป็นครบไหม
            if (
                !formData.docNo ||
                !formData.partName ||
                !formData.model ||
                !formData.partNo ||
                !formData.mc ||
                !formData.rev
            ) {
                Swal.fire({
                    title: "กรอกข้อมูลไม่ครบ!",
                    text: "กรุณากรอกข้อมูลให้ครบทุกช่องที่จำเป็นก่อนบันทึก",
                    icon: "warning",
                    confirmButtonText: "ตกลง",
                });
                return; // ❌ หยุดไม่ให้ส่ง API ต่อ
            }

            if (!formData.requestBy) {
                Swal.fire("กรุณาเลือกผู้ขอ (Request Gauge By)", "", "warning");
                return;
            }
            if (!formData.issueBy) {
                Swal.fire("กรุณาเลือกผู้จ่ายเกจ (Issue Gauge By)", "", "warning");
                return;
            }
            if (!formData.receivedBy) {
                Swal.fire("กรุณาเลือกผู้รับเกจ (Received Gauge By)", "", "warning");
                return;
            }

            // ✅ ถ้าข้อมูลครบแล้วให้บันทึกได้
            const res = await axios.post(`${config.api_path}/gauge-request/create`, formData);

            if (res.data.message === "success") {
                Swal.fire({
                    title: "บันทึกสำเร็จ!",
                    text: "ข้อมูลได้ถูกบันทึกเรียบร้อยแล้ว",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                });
                navigate("/gaugeListPageRequest");
            } else {
                Swal.fire({
                    title: "เกิดข้อผิดพลาด!",
                    text: "ไม่สามารถบันทึกข้อมูลได้",
                    icon: "error",
                    confirmButtonText: "ตกลง",
                });
            }
        } catch (e) {
            console.error("❌ Error submitting gauge request:", e);
            Swal.fire({
                title: "ข้อผิดพลาด!",
                text: e.message,
                icon: "error",
                confirmButtonText: "ตกลง",
            });
        }
    };

    return (
        <TemplatePro>
            <div className="content-wrapper">
                <div
                    style={{
                        width: "950px",
                        margin: "50px auto",
                        marginTop: 0,
                        padding: "30px",
                        border: "2px solid #989898ff",
                        borderRadius: "10px",
                        backgroundColor: "#f8f8f8",
                        fontFamily: "Kanit, sans-serif",
                    }}
                >
                    <div style={{
                        backgroundColor: "rgba(255, 236, 115, 1)",
                        justifyContent: "center",
                        textAlign: "center",
                        paddingTop: "5px",
                        borderRadius: "3px"
                    }}
                    >
                        <h2 style={{ fontWeight: "bold", marginBottom: "30px" }}>
                            REQUEST GAUGE FORM
                        </h2>
                    </div>

                    <div className="row mb-3 mt-4">
                        <div className="col">
                            <span className="ml-2 fw-bold">Doc No.</span>
                            <input
                                className="form-control text-primary"
                                name="docNo"
                                value={formData.docNo} onChange={handleChange}
                                placeholder="............"
                            />
                        </div>
                        <div className="col">
                            <span className="ml-2 fw-bold">Division</span>
                            <input
                                className="form-control text-primary"
                                value={formData.division} readOnly
                            />
                        </div>
                        <div className="col">
                            <span className="ml-2 fw-bold">Date</span>
                            {/* ใช้ input type="date" เพื่อให้สามารถเลือกวันที่ได้ */}
                            <input
                                className="form-control text-primary"
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="row mb-3 mt-4">
                        <div className="col-3">
                            <span className="ml-2 fw-bold">Request Gauge By</span>
                            <Select
                                options={users.map((u) => ({
                                    value: u.employee,
                                    label: u.employee,
                                }))}
                                value={
                                    formData.requestBy
                                        ? { value: formData.requestBy, label: formData.requestBy }
                                        : null
                                }
                                onChange={(selected) => {
                                    const selectedUser = users.find(
                                        (u) => u.employee === selected?.value
                                    );
                                    setFormData({
                                        ...formData,
                                        requestBy: selected?.value || "",
                                        name: selectedUser?.username || "",
                                        lastname: selectedUser?.lastname || "",
                                        section: selectedUser?.typemc || "",
                                    });
                                }}
                                placeholder="พิมพ์รหัสพนักงาน..."
                                isSearchable
                                isClearable
                                styles={{
                                    control: (base) => ({
                                        ...base,
                                        minHeight: "36px",
                                        fontSize: "0.9rem",
                                    }),
                                }}
                            />
                        </div>
                        <div className="col-2">
                            <span className="text-white">-</span>
                            <input
                                className="form-control text-primary border border-white"
                                name="name"
                                value={formData.name}
                                readOnly
                            />
                        </div>
                        <div className="col-3">
                            <span className="text-white">-</span>
                            <input
                                className="form-control text-primary border border-white"
                                name="lastname"
                                value={formData.lastname}
                                readOnly
                            />
                        </div>
                        <div className="col">
                            <span className="text-white">-</span>
                            <input
                                className="form-control text-primary border border-white"
                                name="section"                        // ✅ ใช้ชื่อเดียวกับ Model
                                value={formData.section}              // ✅ ดึงจาก formData.section
                                readOnly
                            />
                        </div>

                    </div>

                    <div className="row mb-3 mt-4">
                        <div className="col">
                            <span className="ml-2 fw-bold">Part Name:</span>

                            <Select
                                options={partOptions}
                                value={partOptions.find((opt) => opt.value === formData.partName) || null}
                                onChange={(selected) =>
                                    setFormData({ ...formData, partName: selected?.value || "" })
                                }
                                placeholder="พิมพ์เพื่อค้นหา Part Name..."
                                isClearable
                            />
                        </div>
                        <div className="col">
                            <span className="ml-2 fw-bold">Model:</span>

                            <Select
                                options={modelOptions}
                                value={modelOptions.find((opt) => opt.value === formData.model) || null}
                                onChange={(selected) =>
                                    setFormData({ ...formData, model: selected?.value || "" })
                                }
                                placeholder="พิมพ์เพื่อค้นหา Model..."
                                isClearable
                            />

                        </div>
                    </div>

                    <div className="row mb-3 mt-4">
                        <div className="col">
                            <span className="ml-2 fw-bold">Part No:</span>
                            <input
                                className="form-control text-primary"
                                name="partNo"
                                value={formData.partNo} onChange={handleChange}
                                placeholder="............"
                            />
                        </div>
                        <div className="col">
                            <span className="ml-2 fw-bold">M/C:</span>
                            <input
                                className="form-control text-primary"
                                name="mc"
                                value={formData.mc} onChange={handleChange}
                                placeholder="............"
                            />
                        </div>
                        <div className="col">
                            <span className="ml-2 fw-bold">Rev:</span>
                            <input
                                className="form-control text-primary"
                                name="rev"
                                value={formData.rev} onChange={handleChange}
                                placeholder="............"
                            />
                        </div>
                    </div>

                    <div className="row mb-3 mt-4">

                        <div className="col-3">
                            <span className="ml-2 fw-bold">Issue Gauge By:</span>
                            <Select
                                options={gaugeUsers.map((u) => ({
                                    value: u.employee,
                                    label: u.employee,
                                }))}
                                value={
                                    formData.issueBy
                                        ? { value: formData.issueBy, label: formData.issueBy }
                                        : null
                                }
                                onChange={(selected) => {
                                    const selectedUser = gaugeUsers.find(
                                        (u) => u.employee === selected?.value
                                    );

                                    setFormData({
                                        ...formData,
                                        issueBy: selected?.value || "",
                                        name_issue: selectedUser?.username || "",
                                        lastname_issue: selectedUser?.lastname || "",
                                        typemc_issue: selectedUser?.typemc || "",
                                    });
                                }}
                                placeholder="พิมพ์รหัสพนักงาน..."
                                isSearchable
                                isClearable
                                styles={{
                                    control: (base) => ({
                                        ...base,
                                        minHeight: "36px",
                                        fontSize: "0.9rem",
                                    }),
                                }}
                            />
                        </div>
                        <div className="col-2">
                            <span className="text-white">-</span>
                            <input
                                className="form-control text-primary border border-white"
                                value={formData.name_issue}
                                readOnly
                            />
                        </div>
                        <div className="col-3">
                            <span className="text-white">-</span>
                            <input
                                className="form-control text-primary border border-white"
                                value={formData.lastname_issue}
                                readOnly
                            />
                        </div>
                        <div className="col">
                            <span className="text-white">-</span>
                            <input
                                className="form-control text-primary border border-white"
                                value={formData.typemc_issue}
                                readOnly
                            />
                        </div>

                    </div>

                    <div className="row mb-3 mt-4">

                        <div className="col-3">
                            <span className="ml-2 fw-bold">Received Gauge By:</span>
                            <Select
                                options={users.map((u) => ({
                                    value: u.employee,
                                    label: u.employee,
                                }))}
                                value={
                                    formData.receivedBy
                                        ? { value: formData.receivedBy, label: formData.receivedBy }
                                        : null
                                }
                                onChange={(selected) => {
                                    const selectedUser = users.find(
                                        (u) => u.employee === selected?.value
                                    );

                                    setFormData({
                                        ...formData,
                                        receivedBy: selected?.value || "",
                                        name_received: selectedUser?.username || "",
                                        lastname_received: selectedUser?.lastname || "",
                                        typemc_received: selectedUser?.typemc || "",
                                    });
                                }}
                                placeholder="พิมพ์รหัสพนักงาน..."
                                isSearchable
                                isClearable
                                styles={{
                                    control: (base) => ({
                                        ...base,
                                        minHeight: "36px",
                                        fontSize: "0.9rem",
                                    }),
                                }}
                            />
                        </div>

                        <div className="col-2">
                            <span className="text-white">--</span>
                            <input
                                className="form-control text-primary border border-white"
                                name="name_received"
                                value={formData.name_received}
                                readOnly
                            />
                        </div>

                        <div className="col-3">
                            <span className="text-white">--</span>
                            <input
                                className="form-control text-primary border border-white"
                                name="lastname_received"
                                value={formData.lastname_received}
                                readOnly
                            />
                        </div>
                        <div className="col">
                            <span className="text-white">--</span>
                            <input
                                className="form-control text-primary border border-white"
                                name="typemc_received"
                                value={formData.typemc_received}
                                readOnly
                            />
                        </div>
                    </div>

                    <div className="d-flex justify-content-between mt-4">
                        <button className="col-2 btn btn-success" onClick={handleSubmit} >
                            <FileDownloadDoneIcon className="mr-1" /> REQUEST</button>
                        <button
                            className="btn btn-danger"
                            onClick={() => navigate("/mainmenu")}
                        >
                            <UndoIcon className="mr-1" />BACK
                        </button>
                    </div>
                </div>
            </div>

        </TemplatePro>
    );
}
