
import React, { useState } from "react";
import { 
  ArrowLeft, BrainCircuit, UploadCloud, Link as LinkIcon, 
  LayoutDashboard, FileText, Users, DollarSign, 
  CheckCircle, Target, Info, Lightbulb, X, Plus, 
  TrendingUp, RefreshCcw, Anchor, Maximize, Trash2, PieChart as PieChartIcon,
  Calculator, Landmark, Briefcase, Handshake
} from "lucide-react";
import { CustomButton } from "./CustomButton";
import { 
  EmprendedorSection, StrategicPlan, FinancialItem, NetworkingContact
} from "../types";
import { generateBusinessPlan } from "../services/geminiService";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface EmprendedorPageProps {
  onBack: () => void;
}

const COLORS = ['#000000', '#2563eb', '#4f46e5', '#7c3aed', '#db2777', '#ea580c'];

// --- SUBCOMPONENTES ---

const Modal = ({ isOpen, onClose, data, title }: any) => {
  if (!isOpen || !data) return null;
  
  // Helper to ensure we have content even if the data structure varies slightly
  const description = data.description || data.context || "No hay descripción disponible.";
  const strategy = data.recommendation || data.strategy || "Estrategia no definida.";
  const action = data.actionStep || "Sin acción inmediata.";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-8 border-b border-gray-100 flex justify-between items-start sticky top-0 bg-white z-10">
          <div>
            <h4 className="text-[10px] font-bold text-blue-600 mb-1 uppercase tracking-widest">{title}</h4>
            <h2 className="text-2xl font-bold tracking-tight">{data.title || data.role || "Detalle"}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-black">
            <X size={24}/>
          </button>
        </div>
        <div className="p-8 space-y-6">
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <h3 className="flex items-center gap-2 font-bold text-gray-800 mb-2 text-sm uppercase tracking-wide"><Info size={16}/> Contexto</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
              <h3 className="flex items-center gap-2 font-bold text-blue-800 mb-2 text-sm uppercase tracking-wide"><Lightbulb size={16}/> Estrategia</h3>
              <p className="text-blue-900/70 text-sm leading-relaxed">{strategy}</p>
            </div>
            {/* Only show Action/Reason box if data exists, or if it's a generic modal */}
            {data.actionStep && (
              <div className="bg-black p-6 rounded-2xl">
                <h3 className="flex items-center gap-2 font-bold text-white mb-2 text-sm uppercase tracking-wide"><Target size={16}/> Próximo Paso</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{data.actionStep}</p>
              </div>
            )}
            {/* Special handling for Networking modal reusing this component */}
            {data.reason && (
               <div className="bg-black p-6 rounded-2xl">
                <h3 className="flex items-center gap-2 font-bold text-white mb-2 text-sm uppercase tracking-wide"><Target size={16}/> Razón de contacto</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{data.reason}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardSection = ({ plan }: { plan: StrategicPlan }) => {
  const [selected, setSelected] = useState<any>(null);
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-black text-white p-8 rounded-3xl shadow-xl">
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Impacto</h3>
          <p className="text-4xl font-bold">{plan.criticalActions?.length || 0}</p>
          <p className="text-xs text-gray-500 mt-2">Acciones críticas identificadas</p>
        </div>
        <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Enfoque</h3>
          <p className="text-4xl font-bold text-blue-600">Alta</p>
          <p className="text-xs text-gray-400 mt-2">Prioridad estratégica</p>
        </div>
        <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">ICP</h3>
          <p className="text-4xl font-bold text-emerald-600">{plan.icp?.painPoints?.length || 0}</p>
          <p className="text-xs text-gray-400 mt-2">Puntos de dolor resueltos</p>
        </div>
      </div>
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
          <CheckCircle className="text-black" />
          <h3 className="font-bold text-xl">Plan de Acción Inmediato</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {plan.criticalActions?.map((action, i) => (
            <div key={i} onClick={() => setSelected({ title: action.title, description: action.context, recommendation: action.description, actionStep: action.suggestion })} className="p-6 hover:bg-gray-50 cursor-pointer transition-all group">
              <div className="flex items-start gap-4">
                <span className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-bold text-xs shrink-0">{i+1}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold group-hover:text-blue-600 transition-colors truncate">{action.title}</h4>
                  <p className="text-sm text-gray-500 line-clamp-1">{action.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} data={selected} title="Acción Crítica" />
    </div>
  );
};

const PlannerSection = ({ plan }: { plan: StrategicPlan }) => {
  const [tab, setTab] = useState<'SWOT' | 'CAME' | 'BMC' | 'ICP'>('SWOT');
  const [selected, setSelected] = useState<any>(null);

  // Updated Card with robust wrapping
  const Card = ({ item, color }: any) => (
    <div onClick={() => setSelected(item)} className={`p-5 bg-white rounded-2xl border border-gray-100 cursor-pointer hover:shadow-md transition-all group ${color} w-full h-full flex flex-col`}>
      <h4 className="font-bold text-sm mb-2 group-hover:text-blue-600 break-words">{item.title}</h4>
      <p className="text-xs text-gray-500 line-clamp-3 break-words leading-relaxed flex-1">{item.description}</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex bg-gray-100 p-1 rounded-2xl w-fit">
        {['SWOT', 'CAME', 'BMC', 'ICP'].map((t: any) => (
          <button key={t} onClick={() => setTab(t)} className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${tab === t ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}>{t}</button>
        ))}
      </div>
      
      {/* SWOT Fixed Layout */}
      {tab === 'SWOT' && (
        <div className="grid md:grid-cols-2 gap-6 items-start">
          <div className="space-y-6">
            <div className="space-y-3">
               <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 flex items-center gap-2"><CheckCircle size={14}/> Fortalezas</h4>
               <div className="grid gap-3">{plan.swot?.strengths?.map((it: any, i: number) => <Card key={i} item={it} color="hover:border-emerald-200" />)}</div>
            </div>
            <div className="space-y-3">
               <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-600 flex items-center gap-2"><RefreshCcw size={14}/> Oportunidades</h4>
               <div className="grid gap-3">{plan.swot?.opportunities?.map((it: any, i: number) => <Card key={i} item={it} color="hover:border-blue-200" />)}</div>
            </div>
          </div>
          <div className="space-y-6">
             <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-red-600 flex items-center gap-2"><Anchor size={14}/> Debilidades</h4>
                <div className="grid gap-3">{plan.swot?.weaknesses?.map((it: any, i: number) => <Card key={i} item={it} color="hover:border-red-200" />)}</div>
             </div>
             <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-orange-600 flex items-center gap-2"><TrendingUp size={14}/> Amenazas</h4>
                <div className="grid gap-3">{plan.swot?.threats?.map((it: any, i: number) => <Card key={i} item={it} color="hover:border-orange-200" />)}</div>
             </div>
          </div>
        </div>
      )}

      {tab === 'CAME' && (
        <div className="grid md:grid-cols-2 gap-6 items-start">
          <div className="space-y-6">
            <div className="space-y-3">
               <h4 className="text-[10px] font-bold uppercase tracking-widest text-purple-600 flex items-center gap-2"><RefreshCcw size={14}/> Corregir (Debilidades)</h4>
               <div className="grid gap-3">{plan.came?.correct?.map((it: any, i: number) => <Card key={i} item={it} color="hover:border-purple-200" />)}</div>
            </div>
            <div className="space-y-3">
               <h4 className="text-[10px] font-bold uppercase tracking-widest text-teal-600 flex items-center gap-2"><CheckCircle size={14}/> Mantener (Fortalezas)</h4>
               <div className="grid gap-3">{plan.came?.maintain?.map((it: any, i: number) => <Card key={i} item={it} color="hover:border-teal-200" />)}</div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="space-y-3">
               <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 flex items-center gap-2"><Anchor size={14}/> Afrontar (Amenazas)</h4>
               <div className="grid gap-3">{plan.came?.adapt?.map((it: any, i: number) => <Card key={i} item={it} color="hover:border-indigo-200" />)}</div>
            </div>
            <div className="space-y-3">
               <h4 className="text-[10px] font-bold uppercase tracking-widest text-pink-600 flex items-center gap-2"><Maximize size={14}/> Explotar (Oportunidades)</h4>
               <div className="grid gap-3">{plan.came?.explore?.map((it: any, i: number) => <Card key={i} item={it} color="hover:border-pink-200" />)}</div>
            </div>
          </div>
        </div>
      )}

      {tab === 'BMC' && (
        <div className="overflow-x-auto pb-4">
          <div className="min-w-[1000px] grid grid-cols-5 grid-rows-2 gap-2 h-[600px]">
            <div className="row-span-2 border border-gray-100 bg-white rounded-2xl p-4 flex flex-col">
              <h5 className="text-[10px] font-bold uppercase text-gray-400 mb-3">Socios Clave</h5>
              <div className="space-y-2">{plan.bmc?.keyPartners?.map((it: any, i: number) => <div key={i} onClick={() => setSelected(it)} className="p-2 bg-gray-50 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-black hover:text-white transition-colors">{it.title}</div>)}</div>
            </div>
            <div className="border border-gray-100 bg-white rounded-2xl p-4 flex flex-col">
              <h5 className="text-[10px] font-bold uppercase text-gray-400 mb-3">Actividades Clave</h5>
              <div className="space-y-2 overflow-y-auto custom-scrollbar">{plan.bmc?.keyActivities?.map((it: any, i: number) => <div key={i} onClick={() => setSelected(it)} className="p-2 bg-gray-50 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-black hover:text-white transition-colors">{it.title}</div>)}</div>
            </div>
            <div className="row-span-2 border border-gray-100 bg-white rounded-2xl p-4 flex flex-col">
              <h5 className="text-[10px] font-bold uppercase text-gray-400 mb-3">Propuesta Valor</h5>
              <div className="space-y-2 overflow-y-auto custom-scrollbar">{plan.bmc?.valuePropositions?.map((it: any, i: number) => <div key={i} onClick={() => setSelected(it)} className="p-2 bg-gray-50 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-black hover:text-white transition-colors">{it.title}</div>)}</div>
            </div>
            <div className="border border-gray-100 bg-white rounded-2xl p-4 flex flex-col">
              <h5 className="text-[10px] font-bold uppercase text-gray-400 mb-3">Relaciones Cliente</h5>
              <div className="space-y-2 overflow-y-auto custom-scrollbar">{plan.bmc?.customerRelationships?.map((it: any, i: number) => <div key={i} onClick={() => setSelected(it)} className="p-2 bg-gray-50 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-black hover:text-white transition-colors">{it.title}</div>)}</div>
            </div>
            <div className="row-span-2 border border-gray-100 bg-white rounded-2xl p-4 flex flex-col">
              <h5 className="text-[10px] font-bold uppercase text-gray-400 mb-3">Segmentos Clientes</h5>
              <div className="space-y-2">{plan.bmc?.customerSegments?.map((it: any, i: number) => <div key={i} onClick={() => setSelected(it)} className="p-2 bg-gray-50 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-black hover:text-white transition-colors">{it.title}</div>)}</div>
            </div>
            <div className="border border-gray-100 bg-white rounded-2xl p-4 flex flex-col">
               <h5 className="text-[10px] font-bold uppercase text-gray-400 mb-3">Recursos Clave</h5>
               <div className="space-y-2 overflow-y-auto custom-scrollbar">{plan.bmc?.keyResources?.map((it: any, i: number) => <div key={i} onClick={() => setSelected(it)} className="p-2 bg-gray-50 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-black hover:text-white transition-colors">{it.title}</div>)}</div>
            </div>
            <div className="border border-gray-100 bg-white rounded-2xl p-4 flex flex-col">
               <h5 className="text-[10px] font-bold uppercase text-gray-400 mb-3">Canales</h5>
               <div className="space-y-2 overflow-y-auto custom-scrollbar">{plan.bmc?.channels?.map((it: any, i: number) => <div key={i} onClick={() => setSelected(it)} className="p-2 bg-gray-50 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-black hover:text-white transition-colors">{it.title}</div>)}</div>
            </div>
          </div>
        </div>
      )}

      {tab === 'ICP' && (
        <div className="space-y-8">
          <div className="bg-black text-white p-10 rounded-3xl shadow-xl">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Perfil General</h4>
            <p className="text-2xl font-bold tracking-tight mb-4">{plan.icp?.description}</p>
            <div className="bg-white/10 p-4 rounded-2xl border border-white/5">
              <span className="text-[10px] font-bold uppercase text-gray-400">Demografía:</span>
              <p className="text-sm">{plan.icp?.demographics}</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-red-600">Puntos de Dolor</h4>
              <div className="grid gap-3">{plan.icp?.painPoints?.map((it: any, i: number) => (
                <div key={i} onClick={() => setSelected({...it, context: it.description})} className="p-5 bg-white rounded-2xl border border-gray-100 cursor-pointer hover:shadow-md transition-all group hover:border-red-200 w-full h-full flex flex-col">
                  <h4 className="font-bold text-sm mb-2 group-hover:text-blue-600 break-words">{it.title}</h4>
                  <p className="text-xs text-gray-500 line-clamp-3 break-words leading-relaxed flex-1">{it.description}</p>
                </div>
              ))}</div>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Objetivos del Cliente</h4>
              <div className="grid gap-3">{plan.icp?.objectives?.map((it: any, i: number) => (
                <div key={i} onClick={() => setSelected({...it, context: it.description})} className="p-5 bg-white rounded-2xl border border-gray-100 cursor-pointer hover:shadow-md transition-all group hover:border-emerald-200 w-full h-full flex flex-col">
                  <h4 className="font-bold text-sm mb-2 group-hover:text-blue-600 break-words">{it.title}</h4>
                  <p className="text-xs text-gray-500 line-clamp-3 break-words leading-relaxed flex-1">{it.description}</p>
                </div>
              ))}</div>
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} data={selected} title="Detalle Estratégico" />
    </div>
  );
};

const NetworkingSection = ({ plan }: { plan: StrategicPlan }) => {
  const [selected, setSelected] = useState<any>(null);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-gradient-to-br from-indigo-900 to-black text-white p-10 rounded-[40px] shadow-2xl">
        <h2 className="text-3xl font-bold mb-4">Estrategia de Conexiones</h2>
        <p className="text-indigo-200 max-w-xl">El éxito de tu emprendimiento depende de quién conoces y cómo aportas valor a esas relaciones. Aquí tienes tu mapa de alianzas clave.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {plan.networking?.map((contact, i) => (
          <div key={i} onClick={() => setSelected(contact)} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-start justify-between mb-4">
               <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-black group-hover:text-white transition-colors">
                  <Users size={24} />
               </div>
               <span className="text-[10px] font-bold uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full text-gray-500">
                 {contact.organizationType}
               </span>
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">{contact.role}</h3>
            <p className="text-sm text-gray-500 line-clamp-2 mb-4">{contact.strategy}</p>
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
              <span>Ver estrategia completa</span>
              <ArrowLeft className="rotate-180" size={12} />
            </div>
          </div>
        ))}
      </div>
       <Modal isOpen={!!selected} onClose={() => setSelected(null)} data={selected} title="Networking Táctico" />
    </div>
  );
};

const BudgetSection = ({ plan }: { plan: StrategicPlan }) => {
  const [showInvestment, setShowInvestment] = useState(true);

  // Prepare data for chart
  const investmentData = plan.financials?.initialInvestment?.map(item => ({
    name: item.concept,
    value: parseFloat(item.amount.replace(/[^0-9.]/g, '') || "0")
  })) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
       <div className="grid md:grid-cols-2 gap-6">
         <div className="bg-black text-white p-8 rounded-[40px] shadow-xl flex flex-col justify-between">
           <div>
             <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Punto de Equilibrio (Break-Even)</h4>
             <p className="text-xl md:text-2xl font-bold leading-tight">{plan.financials?.breakEvenPoint}</p>
           </div>
           <div className="mt-8">
             <Calculator className="text-gray-500 mb-2" />
             <p className="text-xs text-gray-500">Momento estimado en el que los ingresos cubren los gastos.</p>
           </div>
         </div>
         <div className="bg-emerald-50 text-emerald-900 p-8 rounded-[40px] border border-emerald-100 flex flex-col justify-between">
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-2">Proyección de Ingresos</h4>
              <p className="text-sm md:text-base font-medium leading-relaxed">{plan.financials?.revenueProjections}</p>
            </div>
            <div className="mt-8">
              <TrendingUp className="text-emerald-400 mb-2" />
              <p className="text-xs text-emerald-600/70">Escenario base estimado.</p>
            </div>
         </div>
       </div>

       <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
             <h3 className="font-bold text-xl">Estructura Financiera</h3>
             <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
               <button onClick={() => setShowInvestment(true)} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${showInvestment ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}>Inversión</button>
               <button onClick={() => setShowInvestment(false)} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${!showInvestment ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}>Costes Mes</button>
             </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
             <div className="space-y-4">
                {(showInvestment ? plan.financials?.initialInvestment : plan.financials?.monthlyCosts)?.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-50 hover:border-gray-200 transition-all">
                     <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${item.type === 'fixed' || item.type === 'investment' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                           {item.type === 'investment' ? <Landmark size={16}/> : <PieChartIcon size={16}/>}
                        </div>
                        <div>
                           <p className="font-bold text-sm text-gray-900">{item.concept}</p>
                           <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{item.type === 'investment' ? 'CAPEX' : item.type === 'fixed' ? 'Fijo' : 'Variable'}</p>
                        </div>
                     </div>
                     <p className="font-mono font-bold text-gray-900">{item.amount}</p>
                  </div>
                ))}
             </div>
             
             {/* Simple Chart for Investment Only */}
             {showInvestment && investmentData.length > 0 ? (
                <div className="h-[300px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie
                         data={investmentData}
                         cx="50%"
                         cy="50%"
                         innerRadius={60}
                         outerRadius={100}
                         paddingAngle={5}
                         dataKey="value"
                       >
                         {investmentData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                         ))}
                       </Pie>
                       <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                       />
                       <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
                     </PieChart>
                   </ResponsiveContainer>
                </div>
             ) : (
                <div className="flex items-center justify-center h-[300px] bg-gray-50 rounded-[40px] text-gray-300">
                   <p>Gráfico no disponible para esta vista</p>
                </div>
             )}
          </div>
       </div>
    </div>
  );
};

export const EmprendedorPage: React.FC<EmprendedorPageProps> = ({ onBack }) => {
  const [section, setSection] = useState<EmprendedorSection>(EmprendedorSection.INPUT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<StrategicPlan | null>(null);

  const [inputData, setInputData] = useState({
    context: "",
    urls: "",
    files: [] as File[]
  });

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputData.context) { setError("El contexto es obligatorio."); return; }
    setLoading(true); setError(null);
    try {
      const result = await generateBusinessPlan(inputData.context, inputData.urls, inputData.files);
      setPlan(result);
      setSection(EmprendedorSection.DASHBOARD);
    } catch (err: any) {
      console.error("Error generating plan:", err);
      setError("No se pudo generar el plan. Intenta con una descripción más detallada.");
    } finally { setLoading(false); }
  };

  const handleHeaderBack = () => {
    if (section !== EmprendedorSection.INPUT) {
      setSection(EmprendedorSection.INPUT);
    } else {
      onBack();
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 animate-in fade-in">
      <div className="p-6 bg-black rounded-3xl mb-8 animate-pulse shadow-2xl">
        <BrainCircuit size={60} className="text-white" />
      </div>
      <h2 className="text-3xl font-bold tracking-tight mb-2">Diseñando Estrategia...</h2>
      <p className="text-gray-400 text-center max-w-sm">La IA está analizando tu contexto, investigando la competencia y construyendo tu plan de negocio completo (Estrategia, Finanzas, Redes) en tiempo real.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-100 px-6 py-4 sticky top-0 bg-gradient-to-l from-black/10 via-white/50 to-white z-[60] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={handleHeaderBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-2">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold tracking-tight">EmprendedorIA</h1>
        </div>
        <div className="flex items-center gap-4">
          {plan && (
            <div className="hidden md:flex bg-gray-100 p-1 rounded-xl">
              {[
                { id: EmprendedorSection.DASHBOARD, label: 'Inicio', icon: <LayoutDashboard size={14}/> },
                { id: EmprendedorSection.PLANNER, label: 'Estrategia', icon: <FileText size={14}/> },
                { id: EmprendedorSection.NETWORKING, label: 'Redes', icon: <Users size={14}/> },
                { id: EmprendedorSection.BUDGET, label: 'Presupuesto', icon: <DollarSign size={14}/> }
              ].map((nav) => (
                <button key={nav.id} onClick={() => setSection(nav.id)} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${section === nav.id ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                  {nav.icon} {nav.label}
                </button>
              ))}
            </div>
          )}
          <img 
            src="https://www.learningheroes.com/_ipx/q_80/images/Logo.svg" 
            className="h-8 md:h-10 w-auto invert brightness-0" 
            alt="Learning Heroes" 
          />
        </div>
      </header>

      {/* Mobile Nav */}
      {plan && (
        <div className="md:hidden flex bg-gray-50 p-2 border-b border-gray-100 sticky top-[65px] z-50 overflow-x-auto gap-2">
           {[
              { id: EmprendedorSection.DASHBOARD, label: 'Inicio', icon: <LayoutDashboard size={14}/> },
              { id: EmprendedorSection.PLANNER, label: 'Estrategia', icon: <FileText size={14}/> },
              { id: EmprendedorSection.NETWORKING, label: 'Redes', icon: <Users size={14}/> },
              { id: EmprendedorSection.BUDGET, label: 'Presupuesto', icon: <DollarSign size={14}/> }
            ].map((nav) => (
              <button key={nav.id} onClick={() => setSection(nav.id)} className={`px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap transition-all ${section === nav.id ? 'bg-black text-white' : 'text-gray-400'}`}>
                {nav.icon} {nav.label}
              </button>
            ))}
        </div>
      )}

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-12">
        {section === EmprendedorSection.INPUT && (
          <div className="grid md:grid-cols-2 gap-16">
            <section className="space-y-8 animate-in slide-in-from-left duration-700">
              <div className="space-y-2">
                <h2 className="text-4xl font-bold tracking-tight">Tu próxima gran idea</h2>
                <p className="text-gray-500">Define tu visión y deja que la IA construya la estrategia completa.</p>
              </div>
              <form onSubmit={handleProcess} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Contexto del Negocio</label>
                  <textarea value={inputData.context} onChange={e => setInputData({...inputData, context: e.target.value})} placeholder="Describe tu negocio, público objetivo, competencia y qué quieres lograr..." className="w-full p-6 bg-gray-50 border border-gray-200 rounded-3xl h-48 focus:ring-2 focus:ring-black outline-none transition-all resize-none text-sm"/>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Referencias Web</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                    <input type="text" value={inputData.urls} onChange={e => setInputData({...inputData, urls: e.target.value})} placeholder="Webs de competencia o inspiración (separado por comas)..." className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-black outline-none text-sm"/>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Anexos Técnicos</label>
                  <div className="border-2 border-dashed border-gray-100 rounded-3xl p-8 text-center hover:bg-gray-50 transition-colors relative cursor-pointer group">
                    <input type="file" multiple onChange={e => setInputData({...inputData, files: Array.from(e.target.files || [])})} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <UploadCloud size={40} className="mx-auto text-gray-200 mb-4 group-hover:text-black transition-colors" />
                    <p className="text-sm font-bold">{inputData.files.length > 0 ? `${inputData.files.length} archivos seleccionados` : 'Sube PDFs o Excel de base'}</p>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tighter">Opcional para un análisis profundo</p>
                  </div>
                </div>
                <CustomButton className="w-full py-5 text-xl" isLoading={loading}>Generar Plan Maestro</CustomButton>
                {error && <p className="text-red-500 text-xs text-center font-bold bg-red-50 p-4 rounded-2xl border border-red-100">{error}</p>}
              </form>
            </section>
            <section className="bg-gray-50 rounded-[40px] p-12 flex flex-col justify-center text-center space-y-8 animate-in slide-in-from-right duration-700">
               <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm border border-gray-100">
                 <Target size={40} className="text-black" />
               </div>
               <div className="space-y-4">
                 <h3 className="text-3xl font-bold tracking-tight">Análisis Inteligente</h3>
                 <p className="text-gray-400 leading-relaxed text-sm">No es solo una plantilla. Investigamos tendencias reales del mercado y adaptamos modelos probados (BMC, DAFO, CAME) específicamente a tu visión emprendedora.</p>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white p-4 rounded-2xl border border-gray-100 text-xs font-bold uppercase tracking-widest text-gray-400">
                    <BrainCircuit size={16} className="mx-auto mb-2 text-black" />
                    Herramientas
                 </div>
                 <div className="bg-white p-4 rounded-2xl border border-gray-100 text-xs font-bold uppercase tracking-widest text-gray-400">
                    <TrendingUp size={16} className="mx-auto mb-2 text-black" />
                    Crecimiento
                 </div>
               </div>
            </section>
          </div>
        )}

        {plan && section === EmprendedorSection.DASHBOARD && <DashboardSection plan={plan} />}
        {plan && section === EmprendedorSection.PLANNER && <PlannerSection plan={plan} />}
        {plan && section === EmprendedorSection.NETWORKING && <NetworkingSection plan={plan} />}
        {plan && section === EmprendedorSection.BUDGET && <BudgetSection plan={plan} />}
      </main>
    </div>
  );
};
