import React, { useEffect, useState } from "react";
import axios from "axios";
import config from "../../config";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { PieChart, Pie, Legend, Cell, Tooltip as PieTooltip } from "recharts";
import Swal from "sweetalert2";
import "./Dashboard.css"
import TemplatePro from "../../home/TemplatePro";
import DashboardIcon from '@mui/icons-material/Dashboard';
import Modal from "../modals/Modal";

export default function Dashboard() {
  const [details, setDetails] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [scrapCount, setScrapCount] = useState(0);
  const [totalReturned, setTotalReturned] = useState(0);
  const [totalDocNo, setTotalDocNo] = useState(0);
  const [barData, setBarData] = useState([]);
  const [docList, setDocList] = useState([]); // ✅ เก็บรายการเอกสาร

  const [countdown, setCountdown] = useState(300); // 300 วินาที = 5 นาที

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          window.location.reload(); // 🔥 Reload หน้า
          return 300; // 🔄 รีเซ็ตใหม่ 5 นาที
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60).toString().padStart(2, '0');
    const sec = (seconds % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  };

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get(`${config.api_path}/borrow-gauge-detail/list`);
      if (res.data.message === "success") {
        const records = res.data.result;

        // คำนวณข้อมูลสรุป
        setDetails(records); // ✅ เก็บข้อมูลทั้งหมดไว้แสดงใน Modal
        setTotalRecords(records.length);
        setScrapCount(records.filter(r => r.scrapDate).length);
        setTotalReturned(records.filter(r => r.date_re).length);

        // 🔥 คำนวณจำนวน DOC NO แบบไม่ซ้ำ
        const uniqueDocNo = new Set(records.map(r => r.doc_No));
        setTotalDocNo(uniqueDocNo.size);

        // เตรียมข้อมูลสำหรับแสดงในกราฟ
        setBarData([
          { name: "TOTAL RECORDS", value: records.length },
          { name: "SCRAP DATE COUNT", value: records.filter(r => r.scrapDate).length },
          { name: "RETURNED GAUGE", value: records.filter(r => r.date_re).length },
        ]);
      } else {
        Swal.fire("Error", "Unable to fetch Borrow Gauge details", "error");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      Swal.fire("Error", "Something went wrong while fetching data", "error");
    }
  };

  const handleDocNoClick = async () => {
    try {
      const res = await axios.get(`${config.api_path}/gauge-request/list`);
      if (res.data.message === "success") {
        setDocList(res.data.result);
        const modal = new window.bootstrap.Modal(document.getElementById("modalDocList"));
        modal.show();
      }
    } catch (err) {
      console.error("Error fetching doc list:", err);
      Swal.fire("Error", "Unable to fetch document list", "error");
    }
  };

  const handleTotalRecordsClick = () => {
    const modal = new window.bootstrap.Modal(document.getElementById("modalTotalRecords"));
    modal.show();
  };

  const COLORS = ["#007bff", "#ff5733", "#28a745", "#8e44ad"];



  return (
    <>
      <TemplatePro>
        <div className="content-wrapper">
          <h2 className="fw-bold text-dark mb-4"><DashboardIcon id="icon-dashboard" /> DASHBOARD - BORROW GAUGE
            ⏱<span style={{ color: "rgba(244, 244, 244, 1)" }}>{formatTime(countdown)}</span>
          </h2>

          {/* สรุปข้อมูล */}
          <div className="row mb-4">
            <div className="col-md-3">
              <div
                className="stat-total p-3 rounded text-center"
                id="doc-no"
                style={{ backgroundColor: "#8e44ad", cursor: "pointer" }}
                onClick={handleDocNoClick}
              >
                <h5 className="fw-bold text-white">DOC NO</h5>
                <h3 className="fw-bold text-white">{totalDocNo}</h3>
              </div>
            </div>
            <div className="col-md-3">
              <div
                className="stat-total p-3 rounded text-center"
                id="total-record"
                style={{ backgroundColor: "#007bff", cursor: "pointer" }}
                onClick={handleTotalRecordsClick}
              >
                <h5 className="fw-bold text-white">TOTAL RECORDS</h5>
                <h3 className="fw-bold text-white">{totalRecords}</h3>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-total p-3 rounded text-center" id="return-gauge" style={{ backgroundColor: "#28a745" }}>
                <h5 className="fw-bold text-white">RETURNED GAUGE</h5>
                <h3 className="fw-bold text-white">{totalReturned}</h3>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-total p-3 rounded text-center" id="scrap-date" style={{ backgroundColor: "#ff723fff" }}>
                <h5 className="fw-bold text-white">SCRAP DATE COUNT</h5>
                <h3 className="fw-bold text-white">{scrapCount}</h3>
              </div>
            </div>
          </div>

          {/* กราฟแท่งและกราฟวงกลม */}
          <div className="row mb-4">

            {/* BAR CHART */}
            <div className="col-md-6">
              <h4 className="fw-bold text-center mb-3 text-dark">
                📊 BAR CHART - TOTAL SUMMARY
              </h4>
              <div
                className="graph-card"
                style={{ border: "2px solid #bababaff", padding: "20px", borderRadius: "5px" }}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={barData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {/* 🔢 ตัวเลขบนแท่ง */}
                      <LabelList
                        dataKey="value"
                        position="top"
                        fill="#000"
                        fontSize={14}
                        formatter={(v) => v?.toLocaleString?.() ?? v}
                      />
                      {barData.map((entry, index) => (
                        <Cell key={`cell-bar-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* PIE CHART */}
            <div className="col-md-6">
              <h4 className="fw-bold text-center mb-3 text-dark">
                🍩 PIE CHART - TOTAL SUMMARY
              </h4>
              <div
                className="graph-card"
                style={{ border: "2px solid #bababaff", padding: "20px", borderRadius: "5px" }}
              >
                <div className="d-flex justify-content-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={barData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={130}
                        isAnimationActive={false}              // ช่วยให้ดีบักง่าย
                        label={({ value }) => value}           // 🔢 ให้แสดงตัวเลข value
                        labelLine={true}
                      >
                        {barData.map((entry, index) => (
                          <Cell
                            key={`cell-pie-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <PieTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ✅ Modal แสดงรายการ DOC NO */}
        <Modal id="modalDocList" title="LIST GAUGE REQUEST ( DOC NO )" modalSize="modal-xl">
          <div className="table-responsive">
            <table className="table table-bordered table-striped text-center">
              <thead className="table-dark">
                <tr>
                  <th>No.</th>
                  <th>Doc No.</th>
                  <th>Date</th>
                  <th>Request By</th>
                  <th>Machine</th>
                  <th>Section</th>
                </tr>
              </thead>
              <tbody>
                {docList.length > 0 ? (
                  docList.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td className="fw-bold text-primary">{item.docNo}</td>
                      <td>{item.date}</td>
                      <td>{item.name}</td>
                      <td>{item.mc}</td>
                      <td>{item.section}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-muted">ไม่พบข้อมูล</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Modal>

        {/* ✅ Modal แสดงรายการ TOTAL RECORDS */}
        <Modal id="modalTotalRecords" title="LIST TOTAL RECORDS ( BORROW GAUGE )" modalSize="modal-xl">
          <div className="table-responsive" style={{ maxHeight: "70vh", overflowY: "auto" }}>
            <table className="table table-bordered table-striped text-center">
              <thead className="table-dark" style={{ position: "sticky", top: 0 }}>
                <tr>
                  <th>No.</th>
                  <th>Doc No.</th>
                  <th>Item No.</th>
                  <th>Item Name</th>
                  <th>Serial</th>
                  <th>Control No.</th>
                  <th>Model</th>
                </tr>
              </thead>
              <tbody>
                {details.length > 0 ? (
                  details.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td className="fw-bold text-danger">{item.doc_No}</td>
                      <td>{item.item_no}</td>
                      <td className="text-left">{item.item_name}</td>
                      <td>{item.serial}</td>
                      <td className="text-primary fw-bold">{item.control}</td>
                      <td>{item.model}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-muted">ไม่พบข้อมูล</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Modal>
        

      </TemplatePro>
    </>
  );
}
