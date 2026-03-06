import { Router } from "express";
import path from "path";
import { requireAuth, AuthedRequest } from "../utils/auth";
import { db } from "../db/client";

export const resultsRouter = Router();

resultsRouter.get("/:rid", requireAuth, (req: AuthedRequest, res) => {
  const userId = req.user!.id;
  const rid = req.params.rid;

  const row = db.prepare("SELECT id, result_json, pdf_path FROM results WHERE id = ? AND user_id = ?").get(rid, userId) as any;
  if (!row) return res.status(404).json({ message: "Not found" });

  const base = process.env.PUBLIC_BASE_URL || "http://localhost:4000";
  let pdf_url: string | null = null;

  if (row.pdf_path) {
    const filename = path.basename(row.pdf_path);
    pdf_url = `${base}/uploads/${filename}`;
  }

  const result = JSON.parse(row.result_json);
  return res.json({ ...result, pdf_url });
});
