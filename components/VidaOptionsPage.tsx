
import React from "react";
import { DestinationCard } from "./ui/card-21";
import { ArrowLeft, Sparkles } from "lucide-react";

interface VidaOptionsPageProps {
  onBack: () => void;
  onSelectOption: (id: string) => void;
}

const subOptions = [
  {
    location: "Chef Personal",
    stats: "Planifica comidas, genera listas de supermercado inteligentes y aprovecha lo que tienes en tu nevera.",
    imageUrl: "https://plus.unsplash.com/premium_photo-1741048774799-efab4dc9fa72?q=80&w=627&auto=format&fit=crop",
    themeColor: "0 0% 20%",
    id: "vida-chef",
  },
  {
    location: "Idiomas",
    stats: "Practica inglés en tiempo real con un tutor de IA bilingüe. Sesiones personalizadas y corrección instantánea.",
    imageUrl: "https://images.unsplash.com/photo-1613446913331-e27a50f64c18?q=80&w=687&auto=format&fit=crop",
    themeColor: "210 50% 30%",
    id: "vida-idiomas",
  },
  {
    location: "Quest Planner",
    stats: "Organiza las tareas del hogar de forma gamificada. Gana puntos y recompensas manteniendo el orden.",
    imageUrl: "https://images.unsplash.com/photo-1678846851718-2a12c21903a2?q=80&w=735&auto=format&fit=crop",
    themeColor: "0 0% 10%",
    id: "vida-quest",
  },
  {
    location: "Decoración",
    stats: "Redecora tus espacios con IA. Sube una foto y recibe propuestas de estilo y consejos de interiorismo.",
    imageUrl: "https://plus.unsplash.com/premium_photo-1691061708401-1e24045f921c?q=80&w=764&auto=format&fit=crop",
    themeColor: "0 0% 0%",
    id: "vida-deco",
  },
];

export const VidaOptionsPage: React.FC<VidaOptionsPageProps> = ({ onBack, onSelectOption }) => {
  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      <header className="border-b border-gray-100 px-6 py-4 sticky top-0 bg-gradient-to-l from-black/10 via-white/50 to-white z-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-2">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold tracking-tight">Vida-IA</h1>
        </div>
        <img 
          src="https://www.learningheroes.com/_ipx/q_80/images/Logo.svg" 
          className="h-8 md:h-10 w-auto invert brightness-0" 
          alt="Learning Heroes" 
        />
      </header>

      <main className="flex-1 flex flex-col items-center py-12 px-8">
        <div className="text-center max-w-2xl mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
            Inteligencia para tu día a día
          </h2>
          <p className="text-lg text-gray-500">
            Pequeñas automatizaciones que generan grandes cambios en tu calidad de vida.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-7xl">
          {subOptions.map((option, index) => (
            <div
              key={option.id}
              className="w-full aspect-[3/4] animate-in fade-in zoom-in-95 duration-700"
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
            >
              <DestinationCard
                imageUrl={option.imageUrl}
                location={option.location}
                flag=""
                stats={option.stats}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onSelectOption(option.id);
                }}
                themeColor={option.themeColor}
                className="cursor-pointer"
              />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
