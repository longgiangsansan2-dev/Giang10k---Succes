
import { TaskTemplate, DailyTask, TaskQuadrant, TaskStatus } from './types';

const STORAGE_KEYS = {
  TEMPLATES: 'dmo_task_templates',
  DAILY_TASKS: 'dmo_daily_tasks',
  JOURNAL_NODES: 'dmo_journal_nodes',
  JOURNAL_ENTRIES: 'dmo_journal_entries',
  LAST_DMO_RUN: 'dmo_last_run_date'
};

export const db = {
  getTemplates: (): TaskTemplate[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    return data ? JSON.parse(data) : [];
  },

  saveTemplates: (templates: TaskTemplate[]) => {
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  },

  deleteTemplate: (id: string) => {
    const templates = db.getTemplates();
    const filtered = templates.filter(t => t.id !== id);
    db.saveTemplates(filtered);
  },

  getDailyTasks: (date: string): DailyTask[] => {
    const data = localStorage.getItem(STORAGE_KEYS.DAILY_TASKS);
    const all: DailyTask[] = data ? JSON.parse(data) : [];
    return all.filter(t => t.date === date).sort((a, b) => a.orderIndex - b.orderIndex);
  },

  getAllDailyTasks: (): DailyTask[] => {
    const data = localStorage.getItem(STORAGE_KEYS.DAILY_TASKS);
    return data ? JSON.parse(data) : [];
  },

  saveDailyTask: (task: DailyTask) => {
    const data = localStorage.getItem(STORAGE_KEYS.DAILY_TASKS);
    const all: DailyTask[] = data ? JSON.parse(data) : [];
    const index = all.findIndex(t => t.id === task.id);
    
    const now = new Date().toISOString();
    const taskToSave = {
      ...task,
      updatedAt: now,
      createdAt: task.createdAt || now
    };

    if (index > -1) {
      all[index] = taskToSave;
    } else {
      all.push(taskToSave);
    }
    localStorage.setItem(STORAGE_KEYS.DAILY_TASKS, JSON.stringify(all));
  },

  getLastRunDate: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.LAST_DMO_RUN);
  },

  setLastRunDate: (date: string) => {
    localStorage.setItem(STORAGE_KEYS.LAST_DMO_RUN, date);
  }
};

export const seedData = () => {
  const existing = db.getTemplates();
  if (existing.length === 0) {
    const templates: TaskTemplate[] = [
      // Removed userId property which is not defined in TaskTemplate interface
      { id: 't1', title: 'Thiền 10 phút', quadrant: TaskQuadrant.SCHEDULE, isActive: true, orderIndex: 1 },
      { id: 't2', title: 'Xem lại plan ngày', quadrant: TaskQuadrant.DO_NOW, isActive: true, orderIndex: 2 },
      { id: 't3', title: 'Ghi nhật ký 5 phút', quadrant: TaskQuadrant.SCHEDULE, isActive: true, orderIndex: 3 }
    ];
    db.saveTemplates(templates);
  }
};
