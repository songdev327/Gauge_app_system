import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import config from "../../config";
// import TemplatePro from "../../home/TemplatePro";
import { Link } from "react-router-dom";
import UndoIcon from "@mui/icons-material/Undo";
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';



export default function BorrowGaugeDetail() {
  const [details, setDetails] = useState([]);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // ✅ โหลดข้อมูลทั้งหมดจาก Backend
  const fetchData = async () => {
    try {
      const res = await axios.get(`${config.api_path}/list`);
      if (res.data.message === "success") {
        setDetails(res.data.result);
      } else {
        setDetails([]);
      }
    } catch (err) {
      console.error(err);
      Swal.fire("เกิดข้อผิดพลาด!", "ไม่สามารถโหลดข้อมูลได้", "error");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ✅ ฟังก์ชันกรองข้อมูลตามคำค้นหา
  const filteredDetails = details.filter(
    (d) =>
      d.doc_No?.toLowerCase().includes(filter.toLowerCase()) ||
      d.serial?.toLowerCase().includes(filter.toLowerCase()) ||
      d.control?.toLowerCase().includes(filter.toLowerCase()) ||
      d.section?.toLowerCase().includes(filter.toLowerCase())
  );

  // ✅ Pagination logic
  const totalPages = Math.ceil(filteredDetails.length / limit);
  const startIndex = (page - 1) * limit;
  const paginatedDetails = filteredDetails.slice(startIndex, startIndex + limit);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };

  const handleLimitChange = (e) => {
    setLimit(parseInt(e.target.value));
    setPage(1);
  };

  const handleExportExcel = async () => {
  try {
    if (filteredDetails.length === 0) {
      Swal.fire("ไม่พบข้อมูล", "ไม่มีข้อมูลให้ส่งออก", "info");
      return;
    }

    const searchParam = encodeURIComponent(filter);
    const url = `${config.api_path}/export?search=${searchParam}`;
    const response = await axios.get(url, { responseType: "blob" });

    // ✅ สร้างไฟล์ดาวน์โหลด
    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = `Gauge_Issue_Report_${new Date()
      .toLocaleDateString("en-GB")
      .replace(/\//g, "-")}.xlsx`;
    link.click();
  } catch (err) {
    console.error(err);
    Swal.fire("เกิดข้อผิดพลาด!", "ไม่สามารถส่งออกไฟล์ได้", "error");
  }
};

  return (
    <>
    {/* <TemplatePro> */}
      <div className="">
        <Link to="/settings">
          <button type="button" className="btn btn-danger mt-3 ml-3">
            <UndoIcon className="ml-1" /> BACK
          </button>
        </Link>

        <h3 className="fw-bold text-dark mb-3 mt-3 ml-2">
          📋 รายการ Borrow Gauge Detail
        </h3>

        {/* 🔍 ช่องค้นหา */}
        <div className="d-flex align-items-center mb-3 ml-3">
          <input
            type="text"
            className="form-control text-primary col-6"
            style={{ width: "350px" }}
            placeholder="🔍 ค้นหา Doc No / Serial / Control No / Section"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
          /> 
          <button className="btn btn-success ml-4" onClick={handleExportExcel}>
            <SystemUpdateAltIcon className="mr-1"/>EXPORT EXCEL
            </button>
        </div>

        {/* 📑 ตาราง */}
        <div className="table-responsive">
          <table className="table table-bordered table-striped text-center table-bordered-black">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>DATE</th>
                <th>ITEM NAME</th>
                <th>SERIAL NO.</th>
                <th>CONTROL NO</th>
                <th>REQUEST BY</th>
                <th>SECTION</th>
                <th>ISSUE BY</th>
                <th>TYPE / MODEL</th>
                <th>DOC NO</th>
                <th>RETURN BY</th>
                <th>RECEIVE BY</th>
                <th>DATE RETURN</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDetails.length > 0 ? (
                paginatedDetails.map((item, index) => (
                  <tr key={item.id}>
                    <td>{startIndex + index + 1}</td>
                    <td>{item.createdAt? new Date(item.createdAt).toLocaleDateString("th-TH")
                        : "-"}</td>
                    <td className="text-primary fw-bold">{item.item_name}</td>
                    <td>{item.serial}</td>
                    <td>{item.control}</td>
                    <td>{item.name}</td>
                    <td>{item.section}</td>
                    <td>{item.name_issue}</td>
                    <td>{item.model}</td>
                    <td>{item.doc_No}</td>
                    <td>{item.name_rec || "-"}</td>
                    <td>{item.name_received}</td>
                    <td>
                      {item.date_re
                        ? new Date(item.date_re).toLocaleDateString("th-TH")
                        : "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="text-muted">
                    ไม่พบข้อมูล
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 📄 Pagination + Rows per page */}
        {filteredDetails.length > 0 && (
          <div className="d-flex justify-content-between align-items-center mt-3 mb-4">
            <div className="d-flex align-items-center">
              <span className="fw-bold text-primary me-2">Show Rows / Page:</span>
              <select
                className="form-select fw-bold text-primary"
                style={{ width: "100px" }}
                value={limit}
                onChange={handleLimitChange}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="d-flex align-items-center">
              <button
                className="btn btn-outline-primary me-2"
                disabled={page === 1}
                onClick={() => handlePageChange(page - 1)}
              >
                « Previous
              </button>
              <span className="fw-bold text-primary">
                Page {page} / {totalPages || 1}
              </span>
              <button
                className="btn btn-outline-primary ms-2"
                disabled={page === totalPages || totalPages === 0}
                onClick={() => handlePageChange(page + 1)}
              >
                Next »
              </button>
            </div>
          </div>
        )}
      </div>
    {/* </TemplatePro> */}
    </>
  );
}
