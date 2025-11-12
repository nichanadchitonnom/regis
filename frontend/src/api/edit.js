// src/api/edit.js
const BASE = "http://localhost:3000"; // ใช้ CRA proxy (setupProxy ชี้ไป :3000 อยู่แล้ว)

export async function editPortfolio(id, formData, token) {
  if (!token) throw new Error("No token found");

  const res = await fetch(`${BASE}/api/portfolio/${id}/edit`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`, // ต้องแนบ token
    },
    body: formData, // อย่าใส่ Content-Type เอง
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Upload failed");

  return data;
}

