import { Router } from "express";
import { z } from "zod";
import { requireAuth, AuthedRequest } from "../utils/auth";
import { db } from "../db/client";
import { id } from "../utils/id";
import { nowIso } from "../utils/time";
import { stkPush } from "../services/mpesa";

export const paymentsRouter = Router();

paymentsRouter.post("/mpesa/stkpush", requireAuth, async (req: AuthedRequest, res) => {
  const schema = z.object({
    phone: z.string().min(10),
    amount: z.number().int().positive(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid input" });

  const userId = req.user!.id;
  const amount = parsed.data.amount;

  const payAmount = Number(process.env.PAY_AMOUNT_KES || 100);
  if (amount !== payAmount) return res.status(400).json({ message: `Amount must be ${payAmount}` });

  const paymentId = id("pay");
  const created = nowIso();

  db.prepare(`
    INSERT INTO payments (id, user_id, amount, status, method, phone, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(paymentId, userId, amount, "PENDING", "STK_PUSH", parsed.data.phone, created, created);

  const accountRef = "CareerSasa";
  const desc = "CareerSasa Assessment Payment";

  try {
    const mpesaRes = await stkPush({ phone: parsed.data.phone, amount, accountRef, desc });
    const checkoutRequestId = mpesaRes?.CheckoutRequestID || null;

    db.prepare("UPDATE payments SET mpesa_checkout_request_id = ?, updated_at = ? WHERE id = ?")
      .run(checkoutRequestId, nowIso(), paymentId);

    return res.json({ ok: true, paymentId, checkoutRequestId });
  } catch (e: any) {
    db.prepare("UPDATE payments SET status = ?, updated_at = ? WHERE id = ?")
      .run("FAILED", nowIso(), paymentId);
    return res.status(500).json({ message: e?.message || "STK Push failed" });
  }
});

paymentsRouter.post("/mpesa/callback", (req, res) => {
  const body = req.body;
  try {
    const stkCallback = body?.Body?.stkCallback;
    const checkoutId = stkCallback?.CheckoutRequestID;
    const resultCode = stkCallback?.ResultCode;
    const metadata = stkCallback?.CallbackMetadata?.Item || [];

    const receipt = metadata.find((x: any) => x.Name === "MpesaReceiptNumber")?.Value;
    const phone = metadata.find((x: any) => x.Name === "PhoneNumber")?.Value;

    if (checkoutId) {
      const status = resultCode === 0 ? "PAID" : "FAILED";
      db.prepare(`
        UPDATE payments
        SET status = ?, mpesa_receipt = ?, raw_callback = ?, updated_at = ?, phone = COALESCE(phone, ?)
        WHERE mpesa_checkout_request_id = ?
      `).run(status, receipt || null, JSON.stringify(body), nowIso(), phone ? String(phone) : null, checkoutId);
    }
  } catch {
  }
  return res.json({ ok: true });
});

paymentsRouter.get("/me", requireAuth, (req: AuthedRequest, res) => {
  const userId = req.user!.id;
  const paid = db.prepare("SELECT id FROM payments WHERE user_id = ? AND status = 'PAID' ORDER BY created_at DESC LIMIT 1").get(userId);
  return res.json({ paid: Boolean(paid) });
});
