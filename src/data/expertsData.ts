export interface Expert {
  id: number;
  specialization: string;
  certifications: string;
  years_of_experience: number | string;
  client_reviews: string;
  client_ratings: number;
  monthly_budget: string;
  availability: string;
  cooperation: string;
  overview: string;
}

export const expertsData: Expert[] = [
  {
    id: 1,
    specialization: "Weight Loss, Body Decomposition",
    certifications: "MDT Cert. — McKenzie Method of Mechanical Diagnosis & Therapy, Kinesio Taping — Foundations (Kinesio Polska)",
    years_of_experience: 16,
    client_reviews: "",
    client_ratings: 3,
    monthly_budget: "500€+",
    availability: "Saturday",
    cooperation: "On site",
    overview: "Focuses on weight loss and body recomposition through structured exercise and nutritional coaching. Certified in MDT McKenzie — a system for spine assessment and self-management — and Kinesio Taping Foundations for pain relief and soft-tissue support. Typically works with clients seeking fat-loss, posture improvement, and better joint mechanics."
  },
  {
    id: 2,
    specialization: "Rehabilitation training",
    certifications: "MSc Physiotherapy)",
    years_of_experience: 7,
    client_reviews: "",
    client_ratings: 3,
    monthly_budget: "30-60€",
    availability: "Friday",
    cooperation: "Hybrid",
    overview: "Specializes in rehabilitation and mobility restoration. Holds an MSc in Physiotherapy and applies evidence-based manual therapy and exercise correction methods. Often works with clients recovering from musculoskeletal injuries or chronic pain who need progressive re-education of movement."
  },
  {
    id: 3,
    specialization: "Physique Training",
    certifications: "Magister Dietetyki (BSc, REPs Polska — Akredytowany Trener Personalny",
    years_of_experience: 7,
    client_reviews: "",
    client_ratings: 4,
    monthly_budget: "0-30€",
    availability: "Wednesday",
    cooperation: "Remote",
    overview: "Works in physique and strength development. Certified personal trainer with advanced dietary education, combining nutrition programming with hypertrophy and conditioning work. Ideal for intermediate clients aiming to increase lean mass while improving movement efficiency."
  },
  {
    id: 4,
    specialization: "Endurance Training",
    certifications: "PWZFz — Prawo wykonywania zawodu fizjoterapeuty, PNF Certificate (IPNFA Levels 1–5), FDM IC (Typaldos Method)",
    years_of_experience: 17,
    client_reviews: "",
    client_ratings: 4,
    monthly_budget: "0-30€",
    availability: "Sunday",
    cooperation: "Hybrid",
    overview: "Focuses on endurance and performance training. Certified in the Typaldos Method (FDM) and functional kinetic-chain rehabilitation, which target fascial restrictions and mobility deficits. Commonly supports runners and athletes seeking to recover from overuse injuries while enhancing resilience."
  },
  {
    id: 5,
    specialization: "Functional Training",
    certifications: "Magister Fizjoterapii (BSc, Żywienie i wspomaganie dietetyczne w sporcie (AWF), MSc Physiotherapy), EREPS Personal Trainer EQF Level 4",
    years_of_experience: 13,
    client_reviews: "",
    client_ratings: 3,
    monthly_budget: "0-30€",
    availability: "Saturday",
    cooperation: "On site",
    overview: "Specializes in functional training for everyday movement quality. Holds degrees in Physiotherapy and uses manual therapy and strength integration to rebuild posture and balance. Often assists clients managing chronic joint discomfort or seeking to improve coordination and load tolerance."
  },
  {
    id: 6,
    specialization: "Mobility Training",
    certifications: "PhD: Doktor w dyscyplinie nauki o kulturze fizycznej (Physical Culture Sciences), Specjalizacja lekarska: Balneologia i medycyna fizykalna, EREPS Personal Trainer EQF Level 4",
    years_of_experience: 1,
    client_reviews: "",
    client_ratings: 1,
    monthly_budget: "60-100€",
    availability: "Saturday",
    cooperation: "Hybrid",
    overview: "Emphasizes mobility and flexibility training. Certified personal trainer (EQF Level 4) with a PhD in Physical Culture, integrating research-based stretching and neuromuscular control work. Suitable for individuals with restricted range of motion or stiff movement patterns."
  },
  {
    id: 7,
    specialization: "Mobility Training",
    certifications: "REPs Polska — Akredytowany Trener Personalny, Magister Fizjoterapii (BSc, Exercise Trainer, MSc Dietetics)",
    years_of_experience: "20+",
    client_reviews: "",
    client_ratings: 4,
    monthly_budget: "0-30€",
    availability: "Friday",
    cooperation: "Remote",
    overview: "Focuses on strength and mobility through corrective exercise. Accredited by REPs Polska and certified as Strength and Exercise Trainer, emphasizing safe progression and proper technique. Commonly works with clients seeking to overcome muscular imbalances or improve functional stability."
  },
  {
    id: 8,
    specialization: "Rehabilitation training",
    certifications: "Lekarz (MD) + PWZ",
    years_of_experience: 13,
    client_reviews: "",
    client_ratings: 2,
    monthly_budget: "500€+",
    availability: "Tuesday",
    cooperation: "On site",
    overview: "Specializes in medical rehabilitation and physiotherapeutic care. Licensed MD with practice rights (PWZ), enabling integration of clinical assessment and exercise prescription. Ideal for clients with complex or post-surgical conditions requiring supervised recovery."
  },
  {
    id: 9,
    specialization: "Endurance Training",
    certifications: "PWZFz — Prawo wykonywania zawodu fizjoterapeuty",
    years_of_experience: 5,
    client_reviews: "",
    client_ratings: 4,
    monthly_budget: "30-60€",
    availability: "Sunday",
    cooperation: "On site",
    overview: "Works primarily on endurance conditioning and injury prevention. Certified physiotherapist (PWZFz license) using structured mobility and load-management routines to build consistency. Frequently helps recreational athletes avoid strain and recover from repetitive-stress issues."
  },
  {
    id: 10,
    specialization: "Strength Training",
    certifications: "MSc Physiotherapy), Specjalizacja lekarska: Rehabilitacja medyczna",
    years_of_experience: 2,
    client_reviews: "",
    client_ratings: 4,
    monthly_budget: "500€+",
    availability: "Saturday",
    cooperation: "Remote",
    overview: "Focuses on strength training and physical rehabilitation. Holds an MSc in Physiotherapy and certification in Rehabilitation Medicine, combining clinical knowledge with gym-based protocols. Suitable for clients aiming to rebuild capacity after musculoskeletal injuries."
  }
];

export function getExpertById(id: number): Expert | undefined {
  return expertsData.find(expert => expert.id === id);
}
