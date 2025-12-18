
import React, { useState, useMemo } from "react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { IkigaiDiagram } from "./IkigaiDiagram";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Edit3, Sparkles, Wand2, Info, CheckCircle2, ListTodo, Target, ChevronLeftSquare, ChevronRightSquare, Briefcase, Rocket, TrendingUp, User
} from "lucide-react";
import { CustomButton } from "./CustomButton";
import { analyzeIkigai } from "../services/geminiService";
import { IkigaiAnalysis } from "../types";

interface IkigaiPageProps {
  onBack: () => void;
}

const SECTIONS = [
  "basic", "love", "skill", "need", "money",
  "love-skill", "love-need", "skill-money", "need-money",
  "love-skill-need", "love-skill-money", "skill-need-money", "love-need-money",
  "love-skill-need-money"
];

const SECTION_INFO: Record<string, { title: string, subtitle: string, question: string }> = {
  "basic": { title: "Perfil Básico", subtitle: "Paso 0", question: "Completa tus datos para contextualizar tu análisis profesional." },
  "love": { title: "Pasión", subtitle: "(Lo que amas)", question: "¿Qué actividades te hacen perder la noción del tiempo y te llenan de energía?" },
  "skill": { title: "Habilidades", subtitle: "(En lo que eres bueno)", question: "¿Qué talentos tienes que otros suelen destacar o en qué has invertido tiempo formándote?" },
  "need": { title: "Vocación", subtitle: "(Lo que el mundo necesita)", question: "¿Qué problemas de tu entorno o de la sociedad te gustaría ayudar a resolver?" },
  "money": { title: "Sustento", subtitle: "(Por lo que te pueden pagar)", question: "¿Qué servicios o habilidades tuyas tienen demanda real en el mercado actual?" },
  "love-skill": { title: "Tu Pasión", subtitle: "(Amas + Eres bueno)", question: "Cuando combinas lo que te gusta con tu talento, ¿qué tipo de proyectos nacen?" },
  "love-need": { title: "Tu Misión", subtitle: "(Amas + El mundo necesita)", question: "¿De qué manera tu entusiasmo personal puede servir a una causa mayor?" },
  "skill-money": { title: "Tu Profesión", subtitle: "(Eres bueno + Te pagan)", question: "¿Cómo se traduce tu experiencia técnica en un valor económico sostenible?" },
  "need-money": { title: "Tu Vocación", subtitle: "(El mundo necesita + Te pagan)", question: "¿Qué necesidades del mercado puedes satisfacer de manera rentable?" },
  "love-skill-need": { title: "Personalidad", subtitle: "Intersección Triple", question: "¿Cómo se manifiesta tu identidad cuando ignoras la parte económica?" },
  "love-skill-money": { title: "Rareza", subtitle: "Intersección Triple", question: "¿Qué te hace único profesionalmente aunque no impactes masivamente?" },
  "skill-need-money": { title: "Arquetipo", subtitle: "Intersección Triple", question: "¿Cuál es tu rol funcional ideal en la sociedad?" },
  "love-need-money": { title: "Carrera", subtitle: "Intersección Triple", question: "¿Cómo visualizas tu trayectoria a largo plazo?" },
  "love-skill-need-money": { title: "Tu Ikigai Completo", subtitle: "El equilibrio perfecto", question: "Integrando todo lo anterior, ¿cuál es tu visión global de vida y carrera?" }
};

const TEXT_PAGINATION_LIMIT = 1500;
const RESPONSES_PER_PAGE = 5;

export const IkigaiPage: React.FC<IkigaiPageProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState("basic");
  const [viewMode, setViewMode] = useState<"questions" | "analysis">("questions");
  const [responses, setResponses] = useState<Record<string, string>>(
    SECTIONS.reduce((acc, s) => ({ ...acc, [s]: "" }), {})
  );

  const [basicFields, setBasicFields] = useState({
    age: "",
    status: "",
    goal: "",
    location: "",
    about: ""
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<IkigaiAnalysis | null>(null);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<string>("resumen");
  const [responsesPage, setResponsesPage] = useState(0);
  const [contentPage, setContentPage] = useState(0);

  const currentIndex = SECTIONS.indexOf(activeTab);
  const completedCount = Object.values(responses).filter((r: string) => r && r.trim() !== "").length + (basicFields.about ? 1 : 0);
  const isComplete = completedCount >= SECTIONS.length;

  const handleNext = () => { if (currentIndex < SECTIONS.length - 1) setActiveTab(SECTIONS[currentIndex + 1]); };
  const handlePrevious = () => { if (currentIndex > 0) setActiveTab(SECTIONS[currentIndex - 1]); };

  const handleEditIndividual = (section: string) => {
    setActiveTab(section);
    setViewMode("questions");
  };

  const handleDemo = () => {
    setBasicFields({
      age: "32",
      status: "Empleado estancado",
      goal: "Encontrar propósito y escalar ingresos",
      location: "Madrid",
      about: "Soy analista de datos con 8 años de experiencia, pero me apasiona la psicología."
    });
    const demoData: Record<string, string> = {
      "basic": "Perfil de analista de 32 años en Madrid buscando transición.",
      "love": "Me apasiona la educación, la tecnología creativa y ayudar a otros a entender conceptos complejos.",
      "skill": "Soy muy bueno analizando datos, comunicando ideas y programando soluciones con IA.",
      "need": "El mundo necesita profesionales que humanicen la tecnología y cierren la brecha digital.",
      "money": "Empresas de EdTech, consultoras de transformación digital y academias de formación.",
      "love-skill": "Crear tutoriales interactivos de alta calidad donde la estética y la lógica se unen.",
      "love-need": "Educar a la próxima generación en el uso ético y productivo de la inteligencia artificial.",
      "skill-money": "Desarrollador de software especializado en aplicaciones educativas con LLMs.",
      "need-money": "Consultoría estratégica para PYMES que quieren implementar IA de forma sencilla.",
      "love-skill-need": "Un facilitador tecnológico que encuentra gozo en la claridad y el servicio.",
      "love-skill-money": "Un perfil técnico-creativo con una voz única en el mercado hispanohablante.",
      "skill-need-money": "Arquitecto de soluciones de aprendizaje automatizado.",
      "love-need-money": "Líder de comunidad en una startup de impacto social y tecnológico.",
      "love-skill-need-money": "Mi Ikigai es democratizar el acceso a la IA mediante educación accesible y herramientas prácticas."
    };
    setResponses(demoData);
  };

  const handleGenerateAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const contextResponses = {
        ...responses,
        basic: `EDAD: ${basicFields.age}, ESTADO: ${basicFields.status}, META: ${basicFields.goal}, UBICACIÓN: ${basicFields.location}. RESUMEN: ${basicFields.about}`
      };
      const result = await analyzeIkigai(contextResponses);
      setAnalysisResult(result);
      setViewMode("analysis");
      setContentPage(0);
      setActiveAnalysisTab("resumen");
    } catch (error) {
      console.error("Error analizando Ikigai:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const paginateText = (text: string = "") => {
    const pages = [];
    let remaining = text;
    while (remaining.length > 0) {
      if (remaining.length <= TEXT_PAGINATION_LIMIT) {
        pages.push(remaining);
        break;
      }
      let splitIdx = remaining.lastIndexOf('.', TEXT_PAGINATION_LIMIT);
      if (splitIdx === -1) splitIdx = remaining.lastIndexOf(' ', TEXT_PAGINATION_LIMIT);
      if (splitIdx === -1) splitIdx = TEXT_PAGINATION_LIMIT;
      pages.push(remaining.substring(0, splitIdx + 1).trim());
      remaining = remaining.substring(splitIdx + 1).trim();
    }
    return pages.length > 0 ? pages : [""];
  };

  const activeContentPages = useMemo(() => {
    if (!analysisResult) return [""];
    if (activeAnalysisTab === 'resumen') return paginateText(analysisResult.resumen || "");
    if (activeAnalysisTab === 'diagnostico') return paginateText(analysisResult.diagnostico || "");
    return [""];
  }, [analysisResult, activeAnalysisTab]);

  const currentInfo = SECTION_INFO[activeTab];
  const filledSections = SECTIONS.filter(s => responses[s] && responses[s].trim() !== "");
  const responsesTotalPages = Math.ceil(filledSections.length / RESPONSES_PER_PAGE);
  const paginatedResponses = filledSections.slice(responsesPage * RESPONSES_PER_PAGE, (responsesPage + 1) * RESPONSES_PER_PAGE);

  const getPathIcon = (path?: string) => {
    switch (path) {
      case 'emprendedor': return <Rocket size={20} />;
      case 'empresario': return <TrendingUp size={20} />;
      case 'empleado': return <Briefcase size={20} />;
      default: return <User size={20} />;
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col w-full overflow-hidden">
      <header className="border-b border-gray-100 px-6 py-4 bg-white/80 backdrop-blur-md z-[60] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-2">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">IkigaiIA</h1>
        </div>
        <img
          src="https://www.learningheroes.com/_ipx/q_80/images/Logo.svg"
          className="h-8 md:h-10 w-auto invert brightness-0"
          alt="Learning Heroes"
        />
      </header>

      <main className="flex-1 max-w-[1600px] mx-auto w-full px-6 md:px-12 py-4 grid lg:grid-cols-2 gap-8 lg:gap-16 items-center overflow-hidden">
        {/* Columna Izquierda: Diagrama */}
        <div className="h-[700px] flex flex-col items-center justify-center animate-in slide-in-from-left duration-700 p-2">
          <div className="bg-slate-50 rounded-[3rem] p-8 md:p-12 border border-slate-100 shadow-inner flex flex-col items-center justify-center w-full h-full overflow-hidden">
            <IkigaiDiagram
              activeSection={activeTab}
              onSectionClick={(s) => {
                setActiveTab(s || "basic");
                setViewMode("questions");
              }}
            />

            <div className="mt-6 w-full max-w-sm flex flex-col gap-2 shrink-0 text-center">
              <button
                onClick={handleDemo}
                className="flex items-center justify-center gap-3 py-2.5 px-6 bg-white border border-slate-200 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-black hover:border-black transition-all shadow-sm group"
              >
                <Sparkles size={14} className="group-hover:animate-pulse" /> Rellenar Perfil Demo
              </button>
              <p className="text-[10px] text-slate-400 font-medium px-4 leading-relaxed">
                Haz clic fuera del diagrama para editar el perfil básico.
              </p>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Panel de Trabajo */}
        <div className="h-[700px] animate-in slide-in-from-right duration-700 p-2">
          {viewMode === "questions" ? (
            <section className="bg-white rounded-[2.5rem] border border-slate-200 p-6 md:p-8 shadow-2xl relative overflow-hidden h-full flex flex-col">
              <div className="space-y-4 mb-4 shrink-0">
                <div className="flex items-center justify-between">
                  <button onClick={handlePrevious} disabled={currentIndex === 0} className="p-2 text-slate-300 hover:text-black disabled:opacity-30 transition-colors">
                    <ChevronLeft size={24} />
                  </button>

                  <div className="text-center">
                    <h3 className="text-lg font-bold text-slate-900">
                      {currentInfo.title}
                    </h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      {currentInfo.subtitle}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-400">{completedCount}/{SECTIONS.length}</span>
                    <button onClick={handleNext} disabled={currentIndex === SECTIONS.length - 1} className="p-2 text-slate-300 hover:text-black disabled:opacity-30 transition-colors">
                      <ChevronRight size={24} />
                    </button>
                  </div>
                </div>

                <Progress value={(completedCount / SECTIONS.length) * 100} className="h-1 bg-slate-100" />
              </div>

              <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
                <div className="space-y-1 shrink-0">
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">{currentInfo.title}</h2>
                  <p className="text-slate-500 text-[11px] leading-relaxed">{currentInfo.question}</p>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col">
                  {activeTab === 'basic' ? (
                    <div className="flex flex-col gap-2.5 h-full overflow-hidden">
                      <div className="grid grid-cols-2 gap-2.5 shrink-0">
                        <div className="space-y-0.5">
                          <label className="text-[8px] font-bold uppercase text-slate-400 ml-1">Edad</label>
                          <input value={basicFields.age} onChange={e => setBasicFields({ ...basicFields, age: e.target.value })} type="text" placeholder="Ej: 32" className="w-full p-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:ring-1 focus:ring-slate-200 outline-none transition-all" />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[8px] font-bold uppercase text-slate-400 ml-1">Ubicación</label>
                          <input value={basicFields.location} onChange={e => setBasicFields({ ...basicFields, location: e.target.value })} type="text" placeholder="Ej: Madrid" className="w-full p-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:ring-1 focus:ring-slate-200 outline-none transition-all" />
                        </div>
                      </div>
                      <div className="space-y-0.5 shrink-0">
                        <label className="text-[8px] font-bold uppercase text-slate-400 ml-1">Estado Actual</label>
                        <input value={basicFields.status} onChange={e => setBasicFields({ ...basicFields, status: e.target.value })} type="text" placeholder="Situación laboral..." className="w-full p-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:ring-1 focus:ring-slate-200 outline-none transition-all" />
                      </div>
                      <div className="space-y-0.5 shrink-0">
                        <label className="text-[8px] font-bold uppercase text-slate-400 ml-1">Meta Principal</label>
                        <input value={basicFields.goal} onChange={e => setBasicFields({ ...basicFields, goal: e.target.value })} type="text" placeholder="¿Qué buscas lograr?" className="w-full p-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:ring-1 focus:ring-slate-200 outline-none transition-all" />
                      </div>
                      <div className="space-y-0.5 flex-1 flex flex-col overflow-hidden min-h-0">
                        <label className="text-[8px] font-bold uppercase text-slate-400 ml-1">Sobre ti</label>
                        <textarea value={basicFields.about} onChange={e => setBasicFields({ ...basicFields, about: e.target.value })} placeholder="Cuéntanos un poco más de tu trayectoria..." className="w-full flex-1 p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs focus:ring-1 focus:ring-slate-200 outline-none transition-all resize-none min-h-0" />
                      </div>
                    </div>
                  ) : (
                    <textarea
                      value={responses[activeTab]}
                      onChange={(e) => setResponses({ ...responses, [activeTab]: e.target.value })}
                      className="w-full h-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] focus:ring-2 focus:ring-slate-100 outline-none transition-all resize-none text-sm leading-relaxed shadow-inner"
                      placeholder="Escribe tus reflexiones aquí..."
                    />
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex gap-4 shrink-0">
                <CustomButton
                  className="flex-1 py-3 text-sm rounded-2xl shadow-lg transition-all bg-black hover:bg-slate-800 active:scale-[0.98]"
                  onClick={isComplete ? handleGenerateAnalysis : handleNext}
                  isLoading={isAnalyzing}
                  icon={isComplete ? <Wand2 size={18} /> : <ChevronRight size={18} />}
                >
                  {isComplete ? "Generar análisis con IA" : "Siguiente paso"}
                </CustomButton>
              </div>
            </section>
          ) : (
            <section className="bg-white rounded-[2.5rem] border border-slate-200 p-6 md:p-8 shadow-2xl h-full flex flex-col animate-in fade-in duration-700 overflow-hidden">
              <div className="mb-4 shrink-0">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">Análisis de IA de tu Ikigai</h2>
              </div>

              <div className="grid grid-cols-5 bg-slate-50 p-1 rounded-2xl mb-4 gap-1 shrink-0">
                {[
                  { id: 'resumen', label: 'RESUMEN' },
                  { id: 'proposito', label: 'PROPÓSITO' },
                  { id: 'diagnostico', label: 'DIAGNÓSTICO' },
                  { id: 'recomendaciones', label: 'CONSEJOS' },
                  { id: 'respuestas', label: 'RESPUESTAS' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveAnalysisTab(t.id);
                      setResponsesPage(0);
                      setContentPage(0);
                    }}
                    className={`py-2 rounded-xl text-[7px] md:text-[8px] font-bold tracking-widest transition-all ${activeAnalysisTab === t.id ? 'bg-white text-black shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 bg-blue-50/50 rounded-[2rem] border border-blue-100/50 p-5 md:p-6 overflow-hidden flex flex-col relative">
                {activeAnalysisTab === 'resumen' && (
                  <div className="space-y-4 animate-in fade-in duration-300 flex-1 flex flex-col overflow-hidden">
                    <h4 className="flex items-center gap-2 text-blue-900 font-bold shrink-0 text-xs"><Info size={14} /> Conclusión de Carrera</h4>
                    <div className="flex-1 flex flex-col justify-between overflow-hidden">
                      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                        <p className="text-slate-700 leading-relaxed text-xs md:text-sm">
                          {activeContentPages[contentPage] || "Generando..."}
                        </p>
                      </div>

                      {/* Tarjeta de Perfil Sugerido Integrada */}
                      {contentPage === activeContentPages.length - 1 && (
                        <div className="mt-2 p-4 md:p-5 bg-white rounded-3xl border border-blue-100 shadow-sm animate-in slide-in-from-bottom-4 duration-500 shrink-0">
                          <div className="flex items-center gap-4 mb-2">
                            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shrink-0">
                              {getPathIcon(analysisResult?.caminoRecomendado)}
                            </div>
                            <div>
                              <p className="text-[8px] font-bold uppercase tracking-widest text-blue-500">Perfil Sugerido</p>
                              <h5 className="text-sm md:text-base font-bold capitalize text-slate-900">{analysisResult?.caminoRecomendado}</h5>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-600 mb-2 italic leading-snug line-clamp-none">"{analysisResult?.explicacionCamino}"</p>
                          <Button
                            className="w-full bg-black text-white rounded-xl py-4 font-bold uppercase tracking-widest text-[9px] shadow-lg hover:scale-[1.02] transition-transform h-auto"
                            onClick={onBack}
                          >
                            Ir a seleccionar mi camino
                          </Button>
                        </div>
                      )}
                    </div>

                    {activeContentPages.length > 1 && (
                      <div className="flex items-center justify-center gap-3 pt-2 border-t border-blue-100/50 shrink-0">
                        <button disabled={contentPage === 0} onClick={() => setContentPage(p => p - 1)} className="p-1 text-blue-900 disabled:opacity-30"><ChevronLeftSquare size={18} /></button>
                        <span className="text-[8px] font-bold text-blue-900 uppercase tracking-tighter">PARTE {contentPage + 1} DE {activeContentPages.length}</span>
                        <button disabled={contentPage === activeContentPages.length - 1} onClick={() => setContentPage(p => p + 1)} className="p-1 text-blue-900 disabled:opacity-30"><ChevronRightSquare size={18} /></button>
                      </div>
                    )}
                  </div>
                )}

                {activeAnalysisTab === 'proposito' && (
                  <div className="space-y-6 animate-in fade-in duration-300 h-full flex flex-col justify-center text-center overflow-hidden">
                    <div className="p-8 bg-white rounded-[3rem] shadow-xl border border-blue-100 max-w-[320px] mx-auto">
                      <h4 className="text-[9px] font-bold uppercase tracking-widest text-blue-500 mb-6">Tu frase Ikigai definida</h4>
                      <p className="text-xl md:text-2xl font-bold text-slate-900 italic leading-tight">"{analysisResult?.proposito}"</p>
                    </div>
                  </div>
                )}

                {activeAnalysisTab === 'diagnostico' && (
                  <div className="space-y-4 animate-in fade-in duration-300 flex-1 flex flex-col overflow-hidden">
                    <h4 className="flex items-center gap-2 text-blue-900 font-bold shrink-0 text-xs"><Target size={14} /> Diagnóstico de Equilibrio</h4>
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                      <p className="text-slate-700 leading-relaxed text-xs md:text-sm">
                        {activeContentPages[contentPage]}
                      </p>
                    </div>
                    {activeContentPages.length > 1 && (
                      <div className="flex items-center justify-center gap-3 pt-2 border-t border-blue-100/50 shrink-0">
                        <button disabled={contentPage === 0} onClick={() => setContentPage(p => p - 1)} className="p-1 text-blue-900 disabled:opacity-30"><ChevronLeftSquare size={18} /></button>
                        <span className="text-[8px] font-bold text-blue-900 uppercase tracking-tighter">PÁGINA {contentPage + 1}</span>
                        <button disabled={contentPage === activeContentPages.length - 1} onClick={() => setContentPage(p => p + 1)} className="p-1 text-blue-900 disabled:opacity-30"><ChevronRightSquare size={18} /></button>
                      </div>
                    )}
                  </div>
                )}

                {activeAnalysisTab === 'recomendaciones' && (
                  <div className="space-y-4 animate-in fade-in duration-300 flex-1 flex flex-col overflow-hidden">
                    <h4 className="flex items-center gap-2 text-blue-900 font-bold shrink-0 text-xs"><ListTodo size={14} /> Pasos Accionables</h4>
                    <div className="flex-1 space-y-2.5 overflow-hidden">
                      {(analysisResult?.recomendaciones || []).slice(contentPage * 4, (contentPage + 1) * 4).map((rec, i) => (
                        <li key={i} className="flex gap-3 p-3.5 bg-white rounded-2xl border border-blue-50 shadow-sm list-none items-start animate-in slide-in-from-left duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                          <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">{(contentPage * 4) + i + 1}</span>
                          <p className="text-slate-700 text-[11px] font-medium leading-relaxed">{rec}</p>
                        </li>
                      ))}
                    </div>
                    {analysisResult?.recomendaciones && analysisResult.recomendaciones.length > 4 && (
                      <div className="flex items-center justify-center gap-3 pt-2 border-t border-blue-100/50 shrink-0">
                        <button disabled={contentPage === 0} onClick={() => setContentPage(p => p - 1)} className="p-1 text-blue-900 disabled:opacity-30"><ChevronLeftSquare size={18} /></button>
                        <span className="text-[8px] font-bold text-blue-900 uppercase">MÁS CONSEJOS</span>
                        <button disabled={(contentPage + 1) * 4 >= (analysisResult.recomendaciones.length || 0)} onClick={() => setContentPage(p => p + 1)} className="p-1 text-blue-900 disabled:opacity-30"><ChevronRightSquare size={18} /></button>
                      </div>
                    )}
                  </div>
                )}

                {activeAnalysisTab === 'respuestas' && (
                  <div className="space-y-4 animate-in fade-in duration-300 flex-1 flex flex-col overflow-hidden">
                    <h4 className="flex items-center gap-2 text-blue-900 font-bold shrink-0 text-xs"><CheckCircle2 size={14} /> Repaso de reflexiones</h4>
                    <div className="flex-1 space-y-2.5 overflow-hidden">
                      {paginatedResponses.map((s, idx) => (
                        <div key={s} className="bg-white p-3.5 rounded-2xl border border-slate-100 group relative animate-in slide-in-from-left duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                          <button
                            onClick={() => handleEditIndividual(s)}
                            className="absolute top-2.5 right-2.5 p-1 text-slate-300 hover:text-black hover:bg-slate-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Edit3 size={11} />
                          </button>
                          <p className="text-[7px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{SECTION_INFO[s].title}</p>
                          <p className="text-[10px] text-slate-700 leading-relaxed line-clamp-2">{responses[s]}</p>
                        </div>
                      ))}
                    </div>

                    {responsesTotalPages > 1 && (
                      <div className="flex items-center justify-center gap-3 pt-2 border-t border-blue-100/50 shrink-0">
                        <button disabled={responsesPage === 0} onClick={() => setResponsesPage(p => p - 1)} className="p-1 text-blue-900 disabled:opacity-30"><ChevronLeftSquare size={18} /></button>
                        <span className="text-[8px] font-bold text-blue-900 uppercase tracking-tighter">PÁG {responsesPage + 1} DE {responsesTotalPages}</span>
                        <button disabled={responsesPage === responsesTotalPages - 1} onClick={() => setResponsesPage(p => p + 1)} className="p-1 text-blue-900 disabled:opacity-30"><ChevronRightSquare size={18} /></button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-center shrink-0">
                <Button variant="ghost" className="text-slate-400 hover:text-black font-bold uppercase tracking-widest text-[8px] h-auto py-1" onClick={() => setViewMode("questions")}>
                  <ArrowLeft size={10} className="mr-2" /> Volver a las preguntas
                </Button>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};
