import { execSync } from "node:child_process";

function git(command) {
  try {
    return execSync(`git ${command}`, { encoding: "utf-8" }).trim();
  } catch {
    return "";
  }
}

function getVersion() {
  const tag = git("describe --tags --abbrev=0");
  if (tag.startsWith("v")) return tag.slice(1);
  return tag || "1.0.0";
}

function getVersionCode() {
  const count = git("rev-list --count HEAD");
  return parseInt(count, 10) || 1;
}

const config = {
  name: "Asistente de cocina",
  slug: "asistente-cocina",
  version: getVersion(),
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  ios: {
    supportsTablet: true,
  },
  android: {
    package: "com.nbazaes.asistentecocina",
    versionCode: getVersionCode(),
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  scheme: "asistente-cocina",
  web: {
    favicon: "./assets/favicon.png",
    bundler: "metro",
    output: "single",
  },
  plugins: ["expo-router", "expo-sqlite"],
  extra: {
    router: {},
    eas: {
      projectId: "6ffb4f1c-a91f-42d0-bf8d-0dd01543ea12",
    },
  },
  owner: "nbazaes",
};

export default config;
