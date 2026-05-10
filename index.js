require('dotenv').config();
const { Telegraf } = require('telegraf');
const ytdlp = require('yt-dlp-exec');
const fs = require('fs');
const path = require('path');
const os = require('os');
const express = require('express');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

// Render uchun port
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot is running...'));
app.listen(PORT, () => console.log(`Port: ${PORT}`));

bot.start((ctx) => ctx.reply('Video linkini yuboring!'));

bot.on('text', async (ctx) => {
    const url = ctx.message.text;
    if (!url.startsWith('http')) return;

    const outputPath = path.join(os.tmpdir(), `vid_${Date.now()}.mp4`);
    const loading = await ctx.reply('⏳ Jarayon boshlandi...');

    try {
        // MUHIM: Bu sozlamalar videoni kichikroq formatda (Telegram ko'tara oladigan) yuklaydi
        await ytdlp(url, {
            output: outputPath,
            format: 'best[ext=mp4]/best', // Faqat tayyor MP4 qidiradi (birlashtirish shart emas)
            noCheckCertificates: true,
            maxFilesize: '45M', // 50MB dan oshib ketmasligi uchun
        });

        if (fs.existsSync(outputPath)) {
            await ctx.replyWithVideo({ source: outputPath });
            fs.unlinkSync(outputPath);
        } else {
            throw new Error('Fayl yaratilmadi');
        }

    } catch (error) {
        console.error('XATO:', error.message);
        ctx.reply(`❌ Xatolik: Video juda katta yoki bu saytdan yuklab bo'lmaydi.`);
    } finally {
        ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id).catch(() => {});
    }
});

bot.launch();
