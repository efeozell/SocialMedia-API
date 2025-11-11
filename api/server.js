import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { ENV } from "./config/env.js";
import { connectRedis } from "./lib/redis.js";
import Database from "../api/db/db.js";
import mountRoutes from "./routes/index.js";
import swaggerUI from "swagger-ui-express";
import { swaggerSpecs } from "./config/swaggerConfig.js";

const db = new Database();
const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerSpecs));

mountRoutes(app);

async function startServer() {
  try {
    console.log("Baglantilar kuruluyor...");

    await db.connectDB(ENV.MONGO_URI);

    await connectRedis();

    app.listen(ENV.PORT, (req, res) => {
      console.log(`Server starting in ${ENV.PORT}`);
    });
  } catch (error) {
    console.log("Error in starting Server ");
    process.exit(1);
  }
}

startServer();
