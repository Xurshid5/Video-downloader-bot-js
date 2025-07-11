require('dotenv').config();
const { Telegraf } = require('telegraf');
const ytdlp = require('yt-dlp-exec');
const fs = require('fs');
const path = require('path');
const os = require('os');
const express = require('express');

// Telegram botni ishga tushirish
const bot = new Telegraf(process.env.BOT_TOKEN);

// Botni boshlash
bot.start((ctx) => {
  ctx.reply('🎬 Menga video havolasini yuboring (YouTube, TikTok, Instagram) — men sizga videoni yuboraman.');
});

// Link yuborilganda ishlaydi
bot.on('text', async (ctx) => {
  const url = ctx.message.text;

  if (!url.startsWith('http')) {
    return ctx.reply('❗ Iltimos, haqiqiy video link yuboring.');
  }

  const downloadsPath = path.join(os.homedir(), 'Downloads');
  const fileName = `video_${Date.now()}.mp4`;
  const outputPath = path.join(downloadsPath, fileName);

  const loadingMessage = await ctx.reply('⏳ Yuklab olinmoqda, iltimos kuting...');

  try {
    // yt-dlp bilan yuklash
    await ytdlp(url, { output: outputPath });

    // Foydalanuvchiga video yuborish
    await ctx.replyWithVideo({ source: outputPath });

    // Yuklangan faylni o‘chirish
    fs.unlinkSync(outputPath);

    // Yuklab bo‘linganini yangilash
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      loadingMessage.message_id,
      null,
      '✅ Video yuborildi va fayl o‘chirildi.'
    );
  } catch (error) {
    console.error('❌ Yuklab olishda xatolik:', error);
    await ctx.reply('❌ Video yuklab bo‘lmadi. Balki link noto‘g‘ridir.');
  }
});

// Botni ishga tushurish
bot.launch();
console.log('✅ Telegram bot ishga tushdi.');

// Express server (UptimeRobot va Render uchun)
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('✅ Bot ishlayapti!');
});

app.listen(PORT, () => {
  console.log(`🌐 Web server port: ${PORT}`);
});
