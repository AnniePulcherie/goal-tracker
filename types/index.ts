import { GoalStatus } from "@prisma/client";

export type { GoalStatus };

export interface UserSession {
  id: string;
  name?: string | null;
  email?: string | null;
}

export interface TaskWithSubGoal {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: Date;
  completed: boolean;
  completedAt: Date | null;
  subGoal: {
    id: string;
    title: string;
    goal: {
      id: string;
      title: string;
    };
  };
}

export interface GoalWithRelations {
  id: string;
  title: string;
  description: string | null;
  deadline: Date | null;
  status: GoalStatus;
  progress: number;
  createdAt: Date;
  subGoals: SubGoalWithTasks[];
}

export interface SubGoalWithTasks {
  id: string;
  title: string;
  description: string | null;
  order: number;
  status: GoalStatus;
  tasks: TaskItem[];
}

export interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: Date;
  completed: boolean;
  completedAt: Date | null;
}

export interface DecomposedGoal {
  subGoals: {
    title: string;
    description: string;
    order: number;
    tasks: {
      title: string;
      description: string;
      dayOffset: number;
    }[];
  }[];
}

export interface DashboardStats {
  totalGoals: number;
  completedGoals: number;
  todayTasks: number;
  todayCompleted: number;
  weekTasks: number;
  weekCompleted: number;
  monthTasks: number;
  monthCompleted: number;
}