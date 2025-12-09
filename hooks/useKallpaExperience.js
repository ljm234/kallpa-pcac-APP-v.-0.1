// hooks/useKallpaExperience.js
import { useGlobalContext } from '../context/GlobalProvider';

export const useKallpaExperience = () => {
  const context = useGlobalContext();
  if (!context) {
    throw new Error('useKallpaExperience must be used within GlobalProvider');
  }

  if (!context.kallpa) {
    throw new Error('Kallpa state has not been initialized in GlobalProvider');
  }

  return context.kallpa;
};
