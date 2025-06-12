// index.js（選択肢に応じて分岐するv2版）
import express from 'express';
import { middleware, Client } from '@line/bot-sdk';
import dotenv from 'dotenv';
import { generateStory, generateImage } from './services/openai.js';
import { logToSheet, getLatestStory } from './services/sheets.js';
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

  const userMessage = event.message.text.trim();
  const userId = event.source.userId;
  let story = '';
  let inputPrompt = '';

  if (userMessage === 'A' || userMessage === 'B') {
    // AまたはBを選んだ場合は続きの物語
    const previous = await getLatestStory(userId);
    if (!previous) {
      story = '前回のストーリーが見つかりませんでした。最初から始めてください。';
    } else {
      inputPrompt = `前回のストーリー: ${previous.storyText}\nユーザーは「${userMessage}」を選びました。その続きの物語を書いてください。`;      
      story = await generateStory(inputPrompt);
    }
  } else {
    // 最初の入力（自由入力）
    inputPrompt = userMessage;
    story = await generateStory(userMessage);
  }

  // 画像生成（冒頭1行）
  const promptForImage = story
    .split('\n')[0]
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .slice(0, 100);

  let imageUrl = null;
  if (promptForImage && promptForImage.length > 4) {
    try {
      imageUrl = await generateImage(promptForImage);
    } catch (e) {
      console.warn('⚠️ 画像生成失敗:', e.message || e);
    }
  }

  // Sheetsに保存
  try {
    await logToSheet({
      userId,
      inputPrompt,
      storyText: story,
      imageUrl,
    });
  } catch (e) {
    console.error('❌ Sheets保存失敗:', e.message || e);
  }

  // LINE返信
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

app.listen(process.env.PORT, () => {
  console.log('🚀 LINE Bot server running');
});
