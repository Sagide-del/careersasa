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
  console.log(`CareerSasa backend running on http://localhost:${PORT}`);
});
