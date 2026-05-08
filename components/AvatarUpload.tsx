import React, { useState, useRef } from 'react';
import { Camera, Loader2, Upload } from 'lucide-react';
import { uploadProfilePicture } from '../services/r2Upload';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  userId: string;
  onUploadComplete: (newUrl: string) => void;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  userId,
  onUploadComplete,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/image\/(jpeg|webp|png)/)) {
      setError('Formato inválido. Use JPEG, PNG ou WEBP.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const newUrl = await uploadProfilePicture(file, userId);
      onUploadComplete(newUrl);
    } catch (err: any) {
      setError(err.message || 'Falha no upload.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAvatarClick = () => {
    if (!isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        onClick={handleAvatarClick}
        className={`relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg flex items-center justify-center bg-gray-100 transition-all ${
          isUploading ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95 group'
        }`}
      >
        {currentAvatarUrl ? (
          <img
            src={currentAvatarUrl}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center text-gray-400">
            <Camera className="w-8 h-8" />
          </div>
        )}

        {!isUploading && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
            <Upload className="w-6 h-6 text-white drop-shadow-md mb-1" />
            <span className="text-[10px] text-white font-bold tracking-wider">ALTERAR</span>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-sm">
            <Loader2 className="w-8 h-8 text-[#00629b] animate-spin" />
          </div>
        )}
      </div>

      {error && (
        <div className="text-xs text-red-500 font-medium bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 animate-in fade-in slide-in-from-top-1">
          {error}
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/webp,image/png"
        className="hidden"
      />
    </div>
  );
};
