// index.js
import express from 'express';
import { middleware, Client } from '@line/bot-sdk';
import dotenv from 'dotenv';
import { generateStory, generateImage } from './services/openai.js';
import { logToSheet } from './services/sheets.js';
dotenv.config();

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const app = express();
const client = new Client(config);

app.post('/webhook', middleware(config), async (req, res) => {
  Promise.all(req.body.events.map(handleEvent)).then((result) => res.json(result));
});

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const userMessage = event.message.text;

  // ✅ ストーリー生成
  const story = await generateStory(userMessage);

  // ✅ 画像プロンプト整形＋生成（1行目から記号など除去）
  const promptForImage = story
    .split('\n')[0]
    .replace(/[^\w\sぁ-んァ-ヶー一-龯]/g, '')
    .slice(0, 100);

  let imageUrl = null;

  if (promptForImage && promptForImage.length > 4) {
    try {
      imageUrl = await generateImage(promptForImage);
    } catch (e) {
      console.warn('⚠️ 画像生成失敗:', e.message || e);
    }
  }

  // ✅ シート保存（nullでもOK）
  try {
    await logToSheet({
      userId: event.source.userId,
      inputPrompt: userMessage,
      storyText: story,
      imageUrl,
    });
  } catch (e) {
    console.error('❌ Sheets保存失敗:', e.message || e);
  }

  // ✅ LINE返信構築
  const replyMessages = [];

  if (imageUrl) {
    replyMessages.push({
      type: 'image',
      originalContentUrl: imageUrl,
      previewImageUrl: imageUrl,
    });
  }

  replyMessages.push({
    type: 'text',
    text: story,
  });

  return client.replyMessage(event.replyToken, replyMessages);
}

// サーバー起動
app.listen(process.env.PORT, () => {
  console.log('🚀 LINE Bot server running');
});
