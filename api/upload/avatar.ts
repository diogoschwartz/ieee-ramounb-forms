import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { userId, contentType } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required.' });
  }

  if (contentType !== 'image/jpeg' && contentType !== 'image/webp') {
    return res.status(400).json({ error: 'contentType must be image/jpeg or image/webp.' });
  }

  const accountId = process.env.CF_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    console.error('Missing R2 environment variables.');
    return res.status(500).json({ error: 'Erro interno no servidor de configuração de storage.' });
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });

  // Nome fixo para evitar acúmulo de arquivos antigos no storage.
  // O cache busting (para o navegador atualizar) é feito pelo frontend adicionando ?v=timestamp
  const extension = contentType === 'image/webp' ? 'webp' : 'jpg';
  const key = `avatars/${userId}/profile.${extension}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  try {
    const presignedUrl = await getSignedUrl(client, command, { expiresIn: 300 });
    return res.status(200).json({ presignedUrl, key });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return res.status(500).json({ error: 'Falha ao gerar URL de upload segura.' });
  }
}
