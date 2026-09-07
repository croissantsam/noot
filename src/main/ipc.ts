import { ipcMain, dialog, BrowserWindow } from 'electron';
import fs from 'fs';
import path from 'path';
import { GithubService } from './services/github';
import { InstallerService } from './services/installer';
import { LauncherService } from './services/launcher';
import { LibraryStore } from './services/store';
import { RecompGame, SystemInfo } from './types';

export function setupRecompIpc(): {
  githubService: GithubService;
  installerService: InstallerService;
  launcherService: LauncherService;
  libraryStore: LibraryStore;
} {
  const libraryStore = new LibraryStore();
  const settings = libraryStore.getSettings();
  const githubService = new GithubService(settings.githubToken);
  const installerService = new InstallerService(settings.gamesDir);
  const launcherService = new LauncherService();

  // 1. System Info
  ipcMain.handle('recomp:get-system-info', async (): Promise<SystemInfo> => {
    return {
      platform: process.platform as 'darwin' | 'win32' | 'linux',
      arch: process.arch,
      defaultGamesDir: installerService.getGamesDir(),
      isMac: process.platform === 'darwin',
      isWindows: process.platform === 'win32',
      isLinux: process.platform === 'linux',
    };
  });

  // 2. Library CRUD
  ipcMain.handle('recomp:get-library', async (): Promise<RecompGame[]> => {
    return libraryStore.getGames();
  });

  ipcMain.handle('recomp:save-game', async (_, game: RecompGame): Promise<boolean> => {
    libraryStore.saveGame(game);
    return true;
  });

  ipcMain.handle('recomp:delete-game', async (_, gameId: string): Promise<boolean> => {
    const game = libraryStore.getGame(gameId);
    if (game?.installPath) {
      await installerService.deleteInstall(game.installPath);
    }
    return libraryStore.deleteGame(gameId);
  });

  // 3. Settings
  ipcMain.handle('recomp:get-settings', async () => {
    return libraryStore.getSettings();
  });

  ipcMain.handle('recomp:save-settings', async (_, newSettings) => {
    const saved = libraryStore.saveSettings(newSettings);
    if (saved.githubToken) githubService.setToken(saved.githubToken);
    if (saved.gamesDir) installerService.setGamesDir(saved.gamesDir);
    return saved;
  });

  // 4. GitHub Info & Release Inspection
  ipcMain.handle('recomp:fetch-github-repo', async (_, inputUrlOrName: string) => {
    const parsed = githubService.parseRepoUrl(inputUrlOrName);
    if (!parsed) {
      throw new Error('Invalid GitHub repository format. Use "owner/repo" or "https://github.com/owner/repo"');
    }

    const { owner, repo } = parsed;
    const repoInfo = await githubService.fetchRepoInfo(owner, repo);
    const latestRelease = await githubService.fetchLatestRelease(owner, repo);

    const osCompatibility = githubService.computeCompatibility(
      latestRelease,
      process.platform as 'darwin' | 'win32' | 'linux',
      process.arch
    );

    return {
      repoInfo,
      latestRelease,
      osCompatibility,
    };
  });

  // 5. Update Checker
  ipcMain.handle('recomp:check-updates', async (_, gameId?: string): Promise<RecompGame[]> => {
    const gamesToCheck = gameId
      ? libraryStore.getGames().filter((g) => g.id === gameId)
      : libraryStore.getGames();

    for (const game of gamesToCheck) {
      try {
        const latest = await githubService.fetchLatestRelease(game.repoOwner, game.repoName);
        if (latest) {
          game.latestRelease = latest;
          game.osCompatibility = githubService.computeCompatibility(
            latest,
            process.platform as 'darwin' | 'win32' | 'linux',
            process.arch
          );
          game.updateAvailable =
            Boolean(game.installedVersion) &&
            game.installedVersion !== latest.tagName;
          game.lastCheckedAt = new Date().toISOString();
          libraryStore.saveGame(game);
        }
      } catch (e) {
        console.warn(`Could not check updates for ${game.id}:`, e);
      }
    }

    return libraryStore.getGames();
  });

  // 6. Native ISO / ROM File Picker
  ipcMain.handle('recomp:select-iso', async (_, title?: string) => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    const result = await dialog.showOpenDialog(focusedWindow || undefined as any, {
      title: title || 'Select Game Disc Dump / ROM',
      properties: ['openFile'],
      filters: [
        {
          name: 'Game Images & ROMs',
          extensions: ['iso', 'rvz', 'gcm', 'z64', 'n64', 'bin', 'cue', 'ciso', 'wbfs', 'chd'],
        },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const filePath = result.filePaths[0];
    const stats = fs.statSync(filePath);
    const ext = path.extname(filePath).replace('.', '').toLowerCase();

    return {
      path: filePath,
      fileName: path.basename(filePath),
      sizeBytes: stats.size,
      format: ext,
      linkedAt: new Date().toISOString(),
    };
  });

  // 6b. Native Directory Picker
  ipcMain.handle('recomp:select-directory', async (_, title?: string) => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    const result = await dialog.showOpenDialog(focusedWindow || undefined as any, {
      title: title || 'Select Recomp Installation Folder',
      properties: ['openDirectory', 'createDirectory'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  // 7. Install / Update Game
  ipcMain.handle('recomp:install', async (event, gameId: string) => {
    const game = libraryStore.getGame(gameId);
    if (!game) throw new Error(`Game ${gameId} not found`);

    let latestRelease = game.latestRelease;
    if (!latestRelease) {
      latestRelease = (await githubService.fetchLatestRelease(game.repoOwner, game.repoName)) || undefined;
    }
    if (!latestRelease) {
      throw new Error(`No releases found for ${game.repoOwner}/${game.repoName}`);
    }

    const compatibility = githubService.computeCompatibility(
      latestRelease,
      process.platform as 'darwin' | 'win32' | 'linux',
      process.arch
    );

    if (!compatibility.compatibleAsset) {
      throw new Error(`No compatible release asset found for ${process.platform} (${process.arch})`);
    }

    const senderWebContents = event.sender;

    const { installPath, executablePath } = await installerService.installAsset(
      game.id,
      compatibility.compatibleAsset,
      (progress) => {
        senderWebContents.send('recomp:install-progress', progress);
      }
    );

    game.installedVersion = latestRelease.tagName;
    game.installedAt = new Date().toISOString();
    game.installPath = installPath;
    game.executablePath = executablePath;
    game.updateAvailable = false;
    game.latestRelease = latestRelease;
    game.osCompatibility = compatibility;

    libraryStore.saveGame(game);
    return game;
  });

  // 8. Uninstall Game
  ipcMain.handle('recomp:uninstall', async (_, gameId: string) => {
    const game = libraryStore.getGame(gameId);
    if (!game) return false;

    if (game.installPath) {
      await installerService.deleteInstall(game.installPath);
    }
    const defaultGameDir = path.join(installerService.getGamesDir(), game.id);
    if (fs.existsSync(defaultGameDir)) {
      await installerService.deleteInstall(defaultGameDir);
    }

    game.installedVersion = undefined;
    game.installedAt = undefined;
    game.installPath = undefined;
    game.executablePath = undefined;
    game.updateAvailable = false;

    libraryStore.saveGame(game);
    return game;
  });

  // 9. Launch Game
  ipcMain.handle('recomp:launch', async (_, gameId: string) => {
    const game = libraryStore.getGame(gameId);
    if (!game) throw new Error('Game not found');
    return launcherService.launchGame(game);
  });

  // 10. Open Game / ISO Folder
  ipcMain.handle('recomp:open-folder', async (_, targetPath: string) => {
    if (fs.existsSync(targetPath)) {
      const stats = fs.statSync(targetPath);
      if (stats.isFile()) {
        return launcherService.openGameFolder(path.dirname(targetPath));
      }
      return launcherService.openGameFolder(targetPath);
    }
    return '';
  });

  return {
    githubService,
    installerService,
    launcherService,
    libraryStore,
  };
}
