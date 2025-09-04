import { Request, Response } from "express";
import dayjs from "dayjs";
import { pool } from "@/config/db";

export const getSubmissions = async (
  req: Request<any, any, any, { page?: string }>,
  res: Response,
) => {
  try {
    const { id: userId } = req.user;
    const page = parseInt(req.query.page || "1", 10) || 1;
    const limit = 5;
    const offset = (page - 1) * limit;

    const [
      { rows: reportingsCount },
      { rows: sightingsCount },
      { rows: reportings },
      { rows: sightings },
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM reportings WHERE submitted_by = $1", [
        userId,
      ]),
      pool.query("SELECT COUNT(*) FROM sightings WHERE submitted_by = $1", [
        userId,
      ]),
      pool.query(
        `SELECT 
          id, 
          observed_at AS "observedAt", 
          district, 
          block, 
          village_or_ghat AS "villageOrGhat", 
          submission_context AS "type", 
          submitted_at AS "submittedAt"
        FROM reportings 
        WHERE submitted_by = $1
        LIMIT $2 OFFSET $3`,
        [userId, limit, offset],
      ),
      pool.query(
        `SELECT 
          id, 
          observed_at AS "observedAt", 
          district, 
          block, 
          village_or_ghat AS "villageOrGhat", 
          submission_context AS "type", 
          submitted_at AS "submittedAt"
        FROM sightings 
        WHERE submitted_by = $1
        LIMIT $2 OFFSET $3`,
        [userId, limit, offset],
      ),
    ]);

    const totalReportings = parseInt(reportingsCount[0].count, 10);
    const totalSightings = parseInt(sightingsCount[0].count, 10);
    const totalItems = totalReportings + totalSightings;
    const totalPages = Math.ceil(totalItems / limit);

    const submissions = [...reportings, ...sightings].sort(
      (a, b) => dayjs(b.submittedAt).valueOf() - dayjs(a.submittedAt).valueOf(),
    );

    res.status(200).json({
      message: "Submissions fetched successfully",
      result: submissions,
      pagination: {
        page,
        totalPages,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};
