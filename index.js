// index.js
import express from 'express';
import { middleware, Client } from '@line/bot-sdk';
import dotenv from 'dotenv';
import { generateStory } from './services/openai.js';
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
  const story = await generateStory(userMessage);

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: story || '物語の生成に失敗しました。',
  });
}

app.listen(process.env.PORT, () => {
  console.log('🚀 LINE Bot server running');
});
