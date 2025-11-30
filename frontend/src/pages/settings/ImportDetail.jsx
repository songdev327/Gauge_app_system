import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import UndoIcon from '@mui/icons-material/Undo';
import config from "../../config";
import TemplatePro from "../../home/TemplatePro";

export default function ImportDetail() {
    const [file, setFile] = useState(null);

    const handleUpload = async () => {
        if (!file) {
            Swal.fire("⚠️ โปรดเลือกไฟล์ Excel ก่อน");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            Swal.fire({ title: "กำลังนำเข้า...", didOpen: () => Swal.showLoading() });
            const res = await axios.post(`${config.api_path}/upload-excel-detail`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            Swal.fire({
             icon:"✅ สำเร็จ",
             title: "success", 
             text: res.data.message,
             timer: 5000        
            });
            window.location.reload();
        } catch (err) {
            Swal.fire("❌ ผิดพลาด", "ไม่สามารถนำเข้าไฟล์ได้", "error");
            console.error(err);
        }
    };

    return (
        <>
            <TemplatePro>
                <div className="content-wrapper">
                    <Link to="/detail">
                        <button
                            type="button"
                            className="btn btn-danger"
                        >
                            <UndoIcon className="ml-1" /> BACK
                        </button> </Link>
                    <h3 className="fw-bold mb-3 mt-5">📁 UPLOAD EXCEL เข้าตาราง DETAIL</h3>
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={(e) => setFile(e.target.files[0])}
                        className="form-control mb-3 col-6"
                    />
                    <button onClick={handleUpload} className="btn btn-success mt-3 mb-5" id="export-excel">
                        🚀 IMPORT EXCEL DETAIL TO DATABASE
                    </button>
                </div>
            </TemplatePro>
        </>
    );
}
