export function validateFiles(files) {
  const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
  if (!files || files.length === 0) 
    return { ok: false, msg: "At least 1 portfolio file is required (PDF/JPG/PNG ≤ 10MB)" };
  if (files.length > 10) 
    return { ok: false, msg: "ไม่เกิน 10 ไฟล์" };

  for (const f of files) {
    if (f.file) {
      if (!allowedTypes.includes(f.file.type)) 
        return { ok: false, msg: "ชนิดไฟล์ไม่รองรับ" };
      if (f.file.size > 10 * 1024 * 1024) 
        return { ok: false, msg: "ไฟล์ใหญ่เกิน 10MB" };
    } else if (!f.url) {
      return { ok: false, msg: "At least 1 portfolio file is required (PDF/JPG/PNG ≤ 10MB)" };
    }
  }

  return { ok: true };
}
