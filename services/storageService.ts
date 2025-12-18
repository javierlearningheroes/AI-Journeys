
import { QuestUser, QuestTask, QuestReward, UserRole, QuestStatus, QuestDifficulty } from '../types';

const INITIAL_USERS: QuestUser[] = [
  { id: 'u1', name: 'Papá', role: UserRole.ADMIN, avatar: '👨‍💼', points: 0, totalPointsEarned: 0 },
  { id: 'u2', name: 'Mamá', role: UserRole.ADMIN, avatar: '👩‍💼', points: 0, totalPointsEarned: 0 },
  { id: 'u3', name: 'Leo', role: UserRole.CHILD, avatar: '👦', points: 50, totalPointsEarned: 120 },
  { id: 'u4', name: 'Sofía', role: UserRole.CHILD, avatar: '👧', points: 120, totalPointsEarned: 300 },
];

const INITIAL_REWARDS: QuestReward[] = [
  { id: 'r1', title: '1 Hora de Videojuegos', description: 'Tiempo extra en la consola.', cost: 50, icon: '🎮', redeemedBy: [] },
  { id: 'r2', title: 'Elegir la cena', description: 'Tú decides qué cenamos el viernes.', cost: 100, icon: '🍕', redeemedBy: [] },
  { id: 'r3', title: 'Ir al Cine', description: 'Entrada para una película el fin de semana.', cost: 300, icon: '🎟️', redeemedBy: [] },
];

const KEYS = {
  USERS: 'hq_users',
  TASKS: 'hq_tasks',
  REWARDS: 'hq_rewards'
};

const load = <T,>(key: string, defaultVal: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(defaultVal));
    return defaultVal;
  }
  return JSON.parse(stored);
};

export const StorageService = {
  getUsers: (): QuestUser[] => load(KEYS.USERS, INITIAL_USERS),
  saveUsers: (users: QuestUser[]) => localStorage.setItem(KEYS.USERS, JSON.stringify(users)),

  getTasks: (): QuestTask[] => load(KEYS.TASKS, []),
  saveTasks: (tasks: QuestTask[]) => localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks)),

  getRewards: (): QuestReward[] => load(KEYS.REWARDS, INITIAL_REWARDS),
  saveRewards: (rewards: QuestReward[]) => localStorage.setItem(KEYS.REWARDS, JSON.stringify(rewards)),

  updateTaskStatus: (taskId: string, status: QuestStatus) => {
    const tasks = StorageService.getTasks();
    const updated = tasks.map(t => t.id === taskId ? { ...t, status } : t);
    StorageService.saveTasks(updated);
    return updated;
  },

  assignTask: (taskId: string, userId: string | null) => {
    const tasks = StorageService.getTasks();
    const updated = tasks.map(t => t.id === taskId ? { ...t, assignedToId: userId } : t);
    StorageService.saveTasks(updated);
    return updated;
  },

  addTask: (task: QuestTask) => {
    const tasks = StorageService.getTasks();
    tasks.push(task);
    StorageService.saveTasks(tasks);
    return tasks;
  },

  updateTask: (task: QuestTask) => {
    const tasks = StorageService.getTasks();
    const updated = tasks.map(t => t.id === task.id ? task : t);
    StorageService.saveTasks(updated);
    return updated;
  },

  deleteTask: (taskId: string) => {
    const tasks = StorageService.getTasks().filter(t => t.id !== taskId);
    StorageService.saveTasks(tasks);
    return tasks;
  },

  approveTask: (taskId: string) => {
    const tasks = StorageService.getTasks();
    const users = StorageService.getUsers();
    
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return { tasks, users };

    const task = tasks[taskIndex];
    
    if (task.status !== QuestStatus.DONE && task.assignedToId) {
       task.status = QuestStatus.DONE;
       task.completedAt = new Date().toISOString();
       
       const userIndex = users.findIndex(u => u.id === task.assignedToId);
       if (userIndex !== -1) {
         users[userIndex].points += task.rewardPoints;
         users[userIndex].totalPointsEarned += task.rewardPoints;
       }
    }

    StorageService.saveTasks(tasks);
    StorageService.saveUsers(users);
    return { tasks, users };
  },

  redeemReward: (userId: string, rewardId: string) => {
    const users = StorageService.getUsers();
    const rewards = StorageService.getRewards();
    const userIndex = users.findIndex(u => u.id === userId);
    const rewardIndex = rewards.findIndex(r => r.id === rewardId);

    if (userIndex !== -1 && rewardIndex !== -1) {
      const user = users[userIndex];
      const reward = rewards[rewardIndex];

      if (user.points >= reward.cost) {
        user.points -= reward.cost;
        reward.redeemedBy.push(userId);
        
        StorageService.saveUsers(users);
        StorageService.saveRewards(rewards);
        return { success: true, users, rewards };
      }
    }
    return { success: false, users, rewards };
  }
};
