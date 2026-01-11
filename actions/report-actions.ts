"use server";

import { getAuthenticatedClient } from "../lib/supabase/client";
import { 
  format, 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  parseISO,
  isWithinInterval,
  subDays,
  startOfYear,
  endOfYear
} from "date-fns";
import { TaskQuadrant, TaskStatus } from "../types";

const getTaskReportDate = (task: any): Date => {
  if (task.deadline_at) return new Date(task.deadline_at);
  const dateStr = task.date || task.created_at;
  return parseISO(dateStr);
};

export async function getReportData(filter: string) {
  const { supabase, user } = await getAuthenticatedClient();
  const userId = user.id;

  const now = new Date();
  let interval: { start: Date; end: Date };

  switch (filter) {
    case 'today': interval = { start: startOfDay(now), end: endOfDay(now) }; break;
    case 'week': interval = { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }; break;
    case 'month': interval = { start: startOfMonth(now), end: endOfMonth(now) }; break;
    case 'year': interval = { start: startOfYear(now), end: endOfYear(now) }; break;
    default: interval = { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
  }

  const { data: allTasks, error } = await supabase
    .from('daily_task')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;

  const filteredTasks = (allTasks || []).filter(task => {
    const reportDate = getTaskReportDate(task);
    return isWithinInterval(reportDate, interval);
  });

  const total = filteredTasks.length;
  const doneTasks = filteredTasks.filter(t => t.status === TaskStatus.DONE);
  const doneCount = doneTasks.length;
  const efficiency = total > 0 ? Number(((doneCount / total) * 100).toFixed(1)) : 0;
  
  const quadCounts: Record<string, number> = {};
  doneTasks.forEach(t => { quadCounts[t.quadrant] = (quadCounts[t.quadrant] || 0) + 1; });
  const focus = Object.entries(quadCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "--";

  const matrixData = [
    { name: 'Làm ngay', value: doneTasks.filter(t => t.quadrant === TaskQuadrant.DO_NOW).length },
    { name: 'Lên lịch', value: doneTasks.filter(t => t.quadrant === TaskQuadrant.SCHEDULE).length },
    { name: 'Giao việc', value: doneTasks.filter(t => t.quadrant === TaskQuadrant.DELEGATE).length },
    { name: 'Loại bỏ', value: doneTasks.filter(t => t.quadrant === TaskQuadrant.ELIMINATE).length },
  ];

  const progressData: { name: string, done: number }[] = [];
  if (filter === 'week' || filter === 'today') {
    for (let i = 6; i >= 0; i--) {
      const d = subDays(now, i);
      const label = format(d, 'dd/MM');
      const start = startOfDay(d);
      const end = endOfDay(d);
      const count = (allTasks || []).filter(t => {
        const rd = getTaskReportDate(t);
        return t.status === TaskStatus.DONE && isWithinInterval(rd, { start, end });
      }).length;
      progressData.push({ name: label, done: count });
    }
  } else {
    const progressDataMap: Record<string, number> = {};
    filteredTasks.forEach(t => {
      const rd = getTaskReportDate(t);
      const key = format(rd, filter === 'year' ? 'MMM' : 'dd/MM');
      if (t.status === TaskStatus.DONE) progressDataMap[key] = (progressDataMap[key] || 0) + 1;
      else progressDataMap[key] = progressDataMap[key] || 0;
    });
    Object.entries(progressDataMap).forEach(([name, done]) => progressData.push({ name, done }));
  }

  const historyMap: Record<string, { done: number, total: number }> = {};
  filteredTasks.forEach(t => {
    const rd = getTaskReportDate(t);
    const dateKey = format(rd, 'yyyy-MM-dd');
    if (!historyMap[dateKey]) historyMap[dateKey] = { done: 0, total: 0 };
    historyMap[dateKey].total++;
    if (t.status === TaskStatus.DONE) historyMap[dateKey].done++;
  });
  
  const history = Object.entries(historyMap)
    .map(([date, counts]) => ({ 
      date, 
      count: `${counts.done}/${counts.total}`, 
      rate: Math.round((counts.done / counts.total) * 100) 
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  return { total, doneCount, efficiency, focus, matrixData, progressData, history };
}