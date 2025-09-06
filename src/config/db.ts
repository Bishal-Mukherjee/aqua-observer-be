import { Pool } from "pg";
import { config } from "@/config/config";

export const pool = new Pool({
  user: config.db.user,
  database: config.db.name,
  host: config.db.host,
  port: config.db.port,
  password: config.db.password,
  ssl: {
    rejectUnauthorized: true,
    ca: config.ssl.key,
  },
});
