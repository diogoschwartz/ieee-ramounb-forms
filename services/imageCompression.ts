import { AvatarUploadOptions } from '../types';
import { AVATAR_MAX_DIMENSION, AVATAR_QUALITY, AVATAR_MAX_SIZE_BYTES } from '../constants';

export const compressProfileImage = (
  file: File,
  options?: AvatarUploadOptions
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const maxDimension = options?.maxDimension || AVATAR_MAX_DIMENSION;
    const quality = options?.quality || AVATAR_QUALITY;
    const format = options?.format || 'image/jpeg';

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calcula a nova proporção mantendo o aspect ratio
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round(height * (maxDimension / width));
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round(width * (maxDimension / height));
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Falha ao inicializar o Canvas para compressão da imagem.'));
          return;
        }

        // Pinta fundo branco (elimina transparência de PNGs)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Desenha a imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Erro ao converter o Canvas em Blob.'));
              return;
            }

            if (blob.size > AVATAR_MAX_SIZE_BYTES) {
              reject(new Error('A imagem resultante excedeu o limite de 500KB mesmo após a compressão. Escolha uma imagem menor.'));
              return;
            }

            resolve(blob);
          },
          format,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Falha ao carregar a imagem para compressão.'));
      };
    };

    reader.onerror = () => {
      reject(new Error('Falha ao ler o arquivo de imagem.'));
    };
  });
};
