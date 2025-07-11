require('dotenv').config();
const { Telegraf } = require('telegraf');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => ctx.reply('🎬 Video link yuboring — yuklab beraman.'));

bot.on('text', async (ctx) => {
  const url = ctx.message.text;

  if (!url.startsWith('http')) {
    return ctx.reply('❗ Iltimos, to‘g‘ri video havolasini yuboring.');
  }

  const downloadsPath = path.join(os.homedir(), 'Downloads');
  const fileName = `video_${Date.now()}.mp4`;
  const outputPath = path.join(downloadsPath, fileName);

  const loadingMessage = await ctx.reply('⏳ Yuklab olinmoqda...');

  exec(`yt-dlp -o "${outputPath}" ${url}`, async (error) => {
    if (error) {
      console.error(error);
      await ctx.reply('❌ Video yuklab bo‘lmadi.');
      return;
    }

    try {
      await ctx.replyWithVideo({ source: outputPath });
      fs.unlinkSync(outputPath); // Video yuklab bo‘lgach o‘chadi
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        loadingMessage.message_id,
        null,
        '✅ Video yuborildi va fayl o‘chirildi.'
      );
    } catch (err) {
      console.error(err);
      await ctx.reply('❌ Video yuborishda xatolik yuz berdi.');
    }
  });
});

bot.launch();
console.log('✅ Bot ishga tushdi...');
