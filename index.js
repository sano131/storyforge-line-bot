// index.js（最終章はボタン・選択肢文も非表示）
import express from 'express';
import { middleware, Client } from '@line/bot-sdk';
import dotenv from 'dotenv';
import { generateStory, generateImage } from './services/openai.js';
import { logToSheet, getLatestStory } from './services/sheets.js';
import { createStoryFlex } from './utils/flexTemplate.js';
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
  let chapterNumber = 1;

  if (userMessage === 'A' || userMessage === 'B') {
    const previous = await getLatestStory(userId);
    if (!previous) {
      story = '前回のストーリーが見つかりませんでした。最初から始めてください。';
    } else {
      chapterNumber = previous.chapterNumber + 1;
      inputPrompt = `前回のストーリー: ${previous.storyText}\nユーザーは「${userMessage}」を選びました。`;

      if (chapterNumber >= 3) {
        inputPrompt += '\nこれは物語の最終章です。感動的な結末を描いてください。';
      } else {
        inputPrompt += '\nその続きの物語を書いてください。';
      }

      story = await generateStory(inputPrompt);

      // ✅ 最終章ならA/B選択肢の行を削除する
      if (chapterNumber >= 3) {
        story = story
          .split('\n')
          .filter(line => !line.trim().startsWith('A:') && !line.trim().startsWith('B:'))
          .join('\n');
      }
    }
  } else {
    inputPrompt = userMessage;
    story = await generateStory(userMessage);
  }

  // 画像プロンプト整形
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

  // Sheets保存
  try {
    await logToSheet({
      userId,
      inputPrompt,
      storyText: story,
      imageUrl,
      chapterNumber,
    });
  } catch (e) {
    console.error('❌ Sheets保存失敗:', e.message || e);
  }

  // Flexメッセージ or 通常テキストで返信
  let replyMessage;
  if (chapterNumber >= 3) {
    replyMessage = [
      ...(imageUrl ? [{
        type: 'image',
        originalContentUrl: imageUrl,
        previewImageUrl: imageUrl,
      }] : []),
      {
        type: 'text',
        text: story + '\n\n🎉 物語はここで完結しました。はじめから読むには新しいメッセージを送ってね！',
      },
    ];
  } else {
    replyMessage = [createStoryFlex({ storyText: story, imageUrl })];
  }

  return client.replyMessage(event.replyToken, replyMessage);
}

app.listen(process.env.PORT, () => {
  console.log('🚀 LINE Bot server running');
});
