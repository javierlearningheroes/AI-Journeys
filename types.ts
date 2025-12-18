
export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export type ItemCategory = 'Mobiliario' | 'Decoración' | 'Iluminación' | 'Vegetación';

export interface FurnitureItem {
  name: string;
  description: string;
  price?: string;
  shopName?: string;
  dimensions?: string;
  category: ItemCategory;
  isolatedImageUrl?: string;
  links: {
    title: string;
    uri: string;
  }[];
}

export interface DesignResult {
  id: string;
  timestamp: number;
  imageUrl: string;
  description: string;
  furniture: FurnitureItem[];
  totalEstimatedBudget?: string;
}

export type RoomType = 
  | 'Baño' 
  | 'Dormitorio Principal' 
  | 'Aseo' 
  | 'Comedor' 
  | 'Salón' 
  | 'Cocina' 
  | 'Patio' 
  | 'Terraza' 
  | 'Garaje' 
  | 'Estudio/Oficina';

export interface IkigaiAnalysis {
  resumen: string;
  proposito: string;
  diagnostico: string;
  recomendaciones: string[];
  caminoRecomendado: 'empleado' | 'empresario' | 'emprendedor';
  explicacionCamino: string;
}

export interface PlanActivity { day: string; category: string; task: string; description: string; }
export interface Lever { name: string; description: string; area: string; impact: string; complexity: string; priority?: number; }
export interface ImplementationStep { activity: string; owner: string; details?: string; relatedLever?: string; startWeek?: number; durationWeeks?: number; }
export interface OptimizationResult { markdown: string; matchPercentage: number; matchAnalysis: string; interviewQuestions: { question: string; starAnswer: string; }[]; structuredPlan: PlanActivity[]; }
export interface UploadedFile { name: string; type: string; size: number; content: string; }
export interface BusinessAnalysisResult { conclusion: string; levers: Lever[]; implementationPlan: ImplementationStep[]; ninetyDayPlan: any[]; competitors: any[]; potentialClients: any[]; }
export enum DietType { ANY = 'Cualquiera', VEGAN = 'Vegana', VEGETARIAN = 'Vegetariana', KETO = 'Keto', PALEO = 'Paleo' }
export interface GroceryListResponse { categories: { name: string; items: { name: string; quantity: string; }[]; }[]; }
export interface Recipe { title: string; description: string; time: string; difficulty: string; ingredients: string[]; instructions: string[]; }
export interface RecipeResponse { recipes: Recipe[]; identifiedIngredients?: string[]; }

// --- EMPRENDEDOR TYPES ---
export interface FinancialItem { concept: string; amount: string; type: 'fixed' | 'variable' | 'investment'; }
export interface Financials { 
  initialInvestment: FinancialItem[]; 
  monthlyCosts: FinancialItem[]; 
  revenueProjections: string; 
  breakEvenPoint: string; 
}
export interface NetworkingContact { role: string; organizationType: string; reason: string; strategy: string; }
export interface StrategicPlan { 
  criticalActions: any[]; 
  swot: any; 
  came: any; 
  bmc: any; 
  icp: any;
  financials: Financials;
  networking: NetworkingContact[];
}
export enum EmprendedorSection { INPUT = 'INPUT', DASHBOARD = 'DASHBOARD', PLANNER = 'PLANNER', NETWORKING = 'NETWORKING', BUDGET = 'BUDGET' }

export enum UserRole { ADMIN = 'ADMIN', CHILD = 'CHILD' }
export enum QuestStatus { TODO = 'TODO', IN_PROGRESS = 'IN_PROGRESS', DONE = 'DONE' }
export enum QuestDifficulty { EASY = 'EASY', MEDIUM = 'MEDIUM', HARD = 'HARD' }
export interface QuestUser { id: string; name: string; role: UserRole; avatar: string; points: number; totalPointsEarned: number; }
export interface QuestTask { id: string; title: string; description: string; difficulty: QuestDifficulty; rewardPoints: number; status: QuestStatus; assignedToId: string | null; completedAt?: string; }
export interface QuestReward { id: string; title: string; description: string; cost: number; icon: string; redeemedBy: string[]; }
export enum EnglishLevel { BEGINNER = 'BEGINNER', INTERMEDIATE = 'INTERMEDIATE', ADVANCED = 'ADVANCED' }
export enum LearningMode { FREE_STYLE = 'FREE_STYLE', GUIDED = 'GUIDED' }
export interface SessionConfig { level: EnglishLevel; mode: LearningMode; industry?: string; niche?: string; }
export interface ChatMessage { id: string; role: 'user' | 'model'; text: string; timestamp: number; }
