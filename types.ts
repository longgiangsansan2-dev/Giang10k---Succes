export enum TaskQuadrant {
  DO_NOW = 'do_now',
  SCHEDULE = 'schedule',
  DELEGATE = 'delegate',
  ELIMINATE = 'eliminate'
}

export enum TaskStatus {
  TODO = 'pending',
  DONE = 'done'
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  icon: string;
  user_id: string;
  created_at: string;
  category: 'task' | 'bucketlist';
}

export interface JournalTopic {
  id: string;
  name: string;
  created_at: string;
  share_token?: string;
  is_public?: boolean;
}

export interface JournalPost {
  id: string;
  topic_id: string;
  title: string | null;
  content: string;
  mood: number | null;
  entry_date: string;
  created_at: string;
  updated_at: string;
  journal_topic?: {
    name: string;
  };
}

export interface TaskTemplate {
  id: string;
  title: string;
  quadrant: TaskQuadrant;
  isActive: boolean;
  orderIndex: number;
  tag_id?: string;
}

export interface DailyTask {
  id: string;
  date: string;
  title: string;
  description?: string;
  quadrant: TaskQuadrant;
  status: TaskStatus;
  orderIndex: number;
  deadlineAt: string | null;
  sourceTemplateId?: string | null;
  linkedPostId?: string | null;
  linkedPost?: JournalPost | null;
  createdAt: string;
  updatedAt: string;
  tag_id?: string;
}

export enum VisionCategory {
  FINANCE = 'finance',
  WORK = 'work',
  PERSONAL_DEVELOPMENT = 'personal_development',
  HEALTH = 'health',
  RELATIONSHIPS = 'relationships',
  EXPERIENCES = 'experiences'
}

export interface VisionGoal {
  id: string;
  category: VisionCategory;
  title: string;
  description?: string;
  isCompleted: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface BucketlistItem {
  id: string;
  title: string;
  description?: string;
  imageBase64?: string;
  isCompleted: boolean;
  completedAt?: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  tag_ids?: string[];
}

export const VISION_CATEGORY_UI = {
  [VisionCategory.FINANCE]: {
    label: 'MỤC TIÊU TÀI CHÍNH',
    icon: '💰',
    color: 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/30',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500'
  },
  [VisionCategory.WORK]: {
    label: 'MỤC TIÊU CÔNG VIỆC',
    icon: '💼',
    color: 'border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/30',
    textColor: 'text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500'
  },
  [VisionCategory.PERSONAL_DEVELOPMENT]: {
    label: 'PHÁT TRIỂN BẢN THÂN',
    icon: '🎯',
    color: 'border-violet-200 dark:border-violet-900/50 bg-violet-50/50 dark:bg-violet-950/30',
    textColor: 'text-violet-600 dark:text-violet-400',
    dot: 'bg-violet-500'
  },
  [VisionCategory.HEALTH]: {
    label: 'SỨC KHỎE & LỐI SỐNG',
    icon: '❤️',
    color: 'border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/30',
    textColor: 'text-red-600 dark:text-red-400',
    dot: 'bg-red-500'
  },
  [VisionCategory.RELATIONSHIPS]: {
    label: 'MỐI QUAN HỆ',
    icon: '🤝',
    color: 'border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/30',
    textColor: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500'
  },
  [VisionCategory.EXPERIENCES]: {
    label: 'TRẢI NGHIỆM & NIỀM VUI',
    icon: '✨',
    color: 'border-pink-200 dark:border-pink-900/50 bg-pink-50/50 dark:bg-pink-950/30',
    textColor: 'text-pink-600 dark:text-pink-400',
    dot: 'bg-pink-500'
  }
};

export const QUADRANT_UI = {
  [TaskQuadrant.DO_NOW]: {
    label: 'LÀM NGAY',
    sub: 'Quan trọng & Khẩn cấp',
    color: 'border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/20 text-red-600 dark:text-red-400',
    dot: 'bg-red-500'
  },
  [TaskQuadrant.SCHEDULE]: {
    label: 'LÊN LỊCH',
    sub: 'Quan trọng & Không khẩn cấp',
    color: 'border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500'
  },
  [TaskQuadrant.DELEGATE]: {
    label: 'GIAO VIỆC',
    sub: 'Không quan trọng & Khẩn cấp',
    color: 'border-yellow-200 dark:border-yellow-900/50 bg-yellow-50/30 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-400',
    dot: 'bg-yellow-500'
  },
  [TaskQuadrant.ELIMINATE]: {
    label: 'LOẠI BỎ',
    sub: 'Không quan trọng & Không khẩn cấp',
    color: 'border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20 text-slate-500 dark:text-slate-400',
    dot: 'bg-slate-500'
  }
};