// services/openai.js
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: false,
});

// 物語生成（GPT）
export async function generateStory(prompt) {
  const messages = [
    {
      role: 'system',
      content:
        'あなたは子ども向け絵本の物語を語るストーリー作家です。やさしく、感情豊かに、1〜2文でシーンを描写し、最後に「A：...」「B：...」という2つの選択肢を提示してください。',
    },
    {
      role: 'user',
      content: prompt,
    },
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    temperature: 0.9,
  });

  return completion.choices[0]?.message.content.trim();
}

// 挿絵生成（DALL·E）
export async function generateImage(prompt) {
  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1024x1024',
  });

  return response.data[0].url;
}
