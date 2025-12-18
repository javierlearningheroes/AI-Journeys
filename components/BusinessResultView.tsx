
import React, { useState } from 'react';
import { BusinessAnalysisResult, ImplementationStep, Lever } from '../types';
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, ZAxis, Tooltip, ScatterChart, Scatter, Cell } from 'recharts';
import { AlertCircle, CheckCircle, TrendingUp, DollarSign, Users, Clock, Tag, Swords, Target, Globe, CalendarRange, X, Info, Calendar, Flag, CheckSquare } from 'lucide-react';

interface BusinessResultViewProps {
  result: BusinessAnalysisResult;
}

const PriorityBadge = ({ priority }: { priority: number }) => {
  const colors = {
    1: 'bg-red-100 text-red-800 border-red-200',
    2: 'bg-orange-100 text-orange-800 border-orange-200',
    3: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    4: 'bg-blue-100 text-blue-800 border-blue-200',
    5: 'bg-slate-100 text-slate-800 border-slate-200'
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${colors[priority as keyof typeof colors] || colors[5]}`}>
      P{priority}
    </span>
  );
};

const ImpactBadge = ({ level }: { level: string }) => {
  const color = level === 'Alto' ? 'text-emerald-600 bg-emerald-50' : level === 'Medio' ? 'text-yellow-600 bg-yellow-50' : 'text-slate-600 bg-slate-50';
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>{level}</span>;
};

const ComplexityBadge = ({ level }: { level: string }) => {
   const color = level === 'Baja' ? 'text-emerald-600 bg-emerald-50' : level === 'Media' ? 'text-yellow-600 bg-yellow-50' : 'text-red-600 bg-red-50';
   return <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>{level}</span>;
};

const AreaIcon = ({ area }: { area: string }) => {
  switch (area) {
    case 'Ingresos': return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    case 'Costos': return <DollarSign className="w-4 h-4 text-red-500" />;
    case 'Productividad': return <Clock className="w-4 h-4 text-blue-500" />;
    case 'Retención': return <Users className="w-4 h-4 text-purple-500" />;
    case 'Pricing': return <Tag className="w-4 h-4 text-orange-500" />;
    default: return <AlertCircle className="w-4 h-4 text-slate-400" />;
  }
};

export const BusinessResultView: React.FC<BusinessResultViewProps> = ({ result }) => {
  const [selectedStep, setSelectedStep] = useState<ImplementationStep | null>(null);

  // --- DATA TRANSFORMATION FOR CHART (COLLISION HANDLING) ---
  
  const mapValue = (val: string) => {
    if (val === 'Alto' || val === 'Alta') return 3;
    if (val === 'Medio' || val === 'Media') return 2;
    return 1;
  };

  // Group levers by their Impact/Complexity coordinates
  const groupedLevers: Record<string, Lever[]> = {};
  const leversList = result.levers || [];
  leversList.forEach(lever => {
    const x = mapValue(lever.complexity);
    const y = mapValue(lever.impact);
    const key = `${x}-${y}`;
    if (!groupedLevers[key]) groupedLevers[key] = [];
    groupedLevers[key].push(lever);
  });

  // Flatten back to array with offsets applied
  const chartData: any[] = [];
  
  Object.keys(groupedLevers).forEach(key => {
    const group = groupedLevers[key];
    const [baseXStr, baseYStr] = key.split('-');
    const baseX = parseInt(baseXStr);
    const baseY = parseInt(baseYStr);

    if (group.length === 1) {
      // No collision
      chartData.push({
        ...group[0],
        x: baseX,
        y: baseY,
        z: 6 - (group[0].priority || 5) // Size based on priority
      });
    } else {
      // Collision: distribute in a circle
      const radius = 0.15; // Distance from center
      const angleStep = (2 * Math.PI) / group.length;

      group.forEach((lever, index) => {
        const angle = index * angleStep;
        chartData.push({
          ...lever,
          x: baseX + Math.cos(angle) * radius,
          y: baseY + Math.sin(angle) * radius,
          z: 6 - (lever.priority || 5)
        });
      });
    }
  });

  // Calculate Gantt Chart dimensions
  const implementationPlan = result.implementationPlan || [];
  const totalWeeks = implementationPlan.reduce((max, item) => Math.max(max, (item.startWeek || 0) + (item.durationWeeks || 0)), 0) + 1;
  const timelineWeeks = Array.from({ length: Math.max(totalWeeks, 1) }, (_, i) => i + 1);

  // Custom Tooltip for Chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-xs z-50 relative">
          <p className="font-bold text-slate-800">{data.name}</p>
          <div className="flex items-center gap-1 mt-1">
             <AreaIcon area={data.area} />
             <span className="text-slate-600">{data.area}</span>
          </div>
          <p className="text-slate-500 mt-1">Prioridad: P{data.priority || 5}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      
      {/* Conclusion Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-blue-600" />
          Conclusión Estratégica
        </h2>
        <p className="text-slate-700 leading-relaxed text-sm md:text-base">
          {result.conclusion}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table Section */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col order-2 lg:order-1">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
             <h3 className="font-semibold text-slate-800">Matriz de Palancas</h3>
             <span className="text-xs text-slate-500 font-medium bg-white px-2 py-1 rounded border border-slate-200">
               {leversList.length} identificadas
             </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                  <th className="px-4 py-3 font-medium">Prioridad</th>
                  <th className="px-4 py-3 font-medium">Palanca / Acción</th>
                  <th className="px-4 py-3 font-medium">Área</th>
                  <th className="px-4 py-3 font-medium text-center">Impacto</th>
                  <th className="px-4 py-3 font-medium text-center">Complejidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leversList.sort((a, b) => (a.priority || 5) - (b.priority || 5)).map((lever, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-3">
                      <PriorityBadge priority={lever.priority || 5} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{lever.name}</div>
                      <div className="text-xs text-slate-500 mt-1 line-clamp-2 group-hover:line-clamp-none transition-all duration-300">
                        {lever.description}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <AreaIcon area={lever.area} />
                        <span className="text-xs">{lever.area}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ImpactBadge level={lever.impact} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ComplexityBadge level={lever.complexity} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col order-1 lg:order-2 h-min">
           <div className="mb-4">
              <h3 className="font-semibold text-slate-800 mb-1">Mapa de Oportunidades</h3>
              <p className="text-xs text-slate-400">Distribución por Impacto vs. Complejidad</p>
           </div>
           <div className="h-[300px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    name="Complejidad" 
                    domain={[0.5, 3.5]} 
                    tickCount={3}
                    ticks={[1, 2, 3]}
                    tickFormatter={(val) => val === 1 ? 'Baja' : val === 2 ? 'Media' : val === 3 ? 'Alta' : ''}
                    label={{ value: 'Complejidad', position: 'insideBottom', offset: -10, fontSize: 12, fill: '#94a3b8' }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name="Impacto" 
                    domain={[0.5, 3.5]} 
                    tickCount={3}
                    ticks={[1, 2, 3]}
                    tickFormatter={(val) => val === 1 ? 'Bajo' : val === 2 ? 'Medio' : val === 3 ? 'Alto' : ''}
                    label={{ value: 'Impacto', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#94a3b8' }}
                  />
                  <ZAxis type="number" dataKey="z" range={[100, 400]} />
                  <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Levers" data={chartData}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={
                        entry.area === 'Ingresos' ? '#10b981' :
                        entry.area === 'Costos' ? '#ef4444' :
                        entry.area === 'Productividad' ? '#3b82f6' :
                        '#8b5cf6'
                      } fillOpacity={0.8} strokeWidth={1} stroke="#fff" />
                    ))}
                  </Scatter>
                </ScatterChart>
             </ResponsiveContainer>
           </div>
           
           {/* Detailed Legend */}
           <div className="mt-4 flex flex-col gap-2 text-xs border-t border-slate-100 pt-3">
              <span className="font-semibold text-slate-500 mb-1 block">Leyenda de Colores:</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></div>
                  <span className="text-slate-700">Ingresos</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
                  <span className="text-slate-700">Costos</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></div>
                  <span className="text-slate-700">Productividad</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-purple-500 shadow-sm"></div>
                  <span className="text-slate-700">Otros / Retención</span>
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* 90-Day Plan Section (New) */}
      {result.ninetyDayPlan && result.ninetyDayPlan.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-lg text-white">
               <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Plan de Ejecución a 90 Días</h3>
              <p className="text-sm text-slate-500">Hoja de ruta táctica dividida por fases mensuales.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {result.ninetyDayPlan.map((phase, idx) => {
              // Color coding based on month index
              const headerColors = [
                'bg-blue-50 text-blue-800 border-blue-100',
                'bg-indigo-50 text-indigo-800 border-indigo-100',
                'bg-violet-50 text-violet-800 border-violet-100'
              ];
              const accentColor = headerColors[idx % 3];
              const actions = phase.actions || [];

              return (
                <div key={idx} className="p-6">
                  <div className={`mb-4 pb-3 border-b border-dashed ${accentColor.split(' ')[2]}`}>
                    <div className={`text-xs font-bold uppercase tracking-wider mb-1 px-2 py-1 rounded inline-block ${accentColor}`}>
                      {phase.month}
                    </div>
                    <h4 className="font-bold text-slate-800 mt-2 text-lg leading-tight">{phase.focus}</h4>
                  </div>
                  
                  <div className="space-y-4">
                    {actions.map((action, actionIdx) => (
                      <div key={actionIdx} className="flex gap-3 group">
                        <div className="shrink-0 mt-0.5">
                           <CheckSquare className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <div>
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5">
                             {action.dayRange}
                           </span>
                           <p className="text-sm font-medium text-slate-700 leading-snug mb-1">
                             {action.task}
                           </p>
                           <p className="text-xs text-slate-500 flex items-center gap-1">
                             <Flag className="w-3 h-3" /> {action.outcome}
                           </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gantt Chart Section */}
      {implementationPlan.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <div className="p-1.5 bg-indigo-100 rounded text-indigo-600">
               <CalendarRange className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Cronograma de Dependencias (Gantt)</h3>
              <p className="text-xs text-slate-500">Haz clic en una actividad para ver detalles y su palanca asociada.</p>
            </div>
          </div>
          <div className="p-4 overflow-x-auto">
             <div className="min-w-[800px]">
                {/* Header Rows */}
                <div className="grid gap-4 mb-2" style={{ gridTemplateColumns: `250px repeat(${timelineWeeks.length}, minmax(40px, 1fr))` }}>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-end pb-2">Actividad</div>
                  {timelineWeeks.map(week => (
                    <div key={week} className="text-center">
                      <div className="text-[10px] font-medium text-slate-400 mb-1">Sem</div>
                      <div className="text-xs font-bold text-slate-700 bg-slate-100 rounded py-1">{week}</div>
                    </div>
                  ))}
                </div>

                {/* Bars */}
                <div className="space-y-3 relative">
                  {/* Grid Lines Background */}
                  <div className="absolute inset-0 grid pointer-events-none" style={{ gridTemplateColumns: `250px repeat(${timelineWeeks.length}, minmax(40px, 1fr))`, gap: '1rem' }}>
                    <div className="border-r border-slate-100"></div>
                     {timelineWeeks.map(week => (
                       <div key={week} className="border-r border-slate-100 bg-slate-50/30"></div>
                     ))}
                  </div>

                  {implementationPlan.map((step, idx) => (
                    <div 
                      key={idx} 
                      className="grid gap-4 relative z-10 items-center hover:bg-slate-50 rounded-lg transition-colors py-1 cursor-pointer group"
                      style={{ gridTemplateColumns: `250px repeat(${timelineWeeks.length}, minmax(40px, 1fr))` }}
                      onClick={() => setSelectedStep(step)}
                    >
                      <div className="pr-4 group-hover:text-blue-600 transition-colors">
                        <div className="text-sm font-medium text-slate-800 truncate flex items-center gap-1">
                           {step.activity}
                           <Info className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100" />
                        </div>
                        <div className="text-xs text-slate-500">{step.owner}</div>
                      </div>
                      <div 
                        className="bg-blue-500 rounded-full h-6 shadow-sm relative group-hover:bg-blue-600 transition-colors flex items-center px-2"
                        style={{ 
                          gridColumnStart: (step.startWeek || 0) + 1, // +1 because first col is labels
                          gridColumnEnd: `span ${Math.max(step.durationWeeks || 0, 1)}`
                        }}
                      >
                         <span className="text-[10px] text-white font-medium truncate w-full opacity-0 group-hover:opacity-100 transition-opacity">
                           {step.durationWeeks || 0} sem
                         </span>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Gantt Detail Modal */}
      {selectedStep && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
             <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50">
               <div>
                 <h3 className="font-bold text-lg text-slate-900">{selectedStep.activity}</h3>
                 <p className="text-sm text-slate-500 mt-1">Responsable: {selectedStep.owner}</p>
               </div>
               <button onClick={() => setSelectedStep(null)} className="text-slate-400 hover:text-slate-600 p-1 bg-white rounded-full border border-slate-200 shadow-sm">
                 <X className="w-5 h-5" />
               </button>
             </div>
             <div className="p-6 space-y-4">
               <div>
                 <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Detalles de Implementación</label>
                 <p className="text-slate-700 text-sm leading-relaxed bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                   {selectedStep.details || "No hay detalles adicionales disponibles."}
                 </p>
               </div>
               {selectedStep.relatedLever && (
                 <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Palanca Asociada</label>
                    <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                       <Target className="w-4 h-4" />
                       <span className="font-medium">{selectedStep.relatedLever}</span>
                    </div>
                 </div>
               )}
               <div className="flex gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                 <div className="flex items-center gap-1">
                   <CalendarRange className="w-4 h-4" /> Semana inicio: {selectedStep.startWeek || 0}
                 </div>
                 <div className="flex items-center gap-1">
                   <Clock className="w-4 h-4" /> Duración: {selectedStep.durationWeeks || 0} semanas
                 </div>
               </div>
             </div>
             <div className="p-4 bg-slate-50 flex justify-end">
               <button 
                 onClick={() => setSelectedStep(null)}
                 className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800"
               >
                 Cerrar
               </button>
             </div>
           </div>
        </div>
      )}

      {/* New Sections: Competitors and Clients */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Competitors */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
           <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
             <div className="p-2 bg-rose-100 rounded-lg">
               <Swords className="w-5 h-5 text-rose-600" />
             </div>
             <h3 className="font-semibold text-slate-800">Análisis Competitivo</h3>
           </div>
           <div className="space-y-4">
             {result.competitors && result.competitors.length > 0 ? (
               result.competitors.map((comp, idx) => (
                 <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                   <div className="flex items-center justify-between mb-1">
                     <span className="font-semibold text-slate-800 text-sm">{comp.name}</span>
                     <Globe className="w-3 h-3 text-slate-400" />
                   </div>
                   <p className="text-xs text-slate-600 mb-2">{comp.description}</p>
                   <div className="text-xs font-medium text-rose-700 bg-rose-50 px-3 py-2 rounded block">
                     <span className="font-bold block mb-0.5 text-[10px] uppercase opacity-70">Impacto en ti:</span>
                     {comp.differentiation}
                   </div>
                 </div>
               ))
             ) : (
               <p className="text-sm text-slate-400 italic">No se identificaron competidores específicos.</p>
             )}
           </div>
        </div>

        {/* Potential Clients */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
           <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
             <div className="p-2 bg-indigo-100 rounded-lg">
               <Target className="w-5 h-5 text-indigo-600" />
             </div>
             <h3 className="font-semibold text-slate-800">Clientes Potenciales (ICP)</h3>
           </div>
           <div className="space-y-4">
             {result.potentialClients && result.potentialClients.length > 0 ? (
               result.potentialClients.map((client, idx) => (
                 <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                   <div className="font-semibold text-slate-800 text-sm mb-1">{client.profile}</div>
                   <p className="text-xs text-slate-600">{client.rationale}</p>
                 </div>
               ))
             ) : (
               <p className="text-sm text-slate-400 italic">No se definieron perfiles de cliente.</p>
             )}
           </div>
        </div>

      </div>
    </div>
  );
};
