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
  format: string;
  linkedAt: string;
}

export interface RecompGame {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  repoOwner: string;
  repoName: string;
  githubUrl: string;
  bannerUrl?: string;
  iconUrl?: string;
  requiredFileType: string;
  requiredFileDesc: string;

  installedVersion?: string;
  installedAt?: string;
  installPath?: string;
  executablePath?: string;

  latestRelease?: GithubRelease;
  osCompatibility?: OSCompatibility;
  updateAvailable?: boolean;
  lastCheckedAt?: string;

  linkedIso?: LinkedIso;

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

export type LibraryFilter = 'all' | 'installed' | 'updates' | 'missing-iso';
