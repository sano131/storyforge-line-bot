// services/sheets.js
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

export async function logToSheet({ userId, inputPrompt, storyText, imageUrl }) {
  const base64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const key = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));

  const client = new JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth: client });

  const now = new Date().toISOString();
  const values = [[userId, now, inputPrompt, storyText, imageUrl]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.SHEET_ID,
    range: 'A1',
    valueInputOption: 'RAW',
    requestBody: {
      values,
    },
  });
}
