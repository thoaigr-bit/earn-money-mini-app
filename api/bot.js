import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({
      ok: true,
      message: "Earn Money Bot is running"
    });
  }

  try {
    const update = req.body;

    if (update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text || "";

      if (text === "/start" || text.startsWith("/start ")) {
        const token = process.env.BOT_TOKEN;

        if (!token) {
          return res.status(500).json({
            ok: false,
            error: "BOT_TOKEN is missing"
          });
        }

        await fetch(
          `https://api.telegram.org/bot${token}/sendMessage`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              chat_id: chatId,
              text:
                "🎉 <b>CHÀO MỪNG BẠN ĐẾN VỚI EARN MONEY!</b>\n\n" +
                "💰 Kiếm điểm bằng cách hoàn thành nhiệm vụ.\n" +
                "📺 Xem quảng cáo để nhận điểm.\n" +
                "👥 Mời bạn bè nhận thưởng REF.\n" +
                "💵 Tích điểm và đổi thưởng!\n\n" +
                "👇 <b>Bấm nút bên dưới để bắt đầu!</b>",
              parse_mode: "HTML",
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "🚀 MỞ EARN MONEY",
                      web_app: {
                        url: "https://earnmoneyminiappv2.vercel.app"
                      }
                    }
                  ]
                ]
              }
            })
          }
        );
      }
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}
