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
    const limit = 10;
    const offset = (page - 1) * limit;

    const countQuery = `
      SELECT COUNT(*) as total FROM (
        SELECT id FROM reportings WHERE submitted_by = $1
        UNION ALL
        SELECT id FROM sightings WHERE submitted_by = $1
      ) combined
    `;
    const countResult = await pool.query(countQuery, [userId]);
    const totalRecords = parseInt(countResult.rows[0].total, 10);
    const totalPages = Math.ceil(totalRecords / limit);

    const submissionsQuery = `
      SELECT * FROM (
        SELECT 
          id,
          submission_context AS "type",
          submitted_at AS "submittedAt",
		  district,
		  block,
		  village_or_ghat AS "villageOrGhat",
		  observed_at AS "observedAt"
        FROM reportings 
        WHERE submitted_by = $1
        
        UNION ALL
        
        SELECT 
          id,
		  submission_context AS "type",
		  submitted_at AS "submittedAt",
		  district,
		  block,
		  village_or_ghat AS "villageOrGhat",
		  observed_at AS "observedAt"
        FROM sightings 
        WHERE submitted_by = $1
      ) combined_submissions
      ORDER BY "submittedAt" DESC
      LIMIT $2 OFFSET $3
    `;

    const submissionsResult = await pool.query(submissionsQuery, [
      userId,
      limit,
      offset,
    ]);

    res.status(200).json({
      message: "Submissions fetched successfully",
      result: submissionsResult.rows,
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
