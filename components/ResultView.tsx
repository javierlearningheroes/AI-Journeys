
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check, Download, ArrowLeft, Percent, MessageSquare, FileText, Lightbulb, User, CalendarDays, Search, Wrench, Mic2, Clock } from 'lucide-react';
import { CustomButton } from './CustomButton';
import { OptimizationResult, PlanActivity } from '../types';

interface ResultViewProps {
  result: OptimizationResult;
  onReset: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({ result, onReset }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'cv' | 'questions' | 'plan'>('cv');
  
  const { markdown, matchPercentage, matchAnalysis, interviewQuestions = [], structuredPlan = [] } = result;

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([markdown || ''], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = "cv_optimizado.md";
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  };

  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const scoreColorClass = getScoreColor(matchPercentage || 0);

  // Helper for Plan Category Icons & Colors
  const getCategoryStyles = (category: string) => {
    switch(category) {
      case 'investigacion':
        return { 
          bg: 'bg-blue-100', 
          border: 'border-blue-200',
          text: 'text-blue-700',
          bar: 'bg-blue-500',
          icon: <Search className="w-4 h-4" /> 
        };
      case 'tecnico':
        return { 
          bg: 'bg-indigo-100', 
          border: 'border-indigo-200', 
          text: 'text-indigo-700',
          bar: 'bg-indigo-500',
          icon: <Wrench className="w-4 h-4" /> 
        };
      case 'practica':
        return { 
          bg: 'bg-amber-100', 
          border: 'border-amber-200', 
          text: 'text-amber-700',
          bar: 'bg-amber-500',
          icon: <Mic2 className="w-4 h-4" /> 
        };
      case 'logistica':
        return { 
          bg: 'bg-emerald-100', 
          border: 'border-emerald-200', 
          text: 'text-emerald-700',
          bar: 'bg-emerald-500',
          icon: <Clock className="w-4 h-4" /> 
        };
      default:
        return { 
          bg: 'bg-slate-100', 
          border: 'border-slate-200', 
          text: 'text-slate-700',
          bar: 'bg-slate-500',
          icon: <FileText className="w-4 h-4" /> 
        };
    }
  };

  // Group plan by days for the visualization
  const groupedPlan: { [key: string]: PlanActivity[] } = {};
  if (structuredPlan) {
    structuredPlan.forEach(item => {
      if (!groupedPlan[item.day]) {
        groupedPlan[item.day] = [];
      }
      groupedPlan[item.day].push(item);
    });
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Resultados del Análisis</h2>
          <p className="text-slate-500">Tu perfil ha sido procesado exitosamente.</p>
        </div>
        <CustomButton variant="secondary" onClick={onReset} icon={<ArrowLeft className="w-4 h-4"/>}>
          Nuevo Análisis
        </CustomButton>
      </div>

      {/* Score Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4">
          <div className={`h-full rounded-xl border p-6 flex flex-col items-center justify-center text-center ${scoreColorClass}`}>
            <h3 className="text-slate-600 font-medium mb-2 flex items-center gap-2">
              <Percent className="w-4 h-4" /> Compatibilidad Original
            </h3>
            <div className="text-5xl font-bold mb-2">{matchPercentage || 0}%</div>
            <p className="text-sm opacity-90">{matchAnalysis}</p>
          </div>
        </div>
        
        <div className="md:col-span-8 bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-center">
           <h3 className="font-semibold text-slate-900 mb-2">¿Qué significa esto?</h3>
           <p className="text-slate-600 text-sm leading-relaxed">
             Este puntaje refleja qué tanto tu CV <b>original</b> cubría los requisitos de la vacante antes de la optimización. 
             Un puntaje bajo no significa que no seas apto, sino que tal vez tu CV no estaba comunicando tus habilidades correctamente para este puesto específico.
             El CV optimizado (abajo) busca cerrar esa brecha.
           </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('cv')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors
              ${activeTab === 'cv'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }
            `}
          >
            <FileText className="w-4 h-4" />
            CV Optimizado
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors
              ${activeTab === 'questions'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }
            `}
          >
            <MessageSquare className="w-4 h-4" />
            Preguntas STAR
            <span className="bg-slate-100 text-slate-600 py-0.5 px-2.5 rounded-full text-xs ml-2">
              {interviewQuestions.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('plan')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors
              ${activeTab === 'plan'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }
            `}
          >
            <CalendarDays className="w-4 h-4" />
            Plan de Acción
          </button>
        </nav>
      </div>

      {/* Content Area */}
      <div className="min-h-[500px]">
        
        {/* CV TAB */}
        {activeTab === 'cv' && (
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="flex space-x-2">
                <CustomButton variant="outline" onClick={handleCopy} className="py-1.5 px-3 text-xs h-8" icon={copied ? <Check className="w-3 h-3 text-green-600"/> : <Copy className="w-3 h-3"/>}>
                  {copied ? 'Copiado' : 'Copiar'}
                </CustomButton>
                <CustomButton variant="outline" onClick={handleDownload} className="py-1.5 px-3 text-xs h-8" icon={<Download className="w-3 h-3"/>}>
                  Descargar
                </CustomButton>
              </div>
            </div>
            <div className="p-8 overflow-y-auto max-h-[70vh] prose prose-slate max-w-none prose-headings:text-slate-800 prose-a:text-blue-600">
              <ReactMarkdown>{markdown || ''}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* QUESTIONS TAB */}
        {activeTab === 'questions' && (
          <div className="animate-in fade-in zoom-in-95 duration-200 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="mb-6 border-b border-slate-100 pb-4">
                <h3 className="text-lg font-semibold text-slate-900">Simulación de Entrevista</h3>
                <p className="text-slate-500 text-sm">
                  Utiliza este guion para practicar tus respuestas. La sección "Respuesta Sugerida" conecta la pregunta técnica con tu experiencia real en el CV.
                </p>
              </div>
              <div className="space-y-8">
                {interviewQuestions.map((item, idx) => (
                  <div key={idx} className="flex flex-col gap-4 p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden">
                     {/* Background decoration */}
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-purple-100 rounded-full opacity-50 blur-xl"></div>

                    {/* Pregunta */}
                    <div className="flex gap-4 relative z-10">
                      <div className="flex-shrink-0 w-10 h-10 bg-white border border-purple-200 text-purple-600 rounded-xl shadow-sm flex items-center justify-center font-bold text-lg">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="text-slate-900 font-bold text-lg leading-tight">{item.question}</h4>
                      </div>
                    </div>

                    {/* Respuesta Sugerida */}
                    <div className="ml-0 md:ml-14 bg-white p-5 rounded-xl border border-purple-100 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500 transition-all group-hover:w-2"></div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1 bg-purple-100 rounded text-purple-600">
                          <Lightbulb className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Tu Respuesta STAR Sugerida</span>
                      </div>
                      <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line border-l-2 border-slate-100 pl-4">
                        {item.starAnswer}
                      </p>
                      <div className="mt-4 flex items-center justify-end text-xs text-slate-400 italic gap-1">
                        <User className="w-3 h-3" />
                        Personalizado según tu CV
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PLAN TAB - GANTT STYLE */}
        {activeTab === 'plan' && (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-900">Plan de Preparación Estratégica</h3>
                <p className="text-slate-500">Sigue este cronograma de actividades para llegar a la entrevista con total confianza.</p>
              </div>

              <div className="relative">
                {/* Timeline vertical line */}
                <div className="absolute left-4 md:left-24 top-0 bottom-0 w-px bg-slate-200"></div>

                <div className="space-y-12">
                  {Object.keys(groupedPlan).map((day, dayIndex) => (
                    <div key={dayIndex} className="relative">
                      
                      {/* Day Header Marker */}
                      <div className="flex items-start mb-6">
                        <div className="hidden md:flex w-24 flex-col items-end pr-8 pt-1">
                           <span className="font-bold text-slate-900 text-sm">{day.split(':')[0]}</span>
                           <span className="text-xs text-slate-400">{day.split(':')[1]}</span>
                        </div>
                        <div className="absolute left-4 md:left-24 w-3 h-3 -ml-1.5 rounded-full bg-slate-400 border-2 border-white shadow-sm mt-1.5 z-10"></div>
                        
                        <div className="md:hidden pl-10 mb-2">
                           <h4 className="font-bold text-slate-900">{day}</h4>
                        </div>
                      </div>

                      {/* Tasks Container */}
                      <div className="pl-10 md:pl-32 space-y-4">
                        {groupedPlan[day].map((activity, actIndex) => {
                          const style = getCategoryStyles(activity.category);
                          
                          return (
                            <div key={actIndex} className="flex group">
                              {/* Gantt Bar Representation */}
                              <div className={`flex-1 rounded-lg border ${style.border} ${style.bg} p-4 transition-all hover:shadow-md hover:-translate-y-0.5 relative overflow-hidden`}>
                                {/* Left Color Bar */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${style.bar}`}></div>
                                
                                <div className="flex flex-col md:flex-row md:items-center gap-3">
                                  {/* Icon & Title */}
                                  <div className="flex items-center gap-3 md:w-1/3">
                                    <div className={`p-2 rounded-full bg-white/60 ${style.text}`}>
                                      {style.icon}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className={`text-[10px] font-bold uppercase tracking-wider ${style.text}`}>
                                        {activity.category}
                                      </span>
                                      <span className="font-semibold text-slate-900 text-sm">{activity.task}</span>
                                    </div>
                                  </div>
                                  
                                  {/* Description / Details */}
                                  <div className="md:w-2/3 md:border-l md:border-black/5 md:pl-4">
                                     <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                                       {activity.description}
                                     </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* End Marker */}
                <div className="flex items-center mt-12">
                   <div className="absolute left-4 md:left-24 w-4 h-4 -ml-2 rounded-full bg-slate-900 border-2 border-white shadow-sm z-10"></div>
                   <div className="pl-10 md:pl-32">
                      <div className="inline-flex items-center px-4 py-2 rounded-full bg-slate-900 text-white text-sm font-medium shadow-lg">
                        🏁 ¡Listo para la entrevista!
                      </div>
                   </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
