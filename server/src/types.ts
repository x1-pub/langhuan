declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      DEV_USER_ID?: string;
    }
  }
}

export {};
