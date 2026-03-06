$ErrorActionPreference = "Stop"

function WriteFile([string]$path, [string]$content) {
  $dir = Split-Path $path -Parent
  if ($dir -and !(Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  $content | Out-File -Encoding utf8 $path
}

Write-Host "Creating backend structure..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force backend\src, backend\src\db, backend\src\routes, backend\src\services, backend\src\utils, backend\data, backend\uploads | Out-Null

WriteFile "backend\package.json" @"
{
  "name": "careersasa-backend",
  "version": "1.0.0",
  "private": true,
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "db:init": "node dist/db/init.js"
  },
  "dependencies": {
    "axios": "^1.6.8",
    "bcryptjs": "^2.4.3",
    "better-sqlite3": "^9.6.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "pdfkit": "^0.15.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/morgan": "^1.9.9",
    "@types/node": "^20.12.12",
    "@types/pdfkit": "^0.13.6",
    "tsx": "^4.15.6",
    "typescript": "^5.4.5"
  }
}
"@

WriteFile "backend\tsconfig.json" @"
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
"@

WriteFile "backend\.env.example" @"
# Server
PORT=4000
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:3000
JWT_SECRET=change_me_super_secret

# SQLite DB
SQLITE_PATH=./data/careersasa.db

# M-Pesa Daraja
MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=174379
MPESA_PASSKEY=
MPESA_CALLBACK_URL=https://YOUR_PUBLIC_DOMAIN/payments/mpesa/callback

# Business rule
PAY_AMOUNT_KES=100

# AI
AI_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini

# Files
UPLOADS_DIR=./uploads
PUBLIC_BASE_URL=http://localhost:4000
"@

WriteFile "backend\src\index.ts" @"
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import dotenv from "dotenv";

import { initDb } from "./db/init";
import { authRouter } from "./routes/auth";
import { paymentsRouter } from "./routes/payments";
import { assessmentRouter } from "./routes/assessment";
import { resultsRouter } from "./routes/results";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4000);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

initDb();

app.use(helmet());
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

const uploadsDir = process.env.UPLOADS_DIR || "./uploads";
app.use("/uploads", express.static(path.resolve(uploadsDir)));

app.get("/health", (_req, res) => res.json({ ok: true, service: "careersasa-backend" }));

app.use("/auth", authRouter);
app.use("/payments", paymentsRouter);
app.use("/assessment", assessmentRouter);
app.use("/results", resultsRouter);

app.listen(PORT, () => {
  console.log(\`CareerSasa backend running on http://localhost:\${PORT}\`);
});
"@

# ---------------- DB ----------------
WriteFile "backend\src\db\client.ts" @"
import Database from "better-sqlite3";

const SQLITE_PATH = process.env.SQLITE_PATH || "./data/careersasa.db";
export const db = new Database(SQLITE_PATH);

db.pragma("journal_mode = WAL");
"@

WriteFile "backend\src\db\init.ts" @"
import { db } from "./client";

export function initDb() {
  db.exec(\`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      status TEXT NOT NULL,
      method TEXT NOT NULL,
      mpesa_checkout_request_id TEXT,
      mpesa_receipt TEXT,
      phone TEXT,
      raw_callback TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      student_profile_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS results (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      assessment_id TEXT NOT NULL,
      result_json TEXT NOT NULL,
      pdf_path TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(assessment_id) REFERENCES assessments(id)
    );
  \`);
}
"@

# --------------- Utils ---------------
WriteFile "backend\src\utils\id.ts" @"
import crypto from "crypto";

export function id(prefix: string) {
  return prefix + "_" + crypto.randomBytes(12).toString("hex");
}
"@

WriteFile "backend\src\utils\time.ts" @"
export function nowIso() {
  return new Date().toISOString();
}
"@

WriteFile "backend\src\utils\auth.ts" @"
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export type AuthedRequest = Request & { user?: { id: string; email: string } };

export function signToken(payload: { id: string; email: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}
"@

# --------------- KUCCPS data ---------------
WriteFile "backend\src\services\kuccps.ts" @"
import fs from "fs";
import path from "path";

export type KuccpsProgramme = {
  programme: string;
  cluster: string;
  notes: string;
  sample_cutoff?: string;
};

const FILE = path.resolve(__dirname, "../../data/kuccps_programmes.json");

export function loadKuccpsProgrammes(): KuccpsProgramme[] {
  try {
    const raw = fs.readFileSync(FILE, "utf8");
    return JSON.parse(raw) as KuccpsProgramme[];
  } catch {
    return [];
  }
}

export function findProgrammeNotes(programmeName: string): string {
  const all = loadKuccpsProgrammes();
  const hit = all.find(p => p.programme.toLowerCase() === programmeName.toLowerCase());
  return hit ? (hit.notes + (hit.sample_cutoff ? ` (Sample cutoff: ${hit.sample_cutoff})` : "")) : "KUCCPS info: not found in local dataset.";
}
"@

WriteFile "backend\data\kuccps_programmes.json" @"
[
  {
    "programme": "Bachelor of Medicine and Bachelor of Surgery (MBChB)",
    "cluster": "Health Sciences",
    "notes": "Competitive programme. Strong sciences required. Confirm cluster requirements & latest cutoffs on KUCCPS.",
    "sample_cutoff": "Varies by year"
  },
  {
    "programme": "Bachelor of Computer Science",
    "cluster": "Computing / ICT",
    "notes": "Strong Mathematics recommended. Consider universities and programme codes on KUCCPS."
  },
  {
    "programme": "Bachelor of Commerce",
    "cluster": "Business",
    "notes": "Business pathway; check subject requirements per university on KUCCPS."
  }
]
"@

# --------------- AI service ---------------
WriteFile "backend\src\services\ai.ts" @"
import axios from "axios";
import { findProgrammeNotes } from "./kuccps";

type CareerPathway = {
  rank: number;
  pathway_name: string;
  why_fit: string[];
  suggested_programmes: Array<{ programme: string; kuccps_notes: string }>;
  next_steps: string[];
};

export type AiResult = {
  student_summary: { strengths: string[]; growth_areas: string[] };
  top_3_career_pathways: CareerPathway[];
};

function safeJsonParse(text: string): any | null {
  try { return JSON.parse(text); } catch { return null; }
}

export async function runAiCareerPrediction(studentProfile: any): Promise<AiResult> {
  const provider = (process.env.AI_PROVIDER || "openai").toLowerCase();

  // prompt asks for STRICT JSON so backend can render + PDF
  const system = \`
You are CareerSasa, a career guidance engine for Kenyan high school graduates.
Use the student's KCSE results, interests/hobbies, social media usage, birth order, family background notes, and Briggs-style personality snapshot.
Return exactly 3 career pathways. Output MUST be valid JSON only (no markdown).
Each pathway must include: pathway_name, why_fit (bullets), suggested_programmes (3 items), next_steps.
\`.trim();

  const user = \`
STUDENT_PROFILE_JSON:
\${JSON.stringify(studentProfile)}

Rules:
- Tailor to Kenya context and KUCCPS-style programmes
- Use internal/external factors: abilities (KCSE), interests, personality, family/socioeconomic context (incl. birth order)
- Avoid making up exact KUCCPS cutoffs; use "Confirm on KUCCPS" unless provided
Output schema:
{
 "student_summary": { "strengths": [...], "growth_areas": [...] },
 "top_3_career_pathways": [
   {
     "rank": 1,
     "pathway_name": "...",
     "why_fit": ["..."],
     "suggested_programmes": [
        { "programme": "....", "kuccps_notes": "..." }
     ],
     "next_steps": ["..."]
   }
 ]
}
\`.trim();

  if (provider === "openai") {
    const key = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
    if (!key) throw new Error("OPENAI_API_KEY missing");

    // Using OpenAI Responses-style compatible endpoint via HTTPS
    const resp = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ],
        temperature: 0.4
      },
      { headers: { Authorization: \`Bearer \${key}\` } }
    );

    const text = resp.data?.choices?.[0]?.message?.content || "";
    const parsed = safeJsonParse(text);

    if (!parsed) throw new Error("AI returned non-JSON output");

    // attach KUCCPS notes from local dataset (light enrichment)
    for (const p of parsed.top_3_career_pathways || []) {
      for (const s of p.suggested_programmes || []) {
        if (!s.kuccps_notes || s.kuccps_notes.trim().length < 5) {
          s.kuccps_notes = findProgrammeNotes(s.programme);
        }
      }
    }

    return parsed as AiResult;
  }

  throw new Error("Unsupported AI_PROVIDER");
}
"@

# --------------- PDF service ---------------
WriteFile "backend\src\services\pdf.ts" @"
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export function generatePdfReport(opts: {
  outDir: string;
  filename: string;
  studentProfile: any;
  aiResult: any;
}) {
  const outPath = path.resolve(opts.outDir, opts.filename);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const doc = new PDFDocument({ margin: 50 });
  const stream = fs.createWriteStream(outPath);
  doc.pipe(stream);

  doc.fontSize(20).text("CareerSasa – Career Guidance Report", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor("#444").text("Discover Your Best Career Path", { align: "center" });
  doc.moveDown(1);

  doc.fillColor("#000").fontSize(14).text("Student Profile");
  doc.moveDown(0.3);
  doc.fontSize(11).text(\`KCSE Mean Grade: \${opts.studentProfile?.kcse?.meanGrade || "N/A"}\`);
  doc.text(\`Birth Order: \${opts.studentProfile?.family?.birthOrder || "N/A"}\`);
  doc.text(\`Guardian Support (1–5): \${opts.studentProfile?.family?.guardianSupport || "N/A"}\`);
  doc.text(\`Personality Snapshot: \${opts.studentProfile?.briggs?.type || "N/A"}\`);
  doc.moveDown(0.7);

  const subjects = opts.studentProfile?.kcse?.subjects || [];
  if (subjects.length) {
    doc.fontSize(12).text("KCSE Subjects");
    doc.moveDown(0.2);
    doc.fontSize(10);
    for (const s of subjects) {
      if (s?.name) doc.text(\`• \${s.name}: \${s.grade || "—"}\`);
    }
    doc.moveDown(0.7);
  }

  const hobbies = opts.studentProfile?.interests?.hobbies || [];
  if (hobbies.length) {
    doc.fontSize(12).text("Hobbies / Interests");
    doc.moveDown(0.2);
    doc.fontSize(10).text(hobbies.map((h: string) => "• " + h).join("\\n"));
    doc.moveDown(0.7);
  }

  doc.fontSize(14).text("AI Summary");
  doc.moveDown(0.3);

  const summary = opts.aiResult?.student_summary;
  if (summary) {
    doc.fontSize(11).text("Strengths:");
    doc.fontSize(10).text((summary.strengths || []).map((x: string) => "• " + x).join("\\n") || "—");
    doc.moveDown(0.4);
    doc.fontSize(11).text("Growth Areas:");
    doc.fontSize(10).text((summary.growth_areas || []).map((x: string) => "• " + x).join("\\n") || "—");
    doc.moveDown(0.7);
  }

  const paths = opts.aiResult?.top_3_career_pathways || [];
  doc.fontSize(14).text("Top 3 Career Pathways");
  doc.moveDown(0.4);

  for (const p of paths) {
    doc.fontSize(13).text(\`\${p.rank}. \${p.pathway_name}\`);
    doc.moveDown(0.2);

    doc.fontSize(11).text("Why it fits:");
    doc.fontSize(10).text((p.why_fit || []).map((x: string) => "• " + x).join("\\n") || "—");
    doc.moveDown(0.3);

    doc.fontSize(11).text("Suggested Programmes (KUCCPS):");
    doc.fontSize(10);
    for (const s of (p.suggested_programmes || [])) {
      doc.text(\`• \${s.programme} — \${s.kuccps_notes}\`);
    }
    doc.moveDown(0.3);

    doc.fontSize(11).text("Next steps:");
    doc.fontSize(10).text((p.next_steps || []).map((x: string) => "• " + x).join("\\n") || "—");
    doc.moveDown(0.8);
  }

  doc.fontSize(9).fillColor("#666").text(
    "Disclaimer: This report provides guidance, not a final decision. Confirm KUCCPS requirements/cutoffs on the official portal.",
    { align: "left" }
  );

  doc.end();

  return new Promise<string>((resolve, reject) => {
    stream.on("finish", () => resolve(outPath));
    stream.on("error", reject);
  });
}
"@

# --------------- M-Pesa service ---------------
WriteFile "backend\src\services\mpesa.ts" @"
import axios from "axios";

function baseUrl() {
  const env = (process.env.MPESA_ENV || "sandbox").toLowerCase();
  return env === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
}

export async function getAccessToken(): Promise<string> {
  const key = process.env.MPESA_CONSUMER_KEY || "";
  const secret = process.env.MPESA_CONSUMER_SECRET || "";
  if (!key || !secret) throw new Error("MPESA_CONSUMER_KEY/SECRET missing");

  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const res = await axios.get(`${baseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  return res.data.access_token;
}

export function mpesaPassword(timestamp: string) {
  const shortcode = process.env.MPESA_SHORTCODE || "";
  const passkey = process.env.MPESA_PASSKEY || "";
  const raw = `${shortcode}${passkey}${timestamp}`;
  return Buffer.from(raw).toString("base64");
}

export async function stkPush(opts: { phone: string; amount: number; accountRef: string; desc: string }) {
  const token = await getAccessToken();
  const shortcode = process.env.MPESA_SHORTCODE || "";
  const callback = process.env.MPESA_CALLBACK_URL || "";
  if (!shortcode || !callback) throw new Error("MPESA_SHORTCODE or MPESA_CALLBACK_URL missing");

  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14); // YYYYMMDDhhmmss
  const password = mpesaPassword(timestamp);

  const body = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: opts.amount,
    PartyA: opts.phone,
    PartyB: shortcode,
    PhoneNumber: opts.phone,
    CallBackURL: callback,
    AccountReference: opts.accountRef,
    TransactionDesc: opts.desc,
  };

  const res = await axios.post(`${baseUrl()}/mpesa/stkpush/v1/processrequest`, body, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.data;
}
"@

# --------------- Routes: Auth ---------------
WriteFile "backend\src\routes\auth.ts" @"
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
"@

# --------------- Routes: Payments ---------------
WriteFile "backend\src\routes\payments.ts" @"
import { Router } from "express";
import { z } from "zod";
import { requireAuth, AuthedRequest } from "../utils/auth";
import { db } from "../db/client";
import { id } from "../utils/id";
import { nowIso } from "../utils/time";
import { stkPush } from "../services/mpesa";

export const paymentsRouter = Router();

// Start STK push
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
  if (amount !== payAmount) return res.status(400).json({ message: \`Amount must be \${payAmount}\` });

  const paymentId = id("pay");
  const created = nowIso();

  // create pending record
  db.prepare(\`
    INSERT INTO payments (id, user_id, amount, status, method, phone, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  \`).run(paymentId, userId, amount, "PENDING", "STK_PUSH", parsed.data.phone, created, created);

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

// Daraja callback (Safaricom will POST here)
paymentsRouter.post("/mpesa/callback", (req, res) => {
  const body = req.body;
  try {
    const stkCallback = body?.Body?.stkCallback;
    const checkoutId = stkCallback?.CheckoutRequestID;
    const resultCode = stkCallback?.ResultCode;
    const metadata = stkCallback?.CallbackMetadata?.Item || [];

    const receipt = metadata.find((x: any) => x.Name === "MpesaReceiptNumber")?.Value;
    const amount = metadata.find((x: any) => x.Name === "Amount")?.Value;
    const phone = metadata.find((x: any) => x.Name === "PhoneNumber")?.Value;

    if (checkoutId) {
      const status = resultCode === 0 ? "PAID" : "FAILED";
      db.prepare(\`
        UPDATE payments
        SET status = ?, mpesa_receipt = ?, raw_callback = ?, updated_at = ?, phone = COALESCE(phone, ?)
        WHERE mpesa_checkout_request_id = ?
      \`).run(status, receipt || null, JSON.stringify(body), nowIso(), phone ? String(phone) : null, checkoutId);
    }
  } catch {
    // swallow: always 200 to Daraja
  }
  return res.json({ ok: true });
});

// check if current user has paid
paymentsRouter.get("/me", requireAuth, (req: AuthedRequest, res) => {
  const userId = req.user!.id;
  const paid = db.prepare("SELECT id FROM payments WHERE user_id = ? AND status = 'PAID' ORDER BY created_at DESC LIMIT 1").get(userId);
  return res.json({ paid: Boolean(paid) });
});
"@

# --------------- Routes: Assessment ---------------
WriteFile "backend\src\routes\assessment.ts" @"
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
  // paywall
  const paid = db.prepare("SELECT id FROM payments WHERE user_id = ? AND status = 'PAID' ORDER BY created_at DESC LIMIT 1").get(req.user!.id);
  if (!paid) return res.status(402).json({ message: "Payment required" });

  const schema = z.object({ student_profile: z.any() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid input" });

  const userId = req.user!.id;

  const assessmentId = id("asm");
  db.prepare("INSERT INTO assessments (id, user_id, student_profile_json, created_at) VALUES (?, ?, ?, ?)")
    .run(assessmentId, userId, JSON.stringify(parsed.data.student_profile), nowIso());

  // AI prediction
  const ai = await runAiCareerPrediction(parsed.data.student_profile);

  // store result
  const resultId = id("res");
  const created = nowIso();
  db.prepare("INSERT INTO results (id, user_id, assessment_id, result_json, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(resultId, userId, assessmentId, JSON.stringify(ai), created);

  // PDF generation
  const uploadsDir = process.env.UPLOADS_DIR || "./uploads";
  const pdfFilename = \`careersasa-report-\${resultId}.pdf\`;
  const pdfPath = await generatePdfReport({
    outDir: uploadsDir,
    filename: pdfFilename,
    studentProfile: parsed.data.student_profile,
    aiResult: ai,
  });

  db.prepare("UPDATE results SET pdf_path = ? WHERE id = ?").run(pdfPath, resultId);

  return res.json({ ok: true, resultId });
});
"@

# --------------- Routes: Results ---------------
WriteFile "backend\src\routes\results.ts" @"
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
    pdf_url = \`\${base}/uploads/\${filename}\`;
  }

  const result = JSON.parse(row.result_json);
  return res.json({ ...result, pdf_url });
});
"@

WriteFile "backend\README.md" @"
# CareerSasa Backend

## Run
cd backend
npm install
copy .env.example .env
npm run dev

Backend runs on http://localhost:4000

## Endpoints used by frontend
- POST /auth/register
- POST /auth/login
- POST /payments/mpesa/stkpush
- POST /payments/mpesa/callback  (Daraja webhook)
- GET  /payments/me
- POST /assessment/submit
- GET  /results/:rid

## M-Pesa notes
- Use a public URL for MPESA_CALLBACK_URL (ngrok or deployed domain)
- Sandbox and Production base URLs handled via MPESA_ENV
"@

Write-Host "Backend setup complete." -ForegroundColor Green