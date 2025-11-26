import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import config from "../config";
// import hero from "../images/maintenance_request.jpg";
import "./index.css"; // << เพิ่ม
import { Link } from "react-router-dom";

function HomeSetting() {
  const [password, setPassword] = useState("");
  const [process, setProcess] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!password || !process) {
       setErr("กรุณาเลือก Process และ กรอกรหัสผ่าน");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${config.api_path}/auth/loginSetting`, { password, process });

      const user = res.data.user;

      // ✅ เช็คสิทธิ์ก่อนเข้า
      if (user.permissions !== "admin") {
        setErr("คุณไม่มีสิทธิ์เข้าหน้า Settings (ต้องเป็น Admin เท่านั้น)");
        return;
      }

      if (["Production", "Qc"].includes(process)) {
        navigate("/Settings", { replace: true });
      } else if (process === "Qc") {
        navigate("/Settings", { replace: true });
      } else {
        setErr("Process ไม่ถูกต้อง");
      }

    } catch (e) {
      setErr(e?.response?.data?.message || "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <div className="login-wrap">
        <div className="login-shell-s">
          {/* ซ้าย: รูปใหญ่ + หัวข้อ */}
          <aside className="login-hero" aria-hidden="true">
            {/* <img src={hero} alt="Factory maintenance" /> */}
           <h1>Application Gauge Control System</h1>
            
          </aside>

          {/* ขวา: การ์ดฟอร์ม */}
          <main className="login-card">
            <div className="brand">
              <div>
                <h2 style={{ color: "blue" }}>LOGIN TO SETTING</h2>
              </div>
            </div>

            <form onSubmit={onSubmit}>
              <div className="mb-3">
                <label className="form-label">Process</label>
                <select
                  className="form-control"
                  value={process}
                  onChange={(e) => setProcess(e.target.value)}
                  autoFocus
                >
                  <option value="">-- Select Process --</option>
                  <option value="Production">Production</option>
                  <option value="Qc">Qc</option>
                </select>
              </div>

              <div className="mb-2">
                <label className="form-label">Password</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    className="form-control"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPw((v) => !v)}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {showPw ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {err && <div className="alert alert-danger py-2 my-2">{err}</div>}

              <button className="btn btn-warning w-100 mt-4" disabled={loading} type="submit">
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
            <Link to="/dashboardProduct">
              <button
                type="button"
                className="btn btn-danger mt-4"
              >
                ← BACK
              </button> </Link>
          </main>

        </div>

      </div>
    </>
  );
}

export default HomeSetting;
