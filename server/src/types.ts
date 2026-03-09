declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      DEV_USER_ID?: string;
      SERVER_HOST?: string;
      SERVER_PORT?: string;
      CORS_ORIGINS?: string;
    }
  }
}

export {};
