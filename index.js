// index.js
import express from 'express';
import { middleware, Client } from '@line/bot-sdk';
import dotenv from 'dotenv';
import { generateStory, generateImage } from './services/openai.js';
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

  // GPTでストーリー生成
  const story = await generateStory(userMessage);

  // 画像生成（ストーリーの最初の文だけ使う）
  const promptForImage = story.split('\n')[0];
  const imageUrl = await generateImage(promptForImage);

  // LINEに画像とストーリーを順番に送信
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

app.listen(process.env.PORT, () => {
  console.log('🚀 LINE Bot server running');
});
