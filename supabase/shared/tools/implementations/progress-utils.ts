// Progress Calculation Utilities
export function getDateFilter(timePeriod: string): string {
  const now = new Date();
  switch (timePeriod) {
    case 'today':
      return now.toISOString().split('T')[0];
    case 'week':
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return weekAgo.toISOString().split('T')[0];
    case 'month':
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return monthAgo.toISOString().split('T')[0];
    default:
      return '1970-01-01'; // All time
  }
}

export function calculateCompletionRate(checkins: any[]): number {
  if (checkins.length === 0) return 0;
  const completed = checkins.filter(c => c.status === 'completed').length;
  return (completed / checkins.length) * 100;
}

export function calculateProgressPercentage(goal: any): number {
  return goal.target_value ? 
    Math.min((goal.current_value / goal.target_value) * 100, 100) : 0;
}

export function calculateDaysActive(startDate: string): number {
  return Math.floor((Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
}

export function calculateProgressSummary(goals: any[]): any {
  if (!goals || goals.length === 0) {
    return {
      total_goals: 0,
      goals_on_track: 0,
      goals_behind: 0,
      overall_completion_rate: 0,
      goals: []
    };
  }

  return {
    total_goals: goals.length,
    goals_on_track: goals.filter((g: any) => g.progress_percentage >= 80).length,
    goals_behind: goals.filter((g: any) => g.progress_percentage < 50).length,
    overall_completion_rate: goals.reduce((sum: number, g: any) => sum + g.progress_percentage, 0) / goals.length,
    goals
  };
} 