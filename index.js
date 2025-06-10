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

// Webhook受信エンドポイント
app.post('/webhook', middleware(config), async (req, res) => {
  Promise.all(req.body.events.map(handleEvent)).then((result) => res.json(result));
});

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const userMessage = event.message.text;

  // GPTでストーリー生成
  const story = await generateStory(userMessage);

  // DALL·Eで挿絵生成（ストーリー冒頭1行目）
  const imagePrompt = story.split('\n')[0];
  const imageUrl = await generateImage(imagePrompt);

  // スプレッドシートに保存
  await logToSheet({
    userId: event.source.userId,
    inputPrompt: userMessage,
    storyText: story,
    imageUrl,
  });

  // LINEへ画像＋ストーリーを送信
  return client.replyMessage(event.replyToken, [
    {
      type: 'image',
      originalContentUrl: imageUrl,
      previewImageUrl: imageUrl,
    },
    {
      type: 'text',
      text: story,
    },
  ]);
}

// サーバー起動
app.listen(process.env.PORT, () => {
  console.log('🚀 LINE Bot server running');
});
