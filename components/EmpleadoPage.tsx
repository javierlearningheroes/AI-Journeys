
import React, { useState } from 'react';
import { Briefcase, ArrowLeft } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { CustomButton } from './CustomButton';
import { ResultView } from './ResultView';
import { optimizeCV } from '../services/geminiService';
import { AppState, OptimizationResult } from '../types';

interface EmpleadoPageProps {
  onBack: () => void;
}

export const EmpleadoPage: React.FC<EmpleadoPageProps> = ({ onBack }) => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [jobDescription, setJobDescription] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!jobDescription.trim() || !cvFile) {
      setError("Completa la descripción y sue tu CV.");
      return;
    }
    setAppState(AppState.PROCESSING);
    setError(null);
    try {
      const optimizationResult = await optimizeCV(jobDescription, cvFile);
      setResult(optimizationResult);
      setAppState(AppState.SUCCESS);
    } catch (err: any) {
      setError(err.message || "Error inesperado.");
      setAppState(AppState.ERROR);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col w-full">
      <header className="border-b border-gray-100 px-6 py-4 sticky top-0 bg-gradient-to-l from-black/10 via-white/50 to-white z-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-2">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold tracking-tight">CarreraIA</h1>
        </div>
        <img 
          src="https://www.learningheroes.com/_ipx/q_80/images/Logo.svg" 
          className="h-8 md:h-10 w-auto invert brightness-0" 
          alt="Learning Heroes" 
        />
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
        {appState === AppState.SUCCESS && result ? (
          <ResultView result={result} onReset={() => setAppState(AppState.IDLE)} />
        ) : (
          <div className="grid md:grid-cols-2 gap-12">
            <section className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Optimiza tu perfil</h2>
                <p className="text-gray-500">Adapta tu CV a cualquier oferta de trabajo usando IA.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Descripción del Puesto</label>
                <textarea
                  placeholder="Pega aquí la oferta de trabajo..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all h-64 resize-none text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Tu CV Actual</label>
                <FileUpload onFileSelect={setCvFile} selectedFile={cvFile} />
              </div>

              <CustomButton 
                onClick={handleSubmit}
                className="w-full py-4 text-lg"
                isLoading={appState === AppState.PROCESSING}
              >
                Analizar Perfil
              </CustomButton>
              
              {error && <p className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-lg">{error}</p>}
            </section>

            <section className="bg-gray-50 rounded-3xl p-8 flex flex-col justify-center text-center space-y-6">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                <Briefcase className="w-10 h-10 text-gray-300" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Potencia tu empleabilidad</h3>
                <p className="text-gray-400 text-sm max-w-xs mx-auto">Nuestra IA analizará las palabras clave de la oferta y preparará una versión optimizada de tu experiencia.</p>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};
