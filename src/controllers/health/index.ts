import { Request, Response } from "express";
import { pool } from "@/config/db";

export const health = async (req: Request, res: Response) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({
      message: "Service is healthy",
      result: {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: "connected",
      },
    });
  } catch (error) {
    res.status(503).json({
      message: "Service is unhealthy",
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: "disconnected",
    });
  }
};
