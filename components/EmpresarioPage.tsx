
import React, { useState } from 'react';
import { UploadedFile, BusinessAnalysisResult } from '../types';
import { BusinessFileUpload } from './BusinessFileUpload';
import { BusinessResultView } from './BusinessResultView';
import { analyzeBusiness } from '../services/geminiService';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { CustomButton } from './CustomButton';

interface EmpresarioPageProps {
  onBack: () => void;
}

export const EmpresarioPage: React.FC<EmpresarioPageProps> = ({ onBack }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  const [context, setContext] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<BusinessAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (files.length === 0 && urls.length === 0 && !context.trim()) {
      setError("Proporciona documentos o contexto.");
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    try {
      const data = await analyzeBusiness(files, urls, context);
      setResult(data);
    } catch (err: any) {
      setError("Error durante el análisis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col w-full">
      <header className="border-b border-gray-100 px-6 py-4 sticky top-0 bg-gradient-to-l from-black/10 via-white/50 to-white z-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-2">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold tracking-tight">NegocioIA</h1>
        </div>
        <img 
          src="https://www.learningheroes.com/_ipx/q_80/images/Logo.svg" 
          className="h-8 md:h-10 w-auto invert brightness-0" 
          alt="Learning Heroes" 
        />
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
        {result ? (
          <div className="animate-in fade-in duration-700">
            <div className="flex justify-between items-center mb-8">
               <h2 className="text-3xl font-bold tracking-tight">Análisis Estratégico</h2>
               <CustomButton variant="outline" onClick={() => setResult(null)}>Nuevo Análisis</CustomButton>
            </div>
            <BusinessResultView result={result} />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-12">
            <section className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Impulsa tu Negocio</h2>
                <p className="text-gray-500">Analiza tus métricas y documentos para encontrar palancas de crecimiento.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Documentación y Enlaces</label>
                <BusinessFileUpload files={files} setFiles={setFiles} urls={urls} setUrls={setUrls} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Contexto del Negocio</label>
                <textarea
                  placeholder="Describe tus desafíos actuales o metas..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all h-32 resize-none text-sm"
                />
              </div>

              <CustomButton 
                onClick={handleAnalyze}
                className="w-full py-4 text-lg"
                isLoading={isAnalyzing}
              >
                Generar Estrategia
              </CustomButton>
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </section>

            <section className="bg-gray-50 rounded-3xl p-8 flex flex-col justify-center text-center space-y-6">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                <TrendingUp className="w-10 h-10 text-gray-300" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Inteligencia de Crecimiento</h3>
                <p className="text-gray-400 text-sm max-w-xs mx-auto">La IA identificará áreas de mejora en ingresos, costes y productividad basándose en tus datos reales.</p>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};
