interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center space-x-2">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step === currentStep
                  ? 'bg-emerald-600 text-white'
                  : step < currentStep
                  ? 'bg-emerald-500 text-white'
                  : 'bg-neutral-200 text-neutral-600'
              }`}
            >
              {step}
            </div>
            {step < totalSteps && (
              <div
                className={`w-12 h-1 ${step < currentStep ? 'bg-emerald-500' : 'bg-neutral-200'}`}
              />
            )}
          </div>
        ))}
      </div>
      <p className="text-center text-neutral-600 mt-3">
        Step {currentStep} of {totalSteps}
      </p>
    </div>
  );
}
