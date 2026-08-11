import CryptoJS from 'crypto-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { text } = req.body;

  if (typeof text !== 'string') {
    return res.status(400).json({ error: 'text must be a string.' });
  }

  if (!text) {
    return res.status(200).json({ encrypted: '' });
  }

  const encryptionKey = process.env.ENCRYPTION_KEY;

  if (!encryptionKey) {
    console.error('Missing ENCRYPTION_KEY environment variable.');
    return res.status(500).json({ error: 'Erro interno no servidor de configuração de criptografia.' });
  }

  const encrypted = CryptoJS.AES.encrypt(text, encryptionKey).toString();
  return res.status(200).json({ encrypted });
}
