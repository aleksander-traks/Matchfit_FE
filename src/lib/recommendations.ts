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
      'Skup się na ćwiczeniach o niskim obciążeniu i pracy nad mobilnością, aby zmniejszyć ból i poprawić jakość ruchu.'
    );
  }

  if (goals.includes('Get Stronger')) {
    recommendations.push(
      'Trening oporowy z progresywnym obciążeniem i prawidłową techniką pomoże Ci bezpiecznie i skutecznie budować siłę.'
    );
  }

  if (goals.includes('More Stamina')) {
    recommendations.push(
      'Stopniowo zwiększaj czas i intensywność treningu cardio, aby z czasem poprawić swoją wytrzymałość.'
    );
  }

  if (goals.includes('Healthy Weight')) {
    recommendations.push(
      'Połącz regularne ćwiczenia ze świadomymi nawykami żywieniowymi, aby osiągnąć trwałe efekty w zarządzaniu wagą.'
    );
  }

  if (injuries.length > 0) {
    recommendations.push(
      'Ściśle współpracuj z trenerem, aby dostosować ćwiczenia do Twoich kontuzji i skupić się na protokołach rehabilitacyjnych.'
    );
  }

  if (chronicDiseases.length > 0) {
    recommendations.push(
      'Trener dostosuje Twój program do Twoich schorzeń, maksymalizując bezpieczny postęp.'
    );
  }

  if (sessionsPerWeek >= 4) {
    recommendations.push(
      'Przy 4+ sesjach tygodniowo pamiętaj o dniach odpoczynku i zróżnicowaniu intensywności treningu, aby zapobiec przetrenowaniu.'
    );
  } else if (sessionsPerWeek <= 2 && sessionsPerWeek > 0) {
    recommendations.push(
      'Aby zmaksymalizować wyniki, rozważ zwiększenie częstotliwości treningów w miarę budowania konsekwencji i pewności siebie.'
    );
  }

  if (profile.training_experience === '0-6 months') {
    recommendations.push(
      'Zacznij od podstawowych wzorców ruchowych i buduj prawidłową technikę przed przejściem do bardziej złożonych ćwiczeń.'
    );
  }

  if (profile.training_experience === '5years+') {
    recommendations.push(
      'Wprowadź periodyzację i zaawansowane techniki treningowe, aby kontynuować postępy na swoim poziomie.'
    );
  }

  if (profile.age && profile.age >= 50) {
    recommendations.push(
      'Priorytetem powinny być regeneracja, zdrowie stawów i praca nad równowagą, obok głównych celów treningowych.'
    );
  }

  if (profile.weight_goal === 'Gain Weight') {
    recommendations.push(
      'Skup się na progresywnym treningu siłowym i odpowiednim odżywianiu, aby wspierać zdrowy przyrost masy ciała.'
    );
  }

  if (profile.weight_goal === 'Lose Weight') {
    recommendations.push(
      'Stwórz zrównoważony deficyt kaloryczny poprzez połączenie regularnych ćwiczeń i kontrolowanych porcji.'
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'Bądź konsekwentny w treningach i regularnie komunikuj się ze swoim trenerem.',
      'Śledź swoje postępy i świętuj małe sukcesy na swojej drodze do celu.',
      'Słuchaj swojego ciała i stawiaj regenerację na równi z treningiem.'
    );
  }

  return recommendations.slice(0, 5);
}
