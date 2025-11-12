// src/components/AdminAdvisor/VerifyPortfolioAdvisor.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SidebarAdvi from "../AdminAdvisor/SidebarAdvi";
import { getPendingPortfolios } from "../../api/adminApi";

export default function VerifyPortfolioAdvisor() {
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getPendingPortfolios();
        setPortfolios(data);
      } catch (err) {
        console.error("Error fetching portfolios:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="flex role-advisor">
      <SidebarAdvi />
      <div className="main-container">
        <h2 className="page-title">Verify Portfolios (Advisor Stage)</h2>
        <p className="page-subtitle">
          Review and forward approved portfolios to Super Admin.
        </p>

        {portfolios.length === 0 ? (
          <p>ไม่มีพอร์ตที่รอตรวจ</p>
        ) : (
          <table className="verify-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Student</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {portfolios.map((p, i) => (
                <tr key={p._id}>
                  <td>{i + 1}</td>
                  <td>{p.title}</td>
                  <td>{p.owner?.displayName || "Unknown"}</td>
                  <td>
                    <span className={`status-badge ${p.status.toLowerCase()}`}>
                      {p.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-neutral"
                      onClick={() => navigate(`/advisor/review/${p._id}`)}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
