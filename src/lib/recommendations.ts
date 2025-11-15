export interface ClientProfile {
  goals?: string[];
  training_experience?: string;
  sessions_per_week?: number | string;
  chronic_diseases?: string[];
  injuries?: string[];
  weight_goal?: string;
  age?: number;
}

export function generateDummyRecommendations(profile: ClientProfile): string[] {
  const recommendations: string[] = [];
  const goals = profile.goals || [];
  const sessionsPerWeek = typeof profile.sessions_per_week === 'string'
    ? parseInt(profile.sessions_per_week)
    : (profile.sessions_per_week || 0);
  const chronicDiseases = profile.chronic_diseases || [];
  const injuries = profile.injuries || [];

  if (goals.includes('Less Pain') || goals.includes('Move Easier')) {
    recommendations.push(
      'Focus on low-impact exercises and mobility work to reduce pain and improve movement quality.'
    );
  }

  if (goals.includes('Get Stronger')) {
    recommendations.push(
      'Progressive resistance training with proper form will help you build strength safely and effectively.'
    );
  }

  if (goals.includes('More Stamina')) {
    recommendations.push(
      'Gradually increase your cardiovascular training duration and intensity to build endurance over time.'
    );
  }

  if (goals.includes('Healthy Weight')) {
    recommendations.push(
      'Combine regular exercise with mindful nutrition habits for sustainable weight management results.'
    );
  }

  if (injuries.length > 0) {
    recommendations.push(
      'Work closely with your trainer to modify exercises around your injuries and focus on rehabilitation protocols.'
    );
  }

  if (chronicDiseases.length > 0) {
    recommendations.push(
      'Your trainer will adapt your program to accommodate your health conditions while maximizing safe progress.'
    );
  }

  if (sessionsPerWeek >= 4) {
    recommendations.push(
      'With 4+ sessions per week, ensure you include rest days and vary your training intensity to prevent overtraining.'
    );
  } else if (sessionsPerWeek <= 2 && sessionsPerWeek > 0) {
    recommendations.push(
      'To maximize results, consider increasing your training frequency as you build consistency and confidence.'
    );
  }

  if (profile.training_experience === 'Beginner') {
    recommendations.push(
      'Start with foundational movement patterns and build proper technique before progressing to more complex exercises.'
    );
  }

  if (profile.training_experience === 'Advanced' || profile.training_experience === '5+ years') {
    recommendations.push(
      'Incorporate periodization and advanced training techniques to continue making progress at your level.'
    );
  }

  if (profile.age && profile.age >= 50) {
    recommendations.push(
      'Prioritize recovery, joint health, and balance work alongside your primary training goals.'
    );
  }

  if (profile.weight_goal === 'Underweight' || profile.weight_goal === 'Severely Underweight') {
    recommendations.push(
      'Focus on progressive strength training and adequate nutrition to support healthy weight gain.'
    );
  }

  if (profile.weight_goal === 'Overweight' || profile.weight_goal === 'Obese') {
    recommendations.push(
      'Create a sustainable calorie deficit through a combination of regular exercise and portion-controlled nutrition.'
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'Stay consistent with your training and communicate regularly with your trainer.',
      'Track your progress and celebrate small wins along your fitness journey.',
      'Listen to your body and prioritize recovery alongside your training sessions.'
    );
  }

  return recommendations.slice(0, 5);
}
