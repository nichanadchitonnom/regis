import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/studentport_logo.png";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ ตรวจสอบการกรอกข้อมูลก่อนส่ง
  const validate = () => {
    const e = {};
    if (!email) e.email = "กรอกอีเมลก่อนนะ";
    else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "รูปแบบอีเมลไม่ถูกต้อง";
    if (!password) e.password = "กรอกรหัสผ่านก่อนนะ";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ✅ ฟังก์ชันเชื่อม API login backend
  const onSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      const res = await fetch("http://127.0.0.1:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }

      console.log("✅ Login success:", data);

      // ✅ เก็บ token + role + email + user (สำหรับ Sidebar)
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("email", data.user.email);

      // 👇 เพิ่มบันทึก user object สำหรับ SidebarStu
      localStorage.setItem(
        "user",
        JSON.stringify({
          name: data.user.displayName || data.user.name || "Unknown User",
          role: data.user.role,
          email: data.user.email,
        })
      );

      alert("เข้าสู่ระบบสำเร็จ!");

      // ✅ redirect ตาม role
      const role = data.user.role;
      switch (role) {
        case "SuperAdmin":
          navigate("/super/verify");
          break;
        case "AdvisorAdmin":
          navigate("/advisor/veri-portfolio");
          break;
        case "Recruiter":
          navigate("/recruiter/home");
          break;
        case "Student":
          navigate("/student/home");
          break;
        default:
          alert("ไม่พบสิทธิ์ของผู้ใช้ (role ไม่ถูกต้อง)");
          navigate("/login");
          break;
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      alert("เกิดข้อผิดพลาดที่ฝั่ง client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center-wrap">
      <div className="card">
        <img
          src={logo}
          alt="StudentPort Logo"
          style={{
            width: "100px",
            height: "auto",
            margin: "0 auto 15px",
            display: "block",
          }}
        />
        <div className="title">StudentPort.com</div>

        <form onSubmit={onSubmit} noValidate>
          <input
            className="input"
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email && <div className="error">{errors.email}</div>}

          <input
            className="input"
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors.password && <div className="error">{errors.password}</div>}

          <div className="row-links">
            <Link className="link" to="/forgot-password">
              forgot password
            </Link>
            <Link className="link" to="/change-password">
              change password
            </Link>
          </div>

          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>

          <div className="footer">
            Don't have an account?{" "}
            <Link className="link" to="/select-role">
              Sign-up here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
