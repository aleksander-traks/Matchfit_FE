import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/api';
import { generateOverview, warmCache, type ClientIntakeData } from '../lib/openaiStream';
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
  generateOverviewAsync: () => Promise<void>;
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

  const generateOverviewAsync = async () => {
    const { training_experience, goals, sessions_per_week, chronic_diseases, injuries, weight_goal } = intakeData;

    if (!training_experience || goals.length === 0 || !sessions_per_week || !weight_goal) {
      return;
    }

    setIntakeData(prev => ({ ...prev, isGeneratingOverview: true, overviewError: null }));

    try {
      const response = await api.generateOverview({
        training_experience,
        goals,
        sessions_per_week,
        chronic_diseases: chronic_diseases || [],
        injuries: injuries || [],
        weight_goal,
      });

      setIntakeData(prev => ({
        ...prev,
        overview: response.overview,
        isGeneratingOverview: false,
        overviewError: null,
      }));
    } catch (error: any) {
      console.error('Error generating overview:', error);

      await errorLogger.logError(error, {
        userAction: 'Generating overview (Python backend)',
        clientProfileId: intakeData.profileId,
      });

      setIntakeData(prev => ({
        ...prev,
        isGeneratingOverview: false,
        overviewError: error,
      }));
    }
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

      const overview = await generateOverview(clientData);

      setIntakeData(prev => ({
        ...prev,
        overview,
        partialOverview: overview,
        isGeneratingOverview: false,
        overviewError: null,
      }));
    } catch (error: any) {
      console.error('Error generating overview with OpenAI:', error);

      await errorLogger.logError(error, {
        userAction: 'Generating overview with OpenAI',
        clientProfileId: intakeData.profileId,
      });

      setIntakeData(prev => ({
        ...prev,
        isGeneratingOverview: false,
        overviewError: error,
      }));
    }
  };

  const warmCacheInBackground = () => {
    const { training_experience, goals, sessions_per_week, chronic_diseases, injuries, weight_goal } = intakeData;

    if (!training_experience || goals.length === 0 || !sessions_per_week || !weight_goal) {
      return;
    }

    const clientData: ClientIntakeData = {
      training_experience,
      goals,
      sessions_per_week,
      chronic_diseases: chronic_diseases || [],
      injuries: injuries || [],
      weight_goal,
    };

    warmCache(clientData).catch(error => {
      console.error('Error warming cache:', error);
    });
  };

  return (
    <IntakeContext.Provider value={{
      intakeData,
      updateIntakeData,
      resetIntakeData,
      generateOverviewAsync,
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
