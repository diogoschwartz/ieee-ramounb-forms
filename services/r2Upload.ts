import { compressProfileImage } from './imageCompression';

export const getPresignedUrl = async (
  userId: string,
  contentType: string
): Promise<{ presignedUrl: string; key: string }> => {
  const response = await fetch('/api/upload/avatar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, contentType }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Falha ao solicitar URL de upload segura.');
  }

  const data = await response.json();
  return { presignedUrl: data.presignedUrl, key: data.key };
};

export const uploadToR2 = async (
  presignedUrl: string,
  blob: Blob,
  contentType: string
): Promise<void> => {
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: blob,
  });

  if (!response.ok) {
    throw new Error('Falha ao enviar a imagem para o storage.');
  }
};

export const uploadProfilePicture = async (
  file: File,
  userId: string
): Promise<string> => {
  try {
    // 1. Comprimir a imagem
    const blob = await compressProfileImage(file);
    const contentType = blob.type; // Deve ser 'image/jpeg' pelo default da compressão

    // 2. Obter URL pré-assinada
    const { presignedUrl, key } = await getPresignedUrl(userId, contentType);

    // 3. Fazer upload direto para o R2
    await uploadToR2(presignedUrl, blob, contentType);

    // 4. Retornar URL pública montada com cache busting
    const publicUrlBase = import.meta.env.VITE_R2_PUBLIC_URL;
    if (!publicUrlBase) {
      throw new Error('Variável de ambiente VITE_R2_PUBLIC_URL não está configurada.');
    }

    const timestamp = Date.now();
    return `${publicUrlBase}/${key}?v=${timestamp}`;
  } catch (error: any) {
    console.error('Erro no fluxo de upload:', error);
    throw new Error(error.message || 'Ocorreu um erro desconhecido durante o upload.');
  }
};
