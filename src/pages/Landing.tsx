import { useNavigate } from 'react-router-dom';
import { Dumbbell, Target, Users } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Dumbbell className="w-16 h-16 text-emerald-600" />
          </div>
          <h1 className="text-5xl font-bold text-neutral-900 mb-4">MatchFit</h1>
          <p className="text-xl text-neutral-600 mb-8">
            AI-powered trainer matching for your fitness journey
          </p>
          <button
            onClick={() => navigate('/intake/step1')}
            className="bg-emerald-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-emerald-700 transition-colors shadow-lg"
          >
            Get matched with a trainer
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <Target className="w-12 h-12 text-emerald-600 mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Personalized Matching</h3>
            <p className="text-neutral-600">
              Our AI analyzes your goals, health conditions, and preferences to find your perfect trainer
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <Users className="w-12 h-12 text-emerald-600 mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Expert Trainers</h3>
            <p className="text-neutral-600">
              Access certified professionals with years of experience in rehabilitation, strength, and endurance
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <Dumbbell className="w-12 h-12 text-emerald-600 mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Flexible Training</h3>
            <p className="text-neutral-600">
              Choose from on-site, remote, or hybrid training options that fit your lifestyle
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
