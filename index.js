require('dotenv').config();
const { Telegraf } = require('telegraf');
const ytdlp = require('yt-dlp-exec');
const fs = require('fs');
const path = require('path');
const os = require('os');
const express = require('express');

// Botni init qilish
const bot = new Telegraf(process.env.BOT_TOKEN);

// Server (Render o'chib qolmasligi uchun)
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Bot status: ONLINE ✅'));
app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));

// Start buyrug'i
bot.start((ctx) => {
    ctx.reply('🎬 Video havolasini yuboring (YouTube, TikTok, Instagram).');
});

bot.on('text', async (ctx) => {
    const url = ctx.message.text;
    if (!url.startsWith('http')) return ctx.reply('❗ Iltimos, havola yuboring.');

    const tempPath = os.tmpdir();
    const fileName = `video_${Date.now()}.mp4`;
    const outputPath = path.join(tempPath, fileName);
    
    let loadingMsg;
    try {
        loadingMsg = await ctx.reply('⏳ Yuklab olinmoqda...');

        // MUHIM: yt-dlp parametrlari
        await ytdlp(url, {
            output: outputPath,
            format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best', // Eng yaxshi sifat, lekin MP4
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            addHeader: ['referer:youtube.com', 'user-agent:googlebot']
        });

        // Video hajmini tekshirish (Telegram 50MB gacha ruxsat beradi oddiy botlarga)
        const stats = fs.statSync(outputPath);
        const fileSizeInBytes = stats.size;
        const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);

        if (fileSizeInMegabytes > 50) {
            await ctx.reply('❌ Video hajmi juda katta (50MB dan ko‘p). Telegram bot limiti tufayli yuborib bo‘lmaydi.');
        } else {
            await ctx.replyWithVideo({ source: outputPath });
        }

    } catch (error) {
        console.error('Download Error:', error);
        await ctx.reply('❌ Yuklashda xatolik yuz berdi. Havola noto‘g‘ri yoki video himoyalangan.');
    } finally {
        // Faylni o'chirish (Xatolik bo'lsa ham bo'lmasa ham)
        if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
        }
        if (loadingMsg) {
            ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id).catch(() => {});
        }
    }
});

// Xatoliklarni ushlash
bot.catch((err) => console.error('Bot error:', err));

bot.launch();
console.log('✅ Bot ishga tushdi.');
