import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ro.zenyth.memomed',
  appName: 'Zi de zi',
  webDir: 'dist',
  server: {
    // Pe iOS/Android folosim fișierele locale din dist/
    // Dezactivează asta când vrei să testezi live reload de pe web server
    // androidScheme: 'https',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#ffffff',
  },
  android: {
    backgroundColor: '#ffffff',
  },
};

export default config;
