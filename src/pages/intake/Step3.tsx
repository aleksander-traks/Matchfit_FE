import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIntake } from '../../context/IntakeContext';
import ProgressIndicator from '../../components/ProgressIndicator';
import { api } from '../../lib/api';
import { storage } from '../../lib/storage';
import { Loader2 } from 'lucide-react';
import ErrorAlert from '../../components/errors/ErrorAlert';
import { defaultRetryStrategy } from '../../lib/errors/retryStrategy';

export default function IntakeStep3() {
  const navigate = useNavigate();
  const { intakeData, updateIntakeData, generateOverviewWithOpenAI } = useIntake();

  const [overview, setOverview] = useState(intakeData.overview);
  const [isMatching, setIsMatching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setOverview(intakeData.overview);
  }, [intakeData.overview]);

  useEffect(() => {
    if (!intakeData.overview && !intakeData.isGeneratingOverview && !intakeData.overviewError) {
      generateOverviewWithOpenAI();
    }
  }, []);


  const handleRetryGeneration = async () => {
    if (intakeData.overviewError) {
      await defaultRetryStrategy.executeWithRetry(
        async () => {
          await generateOverviewWithOpenAI();
        },
        'overview-generation',
        (attempt, delay, error) => {
          console.log(`Retry attempt ${attempt} in ${delay}ms:`, error.userMessage);
        }
      ).catch(error => {
        console.error('All retry attempts failed:', error);
      });
    } else {
      await generateOverviewWithOpenAI();
    }
  };

  const handleDismissError = () => {
    updateIntakeData({ overviewError: null });
  };

  const handleConfirm = async () => {
    setIsMatching(true);
    setError('');

    try {
      const profileData = {
        ...intakeData,
        overview,
      };

      updateIntakeData({ overview });

      const savedProfile = await api.saveIntake(profileData);
      updateIntakeData({ profileId: savedProfile.id });
      storage.setProfileId(savedProfile.id);

      navigate('/realtime-matches', {
        state: {
          overview,
          profileId: savedProfile.id,
        },
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save profile. Please try again.');
      setIsMatching(false);
    }
  };

  if (intakeData.isGeneratingOverview) {
    return (
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <ProgressIndicator currentStep={3} totalSteps={3} />
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
              Generating your personalized overview
            </h3>
            <p className="text-neutral-600 mb-4">
              This may take up to 90 seconds. We're analyzing your fitness profile to create
              the best possible match with our trainers.
            </p>
            <p className="text-sm text-neutral-500">
              If this is the first request in a while, the AI service may be starting up.
              Thank you for your patience.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <ProgressIndicator currentStep={3} totalSteps={3} />

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 mb-2">Your Overview</h2>
            <p className="text-sm text-neutral-600 mb-4">
              Review and edit your fitness overview. This will be used to match you with the best trainer.
            </p>

            {intakeData.overviewError && (
              <div className="mb-4">
                <ErrorAlert
                  error={intakeData.overviewError}
                  onRetry={handleRetryGeneration}
                  onDismiss={handleDismissError}
                  showTechnicalDetails={true}
                />
              </div>
            )}

            <textarea
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="Describe your fitness goals, experience, and needs..."
            />

            {!overview && !intakeData.overviewError && (
              <p className="text-sm text-neutral-500 mt-2">
                Please describe your fitness goals and situation to help us match you with the right trainer.
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/intake/step2')}
              disabled={isMatching}
              className="flex-1 bg-neutral-200 text-neutral-700 py-3 rounded-lg font-semibold hover:bg-neutral-300 transition-colors disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={handleConfirm}
              disabled={isMatching || !overview.trim()}
              className="flex-1 bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isMatching ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving profile...
                </>
              ) : (
                'Start Matching'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
