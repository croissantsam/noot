import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

const recompAPI = {
  getSystemInfo: () => ipcRenderer.invoke("recomp:get-system-info"),
  getLibrary: () => ipcRenderer.invoke("recomp:get-library"),
  saveGame: (game: any) => ipcRenderer.invoke("recomp:save-game", game),
  deleteGame: (gameId: string) => ipcRenderer.invoke("recomp:delete-game", gameId),
  checkUpdates: (gameId?: string) => ipcRenderer.invoke("recomp:check-updates", gameId),
  fetchGithubRepo: (url: string) => ipcRenderer.invoke("recomp:fetch-github-repo", url),
  selectIso: (title?: string) => ipcRenderer.invoke("recomp:select-iso", title),
  selectDirectory: (title?: string) => ipcRenderer.invoke("recomp:select-directory", title),
  install: (gameId: string) => ipcRenderer.invoke("recomp:install", gameId),
  uninstall: (gameId: string) => ipcRenderer.invoke("recomp:uninstall", gameId),
  launch: (gameId: string) => ipcRenderer.invoke("recomp:launch", gameId),
  openFolder: (path: string) => ipcRenderer.invoke("recomp:open-folder", path),
  getSettings: () => ipcRenderer.invoke("recomp:get-settings"),
  saveSettings: (settings: any) => ipcRenderer.invoke("recomp:save-settings", settings),
  onInstallProgress: (callback: (progress: any) => void) => {
    const subscription = (_event: any, value: any) => callback(value);
    ipcRenderer.on("recomp:install-progress", subscription);
    return () => {
      ipcRenderer.removeListener("recomp:install-progress", subscription);
    };
  },
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("recompAPI", recompAPI);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore
  window.electron = electronAPI;
  // @ts-ignore
  window.recompAPI = recompAPI;
}
