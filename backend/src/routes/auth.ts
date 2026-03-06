import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "../db/client";
import { id } from "../utils/id";
import { nowIso } from "../utils/time";
import { signToken } from "../utils/auth";

export const authRouter = Router();

authRouter.post("/register", (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid input", issues: parsed.error.issues });

  const { name, email, password } = parsed.data;
  const exists = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (exists) return res.status(409).json({ message: "Email already registered" });

  const userId = id("usr");
  const hash = bcrypt.hashSync(password, 10);
  db.prepare("INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)").run(
    userId, name, email, hash, nowIso()
  );

  return res.json({ ok: true });
});

authRouter.post("/login", (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid input" });

  const { email, password } = parsed.data;
  const user = db.prepare("SELECT id, email, password_hash FROM users WHERE email = ?").get(email) as any;
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = signToken({ id: user.id, email: user.email });
  return res.json({ token });
});
