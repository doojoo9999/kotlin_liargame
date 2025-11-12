import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const API_BASE = process.env.PLAYWRIGHT_API_BASE ?? 'http://127.0.0.1:20021/api/v2/nemonemo';
const WS_BASE = process.env.PLAYWRIGHT_WS_BASE ?? 'ws://127.0.0.1:20021/ws';
const APP_BASE = process.env.PLAYWRIGHT_APP_BASE ?? '/';
const DB_URL = process.env.SPRING_LOCAL_DATABASE_URL ?? 'jdbc:postgresql://127.0.0.1/postgres';
const DB_USER = process.env.SPRING_LOCAL_DATABASE_USERNAME ?? 'postgres';
const DB_PASSWORD = process.env.SPRING_LOCAL_DATABASE_PASSWORD ?? 'qudfbf1212';
const DB_DRIVER = process.env.SPRING_LOCAL_DATABASE_DRIVERCLASS ?? 'org.postgresql.Driver';
const BACKEND_PROFILE = process.env.PLAYWRIGHT_BACKEND_PROFILE ?? 'local';

const renderEnv = (key: string, value: string) => `${key}=${JSON.stringify(value)}`;
const backendEnv = [
  renderEnv('SPRING_PROFILES_ACTIVE', BACKEND_PROFILE),
  renderEnv('SPRING_LOCAL_DATABASE_URL', DB_URL),
  renderEnv('SPRING_LOCAL_DATABASE_USERNAME', DB_USER),
  renderEnv('SPRING_LOCAL_DATABASE_PASSWORD', DB_PASSWORD),
  renderEnv('SPRING_LOCAL_DATABASE_DRIVERCLASS', DB_DRIVER)
].join(' ');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry'
  },
  webServer: [
    {
      command: `bash -lc "cd ${repoRoot} && ./gradlew bootJar && ${backendEnv} java -jar build/libs/kotlin_liargame-0.0.1-SNAPSHOT.jar"`,
      url: 'http://127.0.0.1:20021/actuator/health',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000
    },
    {
      command: `bash -lc "cd ${__dirname} && ${[
        renderEnv('VITE_APP_BASE', APP_BASE),
        renderEnv('VITE_API_BASE_URL', API_BASE),
        renderEnv('VITE_WEBSOCKET_URL', WS_BASE),
        'npm run dev -- --host 127.0.0.1 --port 4173'
      ].join(' ')}"`,
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000
    }
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
