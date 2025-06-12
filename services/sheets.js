// services/sheets.js（章数記録対応）
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

function getSheetsClient() {
  const base64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const key = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));

  const client = new JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth: client });
}

export async function logToSheet({ userId, inputPrompt, storyText, imageUrl, chapterNumber }) {
  const sheets = getSheetsClient();
  const now = new Date().toISOString();
  const values = [[userId, now, inputPrompt, storyText, imageUrl, chapterNumber.toString()]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.SHEET_ID,
    range: 'A1',
    valueInputOption: 'RAW',
    requestBody: {
      values,
    },
  });
}

export async function getLatestStory(userId) {
  const sheets = getSheetsClient();
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: 'A1:F1000',
  });

  const rows = result.data.values;
  if (!rows || rows.length < 2) return null;

  for (let i = rows.length - 1; i >= 1; i--) {
    if (rows[i][0] === userId) {
      return {
        userId: rows[i][0],
        timestamp: rows[i][1],
        inputPrompt: rows[i][2],
        storyText: rows[i][3],
        imageUrl: rows[i][4] || null,
        chapterNumber: parseInt(rows[i][5]) || 1,
      };
    }
  }

  return null;
}
