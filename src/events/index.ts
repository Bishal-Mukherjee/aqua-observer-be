import EventEmitter from "events";
import { pool } from "@/config/db";
import { sendSMSAlert } from "@/utils/twilio";

const eventEmitter = new EventEmitter();

eventEmitter.on(
  "reporting:created",
  async (payload: { message: string; district: string }) => {
    try {
      const client = await pool.connect();

      const dfoQuery = await client.query(
        `SELECT phone_number AS "phoneNumber" FROM users WHERE role = 'DFO' AND district = $1`,
        [payload.district],
      );

      if (dfoQuery.rows.length === 0) {
        console.log(`No DFO found for district: ${payload.district}`);
        return;
      }

      const dfo = dfoQuery.rows[0];

      await sendSMSAlert(dfo.phoneNumber, payload.message);
      client.release();
      return;
    } catch (error) {
      console.error("SMS alert failed:", error);
    }
  },
);

export { eventEmitter };
