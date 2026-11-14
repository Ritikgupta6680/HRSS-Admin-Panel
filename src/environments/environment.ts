const getLocalApiUrl = (): string => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = window.localStorage.getItem('HRSS_API_URL');
    if (saved) {
      return saved;
    }
  }
  return 'http://localhost:10000';
};

export const environment = {
  production: false,
  apiUrl: getLocalApiUrl(),
};
