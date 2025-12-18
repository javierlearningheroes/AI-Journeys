
import React, { useState, useEffect, useRef } from "react";
import { DietType, GroceryListResponse, RecipeResponse, Recipe } from "../types";
import { generateGroceryList, suggestRecipes, generateRecipeImage } from "../services/geminiService";
import { 
  ChefHat, ArrowLeft, ChevronDown, ChevronUp, Image as ImageIcon, AlertCircle, Download, Check, Plus, Trash2, ChevronLeft, ChevronRight, X, Sparkles
} from "lucide-react";
import { CustomButton } from "./CustomButton";

interface ChefPersonalPageProps {
  onBack: () => void;
}

const ITEMS_PER_PAGE = 3;

const RecipeCard: React.FC<{ recipe: Recipe; index: number }> = ({ recipe, index }) => {
  const [expanded, setExpanded] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchImage = async () => {
      setLoadingImage(true);
      try {
        const base64Image = await generateRecipeImage(recipe.title);
        if (mounted && base64Image) setImageSrc(base64Image);
      } catch (err) { console.error(err); } finally { if (mounted) setLoadingImage(false); }
    };
    fetchImage();
    return () => { mounted = false; };
  }, [recipe.title]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-48 bg-gray-50 relative">
        {loadingImage ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 animate-pulse bg-slate-50">
            <ImageIcon size={32} />
            <span className="text-[10px] font-bold uppercase mt-2 tracking-widest">Generando imagen...</span>
          </div>
        ) : (
          <img src={imageSrc || `https://picsum.photos/400/200?random=${index}`} alt={recipe.title} className="w-full h-full object-cover" />
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-4 text-white"><h3 className="font-bold text-lg leading-tight">{recipe.title}</h3></div>
      </div>
      <div className="p-5">
        <div className="flex gap-2 text-[10px] font-bold uppercase tracking-wider mb-3">
          <span className="bg-gray-100 px-2 py-1 rounded">{recipe.time}</span>
          <span className="bg-gray-100 px-2 py-1 rounded">{recipe.difficulty}</span>
        </div>
        <p className="text-gray-500 text-sm mb-4 line-clamp-2">{recipe.description}</p>
        <button className="text-xs font-bold uppercase tracking-widest text-black flex items-center gap-2" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Ocultar" : "Ver"} {expanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
        </button>
        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-4 animate-in fade-in duration-300">
            <div><h4 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-2">Ingredientes</h4><ul className="text-sm text-gray-600 space-y-1">{(recipe.ingredients || []).map((ing, i) => <li key={i} className="flex gap-2">- {ing}</li>)}</ul></div>
            <div><h4 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-2">Instrucciones</h4><ol className="text-sm text-gray-600 space-y-2">{(recipe.instructions || []).map((step, i) => <li key={i} className="flex gap-3"><span className="font-bold">{i+1}.</span> {step}</li>)}</ol></div>
          </div>
        )}
      </div>
    </div>
  );
};

export const ChefPersonalPage: React.FC<ChefPersonalPageProps> = ({ onBack }) => {
  const [activeMode, setActiveMode] = useState<"planner" | "chef">("planner");
  const [diet, setDiet] = useState<DietType>(DietType.ANY);
  const [input, setInput] = useState("");
  const [fridgeImage, setFridgeImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [groceryList, setGroceryList] = useState<GroceryListResponse | null>(null);
  const [recipeData, setRecipeData] = useState<RecipeResponse | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !fridgeImage) { 
      setError(activeMode === "planner" ? "Por favor, describe tus preferencias." : "Por favor, escribe ingredientes o sube una foto."); 
      return; 
    }
    
    setError(null); 
    setLoading(true);
    setGroceryList(null);
    setRecipeData(null);
    setCheckedItems({});
    setCurrentPage(0);

    try {
      if (activeMode === "planner") {
        const res = await generateGroceryList(diet, input);
        setGroceryList(res);
      } else {
        const res = await suggestRecipes(input, fridgeImage || undefined);
        setRecipeData(res);
        // Recognition feedback: update textarea with what the AI found
        if (res.identifiedIngredients && res.identifiedIngredients.length > 0) {
          setInput(res.identifiedIngredients.join(", "));
        }
      }
    } catch (err: any) { 
      console.error("Error ChefIA:", err);
      setError("No se pudo generar la información. Por favor, comprueba tu conexión e inténtalo de nuevo."); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFridgeImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const toggleCheck = (category: string, item: string) => {
    const key = `${category}-${item}`;
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const downloadTxtList = () => {
    if (!groceryList) return;
    
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    
    let content = `Lista de Compras - ChefIA\n`;
    content += `Fecha: ${dateStr}\n`;
    content += `--------------------------------\n\n`;
    
    groceryList.categories.forEach(cat => {
      content += `${cat.name.toUpperCase()}\n`;
      cat.items.forEach(it => {
        const isChecked = checkedItems[`${cat.name}-${it.name}`];
        content += `[${isChecked ? 'x' : ' '}] ${it.name} - ${it.quantity}\n`;
      });
      content += `\n`;
    });
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Lista_Compra_ChefIA_${now.getTime()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const paginatedCategories = groceryList?.categories.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  ) || [];

  const totalPages = Math.ceil((groceryList?.categories.length || 0) / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-100 px-6 py-4 sticky top-0 bg-gradient-to-l from-black/10 via-white/50 to-white z-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-2">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold tracking-tight">Chef-IA</h1>
          <div className="flex bg-gray-100 p-1 rounded-xl ml-4">
            <button onClick={() => { setActiveMode("planner"); setRecipeData(null); setError(null); setInput(""); setFridgeImage(null); }} className={`px-4 py-2 rounded-lg text-xs font-bold tracking-widest uppercase transition-all ${activeMode === "planner" ? "bg-white text-black shadow-sm" : "text-gray-400"}`}>Súper</button>
            <button onClick={() => { setActiveMode("chef"); setGroceryList(null); setError(null); setInput(""); setFridgeImage(null); }} className={`px-4 py-2 rounded-lg text-xs font-bold tracking-widest uppercase transition-all ${activeMode === "chef" ? "bg-white text-black shadow-sm" : "text-gray-400"}`}>Cocina</button>
          </div>
        </div>
        <img 
          src="https://www.learningheroes.com/_ipx/q_80/images/Logo.svg" 
          className="h-8 md:h-10 w-auto invert brightness-0" 
          alt="Learning Heroes" 
        />
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 grid md:grid-cols-2 gap-12">
        <section className="space-y-8 animate-in fade-in duration-500">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">
              {activeMode === "planner" ? "Planificador de Súper" : "Aprovechamiento de Nevera"}
            </h2>
            <p className="text-slate-500 text-sm italic">
              {activeMode === "planner" 
                ? "Organiza tu compra semanal. Generamos una lista inteligente basada en tus objetivos nutricionales y preferencias para que no te falte nada." 
                : "Transforma tus sobras en platos gourmet. Analizamos lo que tienes (vía texto o foto) para sugerirte recetas creativas y deliciosas."}
            </p>
          </div>

          <form onSubmit={handleAction} className="space-y-6">
            {activeMode === "planner" && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tipo de Dieta</label>
                <select 
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-black" 
                  value={diet} 
                  onChange={e => setDiet(e.target.value as DietType)}
                >
                  {Object.values(DietType).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}
            <div className="space-y-2 relative">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {activeMode === "planner" ? "¿Qué se te antoja?" : "¿Qué tienes en la nevera?"}
              </label>
              <div className="relative group">
                <textarea 
                  className="w-full p-6 bg-gray-50 border border-gray-200 rounded-[2rem] h-48 resize-none text-sm outline-none focus:ring-2 focus:ring-black shadow-inner" 
                  placeholder={activeMode === "planner" ? "Ej: Quiero comer tacos el martes y sushi el viernes..." : "Ej: 2 huevos, medio pimiento, una pechuga de pollo..."} 
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                />
                {activeMode === "chef" && (
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-6 right-6 p-3 bg-white border border-gray-200 rounded-full shadow-md hover:scale-110 hover:bg-black hover:text-white transition-all group/btn"
                    title="Subir foto de la nevera"
                  >
                    <Plus size={20} />
                  </button>
                )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              
              {fridgeImage && activeMode === "chef" && (
                <div className="mt-4 relative w-full aspect-video rounded-3xl overflow-hidden border border-gray-100 shadow-sm animate-in zoom-in-95 duration-200 group/img">
                  <img src={fridgeImage} className="w-full h-full object-cover" alt="Fridge Preview" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      type="button"
                      onClick={() => setFridgeImage(null)}
                      className="p-3 bg-white text-black rounded-full hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>
            <CustomButton className="w-full py-5 text-xl rounded-[2rem] shadow-lg" isLoading={loading}>
              {activeMode === "planner" ? "Generar Lista Inteligente" : "Inspirarme con Recetas"}
            </CustomButton>
          </form>
        </section>

        <section className="bg-gray-50 rounded-[3rem] p-8 border border-slate-100 shadow-inner min-h-[600px] flex flex-col relative overflow-hidden">
          {error ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95 duration-300">
               <div className="p-4 bg-red-50 text-red-500 rounded-2xl border border-red-100 shadow-sm max-w-xs">
                 <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                 <p className="text-xs font-bold uppercase tracking-widest mb-1">Algo salió mal</p>
                 <p className="text-sm">{error}</p>
               </div>
               <button 
                onClick={() => { setError(null); setLoading(false); }}
                className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-black transition-colors"
               >
                 Reintentar
               </button>
            </div>
          ) : loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-300">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <ChefHat className="text-emerald-600" size={32} />
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-xl font-bold text-slate-800">Cocinando resultados...</p>
                <p className="text-slate-400 text-xs animate-pulse font-medium uppercase tracking-widest">IA en proceso</p>
              </div>
            </div>
          ) : activeMode === "planner" && groceryList ? (
            <div className="space-y-6 animate-in slide-in-from-right duration-500 overflow-y-auto custom-scrollbar pr-2 flex-1">
              <div className="flex justify-between items-center mb-2">
                 <h3 className="font-bold text-xl text-slate-900">Tu Lista de la Compra</h3>
                 <button 
                   onClick={downloadTxtList}
                   className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:scale-110 hover:border-black transition-all group/dl"
                   title="Descargar Lista .txt"
                 >
                   <Download size={20} className="group-hover/dl:text-black" />
                 </button>
              </div>
              
              <div className="grid gap-4 min-h-[400px]">
                {paginatedCategories.map((c, i) => (
                  <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm group hover:border-emerald-200 transition-all">
                    <h4 className="font-bold text-sm text-emerald-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                      {c.name}
                    </h4>
                    <ul className="space-y-3">
                      {(c.items || []).map((it, j) => {
                        const isChecked = checkedItems[`${c.name}-${it.name}`];
                        return (
                          <li 
                            key={j} 
                            onClick={() => toggleCheck(c.name, it.name)}
                            className="flex justify-between items-center text-sm border-b border-slate-50 pb-2 last:border-0 group-hover:border-slate-100 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${isChecked ? 'bg-black border-black text-white' : 'border-gray-200'}`}>
                                {isChecked && <Check size={12} />}
                              </div>
                              <span className={`font-medium transition-all ${isChecked ? 'text-slate-300 line-through' : 'text-slate-700'}`}>
                                {it.name}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold bg-slate-50 text-slate-400 px-2 py-1 rounded-lg border border-slate-100">{it.quantity}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-100 mt-auto">
                  <button 
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="p-2 bg-white border border-gray-100 rounded-xl disabled:opacity-30 hover:border-black transition-all"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Página {currentPage + 1} de {totalPages}
                  </span>
                  <button 
                    disabled={currentPage === totalPages - 1}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="p-2 bg-white border border-gray-100 rounded-xl disabled:opacity-30 hover:border-black transition-all"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </div>
          ) : activeMode === "chef" && recipeData ? (
            <div className="grid gap-6 animate-in slide-in-from-right duration-500 overflow-y-auto custom-scrollbar pr-2 flex-1">
               <div className="flex justify-between items-center mb-2">
                 <h3 className="font-bold text-xl text-slate-900">Sugerencias del Chef</h3>
                 {recipeData.identifiedIngredients && recipeData.identifiedIngredients.length > 0 && (
                   <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-100">
                     <Sparkles size={12}/> Reconocimiento Visual OK
                   </div>
                 )}
               </div>
               {(recipeData.recipes || []).map((r, i) => <RecipeCard key={i} recipe={r} index={i} />)}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-20 group">
              <div className="p-10 bg-white rounded-[3.5rem] shadow-sm group-hover:scale-105 transition-transform duration-500">
                <ChefHat size={80} className="text-slate-400"/>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold tracking-tight">Tu Asistente Culinario</p>
                <p className="text-sm max-w-[240px] mx-auto leading-relaxed">Completa el formulario de la izquierda para ver la magia de la IA en tu cocina.</p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
