import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIntake } from '../../context/IntakeContext';
import { pl } from '../../lib/i18n/pl';
import ProgressIndicator from '../../components/ProgressIndicator';
import MultiSelect from '../../components/MultiSelect';
import { CITIES_OPTIONS, MONTHLY_BUDGET_OPTIONS } from '../../constants/referenceData';

export default function IntakeStep2() {
  const navigate = useNavigate();
  const { intakeData, updateIntakeData } = useIntake();

  const [age, setAge] = useState(intakeData.age);
  const [gender, setGender] = useState(intakeData.gender);
  const [customGender, setCustomGender] = useState('');
  const [livingArea, setLivingArea] = useState<string[]>(intakeData.living_area);
  const [monthlyBudget, setMonthlyBudget] = useState<string[]>(intakeData.monthly_budget);
  const [availability, setAvailability] = useState<string[]>(intakeData.availability);
  const [cooperation, setCooperation] = useState<string[]>(intakeData.cooperation);

  const handleNext = () => {
    const finalGender = gender === 'Other' ? customGender : gender;

    updateIntakeData({
      age,
      gender: finalGender,
      living_area: livingArea,
      monthly_budget: monthlyBudget,
      availability,
      cooperation,
    });

    navigate('/intake/step3');
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <ProgressIndicator currentStep={2} totalSteps={3} />

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-3">{pl.intake.step2.ageLabel}</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder={pl.intake.step2.agePlaceholder}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-3">{pl.intake.step2.genderLabel}</label>
            <div className="space-y-2">
              {['Male', 'Female', 'Other'].map((g) => (
                <label key={g} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    checked={gender === g}
                    onChange={() => setGender(g)}
                    className="w-5 h-5"
                  />
                  <span className="text-neutral-900">{g === 'Male' ? pl.intake.step2.genderMale : g === 'Female' ? pl.intake.step2.genderFemale : pl.intake.step2.genderOther}</span>
                </label>
              ))}
              {gender === 'Other' && (
                <input
                  type="text"
                  value={customGender}
                  onChange={(e) => setCustomGender(e.target.value)}
                  placeholder={pl.intake.step2.genderSpecify}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 mt-2"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-3">
              {pl.intake.step2.locationLabel}
            </label>
            <MultiSelect
              options={CITIES_OPTIONS}
              value={livingArea}
              onChange={setLivingArea}
              placeholder={pl.intake.step2.locationPlaceholder}
              allowOther={true}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-3">
              {pl.intake.step2.budgetLabel}
            </label>
            <div className="flex flex-wrap gap-2">
              {MONTHLY_BUDGET_OPTIONS.map((budget) => (
                <button
                  key={budget}
                  onClick={() => {
                    if (monthlyBudget.includes(budget)) {
                      setMonthlyBudget(monthlyBudget.filter(b => b !== budget));
                    } else {
                      setMonthlyBudget([...monthlyBudget, budget]);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    monthlyBudget.includes(budget)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {budget}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-3">
              {pl.intake.step2.daysLabel}
            </label>
            <div className="flex flex-wrap gap-2">
              {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const).map((day) => (
                <button
                  key={day}
                  onClick={() => {
                    if (availability.includes(day)) {
                      setAvailability(availability.filter(d => d !== day));
                    } else {
                      setAvailability([...availability, day]);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    availability.includes(day)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {pl.intake.step2.days[day]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-3">
              {pl.intake.step2.formatLabel}
            </label>
            <div className="flex flex-wrap gap-2">
              {['On site', 'Remote'].map((coop) => (
                <button
                  key={coop}
                  onClick={() => {
                    if (cooperation.includes(coop)) {
                      setCooperation(cooperation.filter(c => c !== coop));
                    } else {
                      setCooperation([...cooperation, coop]);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    cooperation.includes(coop)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {pl.referenceData.cooperation[coop] ?? coop}
                </button>
              ))}
            </div>
            <p className="text-xs text-neutral-500 mt-2">{pl.intake.step2.formatTip}</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/intake/step1')}
              className="flex-1 bg-neutral-200 text-neutral-700 py-3 rounded-lg font-semibold hover:bg-neutral-300 transition-colors"
            >
              {pl.intake.step2.back}
            </button>
            <button
              onClick={handleNext}
              className="flex-1 bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              {pl.intake.step2.next}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
