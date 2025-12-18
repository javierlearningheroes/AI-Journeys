
import React, { useState, useEffect } from 'react';
import { 
  QuestUser, QuestTask, QuestReward, UserRole, QuestStatus, QuestDifficulty 
} from '../types';
import { StorageService } from '../services/storageService';
import { 
  ArrowLeft, Plus, Trophy, Edit2, Trash2, CheckCircle2, PlayCircle, Clock, 
  Gift, Shield, User, X, Save, AlertCircle
} from 'lucide-react';
import { CustomButton } from './CustomButton';

interface QuestPlannerPageProps {
  onBack: () => void;
}

export const QuestPlannerPage: React.FC<QuestPlannerPageProps> = ({ onBack }) => {
  const [currentUser, setCurrentUser] = useState<QuestUser | null>(null);
  const [view, setView] = useState<'login' | 'dashboard' | 'tasks' | 'rewards'>('login');
  const [users, setUsers] = useState<QuestUser[]>([]);
  const [tasks, setTasks] = useState<QuestTask[]>([]);
  const [rewards, setRewards] = useState<QuestReward[]>([]);
  
  // Modal State
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<QuestTask | null>(null);
  const [newTaskData, setNewTaskData] = useState<{title: string, desc: string, points: number, diff: QuestDifficulty}>({
    title: '', desc: '', points: 50, diff: QuestDifficulty.EASY
  });

  // Refresh data helper
  const refreshData = () => {
    setUsers(StorageService.getUsers());
    setTasks(StorageService.getTasks());
    setRewards(StorageService.getRewards());
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (currentUser) {
      const freshUser = users.find(u => u.id === currentUser.id);
      if (freshUser) setCurrentUser(freshUser);
    }
  }, [users]);

  const handleLogin = (u: QuestUser) => {
    setCurrentUser(u);
    setView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('login');
  };

  // --- TASK ACTIONS ---

  const handleCreateTask = () => {
    if (!newTaskData.title) return;
    const task: QuestTask = {
      id: Date.now().toString(),
      title: newTaskData.title,
      description: newTaskData.desc,
      difficulty: newTaskData.diff,
      rewardPoints: newTaskData.points,
      status: QuestStatus.TODO,
      assignedToId: null
    };
    StorageService.addTask(task);
    setNewTaskData({ title: '', desc: '', points: 50, diff: QuestDifficulty.EASY });
    setIsCreatorOpen(false);
    refreshData();
  };

  const handleUpdateTask = () => {
    if (!editingTask) return;
    StorageService.updateTask(editingTask);
    setEditingTask(null);
    setIsCreatorOpen(false);
    refreshData();
  };

  const handleDeleteTask = (id: string) => {
    if (window.confirm('¿Seguro que quieres borrar esta misión?')) {
      StorageService.deleteTask(id);
      refreshData();
    }
  };

  const handleAcceptTask = (taskId: string) => {
    if (!currentUser) return;
    StorageService.assignTask(taskId, currentUser.id);
    StorageService.updateTaskStatus(taskId, QuestStatus.IN_PROGRESS);
    refreshData();
  };

  const handleApproveTask = (taskId: string) => {
    const res = StorageService.approveTask(taskId);
    setUsers(res.users);
    setTasks(res.tasks);
  };

  const handleRedeemReward = (rewardId: string) => {
    if (!currentUser) return;
    const res = StorageService.redeemReward(currentUser.id, rewardId);
    if (res.success) {
      alert('¡Premio canjeado! Disfrútalo.');
      setUsers(res.users);
      setRewards(res.rewards);
    } else {
      alert('No tienes suficientes puntos para este premio.');
    }
  };

  // --- RENDER HELPERS ---

  const getDifficultyColor = (diff: QuestDifficulty) => {
    switch(diff) {
      case QuestDifficulty.EASY: return 'bg-emerald-100 text-emerald-700';
      case QuestDifficulty.MEDIUM: return 'bg-amber-100 text-amber-700';
      case QuestDifficulty.HARD: return 'bg-rose-100 text-rose-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const logoUrl = "https://www.learningheroes.com/_ipx/q_80/images/Logo.svg";

  // --- LOGIN VIEW ---
  if (view === 'login' || !currentUser) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="border-b border-gray-100 px-6 py-4 sticky top-0 bg-gradient-to-l from-black/10 via-white/50 to-white z-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-2">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-semibold tracking-tight">HogarIA</h1>
          </div>
          <img src={logoUrl} className="h-8 md:h-10 w-auto invert brightness-0" alt="Logo" />
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-center mb-16 space-y-2">
            <h2 className="text-4xl font-bold tracking-tight">HogarIA</h2>
            <p className="text-gray-400">Gamifica tus tareas diarias.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-2xl">
            {users.map(u => (
              <button key={u.id} onClick={() => handleLogin(u)} className="bg-gray-50 p-8 rounded-3xl hover:bg-black group transition-all duration-300">
                <span className="text-5xl block mb-4 group-hover:scale-110 transition-transform">{u.avatar}</span>
                <span className="font-bold text-gray-800 group-hover:text-white uppercase tracking-wider text-xs">{u.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN APP LAYOUT ---
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-100 px-6 py-4 sticky top-0 bg-gradient-to-l from-black/10 via-white/50 to-white z-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-2" title="Cerrar Sesión">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
             <span className="text-xl mr-2">{currentUser.avatar}</span>
             <h1 className="text-xl font-semibold tracking-tight hidden md:block">{currentUser.name}</h1>
          </div>
          
          <div className="hidden md:flex bg-gray-100 p-1 rounded-xl ml-4">
            <button onClick={() => setView('dashboard')} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${view === 'dashboard' ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}>Inicio</button>
            <button onClick={() => setView('tasks')} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${view === 'tasks' ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}>Misiones</button>
            <button onClick={() => setView('rewards')} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${view === 'rewards' ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}>Premios</button>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
              <Trophy size={16} className="text-amber-500" />
              <span className="font-bold text-amber-900">{currentUser.points} pts</span>
           </div>
           <img src={logoUrl} className="h-8 md:h-10 w-auto invert brightness-0" alt="Logo" />
        </div>
      </header>

      {/* Mobile Nav */}
      <div className="md:hidden flex justify-between px-6 py-3 bg-gray-50 border-b border-gray-100">
         <button onClick={() => setView('dashboard')} className={`text-[10px] font-bold uppercase tracking-widest ${view === 'dashboard' ? 'text-black' : 'text-gray-400'}`}>Inicio</button>
         <button onClick={() => setView('tasks')} className={`text-[10px] font-bold uppercase tracking-widest ${view === 'tasks' ? 'text-black' : 'text-gray-400'}`}>Misiones</button>
         <button onClick={() => setView('rewards')} className={`text-[10px] font-bold uppercase tracking-widest ${view === 'rewards' ? 'text-black' : 'text-gray-400'}`}>Premios</button>
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8">
        
        {/* --- DASHBOARD VIEW --- */}
        {view === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="bg-black text-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                   <h2 className="text-3xl font-bold mb-2">¡Hola, {currentUser.name}!</h2>
                   <p className="text-gray-400 mb-8 max-w-md">Tienes {currentUser.points} puntos disponibles. Completa misiones para ganar más o canjéalos por premios increíbles.</p>
                   <div className="flex gap-4">
                      <button onClick={() => setView('tasks')} className="bg-white text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors">Ver Misiones</button>
                      <button onClick={() => setView('rewards')} className="bg-white/10 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/20 transition-colors">Ver Premios</button>
                   </div>
                </div>
                <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10">
                   <Trophy size={300} />
                </div>
             </div>

             <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><PlayCircle className="text-blue-500"/> Misiones Activas</h3>
                <div className="grid gap-4 md:grid-cols-2">
                   {tasks.filter(t => t.assignedToId === currentUser.id && t.status === QuestStatus.IN_PROGRESS).length === 0 ? (
                      <div className="col-span-2 p-8 text-center text-gray-400 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                         No tienes misiones en curso. ¡Ve a la pestaña Misiones y acepta una!
                      </div>
                   ) : (
                      tasks.filter(t => t.assignedToId === currentUser.id && t.status === QuestStatus.IN_PROGRESS).map(task => (
                        <div key={task.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
                           <div>
                              <h4 className="font-bold">{task.title}</h4>
                              <p className="text-xs text-gray-500">{task.description}</p>
                           </div>
                           <div className="text-right">
                              <span className="block font-bold text-amber-500">{task.rewardPoints} pts</span>
                              <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-full">En Progreso</span>
                           </div>
                        </div>
                      ))
                   )}
                </div>
             </div>
          </div>
        )}

        {/* --- TASKS VIEW --- */}
        {view === 'tasks' && (
          <div className="space-y-6 animate-in fade-in duration-500">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Tablón de Misiones</h2>
                {isAdmin && (
                  <CustomButton onClick={() => { setEditingTask(null); setIsCreatorOpen(true); }} icon={<Plus size={18}/>} className="py-2 text-sm">
                    Nueva Misión
                  </CustomButton>
                )}
             </div>

             <div className="grid gap-4">
                {tasks.filter(t => t.status !== QuestStatus.DONE).map(task => (
                  <div key={task.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between group hover:border-black transition-colors">
                     <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${task.status === QuestStatus.TODO ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-600'}`}>
                           {task.status === QuestStatus.TODO ? <Clock size={24}/> : <PlayCircle size={24}/>}
                        </div>
                        <div>
                           <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-lg">{task.title}</h4>
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${getDifficultyColor(task.difficulty)}`}>{task.difficulty}</span>
                           </div>
                           <p className="text-sm text-gray-500 mb-2">{task.description}</p>
                           <div className="flex items-center gap-4 text-xs">
                              <span className="font-bold text-amber-500 flex items-center gap-1"><Trophy size={12}/> {task.rewardPoints} pts</span>
                              {task.assignedToId && (
                                <span className="text-gray-400 flex items-center gap-1">
                                   <User size={12}/> Asignado a: {users.find(u => u.id === task.assignedToId)?.name}
                                </span>
                              )}
                           </div>
                        </div>
                     </div>

                     <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                        {/* Logic for Child */}
                        {!isAdmin && task.status === QuestStatus.TODO && (
                           <CustomButton onClick={() => handleAcceptTask(task.id)} className="w-full md:w-auto py-2 text-xs bg-black text-white">
                              Aceptar Misión
                           </CustomButton>
                        )}
                        {!isAdmin && task.status === QuestStatus.IN_PROGRESS && task.assignedToId === currentUser.id && (
                           <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold border border-blue-100 flex items-center gap-2">
                              <Loader2 className="animate-spin w-3 h-3"/> En progreso
                           </div>
                        )}

                        {/* Logic for Admin */}
                        {isAdmin && (
                           <>
                              {task.status === QuestStatus.IN_PROGRESS && (
                                 <CustomButton onClick={() => handleApproveTask(task.id)} className="py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" icon={<CheckCircle2 size={14}/>}>
                                    Aprobar
                                 </CustomButton>
                              )}
                              <button onClick={() => { setEditingTask(task); setIsCreatorOpen(true); }} className="p-2 text-gray-400 hover:text-black bg-gray-50 rounded-xl transition-colors">
                                 <Edit2 size={16}/>
                              </button>
                              <button onClick={() => handleDeleteTask(task.id)} className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 rounded-xl transition-colors">
                                 <Trash2 size={16}/>
                              </button>
                           </>
                        )}
                     </div>
                  </div>
                ))}
                {tasks.filter(t => t.status !== QuestStatus.DONE).length === 0 && (
                   <div className="text-center py-12 bg-gray-50 rounded-3xl border border-gray-100 border-dashed text-gray-400">
                      No hay misiones activas en este momento.
                   </div>
                )}
             </div>

             {tasks.some(t => t.status === QuestStatus.DONE) && (
                <div className="mt-12">
                   <h3 className="text-lg font-bold mb-4 text-gray-400 uppercase tracking-widest text-xs">Historial de Completadas</h3>
                   <div className="opacity-60 space-y-2">
                      {tasks.filter(t => t.status === QuestStatus.DONE).map(task => (
                         <div key={task.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="font-medium text-sm line-through text-gray-500">{task.title}</span>
                            <span className="text-xs font-bold text-emerald-600">Completada (+{task.rewardPoints} pts)</span>
                         </div>
                      ))}
                   </div>
                </div>
             )}
          </div>
        )}

        {/* --- REWARDS VIEW --- */}
        {view === 'rewards' && (
           <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-bold">Catálogo de Premios</h2>
                 <div className="bg-amber-50 px-4 py-2 rounded-xl border border-amber-100 text-amber-800 font-bold text-sm">
                    Saldo: {currentUser.points} pts
                 </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 {rewards.map(reward => {
                    const canAfford = currentUser.points >= reward.cost;
                    return (
                       <div key={reward.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
                          <div className="text-6xl mb-4">{reward.icon}</div>
                          <h3 className="font-bold text-lg mb-2">{reward.title}</h3>
                          <p className="text-sm text-gray-500 mb-6 min-h-[40px]">{reward.description}</p>
                          <CustomButton 
                            onClick={() => handleRedeemReward(reward.id)} 
                            disabled={!canAfford}
                            className={`w-full py-3 text-sm ${canAfford ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}
                          >
                             {canAfford ? `Canjear (${reward.cost} pts)` : `Faltan ${reward.cost - currentUser.points} pts`}
                          </CustomButton>
                       </div>
                    );
                 })}
              </div>
           </div>
        )}

      </main>

      {/* --- CREATOR MODAL --- */}
      {isCreatorOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold">{editingTask ? 'Editar Misión' : 'Nueva Misión'}</h3>
                 <button onClick={() => setIsCreatorOpen(false)}><X className="text-gray-400 hover:text-black"/></button>
              </div>
              <div className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Título</label>
                    <input 
                      type="text" 
                      value={editingTask ? editingTask.title : newTaskData.title}
                      onChange={e => editingTask ? setEditingTask({...editingTask, title: e.target.value}) : setNewTaskData({...newTaskData, title: e.target.value})}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Descripción</label>
                    <textarea 
                      value={editingTask ? editingTask.description : newTaskData.desc}
                      onChange={e => editingTask ? setEditingTask({...editingTask, description: e.target.value}) : setNewTaskData({...newTaskData, desc: e.target.value})}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black h-24 resize-none"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Puntos</label>
                       <input 
                         type="number" 
                         value={editingTask ? editingTask.rewardPoints : newTaskData.points}
                         onChange={e => editingTask ? setEditingTask({...editingTask, rewardPoints: parseInt(e.target.value)}) : setNewTaskData({...newTaskData, points: parseInt(e.target.value)})}
                         className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black"
                       />
                    </div>
                    <div>
                       <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Dificultad</label>
                       <select 
                         value={editingTask ? editingTask.difficulty : newTaskData.diff}
                         onChange={e => editingTask ? setEditingTask({...editingTask, difficulty: e.target.value as QuestDifficulty}) : setNewTaskData({...newTaskData, diff: e.target.value as QuestDifficulty})}
                         className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black"
                       >
                          <option value={QuestDifficulty.EASY}>Fácil</option>
                          <option value={QuestDifficulty.MEDIUM}>Media</option>
                          <option value={QuestDifficulty.HARD}>Difícil</option>
                       </select>
                    </div>
                 </div>
                 <CustomButton onClick={editingTask ? handleUpdateTask : handleCreateTask} className="w-full py-4 mt-4" icon={<Save size={18}/>}>
                    {editingTask ? 'Guardar Cambios' : 'Crear Misión'}
                 </CustomButton>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

// Simple import fix for Loader2 if missing
const Loader2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
);
