import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.stylesense.fitcheck",
  appName: "FIT Check: Outfit Planner",
  webDir: "www",
  server: {
    androidScheme: "https",
    allowNavigation: ["style-sense-fitcheck.replit.app"],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#000000",
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
