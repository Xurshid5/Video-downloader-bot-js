require('dotenv').config();
const { Telegraf } = require('telegraf');
const ytdlp = require('yt-dlp-exec');
const fs = require('fs');
const path = require('path');
const os = require('os');
const express = require('express');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

// Render uchun Web Server
app.get('/', (req, res) => res.send('Bot is Online!'));
app.listen(process.env.PORT || 3000);

bot.start((ctx) => ctx.reply('🎬 Video havolasini yuboring (YouTube, TikTok, Instagram).'));

bot.on('text', async (ctx) => {
    const url = ctx.message.text;
    if (!url.startsWith('http')) return;

    const tempDir = os.tmpdir();
    const fileName = `vid_${Date.now()}.mp4`;
    const outputPath = path.join(tempDir, fileName);
    
    let loadingMsg;
    try {
        loadingMsg = await ctx.reply('⏳ Yuklab olinmoqda, kuting...');

        // yt-dlp sozlamalari
        await ytdlp(url, {
            output: outputPath,
            // MP4 formatini tanlash (Renderda ffmpeg yo'qligi sababli muhim)
            format: 'best[ext=mp4]/best', 
            noCheckCertificates: true,
            noWarnings: true,
            addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
            maxFilesize: '45M' // Telegram limit
        });

        if (fs.existsSync(outputPath)) {
            const stats = fs.statSync(outputPath);
            if (stats.size > 50 * 1024 * 1024) {
                await ctx.reply('❌ Video juda katta (50MB+).');
            } else {
                await ctx.replyWithVideo({ source: outputPath });
            }
            fs.unlinkSync(outputPath); // Faylni o'chirish
        } else {
            throw new Error('Fayl topilmadi');
        }

    } catch (error) {
        console.error('XATO:', error.message);
        ctx.reply('❌ Yuklab bo‘lmadi. Sababi: Video juda katta yoki sayt bloklagan.');
    } finally {
        if (loadingMsg) {
            ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id).catch(() => {});
        }
    }
});

bot.launch();
console.log('✅ Bot ishga tushdi!');
