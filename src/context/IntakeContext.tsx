import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/api';

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
  overviewError: string;
}

interface IntakeContextType {
  intakeData: IntakeData;
  updateIntakeData: (data: Partial<IntakeData>) => void;
  resetIntakeData: () => void;
  generateOverviewAsync: () => Promise<void>;
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
  overviewError: '',
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

    setIntakeData(prev => ({ ...prev, isGeneratingOverview: true, overviewError: '' }));

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
        overviewError: '',
      }));
    } catch (error: any) {
      console.error('Error generating overview:', error);
      setIntakeData(prev => ({
        ...prev,
        isGeneratingOverview: false,
        overviewError: error.message || 'Failed to generate overview',
      }));
    }
  };

  return (
    <IntakeContext.Provider value={{ intakeData, updateIntakeData, resetIntakeData, generateOverviewAsync }}>
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
