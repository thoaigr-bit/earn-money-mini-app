import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed"
    });
  }

  try {
    const {
      telegram_id,
      username,
      points = 0,
      type = "ad"
    } = req.body || {};

    if (!telegram_id) {
      return res.status(400).json({
        ok: false,
        error: "telegram_id is required"
      });
    }

    const add = Math.max(0, Number(points) || 0);

    if (add <= 0) {
      return res.status(400).json({
        ok: false,
        error: "points must be greater than 0"
      });
    }

    // Điểm danh: chỉ được nhận 1 lần mỗi ngày
    if (type === "checkin") {
      const result = await pool.query(
        `INSERT INTO users (telegram_id, username, points, last_checkin)
         VALUES ($1, $2, $3, CURRENT_DATE)
         ON CONFLICT (telegram_id)
         DO UPDATE SET
           username = EXCLUDED.username,
           points = users.points + $3,
           last_checkin = CURRENT_DATE
         WHERE users.last_checkin IS DISTINCT FROM CURRENT_DATE
         RETURNING telegram_id, username, points, last_checkin`,
        [telegram_id, username || null, add]
      );

      if (result.rows.length === 0) {
        const user = await pool.query(
          `SELECT telegram_id, username, points, last_checkin
           FROM users
           WHERE telegram_id = $1`,
          [telegram_id]
        );

        return res.status(200).json({
          ok: false,
          already_checked_in: true,
          error: "Hôm nay bạn đã điểm danh rồi",
          user: user.rows[0] || null
        });
      }

      return res.status(200).json({
        ok: true,
        user: result.rows[0]
      });
    }

    // Quảng cáo / nhiệm vụ thường
    const result = await pool.query(
      `INSERT INTO users (telegram_id, username, points)
       VALUES ($1, $2, $3)
       ON CONFLICT (telegram_id)
       DO UPDATE SET
         username = EXCLUDED.username,
         points = users.points + $3
       RETURNING telegram_id, username, points, last_checkin`,
      [telegram_id, username || null, add]
    );

    return res.status(200).json({
      ok: true,
      user: result.rows[0]
    });

  } catch (error) {
    console.error("EARN ERROR:", error);

    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}
