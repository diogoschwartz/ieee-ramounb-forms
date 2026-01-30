import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import RegistrationForm from './components/RegistrationForm';


const RegistrationPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pb-20 selection:bg-[#00629b]/20 selection:text-[#00629b]">
      {/* Decorative Top Background (Subtle) */}
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-ieee-gradient opacity-10 pointer-events-none"></div>

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 relative z-10">
        <Header />

        <main className="mt-12 relative">
          <RegistrationForm />
        </main>

        <footer className="mt-16 text-center text-gray-400 text-sm space-y-2">
          <p>© {new Date().getFullYear()} IEEE Student Branch - Universidade de Brasília</p>
          <div className="flex justify-center gap-4">
            <a href="#" className="hover:text-[#00629b]">Termos de Uso</a>
            <span>•</span>
            <a href="#" className="hover:text-[#00629b]">Privacidade</a>
            <span>•</span>
            <a href="#" className="hover:text-[#00629b]">Ajuda</a>
          </div>
        </footer>
      </div>


    </div>
  );
};

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p>Página não encontrada</p>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/forms/cadastro_de_membros_ieee2026" element={<RegistrationPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
