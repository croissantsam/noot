import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { app } from 'electron';
import { InstallProgress, ReleaseAsset } from '../types';

const execFileAsync = promisify(execFile);

export class InstallerService {
  private downloadsDir: string;
  private gamesDir: string;

  constructor(customGamesDir?: string) {
    const userData = app.getPath('userData');
    this.downloadsDir = path.join(userData, 'downloads');
    this.gamesDir = customGamesDir || path.join(userData, 'games');

    if (!fs.existsSync(this.downloadsDir)) {
      fs.mkdirSync(this.downloadsDir, { recursive: true });
    }
    if (!fs.existsSync(this.gamesDir)) {
      fs.mkdirSync(this.gamesDir, { recursive: true });
    }
  }

  setGamesDir(newDir: string): void {
    this.gamesDir = newDir;
    if (!fs.existsSync(this.gamesDir)) {
      fs.mkdirSync(this.gamesDir, { recursive: true });
    }
  }

  getGamesDir(): string {
    return this.gamesDir;
  }

  public async installAsset(
    gameId: string,
    asset: ReleaseAsset,
    onProgress: (progress: InstallProgress) => void
  ): Promise<{ installPath: string; executablePath: string }> {
    const gameDestDir = path.join(this.gamesDir, gameId);
    if (!fs.existsSync(gameDestDir)) {
      fs.mkdirSync(gameDestDir, { recursive: true });
    }

    const archivePath = path.join(this.downloadsDir, `${gameId}-${asset.name}`);

    // Stage 1: Download
    onProgress({
      gameId,
      stage: 'downloading',
      percent: 0,
      downloadedBytes: 0,
      totalBytes: asset.size || 0,
      speedBytesPerSec: 0,
      message: `Downloading ${asset.name}...`,
    });

    await this.downloadFile(asset.downloadUrl, archivePath, (downloaded, total, speed) => {
      const percent = total > 0 ? Math.min(100, Math.round((downloaded / total) * 100)) : 0;
      onProgress({
        gameId,
        stage: 'downloading',
        percent,
        downloadedBytes: downloaded,
        totalBytes: total,
        speedBytesPerSec: speed,
        message: `Downloading ${asset.name} (${Math.round((downloaded / 1024 / 1024) * 10) / 10} MB)...`,
      });
    });

    // Stage 2: Extract
    onProgress({
      gameId,
      stage: 'extracting',
      percent: 100,
      downloadedBytes: asset.size || 0,
      totalBytes: asset.size || 0,
      speedBytesPerSec: 0,
      message: 'Extracting release archive...',
    });

    await this.extractArchive(archivePath, gameDestDir);

    // Stage 3: Find Executable & Configure Permissions
    onProgress({
      gameId,
      stage: 'configuring',
      percent: 100,
      downloadedBytes: asset.size || 0,
      totalBytes: asset.size || 0,
      speedBytesPerSec: 0,
      message: 'Configuring permissions...',
    });

    const executablePath = await this.findAndConfigureExecutable(gameDestDir);

    // Clean up archive to save disk space
    try {
      if (fs.existsSync(archivePath)) {
        fs.unlinkSync(archivePath);
      }
    } catch {
      // Ignore archive cleanup error
    }

    onProgress({
      gameId,
      stage: 'completed',
      percent: 100,
      downloadedBytes: asset.size || 0,
      totalBytes: asset.size || 0,
      speedBytesPerSec: 0,
      message: 'Installation complete!',
    });

    return {
      installPath: gameDestDir,
      executablePath,
    };
  }

  private async downloadFile(
    url: string,
    destPath: string,
    onProgress: (downloaded: number, total: number, speed: number) => void
  ): Promise<void> {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Download failed with status ${res.status}: ${res.statusText}`);
    }

    const total = parseInt(res.headers.get('content-length') || '0', 10);
    const fileStream = fs.createWriteStream(destPath);

    if (!res.body) {
      throw new Error('Response body is null');
    }

    const reader = res.body.getReader();
    let downloaded = 0;
    let lastTime = Date.now();
    let lastDownloaded = 0;
    let currentSpeed = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value) {
        fileStream.write(Buffer.from(value));
        downloaded += value.length;

        const now = Date.now();
        if (now - lastTime >= 400) {
          currentSpeed = ((downloaded - lastDownloaded) / (now - lastTime)) * 1000;
          lastTime = now;
          lastDownloaded = downloaded;
          onProgress(downloaded, total, currentSpeed);
        }
      }
    }

    await new Promise<void>((resolve, reject) => {
      fileStream.end(() => resolve());
      fileStream.on('error', reject);
    });
  }

  private async extractArchive(archivePath: string, destDir: string): Promise<void> {
    const ext = path.extname(archivePath).toLowerCase();

    if (ext === '.zip') {
      if (process.platform === 'darwin') {
        // macOS ditto handles .app bundles, symlinks, codesigning cleanly
        try {
          await execFileAsync('ditto', ['-xk', archivePath, destDir]);
          return;
        } catch {
          await execFileAsync('unzip', ['-o', archivePath, '-d', destDir]);
          return;
        }
      } else if (process.platform === 'win32') {
        // Windows tar supports zip extraction natively in Win 10/11
        try {
          await execFileAsync('tar', ['-xf', archivePath, '-C', destDir]);
        } catch {
          const psCommand = `Expand-Archive -Path "${archivePath}" -DestinationPath "${destDir}" -Force`;
          await execFileAsync('powershell', ['-Command', psCommand]);
        }
      } else {
        // Linux
        await execFileAsync('unzip', ['-o', archivePath, '-d', destDir]);
      }
    } else if (ext === '.tar' || archivePath.endsWith('.tar.gz') || archivePath.endsWith('.tgz')) {
      await execFileAsync('tar', ['-xf', archivePath, '-C', destDir]);
    } else if (ext === '.appimage') {
      const fileName = path.basename(archivePath);
      const target = path.join(destDir, fileName);
      fs.copyFileSync(archivePath, target);
      fs.chmodSync(target, 0o755);
    } else if (ext === '.dmg' && process.platform === 'darwin') {
      // Mount dmg, copy .app, unmount
      const mountPoint = path.join(this.downloadsDir, `mount-${Date.now()}`);
      fs.mkdirSync(mountPoint, { recursive: true });
      await execFileAsync('hdiutil', ['attach', archivePath, '-mountpoint', mountPoint, '-nobrowse', '-quiet']);

      const entries = fs.readdirSync(mountPoint);
      const appBundle = entries.find((e) => e.endsWith('.app'));
      if (appBundle) {
        await execFileAsync('cp', ['-R', path.join(mountPoint, appBundle), destDir]);
      }
      await execFileAsync('hdiutil', ['detach', mountPoint, '-quiet']);
      try {
        fs.rmdirSync(mountPoint);
      } catch {
        // ignore
      }
    } else {
      // Direct binary or unknown, move to destDir
      const fileName = path.basename(archivePath);
      const target = path.join(destDir, fileName);
      fs.copyFileSync(archivePath, target);
      if (process.platform !== 'win32') {
        fs.chmodSync(target, 0o755);
      }
    }
  }

  private async findAndConfigureExecutable(gameDir: string): Promise<string> {
    const isMac = process.platform === 'darwin';
    const isWin = process.platform === 'win32';

    // Helper recursive search
    const files = fs.readdirSync(gameDir, { recursive: true }) as string[];

    if (isMac) {
      // Look for .app bundle
      const appBundle = files.find((f) => f.endsWith('.app'));
      if (appBundle) {
        const fullAppPath = path.join(gameDir, appBundle);
        // Remove macOS quarantine so user doesn't get blocked by Gatekeeper
        try {
          await execFileAsync('xattr', ['-dr', 'com.apple.quarantine', fullAppPath]);
        } catch {
          // Ignore if xattr fails
        }
        // Ensure MacOS inner executable is chmod +x
        const macosDir = path.join(fullAppPath, 'Contents', 'MacOS');
        if (fs.existsSync(macosDir)) {
          const innerBinaries = fs.readdirSync(macosDir);
          for (const bin of innerBinaries) {
            try {
              fs.chmodSync(path.join(macosDir, bin), 0o755);
            } catch {
              // ignore
            }
          }
        }
        return fullAppPath;
      }
    }

    if (isWin) {
      const exe = files.find((f) => f.endsWith('.exe'));
      if (exe) return path.join(gameDir, exe);
    }

    // Linux or fallback: look for AppImage or executable file
    const appImage = files.find((f) => f.endsWith('.AppImage'));
    if (appImage) {
      const full = path.join(gameDir, appImage);
      fs.chmodSync(full, 0o755);
      return full;
    }

    // Look for any regular file without extension or matching game name
    for (const f of files) {
      const full = path.join(gameDir, f);
      const stat = fs.statSync(full);
      if (stat.isFile() && !f.endsWith('.txt') && !f.endsWith('.md') && !f.endsWith('.json')) {
        if (!isWin) {
          try {
            fs.chmodSync(full, 0o755);
          } catch {
            // ignore
          }
        }
        return full;
      }
    }

    return gameDir;
  }

  public async deleteInstall(installPath: string): Promise<void> {
    if (fs.existsSync(installPath)) {
      await fs.promises.rm(installPath, { recursive: true, force: true });
    }
  }
}
