import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { RecompGame } from '../types';

export interface AppSettings {
  gamesDir: string;
  githubToken?: string;
  theme: 'dark' | 'light' | 'system';
  autoCheckUpdates: boolean;
}

export const DEFAULT_GAMES: RecompGame[] = [
  {
    id: 'dusklight',
    title: 'Dusklight',
    subtitle: 'The Legend of Zelda: Twilight Princess',
    description:
      'Dusklight is a reverse-engineered reimplementation of Twilight Princess for modern platforms with 60 FPS, widescreen, Metal/Vulkan rendering, and fixes.',
    repoOwner: 'TwilitRealm',
    repoName: 'dusklight',
    githubUrl: 'https://github.com/TwilitRealm/dusklight',
    bannerUrl: 'https://raw.githubusercontent.com/TwilitRealm/dusklight/main/assets/banner.png',
    iconUrl: 'https://raw.githubusercontent.com/TwilitRealm/dusklight/main/res/icon.png',
    requiredFileType: '.iso, .rvz, .gcm',
    requiredFileDesc: 'Twilight Princess (GameCube or Wii) retail disc dump',
  },
  {
    id: 'kartpad',
    title: 'KartPad',
    subtitle: 'Mario Kart: Double Dash!!',
    description:
      'Static recompilation port of Mario Kart Double Dash with native Metal rendering, controller support, and widescreen for Mac and iOS.',
    repoOwner: 'chrissotraidis',
    repoName: 'kartpad',
    githubUrl: 'https://github.com/chrissotraidis/kartpad',
    requiredFileType: '.iso, .gcm',
    requiredFileDesc: 'Mario Kart Double Dash!! GameCube retail disc dump',
  },
  {
    id: 'zelda64recomp',
    title: 'Zelda 64: Recompiled',
    subtitle: "The Legend of Zelda: Majora's Mask",
    description:
      "Static recompilation of Majora's Mask targeting PC with high framerates, ultra-widescreen, raytracing enhancements, and modern controls.",
    repoOwner: 'Zelda64Recomp',
    repoName: 'Zelda64Recomp',
    githubUrl: 'https://github.com/Zelda64Recomp/Zelda64Recomp',
    requiredFileType: '.z64, .n64',
    requiredFileDesc: "The Legend of Zelda: Majora's Mask (N64 ROM USA/PAL v1.0)",
  },
  {
    id: 'barrelpad',
    title: 'BarrelPad',
    subtitle: 'Diddy Kong Racing',
    description:
      'Native port of Diddy Kong Racing for macOS, iOS, and iPadOS via static recompilation with Metal rendering and controller support.',
    repoOwner: 'chrissotraidis',
    repoName: 'barrelpad',
    githubUrl: 'https://github.com/chrissotraidis/barrelpad',
    requiredFileType: '.z64, .n64',
    requiredFileDesc: 'Diddy Kong Racing (N64 ROM)',
  },
  {
    id: 'ctrpad',
    title: 'CTRpad',
    subtitle: 'Crash Team Racing',
    description:
      'Native static recompilation port of Crash Team Racing for macOS and iOS with Metal graphics and modern gamepad input.',
    repoOwner: 'chrissotraidis',
    repoName: 'ctrpad',
    githubUrl: 'https://github.com/chrissotraidis/ctrpad',
    requiredFileType: '.bin, .iso, .cue',
    requiredFileDesc: 'Crash Team Racing (PS1 retail disc dump)',
  },
  {
    id: 'bellpad',
    title: 'BellPad',
    subtitle: 'Animal Crossing',
    description:
      'Native recompilation of Animal Crossing for macOS and iOS with Metal rendering and controller support.',
    repoOwner: 'chrissotraidis',
    repoName: 'bellpad',
    githubUrl: 'https://github.com/chrissotraidis/bellpad',
    requiredFileType: '.iso, .gcm',
    requiredFileDesc: 'Animal Crossing (GameCube retail disc dump)',
  },
  {
    id: 'shipwright',
    title: 'Ship of Harkinian',
    subtitle: 'The Legend of Zelda: Ocarina of Time',
    description:
      'PC port of Ocarina of Time with modern camera control, 60+ FPS, widescreen, gyroscopic aiming, and high-definition asset packs.',
    repoOwner: 'HarbourMasters',
    repoName: 'Shipwright',
    githubUrl: 'https://github.com/HarbourMasters/Shipwright',
    requiredFileType: '.z64, .n64',
    requiredFileDesc: 'The Legend of Zelda: Ocarina of Time (N64 ROM)',
  },
];

export class LibraryStore {
  private libraryFile: string;
  private settingsFile: string;
  private games: RecompGame[] = [];
  private settings: AppSettings;

  constructor() {
    const userData = app.getPath('userData');
    this.libraryFile = path.join(userData, 'recomp-library.json');
    this.settingsFile = path.join(userData, 'recomp-settings.json');

    this.settings = {
      gamesDir: path.join(userData, 'games'),
      theme: 'dark',
      autoCheckUpdates: true,
    };

    this.loadSettings();
    this.loadLibrary();
  }

  private loadSettings(): void {
    try {
      if (fs.existsSync(this.settingsFile)) {
        const raw = fs.readFileSync(this.settingsFile, 'utf-8');
        this.settings = { ...this.settings, ...JSON.parse(raw) };
      }
    } catch {
      // fallback to defaults
    }
  }

  public saveSettings(newSettings: Partial<AppSettings>): AppSettings {
    this.settings = { ...this.settings, ...newSettings };
    try {
      fs.writeFileSync(this.settingsFile, JSON.stringify(this.settings, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
    return this.settings;
  }

  public getSettings(): AppSettings {
    return this.settings;
  }

  private loadLibrary(): void {
    try {
      if (fs.existsSync(this.libraryFile)) {
        const raw = fs.readFileSync(this.libraryFile, 'utf-8');
        const savedGames: RecompGame[] = JSON.parse(raw);

        // Merge defaults with saved state so new curated games appear while keeping user changes
        const gameMap = new Map<string, RecompGame>();
        for (const defaultGame of DEFAULT_GAMES) {
          gameMap.set(defaultGame.id, { ...defaultGame });
        }
        for (const saved of savedGames) {
          const existing = gameMap.get(saved.id);
          if (existing) {
            gameMap.set(saved.id, { ...existing, ...saved });
          } else {
            gameMap.set(saved.id, saved);
          }
        }
        this.games = Array.from(gameMap.values());
        return;
      }
    } catch (e) {
      console.error('Failed to load library:', e);
    }

    // Default initialization
    this.games = [...DEFAULT_GAMES];
    this.saveLibrary();
  }

  public getGames(): RecompGame[] {
    return this.games;
  }

  public getGame(id: string): RecompGame | undefined {
    return this.games.find((g) => g.id === id);
  }

  public saveGame(game: RecompGame): void {
    const idx = this.games.findIndex((g) => g.id === game.id);
    if (idx >= 0) {
      this.games[idx] = game;
    } else {
      this.games.push(game);
    }
    this.saveLibrary();
  }

  public deleteGame(id: string): boolean {
    const idx = this.games.findIndex((g) => g.id === id);
    if (idx >= 0) {
      this.games.splice(idx, 1);
      this.saveLibrary();
      return true;
    }
    return false;
  }

  public saveLibrary(): void {
    try {
      fs.writeFileSync(this.libraryFile, JSON.stringify(this.games, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save library:', e);
    }
  }
}
