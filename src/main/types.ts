export type SupportedOS = 'macos' | 'windows' | 'linux' | 'ios' | 'android';

export interface ReleaseAsset {
  id: number;
  name: string;
  size: number;
  downloadUrl: string;
  contentType: string;
  detectedOS?: SupportedOS;
  detectedArch?: 'arm64' | 'x64' | 'universal' | 'other';
}

export interface GithubRelease {
  id: number;
  tagName: string;
  name: string;
  body: string;
  publishedAt: string;
  prerelease: boolean;
  htmlUrl: string;
  assets: ReleaseAsset[];
}

export interface OSCompatibility {
  macos: boolean;
  windows: boolean;
  linux: boolean;
  ios: boolean;
  android: boolean;
  macosDetails?: string;
  windowsDetails?: string;
  linuxDetails?: string;
  isHostCompatible: boolean;
  compatibleAsset?: ReleaseAsset;
}

export interface LinkedIso {
  path: string;
  fileName: string;
  sizeBytes: number;
  format: string; // 'iso' | 'rvz' | 'gcm' | 'z64' etc.
  linkedAt: string;
}

export interface RecompGame {
  id: string; // unique slug or repo name, e.g. "dusklight"
  title: string;
  subtitle?: string;
  description: string;
  repoOwner: string;
  repoName: string;
  githubUrl: string;
  bannerUrl?: string;
  iconUrl?: string;
  requiredFileType: string; // e.g., ".iso, .rvz, .gcm"
  requiredFileDesc: string; // e.g. "The Legend of Zelda: Twilight Princess (GC/Wii)"

  // Installation state
  installedVersion?: string;
  installedAt?: string;
  installPath?: string;
  executablePath?: string;

  // Release & update state
  latestRelease?: GithubRelease;
  osCompatibility?: OSCompatibility;
  updateAvailable?: boolean;
  lastCheckedAt?: string;

  // Game ISO / ROM file
  linkedIso?: LinkedIso;

  // Custom configurations
  customLaunchArgs?: string;
  isCustom?: boolean;
}

export interface InstallProgress {
  gameId: string;
  stage: 'downloading' | 'extracting' | 'configuring' | 'completed' | 'error';
  percent: number;
  downloadedBytes: number;
  totalBytes: number;
  speedBytesPerSec: number;
  message?: string;
}

export interface SystemInfo {
  platform: 'darwin' | 'win32' | 'linux';
  arch: string;
  defaultGamesDir: string;
  isMac: boolean;
  isWindows: boolean;
  isLinux: boolean;
}
