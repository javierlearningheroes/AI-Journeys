
import React, { useState, useRef, useEffect } from "react";
import { RoomType, DesignResult, FurnitureItem, ItemCategory } from "../types";
import { generateRedesign } from "../services/geminiService";
import {
  ArrowLeft, Upload, Loader2, Image as ImageIcon, X, Sparkles, Download, Key, Info, ShoppingBag, Plus, Maximize2, ZoomIn, ZoomOut, ExternalLink, Leaf, Lamp, Palette, Sofa, ReceiptText, Pencil, List
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { CustomButton } from "./CustomButton";
// @ts-ignore
import { jsPDF } from "jspdf";

interface DecoracionPageProps {
  onBack: () => void;
}

const ROOM_TYPES: RoomType[] = [
  'Salón', 'Comedor', 'Dormitorio Principal', 'Cocina', 'Baño', 'Aseo', 'Patio', 'Terraza', 'Garaje', 'Estudio/Oficina'
];

const POPULAR_STYLES = [
  'Nórdico/Escandinavo', 'Minimalista', 'Industrial', 'Boho Chic', 'Mid-Century Modern', 'Rústico Moderno', 'Art Déco', 'Japonés (Japandi)'
];

type InfoTab = 'sobre' | 'mobiliario' | 'decor' | 'iluminacion' | 'vegetacion' | 'presupuesto';

export const DecoracionPage: React.FC<DecoracionPageProps> = ({ onBack }) => {
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [image, setImage] = useState<string | null>(null);
  const [refImages, setRefImages] = useState<string[]>([]);
  const [roomType, setRoomType] = useState<RoomType>('Salón');
  const [styleDescription, setStyleDescription] = useState('');
  const [isManualStyle, setIsManualStyle] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [designs, setDesigns] = useState<DesignResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeInfoTab, setActiveInfoTab] = useState<InfoTab>('sobre');

  const [showZoom, setShowZoom] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey as boolean);
      } else {
        const { getGeminiApiKey } = await import("../services/geminiService");
        setHasApiKey(!!getGeminiApiKey());
      }
    };
    checkKey();
  }, []);

  const handleOpenApiKeyDialog = async () => {
    // @ts-ignore
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRefUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setRefImages(prev => [...prev, reader.result as string].slice(0, 5));
      reader.readAsDataURL(file);
    });
  };

  const handleGenerate = async () => {
    if (!image) { setError('Sube una foto de tu espacio base.'); return; }
    setError(null);
    setIsGenerating(true);
    try {
      const res = await generateRedesign(image, roomType, styleDescription, refImages);
      setDesigns(prev => [...prev, res]);
      setActiveIndex(designs.length);
    } catch (err: any) {
      setError(err.message || "Error al procesar el rediseño.");
      if (err.message?.includes("Requested entity")) setHasApiKey(false);
    } finally { setIsGenerating(false); }
  };

  const generatePDF = async () => {
    const current = designs[activeIndex];
    if (!current) return;

    const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("Decor-IA: Informe de Diseño Maestro", 20, y);
    y += 12;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`Espacio: ${roomType} | Estilo: ${styleDescription}`, 20, y);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, pageWidth - 50, y);
    y += 15;

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("Comparativa Visual: Antes y Después", 20, y);
    y += 8;

    const imgWidth = 120;
    const imgHeight = 67.5;

    if (image) {
      doc.setFontSize(10);
      doc.text("Estado Original", 20, y - 2);
      doc.addImage(image, 'JPEG', 20, y, imgWidth, imgHeight);
    }

    doc.text("Propuesta Decor-IA", 150, y - 2);
    doc.addImage(current.imageUrl, 'PNG', 150, y, imgWidth, imgHeight);
    y += imgHeight + 20;

    doc.addPage('a4', 'l');
    y = 25;
    doc.setFontSize(20);
    doc.text("Desglose Detallado y Presupuesto", 20, y);
    y += 15;

    const colNames = ["Producto", "Tienda", "Precio", "Dimensiones"];
    const colWidths = [100, 60, 40, 50];
    const startX = 20;

    doc.setFillColor(240, 243, 245);
    doc.rect(startX, y, 250, 12, 'F');
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60, 70, 85);

    let currentX = startX + 2;
    colNames.forEach((name, i) => {
      doc.text(name, currentX, y + 8);
      currentX += colWidths[i];
    });
    y += 12;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(40);
    current.furniture.forEach((item) => {
      if (y > 180) { doc.addPage('a4', 'l'); y = 25; }

      let rowX = startX + 2;

      const nameLines = doc.splitTextToSize(item.name || "-", colWidths[0] - 5);
      doc.setFont("helvetica", "bold");
      doc.text(nameLines, rowX, y + 7);
      rowX += colWidths[0];

      doc.setFont("helvetica", "normal");
      doc.text(item.shopName || "Consultar", rowX, y + 7);
      rowX += colWidths[1];

      doc.setFont("helvetica", "bold");
      doc.setTextColor(16, 185, 129);
      doc.text(item.price || "---", rowX, y + 7);
      doc.setTextColor(40);
      rowX += colWidths[2];

      doc.setFont("helvetica", "normal");
      const dimLines = doc.splitTextToSize(item.dimensions || "N/A", colWidths[3] - 5);
      doc.text(dimLines, rowX, y + 7);

      const rowHeight = Math.max(nameLines.length * 6, dimLines.length * 6, 12);
      y += rowHeight;
      doc.setDrawColor(220, 225, 230);
      doc.line(startX, y, startX + 250, y);
    });

    y += 15;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setFillColor(0, 0, 0);
    doc.rect(startX, y, 250, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(`PRESUPUESTO TOTAL ESTIMADO: ${current.totalEstimatedBudget || "Consultar"}`, startX + 5, y + 10);

    doc.save(`Informe_Decor-IA_${roomType}.pdf`);
  };

  const currentDesign = designs[activeIndex];
  const itemsByCategory = (cat: ItemCategory) => currentDesign?.furniture.filter(f => f.category === cat) || [];

  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-slate-50 p-12 rounded-[2.5rem] border border-slate-100 max-w-md shadow-sm">
          <Key className="w-16 h-16 text-blue-600 mb-6 mx-auto" />
          <h1 className="text-3xl font-bold mb-4">Decor-IA Pro</h1>
          <p className="text-gray-500 mb-8">Vincula tu clave de Google AI Studio para disfrutar del rediseño en alta resolución con búsqueda de productos reales.</p>
          <button onClick={handleOpenApiKeyDialog} className="w-full bg-black text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:bg-slate-800 transition-all">Configurar API Key</button>
          <button onClick={onBack} className="mt-8 text-gray-400 hover:text-black font-medium transition-colors">Volver</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {showZoom && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-4">
          <button onClick={() => { setShowZoom(null); setZoomScale(1); }} className="absolute top-8 right-8 text-white p-3 hover:bg-white/10 rounded-full transition-all">
            <X size={32} />
          </button>
          <div className="absolute top-8 left-8 flex gap-4">
            <button onClick={() => setZoomScale(s => Math.min(5, s + 0.3))} className="bg-white/10 text-white p-3 rounded-2xl hover:bg-white/20"><ZoomIn /></button>
            <button onClick={() => setZoomScale(s => Math.max(1, s - 0.3))} className="bg-white/10 text-white p-3 rounded-2xl hover:bg-white/20"><ZoomOut /></button>
          </div>
          <div className="w-full h-full flex items-center justify-center overflow-auto cursor-grab active:cursor-grabbing">
            <img
              src={showZoom}
              style={{ transform: `scale(${zoomScale})` }}
              className="max-w-[95vw] max-h-[95vh] transition-transform duration-200 shadow-2xl rounded"
              alt="Zoom"
            />
          </div>
        </div>
      )}

      <header className="border-b border-gray-100 px-6 py-4 sticky top-0 bg-gradient-to-l from-black/10 via-white/50 to-white z-50 flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-2">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">Decor-IA</h1>
        </div>
        <img src="https://www.learningheroes.com/_ipx/q_80/images/Logo.svg" className="h-8 md:h-10 w-auto invert brightness-0" alt="Learning Heroes" />
      </header>

      <main className="flex-1 max-w-[1600px] mx-auto w-full p-6 md:p-12 grid lg:grid-cols-[400px_1fr] gap-12">
        <section className="space-y-8 no-print animate-in fade-in duration-500">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Crea tu Espacio</h2>
            <p className="text-gray-500 text-sm">Transforma cualquier habitación en segundos.</p>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Imagen del Espacio Actual</label>
            <div className="relative aspect-video rounded-[2rem] border-2 border-dashed border-gray-100 overflow-hidden group shadow-inner bg-gray-50">
              {image ? (
                <>
                  <img src={image} className="w-full h-full object-cover" alt="Original" />
                  <button onClick={() => setImage(null)} className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black transition-colors"><X size={16} /></button>
                </>
              ) : (
                <button onClick={() => fileInputRef.current?.click()} className="w-full h-full flex flex-col items-center justify-center hover:bg-gray-100 transition-colors">
                  <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 mb-2">
                    <Upload className="w-8 h-8 text-blue-500" />
                  </div>
                  <span className="text-xs font-bold text-slate-500">Subir foto base</span>
                </button>
              )}
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tipo de Estancia</label>
              <select value={roomType} onChange={(e) => setRoomType(e.target.value as RoomType)} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none text-sm focus:ring-2 focus:ring-black">
                {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Estilo de Diseño</label>
              <div className="flex gap-2">
                {isManualStyle ? (
                  <input
                    type="text"
                    placeholder="Ej: Industrial con toques verdes y madera..."
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none text-sm focus:ring-2 focus:ring-black"
                    onChange={(e) => setStyleDescription(e.target.value)}
                  />
                ) : (
                  <select
                    onChange={(e) => setStyleDescription(prev => prev ? `${prev}, ${e.target.value}` : e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none text-sm focus:ring-2 focus:ring-black"
                  >
                    <option value="">Añadir estilo...</option>
                    {POPULAR_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
                <button
                  onClick={() => setIsManualStyle(!isManualStyle)}
                  className="p-4 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-black hover:text-white transition-all shadow-sm flex items-center justify-center shrink-0"
                  title={isManualStyle ? "Elegir de lista" : "Escribir manualmente"}
                >
                  {isManualStyle ? <List size={20} /> : <Pencil size={20} />}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Instrucciones Detalladas</label>
              <button onClick={() => refInputRef.current?.click()} className="flex items-center gap-2 text-[10px] font-bold bg-gray-50 border border-gray-100 px-4 py-2 rounded-full hover:bg-black hover:text-white transition-all shadow-sm">
                <Plus size={14} /> Referencias
              </button>
            </div>
            <textarea
              placeholder="Describe texturas, colores específicos o muebles que te gustaría incluir..."
              value={styleDescription}
              onChange={e => setStyleDescription(e.target.value)}
              className="w-full p-6 bg-gray-50 border border-gray-100 rounded-3xl h-36 outline-none text-sm resize-none focus:ring-2 focus:ring-black shadow-inner"
            />
            <input type="file" ref={refInputRef} multiple onChange={handleRefUpload} className="hidden" accept="image/*" />

            {refImages.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                {refImages.map((ri, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-white shadow-sm group">
                    <img src={ri} className="w-full h-full object-cover" alt="Ref" />
                    <button onClick={() => setRefImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 p-0.5 bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"><X size={10} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <CustomButton onClick={handleGenerate} isLoading={isGenerating} disabled={!image} className="w-full py-5 text-lg rounded-3xl shadow-xl">
            Generar Propuesta
          </CustomButton>
          {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-[11px] font-bold border border-red-100">{error}</div>}
        </section>

        <section className="bg-slate-50 rounded-[3rem] p-8 border border-gray-100 shadow-inner flex flex-col relative overflow-hidden min-h-[700px]">
          {isGenerating ? (
            <div className="h-full flex flex-col items-center justify-center space-y-8 text-center">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="text-black" size={24} />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold tracking-tight">Nano Banana Pro</p>
                <p className="text-gray-400 text-sm max-w-xs mx-auto">Diseñando iluminación, seleccionando texturas y extrayendo productos reales para tu presupuesto...</p>
              </div>
            </div>
          ) : designs.length > 0 ? (
            <div className="h-full flex flex-col space-y-8 animate-in fade-in duration-700">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold tracking-tight">Diseño Final</h3>
                    <div className="flex gap-1.5 bg-white p-1 rounded-2xl border border-gray-100 w-fit">
                      {designs.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => { setActiveIndex(i); setActiveInfoTab('sobre'); }}
                          className={`px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${activeIndex === i ? 'bg-black text-white shadow-md' : 'text-gray-400 hover:text-black hover:bg-gray-100'}`}
                        >
                          V{i + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={generatePDF} className="p-4 bg-white rounded-2xl border border-gray-100 hover:border-black transition-all shadow-md group" title="Descargar Informe PDF">
                    <Download size={24} className="group-hover:scale-110 transition-transform" />
                  </button>
                </div>

                <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl bg-white border-4 border-white group">
                  <img
                    src={designs[activeIndex].imageUrl}
                    className="w-full h-auto cursor-pointer"
                    onClick={() => setShowZoom(designs[activeIndex].imageUrl)}
                    alt="Resultado"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <div className="p-4 bg-white/20 backdrop-blur-md rounded-full border border-white/40">
                      <Maximize2 className="text-white" size={40} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 overflow-hidden min-h-[450px]">
                <div className="flex flex-wrap gap-6 border-b border-gray-50 mb-6 no-print sticky top-0 bg-white z-10">
                  <button
                    onClick={() => setActiveInfoTab('sobre')}
                    className={`pb-3 text-[10px] font-bold uppercase tracking-widest transition-all ${activeInfoTab === 'sobre' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    Sobre este diseño
                  </button>
                  {[
                    { id: 'mobiliario' as InfoTab, label: 'Mobiliario', icon: <Sofa size={12} /> },
                    { id: 'decor' as InfoTab, label: 'Decor', icon: <Palette size={12} /> },
                    { id: 'iluminacion' as InfoTab, label: 'Iluminación', icon: <Lamp size={12} /> },
                    { id: 'vegetacion' as InfoTab, label: 'Vegetación', icon: <Leaf size={12} /> },
                    { id: 'presupuesto' as InfoTab, label: 'Presupuesto', icon: <ReceiptText size={12} /> }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveInfoTab(tab.id)}
                      className={`pb-3 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeInfoTab === tab.id ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                  {activeInfoTab === 'sobre' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <div className="prose prose-sm max-w-none prose-slate text-slate-700 prose-headings:text-slate-900 prose-headings:font-bold prose-headings:mt-6 prose-headings:mb-4">
                        <ReactMarkdown>{designs[activeIndex].description}</ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {(['mobiliario', 'decor', 'iluminacion', 'vegetacion'] as const).includes(activeInfoTab as any) && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      {itemsByCategory(
                        activeInfoTab === 'mobiliario' ? 'Mobiliario' :
                          activeInfoTab === 'decor' ? 'Decoración' :
                            activeInfoTab === 'iluminacion' ? 'Iluminación' : 'Vegetación'
                      ).map((item, idx) => (
                        <div key={idx} className="bg-slate-50 rounded-[2rem] p-6 flex flex-col md:flex-row gap-6 border border-slate-100 group hover:border-black hover:bg-white transition-all duration-300 shadow-sm">
                          {item.isolatedImageUrl && (
                            <div className="w-28 h-28 shrink-0 bg-white rounded-2xl overflow-hidden border border-gray-100 p-2 shadow-inner cursor-pointer" onClick={() => setShowZoom(item.isolatedImageUrl!)}>
                              <img src={item.isolatedImageUrl} className="w-full h-full object-contain" alt={item.name} />
                            </div>
                          )}
                          <div className="flex-1 space-y-3">
                            <div className="flex justify-between items-start">
                              <h5 className="font-bold text-lg text-slate-900">{item.name}</h5>
                              {item.price && (
                                <span className="text-[10px] font-bold bg-white text-emerald-600 px-3 py-1.5 rounded-xl border border-emerald-100 shadow-sm">{item.price}</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.description}</p>
                            <div className="flex flex-wrap gap-2 pt-2">
                              {(item.links || []).map((link, lidx) => (
                                <a
                                  key={lidx}
                                  href={link.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[9px] font-bold uppercase tracking-wider bg-white text-black px-4 py-2 rounded-xl border border-slate-200 hover:bg-black hover:text-white hover:border-black transition-all flex items-center gap-2 shadow-sm"
                                >
                                  <ExternalLink size={10} /> {item.shopName || "Ver Tienda"}
                                </a>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeInfoTab === 'presupuesto' && (
                    <div className="space-y-10 animate-in fade-in duration-300">
                      <div className="bg-black text-white p-10 rounded-[2.5rem] shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                          <h4 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2">Inversión Estimada</h4>
                          <p className="text-5xl font-bold tracking-tighter">{designs[activeIndex].totalEstimatedBudget}</p>
                        </div>
                        <div className="text-right text-gray-500 text-xs max-w-xs leading-relaxed">
                          Precios calculados mediante búsqueda dinámica de productos similares en el mercado retail actual.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-8 opacity-20">
              <div className="p-10 bg-white rounded-[3.5rem] shadow-sm">
                <Sparkles className="w-16 h-16 text-slate-400" />
              </div>
              <div className="space-y-3">
                <p className="text-3xl font-bold tracking-tight">Tu Espacio Ideal</p>
                <p className="text-sm max-w-[280px] mx-auto leading-relaxed">Sube una foto y configura tus preferencias para ver cómo la IA transforma tu hogar con productos reales.</p>
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-gray-100 py-10 px-6 text-center text-[10px] font-bold uppercase tracking-[0.4em] text-gray-300 no-print">
        &copy; {new Date().getFullYear()} Decor-IA Pro &bull; Gemini 3 Pro &bull; Nano Banana
      </footer>
    </div>
  );
};
