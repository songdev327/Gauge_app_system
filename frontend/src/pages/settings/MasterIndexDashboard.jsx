import React, { useEffect, useState } from "react";
import axios from "axios";
import config from "../../config";
import UndoIcon from "@mui/icons-material/Undo";
import { useNavigate } from "react-router-dom";
import Modal from "../modals/Modal";
import * as XLSX from "xlsx"; // ✅ เพิ่ม XLSX
import "./setting.css";
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LabelList
} from "recharts";

export default function MasterIndexDashboard() {
  const [summary, setSummary] = useState({
    total: 0,
    fileCount: 0,
    fileDetails: [],
    scrapCount: 0,
  });

  const [okList, setOkList] = useState([]);
  const [ngList, setNgList] = useState([]);
  const [totalList, setTotalList] = useState([]);

  const [showOkModal, setShowOkModal] = useState(false);
  const [showNgModal, setShowNgModal] = useState(false);
  const [showTotalModal, setShowTotalModal] = useState(false);

  const [currentFile, setCurrentFile] = useState("");

  const navigate = useNavigate();

  // ✅ โหลดสรุป Dashboard
  const fetchSummary = async () => {
    try {
      const res = await axios.get(`${config.api_path}/masterIndex/summary`);
      setSummary(res.data);
    } catch (err) {
      console.error("Error loading summary:", err);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // ✅ โหลดรายการ OK
  const fetchOkList = async (fileName) => {
    try {
      const res = await axios.get(`${config.api_path}/masterIndex/list-ok`, {
        params: { fileName },
      });
      setOkList(res.data);
      setCurrentFile(fileName);
      setShowOkModal(true);
    } catch (err) {
      console.error("Error fetching OK list:", err);
    }
  };

  // ✅ โหลดรายการ SCRAP
  const fetchNgList = async (fileName) => {
    try {
      const res = await axios.get(`${config.api_path}/masterIndex/list-scrap`, {
        params: { fileName },
      });
      setNgList(res.data);
      setCurrentFile(fileName);
      setShowNgModal(true);
    } catch (err) {
      console.error("Error fetching SCRAP list:", err);
    }
  };

  // ✅ โหลดรายการ TOTAL (OK + SCRAP)
  const fetchTotalList = async (fileName) => {
    try {
      const res = await axios.get(`${config.api_path}/masterIndex/list-total`, {
        params: { fileName },
      });
      setTotalList(res.data);
      setCurrentFile(fileName);
      setShowTotalModal(true);
    } catch (err) {
      console.error("Error fetching TOTAL list:", err);
    }
  };

  // ✅ ฟังก์ชัน Export Excel
  const handleExportTotalExcel = () => {
    if (totalList.length === 0) return;

    // ✅ สร้างข้อมูลสำหรับ Excel
    const exportData = totalList.map((item, index) => ({
      No: index + 1,
      SHEET_NAME: item.SHEET_NAME,
      FIXASSET: item.FIXASSET,
      CONTROL_NO: item.CONTROL_NO,
      SCRAP_DATE: item.SCRAP_DATE ? item.SCRAP_DATE.slice(0, 10) : "-",
    }));

    // ✅ แปลงข้อมูลเป็น worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TOTAL SHEET LIST");

    // ✅ ตั้งชื่อไฟล์
    const fileName = `${currentFile.replace(/\s+/g, "_")}_TOTAL_SHEET_LIST.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // ✅ เตรียมข้อมูลกราฟ
  const chartData = summary.fileDetails.map((f) => ({
    name: f.FILE_NAME,
    ok: f.okCount,
    scrap: f.scrapCount,
    total: f.okCount + f.scrapCount,
  }));

  // ✅ คำนวณ GAUGE BALANCE
  const gaugeBalance =
    summary.fileDetails.reduce((sum, f) => sum + f.sheetCount, 0) -
    summary.scrapCount;

  const COLORS = ["#00C49F", "#FF8042"];

  const pieData = [
    { name: "OK SHEETS", value: chartData.reduce((sum, f) => sum + f.ok, 0) },
    { name: "SCRAP SHEETS", value: chartData.reduce((sum, f) => sum + f.scrap, 0) },
  ];

  const barSummaryData = [
    { name: "TOTAL RECORDS", value: summary.total },
    { name: "TOTAL FILES", value: summary.fileCount },
    {
      name: "TOTAL SHEETS",
      value: summary.fileDetails.reduce((sum, f) => sum + f.sheetCount, 0),
    },
    { name: "SCRAP", value: summary.scrapCount },
    { name: "GAUGE BALANCE", value: summary.total - summary.scrapCount },  // เพิ่ม GAUGE BALANCE

  ];

  const BAR_COLORS = ["#44f6ff", "#ffe770", "#7ed6df", "#ff1616ff", "#28ff19"]; // สีแต่ละแท่ง


  return (
    <div className=" mt-2 ml-3 mr-3"
    // style={{ fontFamily: "Kanit, sans-serif", maxWidth: "1500px" }}
    >
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="fw-bold text-dark">📊 MASTER INDEX DASHBOARD</h2>
        <button className="btn btn-danger" onClick={() => navigate("/masterindex")}>
          <UndoIcon /> BACK
        </button>
      </div>

      {/* ✅ แสดงยอดรวม */}
      <div className="row mb-4">
        <div className="col-2 ml-4">
          <div className="summary-card card-blue">
            <h5>TOTAL RECORDS</h5>
            <h3 className="fw-bold text-primary">{summary.total}</h3>
          </div>
        </div>

        <div className="col-2 ml-5">
          <div className="summary-card card-yellow">
            <h5>TOTAL FILES</h5>
            <h3 className="fw-bold text-primary">{summary.fileCount}</h3>
          </div>
        </div>

        <div className="col-2 ml-5">
          <div className="summary-card card-cyan">
            <h5>TOTAL SHEETS</h5>
            <h3 className="fw-bold text-primary">
              {summary.fileDetails.reduce((sum, f) => sum + f.sheetCount, 0)}
            </h3>
          </div>
        </div>

        <div className="col-2 ml-5">
          <div className="summary-card card-orange">
            <h5>SCRAP</h5>
            <h3 className="fw-bold text-white">{summary.scrapCount}</h3>
          </div>
        </div>
        <div className="col-2 ml-5">
          <div className="summary-card card-success">
            <h5>GAUGE BALANCE</h5>
            <h3 className="fw-bold text-dark">
              {summary.total - summary.scrapCount}
            </h3>
          </div>
        </div>
      </div>


      {/* ✅ กราฟแท่ง + วงกลม แบ่งซ้ายขวา */}
      <div className="row mt-4">

        {/* 🔹 ซ้าย: BAR CHART */}
        <div className="col-6 mb-4">
          <div className="rounded shadow"
            style={{ backgroundColor: "#f8f9fa", border: "1px solid #bdbdbdff" }}
          >
            <h4 className="fw-bold text-center mb-3 mt-1 text-primary">
              📊 BAR CHART — TOTAL SUMMARY
            </h4>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={barSummaryData}
                margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value"
                  radius={[6, 6, 0, 0]}
                  style={{
                    filter: "drop-shadow(2px 4px 6px rgba(116, 116, 116, 0.49))"
                  }}
                >
                  {/* 🔢 ตัวเลขบนแท่ง */}
                  <LabelList
                    dataKey="value"
                    position="top"
                    fill="#000"
                    fontSize={14}
                  />
                  {/* 🎨 สีแต่ละแท่ง */}
                  {barSummaryData.map((entry, index) => (
                    <Cell
                      key={`cell-bar-${index}`}
                      fill={BAR_COLORS[index % BAR_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>


        {/* 🔹 ขวา: PIE CHART */}
        <div className="col-6 mb-4">
          <div className="rounded shadow"
            style={{ backgroundColor: "#f8f9fa", border: "1px solid #bdbdbdff" }}
          >
            <h4 className="fw-bold text-center mb-3 mt-1 text-primary">
              🍩 PIE CHART — TOTAL SUMMARY
            </h4>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={[
                    {
                      name: "OK SHEETS",
                      value: summary.fileDetails.reduce((sum, f) => sum + (f.okCount || 0), 0),
                    },
                    {
                      name: "SCRAP SHEETS",
                      value: summary.fileDetails.reduce((sum, f) => sum + (f.scrapCount || 0), 0),
                    },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={130}
                  label
                >
                  <Cell fill="#00C49F" />
                  <Cell fill="#ff1010ff" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>


      {/* ✅ ตาราง FILE_NAME / SHEET_NAME */}
      <table className="table table-bordered table-striped text-center table-bordered-black">
        <thead className="table-dark">
          <tr>
            <th>#</th>
            <th>FILE_NAME</th>
            <th>SHEET COUNT</th>
            <th>OK SHEET COUNT</th>
            <th>SCRAP SHEET COUNT</th>
            <th>TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {summary.fileDetails.length > 0 ? (
            summary.fileDetails.map((file, idx) => (
              <tr key={idx}>
                <td>{idx + 1}</td>
                <td>{file.FILE_NAME}</td>
                <td>{file.sheetCount}</td>

                <td
                  data-toggle="modal"
                  data-target="#modalShowOk"
                  className="text-success fw-bold"
                  style={{ cursor: "pointer" }}
                  onClick={() => fetchOkList(file.FILE_NAME)}
                >
                  {file.okCount}
                </td>

                <td
                  data-toggle="modal"
                  data-target="#modalShowNg"
                  className="text-danger fw-bold"
                  style={{ cursor: "pointer" }}
                  onClick={() => fetchNgList(file.FILE_NAME)}
                >
                  {file.scrapCount}
                </td>

                {/* ✅ คลิกเปิด Modal TOTAL */}
                <td
                  data-toggle="modal"
                  data-target="#modalShowTotal"
                  className="fw-bold text-primary"
                  style={{ cursor: "pointer" }}
                  onClick={() => fetchTotalList(file.FILE_NAME)}
                >
                  {file.okCount + file.scrapCount}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-muted">
                No Data Available
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ✅ Modal แสดง OK */}
      {showOkModal && (
        <Modal
          id="modalShowOk"
          title={`✅ OK SHEET LIST — FILE: ${currentFile}`}
          modalSize="modal-dialog-custom-xlll"
          onClose={() => setShowOkModal(false)}
        >
          <table className="table table-bordered text-center">
            <thead className="table-success">
              <tr>
                <th>#</th>
                <th>SHEET_NAME</th>
                <th>FIXASSET</th>
                <th>CONTROL_NO</th>
                <th>SCRAP_DATE</th>
              </tr>
            </thead>
            <tbody>
              {okList.length > 0 ? (
                okList.map((item, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>{item.SHEET_NAME}</td>
                    <td>{item.FIXASSET}</td>
                    <td>{item.CONTROL_NO}</td>
                    <td>-</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-muted">No OK Data</td>
                </tr>
              )}
            </tbody>
          </table>
        </Modal>
      )}

      {/* ✅ Modal แสดง SCRAP */}
      {showNgModal && (
        <Modal
          id="modalShowNg"
          title={`❌ SCRAP SHEET LIST — FILE: ${currentFile}`}
          modalSize="modal-dialog-custom-xlll"
          onClose={() => setShowNgModal(false)}
        >
          <table className="table table-bordered text-center">
            <thead className="table-danger">
              <tr>
                <th>#</th>
                <th>SHEET_NAME</th>
                <th>FIXASSET</th>
                <th>CONTROL_NO</th>
                <th>SCRAP_DATE</th>
              </tr>
            </thead>
            <tbody>
              {ngList.length > 0 ? (
                ngList.map((item, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>{item.SHEET_NAME}</td>
                    <td>{item.FIXASSET}</td>
                    <td>{item.CONTROL_NO}</td>
                    <td>{item.SCRAP_DATE?.slice(0, 10) || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-muted">No SCRAP Data</td>
                </tr>
              )}
            </tbody>
          </table>
        </Modal>
      )}

      {/* ✅ Modal แสดง TOTAL */}

      {showTotalModal && (
        <Modal
          id="modalShowTotal"
          title={`📋 TOTAL SHEET LIST — FILE: ${currentFile}`}
          modalSize="modal-dialog-custom-xlll"
        >

          {/* 🔹 ปุ่ม Export Excel */}
          <div className="d-flex justify-content-end mb-3">
            <button
              className="btn btn-success"
              onClick={handleExportTotalExcel}
            >
              <SystemUpdateAltIcon className="mr-2" />
              Export Excel
            </button>
          </div>
          <table className="table table-bordered text-center">
            <thead className="table-info">
              <tr>
                <th>#</th>
                <th>SHEET_NAME</th>
                <th>FIXASSET</th>
                <th>CONTROL_NO</th>
                <th>SCRAP_DATE</th>
              </tr>
            </thead>
            <tbody>
              {totalList.length > 0 ? (
                totalList.map((item, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>{item.SHEET_NAME}</td>
                    <td>{item.FIXASSET}</td>
                    <td>{item.CONTROL_NO}</td>
                    <td>{item.SCRAP_DATE ? item.SCRAP_DATE.slice(0, 10) : "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-muted">No TOTAL Data</td>
                </tr>
              )}
            </tbody>
          </table>
        </Modal>
      )}

    </div>
  );
}
