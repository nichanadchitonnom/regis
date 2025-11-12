// src/pages/CommentPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./CommentPage.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000";

function CommentBlock({ author, role, text, initial }) {
  return (
    <div className="comment-block">
      <div className="comment-header">
        <div className="author-initial">{initial || (author?.[0] || "U")}</div>
        <div className="author-info">
          <span className="author-name">{author}</span>
          <span className="author-role">&lt;{role}&gt;</span>
        </div>
      </div>
      <p className="comment-text">{`“${text}”`}</p>
    </div>
  );
}

export default function CommentPage() {
  const { projectId } = useParams();               // path: /project/:projectId/comments
  const navigate = useNavigate();

  const [loading, setLoading]   = useState(true);
  const [project, setProject]   = useState(null);
  const [comments, setComments] = useState([]);
  const [imgIndex, setImgIndex] = useState(0);
  const [newText, setNewText]   = useState("");
  const [posting, setPosting]   = useState(false);
  const MAX_LEN = 300;

  async function fetchDetail() {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE}/api/portfolio/detail/${projectId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.status === 401) {
        // ต้องล็อกอินก่อนถึงดู internal ได้
        navigate("/login");
        return;
      }
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Fetch detail failed (${res.status}). ${t.slice(0,120)}`);
      }

      const data = await res.json();

      // map ฟิลด์พื้นฐานให้ UI ใช้งานง่าย
      const images =
        (Array.isArray(data.images) && data.images.length && data.images) ||
        (Array.isArray(data.files) &&
          data.files.filter((p) => /\.(png|jpe?g|gif|webp)$/i.test(String(p)))) ||
        (data.cover_img ? [data.cover_img] : []);

      const norm = (x) =>
        x?.startsWith("http") ? x : `${API_BASE}${x?.startsWith("/") ? "" : "/"}${x || ""}`;

      setProject({
        id: data._id || data.id || projectId,
        title: data.title || "-",
        name: data.owner?.displayName || data.name || "-",
        university: data.owner?.university || data.university || "-",
        description: data.description || data.desc || "-",
        images: images.map(norm),
      });

      // ถ้าหลังบ้านแนบ comments มากับ detail ก็อ่านจาก data.comments
      const list = Array.isArray(data.comments) ? data.comments : [];
      setComments(
        list.map((c, i) => ({
          id: c._id || String(i),
          author: c.user?.displayName || c.author || "Unknown",
          role: c.user?.role || c.role || "guest",
          text: c.text || "",
          initial: (c.user?.displayName || c.author || "U").slice(0,1).toUpperCase(),
        }))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchDetail(); /* eslint-disable-next-line */ }, [projectId]);

  async function onPost(e) {
    e.preventDefault();
    if (!newText.trim() || posting) return;

    try {
      setPosting(true);
      const token = localStorage.getItem("token") || "";
      if (!token) {
        alert("โปรดล็อกอินก่อนแสดงความคิดเห็น");
        navigate("/login");
        return;
      }

      const res = await fetch(`${API_BASE}/api/portfolio/${projectId}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: newText.trim() }),
      });

      if (res.status === 401) {
        navigate("/login");
        return;
      }
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Post failed (${res.status}). ${t.slice(0,120)}`);
      }

      // โพสต์เสร็จ → รีเฟตช์ detail เพื่อให้คอมเมนต์ล่าสุดขึ้น
      await fetchDetail();
      setNewText("");
    } catch (err) {
      alert(err.message || "Post comment error");
    } finally {
      setPosting(false);
    }
  }

  if (loading)     return <div className="loading-page">Loading…</div>;
  if (!project)    return <div className="error-page">Project not found.</div>;
  const total = project.images.length;

  return (
    <div className="comment-page-container">
      <div className="header-row">
        <h2 className="page-title">{project.title}</h2>
        <button className="back-button" onClick={() => navigate(-1)}>⬅️ Back</button>
      </div>

      <div className="comment-page-grid">
        {/* LEFT: รูป + รายละเอียด */}
        <section className="project-display-section">
          <div className="image-viewer">
            <img
              src={project.images[imgIndex] || "https://via.placeholder.com/900x520?text=No+Image"}
              alt={`Project Image ${imgIndex + 1}`}
              className="project-main-image"
            />
            {total > 1 && (
              <div className="image-pagination">
                {project.images.map((_, i) => (
                  <span
                    key={i}
                    className={`dot ${i === imgIndex ? "active" : ""}`}
                    onClick={() => setImgIndex(i)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="project-details">
            <p><strong>Name:</strong> {project.name}</p>
            <p><strong>University:</strong> {project.university}</p>
            <p><strong>Description:</strong> {project.description}</p>
          </div>
        </section>

        {/* RIGHT: คอมเมนต์ + ฟอร์ม */}
        <aside className="comments-section">
          {comments.length ? (
            comments.map((c) => <CommentBlock key={c.id} {...c} />)
          ) : (
            <p style={{ opacity: 0.7 }}>No comments yet</p>
          )}

          <form className="comment-form" onSubmit={onPost}>
            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value.slice(0, MAX_LEN))}
              placeholder="Add your comment here..."
              rows={3}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <small style={{ opacity: 0.7 }}>{newText.length}/{MAX_LEN}</small>
              <button type="submit" disabled={!newText.trim() || posting}>
                {posting ? "Posting…" : "Post Comment"}
              </button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}
