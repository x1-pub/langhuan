import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

let loaded = false;

export const loadServerEnv = () => {
  if (loaded) {
    return;
  }

  const envPathCandidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'server/.env'),
    path.resolve(__dirname, '../../../.env'),
    path.resolve(__dirname, '../../../../.env'),
  ];

  const envPath = envPathCandidates.find(candidate => fs.existsSync(candidate));
  dotenv.config({ path: envPath, quiet: true });
  loaded = true;
};
