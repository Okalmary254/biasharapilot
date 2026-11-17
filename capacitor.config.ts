import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.biasharapilot.app",
  appName: "BiasharaPilot AI",
  webDir: "dist",
  plugins: {
    CapacitorUpdater: {
      appId: "38ca2f94-62d2-45fc-98cd-af556093aba3",
      defaultChannel: "production",
      autoUpdate: "onlyDownload",
    },
  },
};

export default config;
