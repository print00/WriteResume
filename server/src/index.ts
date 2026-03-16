import "dotenv/config";
import express from "express";
import cors from "cors";
import aiRoutes from "./routes/ai.js";
import generateRoutes from "./routes/generate.js";
import { errorHandler } from "./lib/errors.js";

const app = express();
const port = Number(process.env.PORT || 3001);
const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS"));
    },
  }),
);
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/ai", aiRoutes);
app.use("/api/generate", generateRoutes);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Resume builder server listening on port ${port}`);
});
