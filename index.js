require('dotenv').config();
const { Telegraf } = require('telegraf');
const ytdlp = require('yt-dlp-exec');
const fs = require('fs');
const path = require('path');
const os = require('os');
const express = require('express');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

// Render uxlab qolmasligi uchun Web Server
app.get('/', (req, res) => res.send('Bot Status: Online ✅'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

bot.start((ctx) => ctx.reply('🎬 Menga YouTube, TikTok yoki Instagram havolasini yuboring. Men uni yuklab beraman!'));

bot.on('text', async (ctx) => {
    const url = ctx.message.text;
    if (!url.startsWith('http')) return;

    const tempDir = os.tmpdir();
    const fileName = `video_${Date.now()}.mp4`;
    const outputPath = path.join(tempDir, fileName);
    
    let loadingMsg;
    try {
        loadingMsg = await ctx.reply('⏳ Yuklab olish jarayoni boshlandi, kuting...');

        // MUHIM: Render va YouTube uchun eng optimal sozlamalar
        await ytdlp(url, {
            output: outputPath,
            // Sifatni 480p gacha cheklaymiz va faqat MP4 so'raymiz
            format: 'best[height<=480][ext=mp4]/best[ext=mp4]/best', 
            noCheckCertificates: true,
            noWarnings: true,
            addHeader: [
                'referer:https://www.google.com/',
                'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ],
            // 50MB dan oshib ketsa yuklamaymiz (Telegram limiti)
            maxFilesize: '49M' 
        });

        if (fs.existsSync(outputPath)) {
            // Videoni yuborish
            await ctx.replyWithVideo({ source: outputPath });
            // Server xotirasini tozalash (MUHIM!)
            fs.unlinkSync(outputPath);
        } else {
            throw new Error('Fayl yaratilmadi');
        }

    } catch (error) {
        console.error('Xatolik tafsiloti:', error.message);
        ctx.reply('❌ Yuklab bo‘lmadi.\n\nSababi: Video juda katta (50MB+) yoki YouTube serverimizni bloklagan.');
    } finally {
        if (loadingMsg) {
            ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id).catch(() => {});
        }
    }
});

// Botni ishga tushirish
bot.launch().then(() => console.log('✅ Bot muvaffaqiyatli ishga tushdi!'));

// Xatoliklarni boshqarish
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
