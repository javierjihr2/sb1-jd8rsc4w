import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initializeLanguage, changeLanguage, getCurrentLanguage, t, SupportedLanguage } from '../lib/i18n';
import { useAuth } from './AuthContextSimple';

interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => Promise<void>;
  t: (key: string, options?: any) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const [isLoading, setIsLoading] = useState(true);
  const { user, profile } = useAuth();

  useEffect(() => {
    const initLanguage = async () => {
      try {
        setIsLoading(true);
        const language = await initializeLanguage(profile?.currentServer);
        setCurrentLanguage(language as SupportedLanguage);
      } catch (error) {
        console.error('Error initializing language:', error);
        setCurrentLanguage('en');
      } finally {
        setIsLoading(false);
      }
    };

    initLanguage();
  }, [profile?.currentServer]);

  const setLanguage = async (language: SupportedLanguage) => {
    try {
      await changeLanguage(language);
      setCurrentLanguage(language);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    t,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;