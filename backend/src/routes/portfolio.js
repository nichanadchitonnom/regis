// src/routes/portfolio.js
import express from "express";
import { auth, allowRoles } from "../middleware/auth.js";
import Portfolio from "../models/Portfolio.js";
import { upload } from "../middleware/upload.js";
import multer from "multer";

const router = express.Router();

/**
 * POST /api/portfolio
 * สร้าง portfolio ใหม่
 * ต้อง login ก่อน
 */

// router.post("/", auth, upload.array("portfolioFiles", 11), async (req, res) => {
//   try {
//     const { title, university, year, category, desc, visibility, submit } =
//       req.body;

//     // ⛔ ถ้าดังนี้ขาดอย่างใดอย่างหนึ่ง → error
//     if (!title || !university || !year || !category) {
//       return res.status(400).json({
//         message: "title, university, year, category are required",
//       });
//     }
//     // ✅ ต้องมีอย่างน้อย 1 ไฟล์
//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({
//         message: "At least 1 file is required (PDF, JPG, PNG ≤ 10MB)",
//       });
//     }
//     // ✅ ตรวจปี
//     const yearNum = Number(year);
//     if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2025) {
//       return res
//         .status(400)
//         .json({ message: "Year must be between 2020-2025" });
//     }

//     // ✅ ตรวจ category
//     const allowedCategories = [
//       "AI",
//       "ML",
//       "BI",
//       "QA",
//       "UX/UI",
//       "Database",
//       "Software Engineering",
//       "IOT",
//       "Gaming",
//       "Web Development",
//       "Coding",
//       "Data Science",
//       "Hackathon",
//       "Bigdata",
//       "Data Analytics",
//     ];
//     if (!allowedCategories.includes(category)) {
//       return res.status(400).json({ message: "Invalid category" });
//     }

//     // ✅ เก็บ path ไฟล์ทั้งหมดลง array
//     const filePaths = req.files.map((f) => f.path);

//     const status = submit === "true" ? "pending" : "draft";

//     const portfolio = await Portfolio.create({
//       owner: req.user.id,
//       title,
//       university,
//       year,
//       category,
//       desc,
//       files: filePaths, // ✅ บันทึก array ไฟล์
//       visibility: visibility || "private",
//       status,
//     });

//     return res.status(201).json({
//       message: "Portfolio created",
//       data: portfolio,
//     });
//   } catch (err) {
//     console.error("Create portfolio error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// });
router.post(
  "/",
  auth,
  upload.fields([
    { name: "cover_img", maxCount: 1 },
    { name: "portfolioFiles", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const { title, university, year, category, desc, visibility, submit } =
        req.body;
      const isDraft = submit !== "true"; // ✅ ถ้าไม่ใช่ submit จริง → ถือว่า draft
      // 🔹 เพิ่มใหม่ → ตรวจเฉพาะตอนจะส่งเป็น pending เท่านั้น
      // ถ้าเป็นการ "submit" จริง → ต้องกรอกครบทุกช่องและแนบไฟล์
      if (!isDraft) {
        if (!title || !university || !year || !category) {
          return res.status(400).json({
            message:
              "title, university, year, and category are required for submission",
          });
        }

        if (!req.files?.cover_img || req.files.cover_img.length === 0) {
          return res.status(400).json({
            message: "cover_img is required when submitting",
          });
        }

        if (
          !req.files?.portfolioFiles ||
          req.files.portfolioFiles.length === 0
        ) {
          return res.status(400).json({
            message:
              "At least 1 portfolio file is required (PDF/JPG/PNG ≤ 10MB)",
          });
        }

        // 🔸 ของเดิม (validate year/category) แต่ถูกย้ายเข้ามาใน if
        const yearNum = Number(year);
        if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2025) {
          return res
            .status(400)
            .json({ message: "Year must be between 2020-2025" });
        }

        // ✅ หมวดหมู่
        const allowedCategories = [
          "AI",
          "ML",
          "BI",
          "QA",
          "UX/UI",
          "Database",
          "Software Engineering",
          "IOT",
          "Gaming",
          "Web Development",
          "Coding",
          "Data Science",
          "Hackathon",
          "Bigdata",
          "Data Analytics",
        ];

        if (!allowedCategories.includes(category)) {
          return res.status(400).json({ message: "Invalid category" });
        }
      }

      if (!title || title.trim() === "") {
        return res.status(400).json({
          message: "title cannot be empty",
        });
      }
      let useYear = Number(year);
      if (year === undefined || year.trim() === "") {
        useYear = new Date().getFullYear();
      }

      // 🔸 ของเดิม (กำหนด URL ถ้ามีไฟล์)
      const coverImgUrl = req.files?.cover_img
        ? `${req.protocol}://${req.get("host")}/${req.files.cover_img[0].path}`
        : undefined;

      const otherUrls = req.files?.portfolioFiles
        ? req.files.portfolioFiles.map(
            (f) => `${req.protocol}://${req.get("host")}/${f.path}`
          )
        : [];

      // 🔹 เพิ่มใหม่ → ใช้ตัวแปร isDraft แทน submitValue
      const status = isDraft ? "draft" : "pending";

      // 🔸 ของเดิม (บันทึก DB เหมือนเดิม)
      const portfolio = await Portfolio.create({
        owner: req.user.id,
        title,
        university,
        year: useYear,
        category,
        desc,
        cover_img: coverImgUrl,
        files: otherUrls,
        visibility: visibility || "private",
        status,
      });

      // 🔹 เพิ่มใหม่ → ปรับข้อความตอบกลับตามสถานะ
      return res.status(201).json({
        message: isDraft ? "✅ Draft saved" : "✅ Portfolio submitted",
        data: portfolio,
      });
    } catch (err) {
      // 🔸 ของเดิม
      console.error("Create portfolio error:", err);

      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message });
      }
      return res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * GET /api/portfolio/mine
 * ดู portfolio ของตัวเอง
 */
router.get("/mine", auth, async (req, res) => {
  try {
    const list = await Portfolio.find({ owner: req.user.id }).sort({
      createdAt: -1,
    });
    return res.json(list);
  } catch (err) {
    console.error("Get my portfolio error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get portfolio detail + comments
router.get("/detail/:id", auth, async (req, res) => {
  try {
    const p = await Portfolio.findById(req.params.id)
      .populate("owner", "displayName email role")
      .populate("comments.user", "displayName email role"); // ✅ ดึงชื่อผู้เมนต์

    if (!p) return res.status(404).json({ message: "Portfolio not found" });

    return res.status(200).json(p);
  } catch (err) {
    console.error("Get detail error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/portfolio/public
 * ดูเฉพาะ public
 */
router.get("/public", async (req, res) => {
  try {
    const list = await Portfolio.find({
      visibility: "public",
      status: "approved",
    })
      .populate("owner", "displayName email role")
      .sort({ createdAt: -1 });

    console.log(list);
    return res.json(list);
  } catch (err) {
    console.error("Get public portfolio error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * PUT /api/portfolio/:id/visibility
 * เจ้าของเปลี่ยน public/private ได้
 */
router.put("/:id/visibility", auth, async (req, res) => {
  try {
    const { visibility } = req.body;

    if (!["public", "private"].includes(visibility)) {
      return res.status(400).json({ message: "Invalid visibility value" });
    }

    const portfolio = await Portfolio.findById(req.params.id);
    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    // อนุญาตเฉพาะเจ้าของ
    if (portfolio.owner.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You cannot change this portfolio" });
    }

    if (portfolio.status !== "approved") {
      return res.status(400).json({
        message: "Portfolio must be approved before changing visibility",
      });
    }

    portfolio.visibility = visibility;
    await portfolio.save();

    return res.json({ message: "Visibility updated", data: portfolio });
  } catch (err) {
    console.error("Update visibility error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/portfolio/pending
 * เฉพาะ AdvisorAdmin + SuperAdmin ดูพอร์ตที่รออนุมัติ
 */
router.get("/pending", auth, allowRoles("AdvisorAdmin"), async (req, res) => {
  try {
    const list = await Portfolio.find({ status: "pending" })
      .populate("owner", "displayName email university")
      .sort({ createdAt: -1 });

    return res.json(list);
  } catch (err) {
    console.error("Get pending portfolio error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/inProcess", auth, allowRoles("SuperAdmin"), async (req, res) => {
  try {
    const list = await Portfolio.find({ status: "in_process" })
      .populate("owner", "displayName email university")
      .sort({ createdAt: -1 });

    return res.json(list);
  } catch (err) {
    console.error("Get pending portfolio error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * PUT /api/portfolio/:id/approve
 * อนุมัติพอร์ต
 */
router.put(
  "/admin/:id/approve/:isApprove",
  auth,
  allowRoles("AdvisorAdmin"),
  async (req, res) => {
    try {
      const { id, isApprove } = req.params;
      const approve = isApprove === "true";

      const p = await Portfolio.findById(id);
      if (!p) return res.status(404).json({ message: "Portfolio not found" });

      if (p.status !== "pending") {
        return res.status(400).json({
          message: "Only pending portfolios can be approved",
        });
      }

      // ✅ ถ้า approve = true แต่ส่ง feedback → error
      if (approve && req.body?.feedback) {
        return res.status(400).json({
          message: "Feedback is only allowed when rejecting portfolio",
        });
      }

      // ✅ ถ้า reject แต่ไม่ส่ง feedback → error
      if (!approve && !req.body?.feedback) {
        return res.status(400).json({
          message: "Feedback is required when rejecting portfolio",
        });
      }

      // ✅ Apply result
      if (approve) {
        p.status = "in_process"; // ส่งต่อไป super admin
      } else {
        p.status = "rejected";
        p.feedback = req.body.feedback;
      }

      p.reviewedBy = req.user.id;
      p.reviewedAt = new Date();
      await p.save();

      return res.json({
        message:
          isApprove === "true"
            ? "✅ Sent to SuperAdmin for approval"
            : "❌ Portfolio rejected",
        data: p,
      });
    } catch (err) {
      console.error("Approve portfolio error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

router.put(
  "/super/:id/approve/:isApprove",
  auth,
  allowRoles("SuperAdmin"),
  async (req, res) => {
    try {
      const { id, isApprove } = req.params;
      const approve = isApprove === "true";

      const p = await Portfolio.findById(id);
      if (!p) return res.status(404).json({ message: "Portfolio not found" });

      if (p.status !== "in_process") {
        return res.status(400).json({
          message: "Only in process portfolios can be approved",
        });
      }

      if (approve && req.body?.feedback) {
        return res.status(400).json({
          message: "Feedback is only allowed when rejecting portfolio",
        });
      }

      if (!approve && !req.body?.feedback) {
        return res.status(400).json({
          message: "Feedback is required when rejecting portfolio",
        });
      }

      if (approve) {
        p.status = "approved";
      } else {
        p.status = "rejected";
        p.feedback = req.body.feedback;
      }

      p.reviewedBy = req.user.id;
      p.reviewedAt = new Date();
      await p.save();

      return res.json({
        message:
          isApprove === "true"
            ? "✅ Portfolio approved"
            : "❌ Portfolio rejected",
        data: p,
      });
    } catch (err) {
      console.error("Approve portfolio error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// ✅ EDIT portfolio (แก้ draft / rejected)
// ถ้าแก้เสร็จแล้ว → กลับไป pending อีกครั้ง
router.put(
  "/:id/edit",
  auth,
  upload.fields([
    { name: "cover_img", maxCount: 1 },
    { name: "portfolioFiles", maxCount: 10 },
  ]),

  async (req, res) => {
    try {
      const p = await Portfolio.findById(req.params.id);
      const isDraft = req.body.saveDraft === "true"; // ✅ keep only this one

      if (!p) return res.status(404).json({ message: "Portfolio not found" });

      // ✅ อนุญาตแก้เฉพาะเจ้าของ
      if (p.owner.toString() !== req.user.id) {
        return res
          .status(403)
          .json({ message: "You cannot edit this portfolio" });
      }

      // ✅ แก้ได้เฉพาะ draft หรือ rejected
      if (!["draft", "rejected"].includes(p.status)) {
        return res
          .status(400)
          .json({ message: "Only draft or rejected portfolios can be edited" });
      }

      // ✅ อัปเดต text fields ถ้าส่งมา
      const { title, university, year, category, desc } = req.body;
      if (title) p.title = title;
      if (university) p.university = university;
      // ✅ validate year
      if (year) {
        const yearNum = Number(year);
        if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2025) {
          return res
            .status(400)
            .json({ message: "Year must be between 2020-2025" });
        }
        p.year = year ? yearNum : new Date().getFullYear();
      }
      // ✅ validate category
      if (category) {
        const allowedCategories = [
          "AI",
          "ML",
          "BI",
          "QA",
          "UX/UI",
          "Database",
          "Software Engineering",
          "IOT",
          "Gaming",
          "Web Development",
          "Coding",
          "Data Science",
          "Hackathon",
          "Bigdata",
          "Data Analytics",
        ];
        if (!allowedCategories.includes(category)) {
          return res.status(400).json({ message: "Invalid category" });
        }
        p.category = category;
      }

      if (desc) p.desc = desc;

      // ✅ ถ้ามี cover_img ใหม่ → ลบของเก่าทิ้ง แล้วใช้ของใหม่แทน
      if (req.files?.cover_img && req.files.cover_img.length > 0) {
        const fs = await import("fs");
        if (p.cover_img) {
          const oldCoverPath = p.cover_img.replace(
            `${req.protocol}://${req.get("host")}/`,
            ""
          );
          if (fs.existsSync(oldCoverPath)) {
            try {
              fs.unlinkSync(oldCoverPath);
            } catch (e) {
              console.warn("⚠️ Failed to delete old cover image:", oldCoverPath);
            }
          }
        }
        p.cover_img = `${req.protocol}://${req.get("host")}/${
          req.files.cover_img[0].path
        }`;
      }

      // ✅ ถ้ามี portfolioFiles ใหม่ → ลบไฟล์เก่าทั้งหมด แล้วใช้ไฟล์ใหม่แทน
      if (req.files?.portfolioFiles && req.files.portfolioFiles.length > 0) {
        const newFiles = req.files.portfolioFiles.map(
          (f) => `${req.protocol}://${req.get("host")}/${f.path}`
        );
        const fs = await import("fs");
        if (p.files && p.files.length > 0) {
          for (const oldPath of p.files) {
            const localPath = oldPath.replace(
              `${req.protocol}://${req.get("host")}/`,
              ""
            );
            if (fs.existsSync(localPath)) {
              try {
                fs.unlinkSync(localPath);
              } catch (e) {
                console.warn("⚠️ Failed to delete old file:", localPath);
              }
            }
          }
        }
        p.files = newFiles;
      }

      // 🔹 เฉพาะตอน Draft เท่านั้นถึงจะ “ล้างไฟล์หมดได้”
      if (isDraft) {
        // 🔸 ลบทุก portfolio file ถ้า user เอาออกหมด
        if (
          (!req.files?.portfolioFiles ||
            req.files.portfolioFiles.length === 0) &&
          (!req.body.files || req.body.files.length === 0)
        ) {
          p.files = [];
        }

        // 🔸 ลบ cover_img ถ้า user สั่ง removeCover
        if (
          (!req.files?.cover_img || req.files.cover_img.length === 0) &&
           typeof p.cover_img !== "undefined"
        ) {
          const fs = await import("fs");
          if (p.cover_img) {
            const oldCoverPath = p.cover_img.replace(
              `${req.protocol}://${req.get("host")}/`,
              ""
            );
            if (fs.existsSync(oldCoverPath)) {
              try {
                fs.unlinkSync(oldCoverPath);
              } catch (e) {
                console.warn("⚠️ Failed to delete old cover image:", oldCoverPath);
              }
            }
          }
          p.cover_img = undefined;
        }
      }


      // 🔹 เพิ่มใหม่ → ตรวจเฉพาะตอนจะส่งกลับเป็น pending เท่านั้น
      if (!isDraft) {
        if (!p.title || !p.university || !p.year || !p.category) {
          return res.status(400).json({
            message:
              "title, university, year, and category are required for submission",
          });
        }
        if (!p.cover_img) {
          return res.status(400).json({
            message: "cover_img is required when submitting",
          });
        }

        if (!p.files || p.files.length === 0) {
          return res.status(400).json({
            message:
              "At least 1 portfolio file is required (PDF/JPG/PNG ≤ 10MB)",
          });
        }
      }
      if (!title || title.trim() === "") {
        return res.status(400).json({
          message: "title cannot be empty",
        });
      }
      p.status = isDraft ? "draft" : "pending";


      // 🔸 ของเดิม
      p.feedback = undefined;

      await p.save();

      // 🔹 เพิ่มใหม่ → แสดงข้อความตอบกลับตามสถานะ
      return res.json({
        message: isDraft
          ? "✅ Draft updated"
          : "✅ Portfolio updated & resubmitted",
        portfolio: p,
      });
    } catch (err) {
      console.error("Edit portfolio error:", err);

      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message });
      }

      return res.status(500).json({ message: "Server error" });
    }
  }
);

// GET /api/portfolio/:id
// Admin หรือ AdvisorAdmin เอาไว้เปิดพอร์ตชิ้นเดียวเต็มๆ
router.get(
  "/admin-view/:id",
  auth,
  allowRoles("AdvisorAdmin", "SuperAdmin"),
  async (req, res) => {
    try {
      const p = await Portfolio.findById(req.params.id).populate(
        "owner",
        "displayName email university role"
      );

      if (!p) return res.status(404).json({ message: "Portfolio not found" });

      return res.json(p);
    } catch (err) {
      console.error("Get one portfolio error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// ✅ COMMENT on portfolio
router.post("/:id/comment", auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text)
      return res.status(400).json({ message: "Comment text required" });

    const p = await Portfolio.findById(req.params.id);
    if (!p) return res.status(404).json({ message: "Portfolio not found" });

    // ✅ push comment
    p.comments.push({
      user: req.user.id,
      role: req.user.role, // ✅ เก็บชื่อ role ของผู้คอมเมนต์
      text,
    });

    await p.save();

    return res.json({ message: "✅ Comment added", comments: p.comments });
  } catch (err) {
    console.error("Add comment error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
