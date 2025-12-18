
import React, { useState, useEffect } from "react";
import { DestinationCard } from "./components/ui/card-21";
import { EmpleadoPage } from "./components/EmpleadoPage";
import { IkigaiPage } from "./components/IkigaiPage";
import { EmpresarioPage } from "./components/EmpresarioPage";
import { EmprendedorPage } from "./components/EmprendedorPage";
import { VidaOptionsPage } from "./components/VidaOptionsPage";
import { QuestPlannerPage } from "./components/QuestPlannerPage";
import { ChefPersonalPage } from "./components/ChefPersonalPage";
import { DecoracionPage } from "./components/DecoracionPage";
import { IdiomasPage } from "./components/IdiomasPage";

const destinations = [
  {
    location: "Empleado/a",
    flag: "",
    stats: "Mejora tu salario, consigue un ascenso o cambia de trabajo usando IA.",
    imageUrl: "https://images.unsplash.com/photo-1535083252457-6080fe29be45?q=80&w=687&auto=format&fit=crop",
    themeColor: "150 50% 25%",
    id: "empleado",
  },
  {
    location: "Empresario/a",
    flag: "",
    stats: "Optimiza operaciones, reduce costes y aumenta ventas en tu negocio.",
    imageUrl: "https://images.unsplash.com/photo-1579567761406-4684ee0c75b6?q=80&w=687&auto=format&fit=crop",
    themeColor: "250 50% 30%",
    id: "empresario",
  },
  {
    location: "Emprendedor/a",
    flag: "",
    stats: "Lanza tu propio negocio basado en IA desde cero.",
    imageUrl: "https://plus.unsplash.com/premium_photo-1667112532508-3658ca5c51d8?q=80&w=687&auto=format&fit=crop",
    themeColor: "340 60% 40%",
    id: "emprendedor",
  },
  {
    location: "Ikigai",
    flag: "",
    stats: "Estoy en transición / No lo tengo claro",
    imageUrl: "https://images.unsplash.com/photo-1644310972589-643a2099d946?q=80&w=735&auto=format&fit=crop",
    themeColor: "210 60% 35%",
    id: "ikigai",
  },
  {
    location: "IA para la Vida",
    flag: "",
    stats: "Automatiza tareas personales y mejora tu productividad diaria.",
    imageUrl: "https://images.unsplash.com/photo-1626282874430-c11ae32d2898?q=80&w=687&auto=format&fit=crop",
    themeColor: "30 70% 35%",
    id: "vida",
  },
];

type ViewState = "home" | "ikigai" | "empleado" | "empresario" | "emprendedor" | "vida" | "quest-planner" | "chef-personal" | "decoracion" | "idiomas";

// Moved PageWrapper outside to avoid re-creation and fix type inference issues
const PageWrapper = ({ children, isFadingOut }: React.PropsWithChildren<{ isFadingOut: boolean }>) => (
  <div className={`w-full h-full transition-opacity duration-700 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
    {children}
  </div>
);

const App = () => {
  const [currentView, setCurrentView] = useState<ViewState>("home");
  const [transitioningId, setTransitioningId] = useState<string | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const handleCardClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setTransitioningId(id);
    
    // 1. Animación inicial de la tarjeta al centro (1000ms definidos en CSS)
    // 2. Espera en el centro (añadimos 1s extra a los 800ms previos -> 1800ms en el centro)
    // Total tiempo antes de empezar a desvanecer la escena: 2800ms
    
    setTimeout(() => {
      // Empezamos a desvanecer toda la pantalla antes del cambio de vista
      setIsFadingOut(true);
      
      // Esperamos a que el desvanecimiento termine (400ms adicionales)
      setTimeout(() => {
        if (id === "vida") setCurrentView("vida");
        else if (id === "ikigai") setCurrentView("ikigai");
        else if (id === "empleado") setCurrentView("empleado");
        else if (id === "empresario") setCurrentView("empresario");
        else if (id === "emprendedor") setCurrentView("emprendedor");
        
        // Reset states para la nueva página
        setTransitioningId(null);
        setIsFadingOut(false);
      }, 400); 
    }, 2800);
  };

  const handleVidaOption = (id: string) => {
    // Para las subopciones de "Vida", hacemos una transición rápida
    setIsFadingOut(true);
    setTimeout(() => {
      if (id === "vida-quest") setCurrentView("quest-planner");
      else if (id === "vida-chef") setCurrentView("chef-personal");
      else if (id === "vida-deco") setCurrentView("decoracion");
      else if (id === "vida-idiomas") setCurrentView("idiomas");
      setIsFadingOut(false);
    }, 400);
  };

  const logoUrl = "https://www.learningheroes.com/_ipx/q_80/images/Logo.svg";

  if (currentView === "ikigai") return <PageWrapper isFadingOut={isFadingOut}><IkigaiPage onBack={() => setCurrentView("home")} /></PageWrapper>;
  if (currentView === "empleado") return <PageWrapper isFadingOut={isFadingOut}><EmpleadoPage onBack={() => setCurrentView("home")} /></PageWrapper>;
  if (currentView === "empresario") return <PageWrapper isFadingOut={isFadingOut}><EmpresarioPage onBack={() => setCurrentView("home")} /></PageWrapper>;
  if (currentView === "emprendedor") return <PageWrapper isFadingOut={isFadingOut}><EmprendedorPage onBack={() => setCurrentView("home")} /></PageWrapper>;
  if (currentView === "vida") return <PageWrapper isFadingOut={isFadingOut}><VidaOptionsPage onBack={() => setCurrentView("home")} onSelectOption={handleVidaOption} /></PageWrapper>;
  if (currentView === "quest-planner") return <PageWrapper isFadingOut={isFadingOut}><QuestPlannerPage onBack={() => setCurrentView("vida")} /></PageWrapper>;
  if (currentView === "chef-personal") return <PageWrapper isFadingOut={isFadingOut}><ChefPersonalPage onBack={() => setCurrentView("vida")} /></PageWrapper>;
  if (currentView === "decoracion") return <PageWrapper isFadingOut={isFadingOut}><DecoracionPage onBack={() => setCurrentView("vida")} /></PageWrapper>;
  if (currentView === "idiomas") return <PageWrapper isFadingOut={isFadingOut}><IdiomasPage onBack={() => setCurrentView("vida")} /></PageWrapper>;

  return (
    <div className={`min-h-screen w-full bg-white flex flex-col transition-opacity duration-500 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
      <header className={`px-6 py-4 flex items-center justify-between transition-all duration-1000 bg-gradient-to-l from-black/10 via-white/50 to-white ${transitioningId ? 'opacity-0' : 'opacity-100'}`}>
        <div className="w-10"></div>
        <img 
          src={logoUrl} 
          className="h-10 md:h-12 w-auto invert brightness-0" 
          alt="Learning Heroes" 
        />
      </header>
      
      <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-hidden">
        <header className={`mb-12 text-center max-w-2xl transition-all duration-1000 ${transitioningId ? 'opacity-0 -translate-y-10' : 'opacity-100'}`}>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
            Diseña tu Futuro con IA
          </h1>
          <p className="text-lg text-gray-500">
            Selecciona el perfil que mejor se adapta a ti y comienza tu transformación.
          </p>
        </header>

        <div className="relative w-full max-w-[1600px] min-h-[500px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 w-full h-full">
            {destinations.map((dest) => {
              const isSelected = transitioningId === dest.id;
              const isOthersDimmed = transitioningId !== null && !isSelected;

              return (
                <div
                  key={dest.id}
                  className={`w-full aspect-[3/4] max-h-[500px] transition-all duration-1000 ease-in-out
                    ${isOthersDimmed ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}
                    ${isSelected ? 'z-50' : 'z-0'}
                  `}
                  style={isSelected ? {
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%) scale(1.1)',
                    width: '320px',
                  } : undefined}
                  onClick={(e) => !transitioningId && handleCardClick(e, dest.id)}
                >
                  <DestinationCard
                    imageUrl={dest.imageUrl}
                    location={dest.location}
                    flag={dest.flag}
                    stats={dest.stats}
                    href="#"
                    themeColor={dest.themeColor}
                    className={`${!transitioningId ? 'cursor-pointer' : ''}`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
