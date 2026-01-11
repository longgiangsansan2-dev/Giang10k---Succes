
import React from 'react';
import { DailyTask, QUADRANT_UI, TaskStatus } from '../types';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

interface TaskListProps {
  tasks: DailyTask[];
}

const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-200">
        <Clock className="mx-auto text-gray-300 mb-4" size={48} />
        <p className="text-gray-500">Chưa có công việc nào cho hôm nay.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-gray-800 px-1">Danh sách hôm nay</h2>
      {tasks.map((task) => {
        const config = QUADRANT_UI[task.quadrant];
        return (
          <div 
            key={task.id} 
            className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <button className="text-gray-300 hover:text-indigo-600 transition-colors">
              {task.status === TaskStatus.DONE ? <CheckCircle2 className="text-green-500" /> : <Circle />}
            </button>
            <div className="flex-1">
              <h4 className={`font-medium ${task.status === TaskStatus.DONE ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                {task.title}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${config.color}`}>
                  {config.label}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TaskList;
