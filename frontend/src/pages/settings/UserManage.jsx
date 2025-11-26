import { useEffect, useState } from "react";
import axios from "axios";
import config from "../../config";
import { Link } from "react-router-dom";
import TemplatePro from "../../home/TemplatePro"
import UndoIcon from '@mui/icons-material/Undo';
import Select from "react-select";  // ✅ เพิ่มตรงนี้
import ExcelJS from "exceljs";  // เพิ่มการใช้ ExcelJS
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';
import Swal from "sweetalert2";


export default function UserManage() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [processOptions, setProcessOptions] = useState([]);

  const [form, setForm] = useState({
    username: "",
    lastname: "",
    employee: "",
    password: "",
    permissions: "user",
    typemc: "",
    process: "",
  });

  const load = async () => {
    try {
      const r = await axios.get(`${config.api_path}/users`, { params: { q } });
      setList(r.data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  useEffect(() => {
    load();
    fetchProcess();
  }, []); // โหลดครั้งแรก

  const onChange = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const resetForm = () => {
    setForm({ username: "", lastname: "", employee: "", password: "", permissions: "user", typemc: "", process: "" });
    setEditingId(null);
  };

 const submit = async (e) => {
    e?.preventDefault?.();
    try {
      if (editingId) {
        // update (ไม่ส่ง password ที่นี่)
        const { password, ...rest } = form;
        await axios.patch(`${config.api_path}/users/${editingId}`, rest);
        if (password) {
          await axios.patch(`${config.api_path}/users/${editingId}/password`, { newPassword: password });
        }
      } else {
        await axios.post(`${config.api_path}/users`, form);
      }
      await load();
      resetForm();
      Swal.fire({
        title: "บันทึกสำเร็จ",
        text: "ข้อมูลของคุณได้ถูกบันทึกเรียบร้อยแล้ว",
        icon: "success",
        confirmButtonText: "ตกลง",
        timer: 1500
      });
    } catch (err) {
      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: err?.response?.data?.message || "ไม่สามารถบันทึกข้อมูลได้",
        icon: "error",
        confirmButtonText: "ตกลง"
      });
    }
};


  const editRow = (u) => {
    setEditingId(u.id);
    setForm({
      username: u.username || "",
      lastname: u.lastname || "",
      employee: u.employee || "",
      password: "", // เวลาจะแก้ ให้ผู้ใช้กรอกใหม่
      permissions: u.permissions || "user",
      typemc: u.typemc || "",
      process: u.process || "",
    });
  };

  const removeRow = async (u) => {
    if (!window.confirm(`ลบผู้ใช้ "${u.username}" ?`)) return;
    await axios.delete(`${config.api_path}/users/${u.id}`);
    await load();
  };


  const fetchProcess = async () => {
    try {
      const res = await axios.get(`${config.api_path}/process-name/list`);
      if (res.data.message === "success") {
        setProcessOptions(
          res.data.result.map((m) => ({
            value: m.typemc,
            label: m.typemc,
          }))
        );
      }
    } catch (err) {
      console.error("❌ Error fetching models:", err);
    }
  };

  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("User List");

      // กำหนดหัวตาราง
      worksheet.columns = [
        { header: 'ID', key: 'id' },
        { header: 'Username', key: 'username' },
        { header: 'Last Name', key: 'lastname' },
        { header: 'Employee ID', key: 'employee' },
        { header: 'Section', key: 'typemc' },
        { header: 'Permissions', key: 'permissions' },
        { header: 'Process', key: 'process' },
      ];

      // เพิ่มข้อมูลจาก list
      list.forEach(user => {
        worksheet.addRow({
          id: user.id,
          username: user.username,
          lastname: user.lastname,
          employee: user.employee,
          typemc: user.typemc,
          permissions: user.permissions,
          process: user.process,
        });
      });

      // สร้างไฟล์ Excel และดาวน์โหลด
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'User_Management_List.xlsx';
      link.click();
    } catch (err) {
      console.error("Error exporting to Excel:", err);
      alert("ไม่สามารถส่งออกข้อมูลได้");
    }
  };

 
  return (
    <>
      <TemplatePro>

        <div className="content-wrapper">
          <h5>
            <span className="fw-bold" style={{ fontSize: "2.2rem" }}>USER MANAGEMENT</span>
            <Link to="/settings">
              <button
                type="button"
                className="btn btn-danger ml-5"
              >
                <UndoIcon className="ml-1" /> BACK
              </button> </Link>
          </h5>

          <form style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              placeholder="ค้นหา username / ชื่อ / รหัสพนักงาน / Section"
              value={q}
              onChange={e => {
                setQ(e.target.value); // ตั้งค่าที่พิมพ์ในช่อง
                load(); // ดึงข้อมูลใหม่เมื่อพิมพ์
              }}
              style={{ flex: 1 }}
            />
            <button className="btn btn-secondary" type="button" onClick={() => { setQ(""); load(); }}>ล้าง</button>
          </form>

          <form onSubmit={submit} style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8, marginBottom: 16 }}>
            <div className="row g-2">
              <div className="col-md-3">
                <label>Username *</label>
                <input className="form-control" value={form.username} onChange={e => onChange("username", e.target.value.toUpperCase())} />
              </div>
              <div className="col-md-3">
                <label>last name</label>
                <input className="form-control" value={form.lastname} onChange={e => onChange("lastname", e.target.value.toUpperCase())} />
              </div>
              <div className="col-md-3">
                <label>Employee ID</label>
                <input className="form-control" value={form.employee} onChange={e => onChange("employee", e.target.value.toUpperCase())} />
              </div>
              <div className="col-md-3">
                <label>Section</label>
                {/* <input className="form-control" value={form.typemc} onChange={e => onChange("typemc", e.target.value.toUpperCase())} /> */}
                <Select
                  options={processOptions}
                  value={processOptions.find((opt) => opt.value === form.typemc) || null}
                  onChange={(selected) =>
                    setForm({ ...form, typemc: selected?.value || "" })
                  }
                  placeholder="...Select Process..."
                  isClearable
                />
              </div>
              <div className="col-md-4">
                <label>Password {editingId ? "(ใส่ถ้าต้องการเปลี่ยน)" : "*"}</label>
                <input className="form-control" type="password" value={form.password} onChange={e => onChange("password", e.target.value)} required={!editingId} />
              </div>
              <div className="col-md-4">
                <label>Permissions</label>
                <select className="form-select" value={form.permissions} onChange={e => onChange("permissions", e.target.value)}>
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </div>

              <div className="col-md-4">
                <label>Process Login</label>
                <select className="form-select" value={form.process} onChange={e => onChange("process", e.target.value)}>
                  <option value="">-- Select Process --</option>
                  <option value="Production">Production</option>
                  <option value="Qc">Qc</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-success" type="submit">{editingId ? "UPDATE" : "CREATE"}</button>
              {editingId && <button className="btn btn-danger ml-2" type="button" onClick={resetForm}>Cancel</button>}
            </div>
          
          </form>
          <button 
          className="btn btn-success mb-3 mt-2 ml-2" 
          onClick={exportToExcel}
          >
            <SystemUpdateAltIcon className="mr-1"/>EXPORT EXCEL
            </button>

          <table className="table table-striped table-bordered table-bordered-black text-center">
            <thead className="table-dark">
              <tr>
                <th style={{ width: "3.5rem" }}>ID</th>
                <th style={{ width: "10rem" }}>Username</th>
                <th style={{ width: "10rem" }}>last name</th>
                <th style={{ width: "7rem" }}>Employee</th>
                <th style={{ width: "16rem" }}>Section</th>
                <th style={{ width: "8rem" }}>Permissions</th>
                <th style={{ width: "10rem" }}>Process</th>
                <th style={{ width: "12rem" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr><td colSpan={7} className="text-center">ไม่มีผู้ใช้</td></tr>
              )}
              {list.map(u => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.username}</td>
                  <td>{u.lastname || "-"}</td>
                  <td>{u.employee || "-"}</td>
                  <td>{u.typemc || "-"}</td>
                  <td>{u.permissions || "-"}</td>
                  <td>{u.process || "-"}</td>
                  <td>
                   
                      <button className="btn btn-primary" onClick={() => editRow(u)}>Edit</button>
                      <button className="btn btn-danger ml-2" onClick={() => removeRow(u)}>Delete</button>
                   
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>

      </TemplatePro>
    </>
  );
}
