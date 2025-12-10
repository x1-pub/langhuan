declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production';
      DATABASE_URL: string;
      DEV_USER_ID?: string;
    }
  }
}

export {};
