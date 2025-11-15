import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIntake } from '../../context/IntakeContext';
import ProgressIndicator from '../../components/ProgressIndicator';
import MultiSelect from '../../components/MultiSelect';
import {
  GOALS_OPTIONS,
  TRAINING_EXPERIENCE_OPTIONS,
  SESSIONS_PER_WEEK_OPTIONS,
  CHRONIC_DISEASES_OPTIONS,
  INJURIES_OPTIONS,
  WEIGHT_GOAL_OPTIONS,
} from '../../constants/referenceData';

export default function IntakeStep1() {
  const navigate = useNavigate();
  const { intakeData, updateIntakeData, generateOverviewAsync } = useIntake();

  const [trainingExperience, setTrainingExperience] = useState(intakeData.training_experience);
  const [goals, setGoals] = useState<string[]>(intakeData.goals);
  const [sessionsPerWeek, setSessionsPerWeek] = useState(intakeData.sessions_per_week);
  const [chronicDiseases, setChronicDiseases] = useState<string[]>(intakeData.chronic_diseases);
  const [injuries, setInjuries] = useState<string[]>(intakeData.injuries);
  const [weightGoal, setWeightGoal] = useState(intakeData.weight_goal);

  const handleContinue = () => {
    const data = {
      training_experience: trainingExperience,
      goals,
      sessions_per_week: sessionsPerWeek,
      chronic_diseases: chronicDiseases,
      injuries,
      weight_goal: weightGoal,
    };

    updateIntakeData(data);

    generateOverviewAsync();

    navigate('/intake/step2');
  };

  const isValid =
    trainingExperience && goals.length > 0 && sessionsPerWeek && weightGoal;

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <ProgressIndicator currentStep={1} totalSteps={3} />

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-3">
              What are your fitness goals?
            </label>
            <div className="flex flex-wrap gap-2">
              {GOALS_OPTIONS.map((goal) => (
                <button
                  key={goal}
                  onClick={() => {
                    if (goals.includes(goal)) {
                      setGoals(goals.filter((g) => g !== goal));
                    } else {
                      setGoals([...goals, goal]);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    goals.includes(goal)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-3">
              What is your training experience?
            </label>
            <div className="flex flex-wrap gap-2">
              {TRAINING_EXPERIENCE_OPTIONS.map((exp) => (
                <button
                  key={exp}
                  onClick={() => setTrainingExperience(exp)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    trainingExperience === exp
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {exp}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-3">
              How many times per week can you work out?
            </label>
            <div className="flex flex-wrap gap-2">
              {SESSIONS_PER_WEEK_OPTIONS.map((num) => (
                <button
                  key={num}
                  onClick={() => setSessionsPerWeek(num)}
                  className={`w-12 h-12 rounded-lg text-sm font-medium transition-colors ${
                    sessionsPerWeek === num
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-3">
              Do you have any chronic diseases or conditions?
            </label>
            <MultiSelect
              options={CHRONIC_DISEASES_OPTIONS}
              value={chronicDiseases}
              onChange={setChronicDiseases}
              placeholder="Select chronic diseases"
              allowOther
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-3">
              Do you have any current injuries?
            </label>
            <MultiSelect
              options={INJURIES_OPTIONS}
              value={injuries}
              onChange={setInjuries}
              placeholder="Select injuries"
              allowOther
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-3">
              What is your weight goal?
            </label>
            <div className="flex flex-wrap gap-2">
              {WEIGHT_GOAL_OPTIONS.map((goal) => (
                <button
                  key={goal}
                  onClick={() => setWeightGoal(goal)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    weightGoal === goal
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleContinue}
            disabled={!isValid}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
