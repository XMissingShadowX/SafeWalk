import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.safewalk.app',
  appName: 'safewalk',
  webDir: 'out',
  server: {
    url: 'https://safe-walk-ten.vercel.app/',
    cleartext: true,
    androidScheme: 'https',
  },
};

export default config;