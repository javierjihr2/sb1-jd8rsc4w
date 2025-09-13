import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import en from '../locales/en.json';
import es from '../locales/es.json';
import pt from '../locales/pt.json';
import ja from '../locales/ja.json';

// Server to language mapping based on PUBG Mobile servers
export const SERVER_LANGUAGE_MAP = {
  // Asia servers
  'Asia': 'en',
  'Japón': 'ja',
  'Corea del Sur': 'ja',
  'Singapur': 'en',
  'Malasia': 'en',
  'Indonesia': 'en',
  'Filipinas': 'en',
  'Hong Kong': 'en',
  'Taiwán': 'en',
  'Tailandia': 'en',
  'Vietnam': 'en',
  'India': 'en',
  
  // Europe servers
  'Europa': 'en',
  'Reino Unido': 'en',
  'Alemania': 'en',
  'Francia': 'en',
  'España': 'es',
  'Italia': 'en',
  'Países Bajos': 'en',
  'Suecia': 'en',
  'Noruega': 'en',
  'Dinamarca': 'en',
  'Finlandia': 'en',
  'Polonia': 'en',
  'República Checa': 'en',
  'Hungría': 'en',
  'Rumania': 'en',
  'Bulgaria': 'en',
  'Grecia': 'en',
  'Portugal': 'pt',
  'Suiza': 'en',
  'Austria': 'en',
  'Bélgica': 'en',
  'Irlanda': 'en',
  'Ucrania': 'en',
  'Bielorrusia': 'en',
  'Lituania': 'en',
  'Letonia': 'en',
  'Estonia': 'en',
  'Rusia': 'en',
  'Turquía': 'en',
  
  // Americas servers
  'Norte América': 'en',
  'Estados Unidos Este': 'en',
  'Estados Unidos Oeste': 'en',
  'Estados Unidos Central': 'en',
  'Canadá': 'en',
  
  'Sur América': 'es',
  'Brasil': 'pt',
  'Argentina': 'es',
  'Chile': 'es',
  'Colombia': 'es',
  'Perú': 'es',
  'México': 'es',
  'Venezuela': 'es',
  'Ecuador': 'es',
  'Uruguay': 'es',
  'Paraguay': 'es',
  'Bolivia': 'es',
  
  // Middle East servers
  'Medio Oriente': 'en',
  'Emiratos Árabes Unidos': 'en',
  'Arabia Saudí': 'en',
  
  // Africa servers
  'África': 'en',
  'Egipto': 'en',
  'Sudáfrica': 'en',
  'Nigeria': 'en',
  'Kenia': 'en',
  'Marruecos': 'en',
  
  // KRJP servers
  'Krjp': 'ja',
  
  // Oceania servers
  'Australia': 'en',
  'Nueva Zelanda': 'en',
} as const;

// Create i18n instance
const i18n = new I18n({
  en,
  es,
  pt,
  ja,
});

// Set default locale
i18n.defaultLocale = 'en';
i18n.enableFallback = true;

// Language storage key
const LANGUAGE_STORAGE_KEY = '@SquadGO:language';

// Initialize language based on user preference or device locale
export const initializeLanguage = async (userServer?: string): Promise<string> => {
  try {
    // First, check if user has a saved language preference
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage) {
      i18n.locale = savedLanguage;
      return savedLanguage;
    }
    
    // If user has a server selected, use server-based language
    if (userServer && SERVER_LANGUAGE_MAP[userServer as keyof typeof SERVER_LANGUAGE_MAP]) {
      const serverLanguage = SERVER_LANGUAGE_MAP[userServer as keyof typeof SERVER_LANGUAGE_MAP];
      i18n.locale = serverLanguage;
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, serverLanguage);
      return serverLanguage;
    }
    
    // Fall back to device locale
    const deviceLocale = Localization.getLocales()[0].languageCode;
    const languageCode = deviceLocale;
    
    // Check if we support the device language
    const supportedLanguages = ['en', 'es', 'pt', 'ja'];
    const finalLanguage = supportedLanguages.includes(languageCode) ? languageCode : 'en';
    
    i18n.locale = finalLanguage;
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, finalLanguage);
    return finalLanguage;
  } catch (error) {
    console.error('Error initializing language:', error);
    i18n.locale = 'en';
    return 'en';
  }
};

// Change language
export const changeLanguage = async (languageCode: string): Promise<void> => {
  try {
    i18n.locale = languageCode;
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
  } catch (error) {
    console.error('Error changing language:', error);
  }
};

// Get current language
export const getCurrentLanguage = (): string => {
  return i18n.locale;
};

// Get language for server
export const getLanguageForServer = (server: string): string => {
  return SERVER_LANGUAGE_MAP[server as keyof typeof SERVER_LANGUAGE_MAP] || 'en';
};

// Get available languages
export const getAvailableLanguages = () => {
  return [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  ];
};

// Translation function
export const t = (key: string, options?: any): string => {
  return i18n.t(key, options);
};

// Export i18n instance
export default i18n;

// Types for better TypeScript support
export type SupportedLanguage = 'en' | 'es' | 'pt' | 'ja';
export type PubgServer = keyof typeof SERVER_LANGUAGE_MAP;