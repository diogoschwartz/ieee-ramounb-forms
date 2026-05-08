import React, { useState } from 'react';
import { cpf } from 'cpf-cnpj-validator';
import { Search, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { AvatarUpload } from './AvatarUpload';

export const AvatarToolPage: React.FC = () => {
  const [cpfInput, setCpfInput] = useState('');
  const [activeCpf, setActiveCpf] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'found' | 'not_found'>('idle');

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpfInput(cpf.format(e.target.value));
  };

  const searchPhoto = () => {
    if (!cpf.isValid(cpfInput)) {
      alert('CPF inválido! Por favor, verifique os números digitados.');
      return;
    }

    const cleanCpf = cpfInput.replace(/\D/g, '');
    setActiveCpf(cleanCpf);
    setStatus('loading');

    const publicUrlBase = import.meta.env.VITE_R2_PUBLIC_URL;
    // O timestamp evita que o navegador mostre uma imagem do cache antigo
    const testUrl = `${publicUrlBase}/avatars/${cleanCpf}/profile.jpg?v=${Date.now()}`;

    // Usamos o objeto Image nativo para testar silenciosamente se a foto existe no R2
    const img = new Image();
    img.onload = () => {
      setPhotoUrl(testUrl);
      setStatus('found');
    };
    img.onerror = () => {
      setPhotoUrl(null);
      setStatus('not_found');
    };
    img.src = testUrl;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pb-20 selection:bg-[#00629b]/20 selection:text-[#00629b]">
      {/* Decorative Top Background (Subtle) */}
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-ieee-gradient opacity-10 pointer-events-none"></div>

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 relative z-10 flex flex-col items-center justify-center min-h-[80vh]">
        
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl shadow-xl shadow-[#00629b]/5 border border-gray-100">
          <div className="text-center">
            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
              <ImageIcon className="h-8 w-8 text-[#00629b]" />
            </div>
            <h2 className="mt-2 text-2xl font-extrabold text-gray-900 tracking-tight">
              Gerenciar Foto de Perfil
            </h2>
            <p className="mt-3 text-sm text-gray-500">
              Digite o seu CPF cadastrado para buscar sua foto atual e, se desejar, fazer o upload de uma nova.
            </p>
          </div>

          <div className="mt-8 space-y-6">
            <div className="flex gap-3">
              <input
                type="text"
                value={cpfInput}
                onChange={handleCpfChange}
                placeholder="000.000.000-00"
                className="flex-1 px-4 py-3 text-lg text-center font-medium border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00629b]/20 focus:border-[#00629b] outline-none transition-all placeholder:font-normal placeholder:text-gray-400"
              />
              <button
                onClick={searchPhoto}
                className="bg-[#00629b] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#004b7a] transition-colors shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            {status === 'loading' && (
              <div className="text-center text-sm text-gray-500 animate-pulse font-medium">
                Verificando no storage...
              </div>
            )}

            {status === 'not_found' && (
              <div className="bg-yellow-50/80 border-l-4 border-yellow-400 p-4 rounded-r-xl">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-500 mr-3 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800 leading-relaxed font-medium">
                    Nenhuma foto foi encontrada associada a este CPF. Mas você pode enviar uma foto agora mesmo!
                  </p>
                </div>
              </div>
            )}

            {(status === 'found' || status === 'not_found') && activeCpf && (
              <div className="flex flex-col items-center gap-4 bg-gray-50 p-8 rounded-2xl border border-gray-100 mt-6 animate-in fade-in zoom-in-95 duration-300">
                <AvatarUpload
                  userId={activeCpf}
                  currentAvatarUrl={photoUrl || undefined}
                  showUploadButton={true}
                  onUploadComplete={(newUrl) => {
                    setPhotoUrl(newUrl);
                    setStatus('found');
                  }}
                />
                
                {status === 'found' && (
                  <p className="text-[10px] uppercase tracking-widest font-bold text-green-600 mt-2">
                    Foto encontrada e carregada
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
