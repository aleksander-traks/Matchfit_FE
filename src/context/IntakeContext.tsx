import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { generateClientOverview, type ClientIntakeData } from '../lib/openai/generateOverview';
import { errorLogger } from '../lib/logging/errorLogger';
import type { AppError } from '../lib/errors/AppError';

interface IntakeData {
  training_experience: string;
  goals: string[];
  sessions_per_week: string;
  chronic_diseases: string[];
  injuries: string[];
  weight_goal: string;
  age: string;
  gender: string;
  living_area: string;
  monthly_budget: string;
  availability: string;
  cooperation: string;
  overview: string;
  profileId?: string;
  isGeneratingOverview: boolean;
  overviewError: AppError | null;
  partialOverview: string;
  useOpenAI: boolean;
}

interface IntakeContextType {
  intakeData: IntakeData;
  updateIntakeData: (data: Partial<IntakeData>) => void;
  resetIntakeData: () => void;
  generateOverviewWithOpenAI: () => Promise<void>;
  warmCacheInBackground: () => void;
}

const initialIntakeData: IntakeData = {
  training_experience: '',
  goals: [],
  sessions_per_week: '',
  chronic_diseases: [],
  injuries: [],
  weight_goal: '',
  age: '',
  gender: '',
  living_area: '',
  monthly_budget: '',
  availability: '',
  cooperation: '',
  overview: '',
  isGeneratingOverview: false,
  overviewError: null,
  partialOverview: '',
  useOpenAI: true,
};

const IntakeContext = createContext<IntakeContextType | undefined>(undefined);

export function IntakeProvider({ children }: { children: ReactNode }) {
  const [intakeData, setIntakeData] = useState<IntakeData>(() => {
    const stored = sessionStorage.getItem('intakeData');
    return stored ? JSON.parse(stored) : initialIntakeData;
  });

  useEffect(() => {
    sessionStorage.setItem('intakeData', JSON.stringify(intakeData));
  }, [intakeData]);

  const updateIntakeData = (data: Partial<IntakeData>) => {
    setIntakeData((prev) => ({ ...prev, ...data }));
  };

  const resetIntakeData = () => {
    setIntakeData(initialIntakeData);
    sessionStorage.removeItem('intakeData');
  };


  const generateOverviewWithOpenAI = async () => {
    const { training_experience, goals, sessions_per_week, chronic_diseases, injuries, weight_goal } = intakeData;

    if (!training_experience || goals.length === 0 || !sessions_per_week || !weight_goal) {
      return;
    }

    setIntakeData(prev => ({ ...prev, isGeneratingOverview: true, overviewError: null, partialOverview: '' }));

    try {
      const clientData: ClientIntakeData = {
        training_experience,
        goals,
        sessions_per_week,
        chronic_diseases: chronic_diseases || [],
        injuries: injuries || [],
        weight_goal,
      };

      const overview = await generateClientOverview(clientData);

      setIntakeData(prev => ({
        ...prev,
        overview,
        partialOverview: overview,
        isGeneratingOverview: false,
        overviewError: null,
      }));
    } catch (error) {
      console.error('Error generating overview with OpenAI:', error);

      const appError = error as AppError;
      await errorLogger.logError(appError, {
        userAction: 'Generating overview with OpenAI',
        clientProfileId: intakeData.profileId,
      });

      setIntakeData(prev => ({
        ...prev,
        isGeneratingOverview: false,
        overviewError: appError,
      }));
    }
  };

  const warmCacheInBackground = () => {
    console.log('Cache warming not needed with direct OpenAI calls');
  };

  return (
    <IntakeContext.Provider value={{
      intakeData,
      updateIntakeData,
      resetIntakeData,
      generateOverviewWithOpenAI,
      warmCacheInBackground
    }}>
      {children}
    </IntakeContext.Provider>
  );
}

export function useIntake() {
  const context = useContext(IntakeContext);
  if (context === undefined) {
    throw new Error('useIntake must be used within an IntakeProvider');
  }
  return context;
}
