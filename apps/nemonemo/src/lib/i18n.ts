import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  ko: {
    common: {
      welcome: '네모네모에 오신 것을 환영합니다'
    }
  },
  en: {
    common: {
      welcome: 'Welcome to Nemonemo'
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'ko',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  }
});

export default i18n;
