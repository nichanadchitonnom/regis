import React from "react";

export default function FileInput({ files, onChange }) {
  const handleChange = (e) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    const maxSize = 10 * 1024 * 1024;
    let newFiles = Array.from(e.target.files);

    const invalidFiles = newFiles.filter((f) => !allowedTypes.includes(f.type));
    const largeFiles = newFiles.filter((f) => f.size > maxSize);
    if (invalidFiles.length > 0) alert("ชนิดไฟล์ไม่รองรับ");
    if (largeFiles.length > 0) alert("ไฟล์ใหญ่เกิน 10MB");

    newFiles = newFiles.filter((f) => allowedTypes.includes(f.type));

    const newFileObjects = newFiles.map((f) => ({ file: f, url: null }));

    let combinedFiles = [...files, ...newFileObjects];
    if (combinedFiles.length > 10) {
      alert("เลือกไฟล์ได้ไม่เกิน 10 ไฟล์");
      combinedFiles = combinedFiles.slice(0, 10);
    }

    onChange(combinedFiles);
  };

  const handleRemove = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    onChange(updatedFiles);
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*,application/pdf"
        multiple
        onChange={handleChange}
        style={{
          width: "100%",
          padding: 10,
          borderRadius: 8,
          background: "#fff",
          boxSizing: "border-box",
          marginBottom: 10,
        }}
      />

      {files.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap", // ✅ ทำให้หลายไฟล์ขึ้นบรรทัดใหม่อัตโนมัติ
            gap: "6px",
          }}
        >
          {files.map((item, idx) => {
            const name = item.file
              ? item.file.name
              : item.url?.split("/").pop() || "File";
            const href = item.url || (item.file ? URL.createObjectURL(item.file) : "#");

            return (
              <div
                key={idx}
                style={{
                  display: "inline-flex", // ✅ ขยายตามความยาวชื่อ
                  alignItems: "center",
                  background: "#c1f2e6ff",
                  padding: "3px 8px",
                  borderRadius: 20,
                  fontSize: 15,
                  whiteSpace: "nowrap", // ✅ ไม่ตัดบรรทัดในชื่อ
                  maxWidth: "100%",
                }}
              >
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#0077cc",
                    textDecoration: "none",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "200px",
                  }}
                  title={name} // tooltip แสดงชื่อเต็ม
                >
                  {name}
                </a>
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontWeight: "bold",
                    color: "red",
                    marginLeft: 4,
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}




