import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.royalcomfort.app',
  appName: 'The Royal Comfort',
  webDir: 'public',
  server: {
    url: 'https://menu-gamma-three.vercel.app',
    cleartext: true
  },
  plugins: {
    CapacitorCookies: {
      enabled: true,
    },
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
