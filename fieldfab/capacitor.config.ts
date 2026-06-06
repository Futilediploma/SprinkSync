import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sprinksy.fieldfab',
  appName: 'FieldFab',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
  },
};

export default config;
