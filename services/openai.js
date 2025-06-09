// services/openai.js
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: false,
});

export async function generateStory(prompt) {
  const messages = [
    {
      role: 'system',
      content:
        'あなたは子ども向け絵本の物語を語るストーリー作家です。優しく、感情豊かに、1〜2文でシーンを描写し、最後に「A：...」「B：...」という2つの選択肢を提示してください。',
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
