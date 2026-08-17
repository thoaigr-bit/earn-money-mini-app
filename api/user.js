import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true });
  }

  try {
    const { telegram_id, username } = req.body;

    if (!telegram_id) {
      return res.status(400).json({
        ok: false,
        error: "telegram_id is required"
      });
    }

    const result = await pool.query(
      `INSERT INTO users (telegram_id, username)
       VALUES ($1, $2)
       ON CONFLICT (telegram_id)
       DO UPDATE SET username = EXCLUDED.username
       RETURNING telegram_id, username, points, last_checkin`,
      [telegram_id, username || null]
    );

    return res.status(200).json({
      ok: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}
