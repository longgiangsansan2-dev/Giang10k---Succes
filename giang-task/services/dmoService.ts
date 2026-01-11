
import { db } from '../db';
import { DailyTask, TaskStatus } from '../types';

export const dmoService = {
  generateDailyTasks: (date: string) => {
    const lastRun = db.getLastRunDate();
    if (lastRun === date) return; // Already run today

    const existingDaily = db.getDailyTasks(date);
    const templates = db.getTemplates();

    templates.forEach((tpl, index) => {
      // Check if task from this template already exists for today to ensure idempotency
      const alreadyExists = existingDaily.some(t => t.title === tpl.title);
      if (!alreadyExists) {
        // Fix: Added createdAt and updatedAt properties to conform to DailyTask interface
        const now = new Date().toISOString();
        // Removed non-existent userId property to match DailyTask interface and fixed property access on TaskTemplate
        // Added missing deadlineAt property to satisfy the DailyTask interface
        const newTask: DailyTask = {
          id: `dt_${Date.now()}_${index}`,
          title: tpl.title,
          quadrant: tpl.quadrant,
          // FIX: Changed to TaskStatus.TODO to match the TaskStatus enum definition
          status: TaskStatus.TODO,
          date: date,
          orderIndex: index,
          deadlineAt: null,
          createdAt: now,
          updatedAt: now
        };
        db.saveDailyTask(newTask);
      }
    });

    db.setLastRunDate(date);
  }
};
