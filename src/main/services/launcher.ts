import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { shell } from 'electron';
import { RecompGame } from '../types';

export class LauncherService {
  private runningProcesses: Map<string, number> = new Map();

  public isGameRunning(gameId: string): boolean {
    return this.runningProcesses.has(gameId);
  }

  public async launchGame(game: RecompGame): Promise<{ success: boolean; pid?: number; message?: string }> {
    if (!game.executablePath || !fs.existsSync(game.executablePath)) {
      return {
        success: false,
        message: `Executable not found at ${game.executablePath || 'undefined'}`,
      };
    }

    const isMac = process.platform === 'darwin';
    const isAppBundle = isMac && game.executablePath.endsWith('.app');
    const args: string[] = [];

    // If custom launch args are provided
    if (game.customLaunchArgs && game.customLaunchArgs.trim().length > 0) {
      args.push(...game.customLaunchArgs.trim().split(/\s+/));
    }

    // Add linked ISO path if available
    if (game.linkedIso?.path && fs.existsSync(game.linkedIso.path)) {
      args.push(game.linkedIso.path);
    }

    try {
      if (isAppBundle) {
        // For macOS .app bundles:
        // If an ISO is linked, pass using `open -a <app> --args <iso>`
        const openArgs = ['-a', game.executablePath];
        if (args.length > 0) {
          openArgs.push('--args', ...args);
        }

        const child = spawn('open', openArgs, {
          detached: true,
          stdio: 'ignore',
        });

        child.unref();
        this.runningProcesses.set(game.id, child.pid || Date.now());

        return { success: true, pid: child.pid };
      } else {
        // Direct executable (Windows, Linux, or standalone binary)
        const workingDir = path.dirname(game.executablePath);
        const child = spawn(game.executablePath, args, {
          cwd: workingDir,
          detached: true,
          stdio: 'ignore',
        });

        const pid = child.pid || Date.now();
        this.runningProcesses.set(game.id, pid);

        child.on('exit', () => {
          this.runningProcesses.delete(game.id);
        });

        child.unref();
        return { success: true, pid };
      }
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to start game process',
      };
    }
  }

  public openGameFolder(folderPath: string): Promise<string> {
    return shell.openPath(folderPath);
  }
}
