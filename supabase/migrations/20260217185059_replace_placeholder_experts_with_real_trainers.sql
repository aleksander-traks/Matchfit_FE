/*
  # Replace Placeholder Trainers with Real Trainer Data

  ## Summary
  Replaces all 10 placeholder/fake trainer records with 8 real personal trainers
  who submitted their profiles via the intake survey on 2026-02-16.

  ## Changes

  ### Deleted Data
  - All 10 existing placeholder trainers (Alex Thompson, Maria Santos, David Chen, etc.)
  - All match_results rows referencing the old trainer IDs (stale data)
  - All selected_trainers rows referencing the old trainer IDs (stale data)
  - All messages rows referencing the old trainer IDs (stale data)
  - All intro_calls rows referencing the old trainer IDs (stale data)
  - Sequence reset to start from 1

  ### New Trainer Records (8 real trainers)
  All trainers are based in Piaseczno area, Poland.

  1. Mikołaj Pietranik - Weight loss / Sports Performance / Running, 3.5 yrs, 150 PLN/session
  2. Wiktor Demirseren - Physique / Strength / Functional, 1.5 yrs, 130 PLN/session
  3. Paweł Osuch - Physique / Sports Performance / Functional + Olympic Lifting, 10 yrs, 150 PLN/session
  4. Michał Utrata - Weight loss / Strength / Rehabilitation + Mobility, 10 yrs, 120 PLN/session
  5. Szymon Fiderkiewicz - Strength / Weight loss / Sports Performance, 6 yrs, 140 PLN/session
  6. Patryk Prusik - Sports Performance / Endurance / Strength, 14 yrs, 250 PLN/session
  7. Przemysław - Functional / Mobility / Physique, 19 yrs, 200 PLN/session
  8. Stanisław Sitowski - Weight loss / Bodyweight / Functional, 1 yr, 120 PLN/session

  ### Field Mapping from CSV
  - "Specializations" → specialization
  - "How long have you been working as a personal trainer?" → years_of_experience
  - "How much you are charging per session?" → monthly_budget
  - "Avability" → availability
  - "Types of training you offer?" + "Location" + "Client preferences" + "Beyond being a trainer" → overview
  - "Types of training you offer?" (includes Online) → cooperation (On site vs Hybrid)
  - Image: initials-based avatar placeholder (no photos provided in survey)

  ### Notes
  - client_reviews and client_ratings left as NULL (no review data available yet for new trainers)
  - certificates left as NULL (not collected in survey)
  - Email addresses are stored in the survey CSV but NOT stored in DB per privacy
*/

-- Step 1: Remove all dependent records referencing old expert IDs
DELETE FROM messages WHERE expert_id IN (SELECT id FROM experts);
DELETE FROM intro_calls WHERE expert_id IN (SELECT id FROM experts);
DELETE FROM selected_trainers WHERE expert_id IN (SELECT id FROM experts);
DELETE FROM match_results WHERE expert_id IN (SELECT id FROM experts);

-- Step 2: Remove all placeholder trainer records
DELETE FROM experts;

-- Step 3: Reset the serial sequence so IDs start cleanly from 1
ALTER SEQUENCE experts_id_seq RESTART WITH 1;

-- Step 4: Insert the 8 real trainers from the survey
INSERT INTO experts (name, specialization, certificates, years_of_experience, client_reviews, client_ratings, monthly_budget, availability, cooperation, overview, image) VALUES

(
  'Mikołaj Pietranik',
  'Weight loss, Sports Performance Training, Running',
  NULL,
  4,
  NULL,
  NULL,
  '150 PLN/session',
  'Monday, Tuesday, Wednesday, Thursday, Friday, Saturday',
  'On site',
  'Mikołaj is a personal trainer based in Piaseczno with nearly 4 years of experience, specialising in weight loss, sports performance, and running. He works with beginners, amateur athletes, and intermediate gym users in a 1:1 gym setting. Beyond training, he also offers dietitian support — making him a great choice for clients who want to combine structured exercise with nutritional guidance to reach their goals faster.',
  'https://ui-avatars.com/api/?name=Mikolaj+Pietranik&background=3b82f6&color=fff&size=400&bold=true'
),

(
  'Wiktor Demirseren',
  'Physique Training, Strength Training, Functional Training',
  NULL,
  2,
  NULL,
  NULL,
  '130 PLN/session',
  'Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday',
  'On site',
  'Wiktor is a Piaseczno-based trainer specialising in physique development, strength training, and functional movement. With around 2 years of hands-on experience, he works with beginners, kids, and amateur athletes in a 1:1 gym environment. He is available 7 days a week, making it easy to find a schedule that works around even the busiest lifestyle.',
  'https://ui-avatars.com/api/?name=Wiktor+Demirseren&background=3b82f6&color=fff&size=400&bold=true'
),

(
  'Paweł Osuch',
  'Physique Training, Sports Performance Training, Functional Training, Olympic Weightlifting',
  NULL,
  10,
  NULL,
  NULL,
  '150 PLN/session',
  'Monday, Tuesday, Wednesday, Thursday, Friday',
  'Hybrid',
  'Paweł is an experienced trainer from Piaseczno with 10 years in the field, covering physique training, sports performance, functional training, and Olympic weightlifting. He holds additional qualifications as a dietitian, offering a fully integrated approach to training and nutrition. He works with beginners, amateur athletes, and intermediate gym users both in person and online — ideal for clients who want expert-level coaching with flexible delivery.',
  'https://ui-avatars.com/api/?name=Pawel+Osuch&background=3b82f6&color=fff&size=400&bold=true'
),

(
  'Michał Utrata',
  'Weight Loss, Strength Training, Rehabilitation Training, Mobility',
  NULL,
  10,
  NULL,
  NULL,
  '120 PLN/session',
  'Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday',
  'Hybrid',
  'Michał is a versatile trainer from Piaseczno with 10 years of experience across weight loss, strength training, rehabilitation, and mobility work. He is available every day of the week and offers in-gym, home, and online sessions — giving clients maximum flexibility. He works well with intermediate gym users, seniors, and beginners, making him an excellent fit for those returning to fitness after injury or looking to build a sustainable long-term routine.',
  'https://ui-avatars.com/api/?name=Michal+Utrata&background=3b82f6&color=fff&size=400&bold=true'
),

(
  'Szymon Fiderkiewicz',
  'Strength Training, Weight Loss, Sports Performance Training, Functional Training',
  NULL,
  6,
  NULL,
  NULL,
  '140 PLN/session',
  'Monday, Tuesday, Wednesday, Thursday, Friday, Saturday',
  'Hybrid',
  'Szymon is a trainer at GreenUp Fitness in Piaseczno with 6 years of experience. He specialises in strength, weight loss, and sports performance, and also offers functional training guidance. He works with clients at every fitness level and age group, both in the gym and online. Szymon takes a personalised approach — working with each client to identify the best strategy for their specific goals and needs.',
  'https://ui-avatars.com/api/?name=Szymon+Fiderkiewicz&background=3b82f6&color=fff&size=400&bold=true'
),

(
  'Patryk Prusik',
  'Sports Performance Training, Endurance Training, Strength Training',
  NULL,
  14,
  NULL,
  NULL,
  '250 PLN/session',
  'Monday, Tuesday, Wednesday, Thursday, Friday, Saturday',
  'Hybrid',
  'Patryk is a highly experienced trainer with 14 years in sports performance, endurance, and strength training, operating across Piaseczno and Lesznowola. In addition to personal training, he is also a coach in other sports disciplines, giving him a broad athletic perspective. He works with amateur and professional athletes as well as kids, offering in-gym, home, and online sessions. Ideal for clients serious about measurable athletic performance.',
  'https://ui-avatars.com/api/?name=Patryk+Prusik&background=3b82f6&color=fff&size=400&bold=true'
),

(
  'Przemysław',
  'Functional Training, Mobility Training, Physique Training',
  NULL,
  19,
  NULL,
  NULL,
  '200 PLN/session',
  'Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday',
  'On site',
  'Przemysław is one of the most experienced trainers on the platform, with 19 years in functional training, mobility, and physique development. Based in Piaseczno, he works in a 1:1 gym setting and is available 7 days a week. He has worked with everyone from complete beginners to professional athletes, bringing a deep and well-rounded coaching perspective to every session.',
  'https://ui-avatars.com/api/?name=Przemyslaw&background=3b82f6&color=fff&size=400&bold=true'
),

(
  'Stanisław Sitowski',
  'Weight Loss, Bodyweight Training, Functional Training',
  NULL,
  1,
  NULL,
  NULL,
  '120 PLN/session',
  'Monday, Wednesday, Saturday',
  'On site',
  'Stanisław is a trainer in Piaseczno focusing on weight loss, bodyweight training, and functional movement. With 1 year of training experience and sessions available Monday, Wednesday, and Saturday, he offers an accessible and affordable entry point for kids, beginners, and amateur athletes looking to build a healthy and active lifestyle through gym-based 1:1 training.',
  'https://ui-avatars.com/api/?name=Stanislaw+Sitowski&background=3b82f6&color=fff&size=400&bold=true'
);
