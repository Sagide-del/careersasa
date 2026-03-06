import { Router } from "express";
import { z } from "zod";
import { requireAuth, AuthedRequest } from "../utils/auth";
import { db } from "../db/client";
import { id } from "../utils/id";
import { nowIso } from "../utils/time";
import { runAiCareerPrediction } from "../services/ai";
import { generatePdfReport } from "../services/pdf";

export const assessmentRouter = Router();

assessmentRouter.post("/submit", requireAuth, async (req: AuthedRequest, res) => {
  const paid = db.prepare("SELECT id FROM payments WHERE user_id = ? AND status = 'PAID' ORDER BY created_at DESC LIMIT 1").get(req.user!.id);
  if (!paid) return res.status(402).json({ message: "Payment required" });

  const schema = z.object({ student_profile: z.any() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid input" });

  const userId = req.user!.id;

  const assessmentId = id("asm");
  db.prepare("INSERT INTO assessments (id, user_id, student_profile_json, created_at) VALUES (?, ?, ?, ?)")
    .run(assessmentId, userId, JSON.stringify(parsed.data.student_profile), nowIso());

  const ai = await runAiCareerPrediction(parsed.data.student_profile);

  const resultId = id("res");
  const created = nowIso();
  db.prepare("INSERT INTO results (id, user_id, assessment_id, result_json, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(resultId, userId, assessmentId, JSON.stringify(ai), created);

  const uploadsDir = process.env.UPLOADS_DIR || "./uploads";
  const pdfFilename = `careersasa-report-${resultId}.pdf`;
  const pdfPath = await generatePdfReport({
    outDir: uploadsDir,
    filename: pdfFilename,
    studentProfile: parsed.data.student_profile,
    aiResult: ai,
  });

  db.prepare("UPDATE results SET pdf_path = ? WHERE id = ?").run(pdfPath, resultId);

  return res.json({ ok: true, resultId });
});
