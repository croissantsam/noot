import { ElectronAPI } from "@electron-toolkit/preload";
import {
  RecompGame,
  SystemInfo,
  InstallProgress,
  LinkedIso,
  GithubRelease,
  OSCompatibility,
} from "../main/types";

export interface RecompAPI {
  getSystemInfo: () => Promise<SystemInfo>;
  getLibrary: () => Promise<RecompGame[]>;
  saveGame: (game: RecompGame) => Promise<boolean>;
  deleteGame: (gameId: string) => Promise<boolean>;
  checkUpdates: (gameId?: string) => Promise<RecompGame[]>;
  fetchGithubRepo: (url: string) => Promise<{
    repoInfo: any;
    latestRelease: GithubRelease | null;
    osCompatibility: OSCompatibility;
  }>;
  selectIso: (title?: string) => Promise<LinkedIso | null>;
  selectDirectory: (title?: string) => Promise<string | null>;
  install: (gameId: string) => Promise<RecompGame>;
  uninstall: (gameId: string) => Promise<RecompGame | false>;
  launch: (gameId: string) => Promise<{ success: boolean; pid?: number; message?: string }>;
  openFolder: (path: string) => Promise<string>;
  getSettings: () => Promise<any>;
  saveSettings: (settings: any) => Promise<any>;
  onInstallProgress: (callback: (progress: InstallProgress) => void) => () => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    recompAPI: RecompAPI;
  }
}
