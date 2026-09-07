import React, { useState, useEffect } from 'react';
import {
  Play,
  Download,
  RefreshCw,
  Folder,
  FolderOpen,
  Trash2,
  ExternalLink,
  Apple,
  Monitor,
  Smartphone,
  Disc,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Layers,
  ArrowDownCircle,
  AlertTriangle,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { RecompGame, SystemInfo, InstallProgress } from '../types/recomp';
import { formatBytes, formatSpeed, formatDate } from '../lib/formatters';

interface GameDetailProps {
  game: RecompGame;
  onLaunch: (game: RecompGame) => void;
  onInstall: (game: RecompGame) => void;
  onUninstall: (game: RecompGame) => void;
  onDeleteGame: (gameId: string) => void;
  onSelectIso: (game: RecompGame) => void;
  onRefreshGame: (gameId: string) => void;
  onOpenFolder: (path: string) => void;
  onSaveCustomArgs: (game: RecompGame, args: string) => void;
  isInstalling: boolean;
  installProgress: InstallProgress | null;
  isRefreshing: boolean;
  systemInfo: SystemInfo | null;
}

export const GameDetail: React.FC<GameDetailProps> = ({
  game,
  onLaunch,
  onInstall,
  onUninstall,
  onDeleteGame,
  onSelectIso,
  onRefreshGame,
  onOpenFolder,
  onSaveCustomArgs,
  isInstalling,
  installProgress,
  isRefreshing,
  systemInfo,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'settings'>('overview');
  const [customArgs, setCustomArgs] = useState(game.customLaunchArgs || '');
  const [installFolder, setInstallFolder] = useState(game.installPath || '');
  const [showUninstallModal, setShowUninstallModal] = useState(false);

  useEffect(() => {
    setCustomArgs(game.customLaunchArgs || '');
    setInstallFolder(game.installPath || '');
  }, [game.id, game.installPath, game.customLaunchArgs]);

  const isInstalled = Boolean(game.installedVersion);
  const hasIso = Boolean(game.linkedIso);
  const isUpdate = Boolean(game.updateAvailable);

  const latestTag = game.latestRelease?.tagName || 'latest';
  const compat = game.osCompatibility;
  const isHostCompatible = compat ? compat.isHostCompatible : true;

  const currentHostLabel = systemInfo?.isMac
    ? 'macOS'
    : systemInfo?.isWindows
    ? 'Windows'
    : 'Linux';

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-background/50">
      {/* Hero Header */}
      <div className="relative w-full h-64 bg-gradient-to-br from-indigo-950 via-slate-900 to-zinc-950 flex flex-col justify-end p-6 overflow-hidden border-b border-border/40">
        {game.bannerUrl && (
          <img
            src={game.bannerUrl}
            alt={game.title}
            className="absolute inset-0 w-full h-full object-cover opacity-35 filter blur-xs"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        {/* Header Content */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[11px] bg-background/80 backdrop-blur-xs">
                {game.repoOwner}/{game.repoName}
              </Badge>
              {game.latestRelease?.publishedAt && (
                <span className="text-xs text-muted-foreground">
                  Updated {formatDate(game.latestRelease.publishedAt)}
                </span>
              )}
            </div>

            <h1 className="text-3xl font-black tracking-tight text-foreground">{game.title}</h1>
            {game.subtitle && (
              <p className="text-sm font-medium text-muted-foreground">{game.subtitle}</p>
            )}
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRefreshGame(game.id)}
              disabled={isRefreshing}
              className="gap-1.5 text-xs bg-background/60 backdrop-blur-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
              Check Updates
            </Button>

            <a
              href={game.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-border/80 bg-background/60 backdrop-blur-xs hover:bg-accent text-foreground transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              GitHub
            </a>
          </div>
        </div>
      </div>

      {/* Main Action Bar */}
      <div className="p-6 border-b border-border/40 bg-card/40 backdrop-blur-xs flex flex-wrap items-center justify-between gap-4">
        {/* Play / Install CTA */}
        <div className="flex items-center gap-3">
          {isInstalled && (
            <Button
              onClick={() => onLaunch(game)}
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-500/20 gap-2 text-sm px-6 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              Launch Game
            </Button>
          )}

          {isInstalled && !hasIso && (
            <Button
              onClick={() => onSelectIso(game)}
              variant="outline"
              size="sm"
              className="border-dashed gap-1.5 text-xs cursor-pointer"
            >
              <Disc className="w-3.5 h-3.5 text-muted-foreground" />
              Link ISO (Optional)
            </Button>
          )}

          {/* Install / Update Button */}
          {isUpdate ? (
            <Button
              onClick={() => onInstall(game)}
              disabled={isInstalling || !isHostCompatible}
              size="lg"
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md shadow-amber-500/20 gap-2 text-sm px-6 cursor-pointer animate-pulse"
            >
              <ArrowDownCircle className="w-4 h-4" />
              Update to {latestTag}
            </Button>
          ) : !isInstalled ? (
            <Button
              onClick={() => onInstall(game)}
              disabled={isInstalling || !isHostCompatible}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md shadow-primary/20 gap-2 text-sm px-6 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Install {latestTag}
            </Button>
          ) : null}

          {/* Open Folder / Uninstall Dropdown actions */}
          {isInstalled && game.installPath && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenFolder(game.installPath!)}
              className="gap-1.5 text-xs cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Open Game Folder
            </Button>
          )}

          {isInstalled && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUninstallModal(true)}
              className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive text-xs gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Uninstall Recomp
            </Button>
          )}
        </div>

        {/* Version status pill */}
        <div className="flex items-center gap-3 text-xs">
          {isInstalled && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/60">
              <span className="text-muted-foreground">Installed:</span>
              <span className="font-mono font-semibold text-foreground">{game.installedVersion}</span>
            </div>
          )}
          {game.latestRelease?.tagName && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/60">
              <span className="text-muted-foreground">Latest Release:</span>
              <span className="font-mono font-semibold text-foreground">{game.latestRelease.tagName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar (when installing or updating) */}
      {isInstalling && installProgress && (
        <div className="p-4 mx-6 my-4 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-primary animate-bounce" />
              {installProgress.message || 'Installing recompilation package...'}
            </span>
            <span className="font-mono text-muted-foreground">
              {installProgress.percent}% ({formatSpeed(installProgress.speedBytesPerSec)})
            </span>
          </div>
          <Progress value={installProgress.percent} className="h-2" />
        </div>
      )}

      {/* Content Body */}
      <div className="p-6 space-y-6">
        {/* OS Compatibility Matrix */}
        <div className="p-4 rounded-xl border border-border/60 bg-card/60 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              OS Compatibility (From GitHub Release Assets)
            </h3>
            {isHostCompatible ? (
              <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-[11px] gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Compatible with this {currentHostLabel} system
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-rose-500/10 border-rose-500/40 text-rose-500 text-[11px] gap-1">
                <AlertCircle className="w-3 h-3" />
                No native build found for this {currentHostLabel} system
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {/* macOS */}
            <div className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1.5 text-center ${
              compat?.macos
                ? systemInfo?.isMac
                  ? 'border-primary/50 bg-primary/10 text-primary font-semibold'
                  : 'border-border/60 bg-card text-foreground'
                : 'opacity-40 border-dashed border-border/40 text-muted-foreground'
            }`}>
              <Apple className="w-5 h-5" />
              <span className="text-xs">macOS</span>
              <span className="text-[10px] text-muted-foreground">
                {compat?.macos ? 'Native (.app/zip)' : 'No release'}
              </span>
            </div>

            {/* Windows */}
            <div className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1.5 text-center ${
              compat?.windows
                ? systemInfo?.isWindows
                  ? 'border-primary/50 bg-primary/10 text-primary font-semibold'
                  : 'border-border/60 bg-card text-foreground'
                : 'opacity-40 border-dashed border-border/40 text-muted-foreground'
            }`}>
              <Monitor className="w-5 h-5" />
              <span className="text-xs">Windows</span>
              <span className="text-[10px] text-muted-foreground">
                {compat?.windows ? 'Win64 (.exe)' : 'No release'}
              </span>
            </div>

            {/* Linux */}
            <div className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1.5 text-center ${
              compat?.linux
                ? systemInfo?.isLinux
                  ? 'border-primary/50 bg-primary/10 text-primary font-semibold'
                  : 'border-border/60 bg-card text-foreground'
                : 'opacity-40 border-dashed border-border/40 text-muted-foreground'
            }`}>
              <span className="text-base font-bold">🐧</span>
              <span className="text-xs">Linux</span>
              <span className="text-[10px] text-muted-foreground">
                {compat?.linux ? 'AppImage / tar' : 'No release'}
              </span>
            </div>

            {/* iOS */}
            <div className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1.5 text-center ${
              compat?.ios
                ? 'border-border/60 bg-card text-foreground'
                : 'opacity-40 border-dashed border-border/40 text-muted-foreground'
            }`}>
              <Smartphone className="w-5 h-5 text-indigo-400" />
              <span className="text-xs">iOS / iPadOS</span>
              <span className="text-[10px] text-muted-foreground">
                {compat?.ios ? 'IPA package' : 'No release'}
              </span>
            </div>

            {/* Android */}
            <div className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1.5 text-center ${
              compat?.android
                ? 'border-border/60 bg-card text-foreground'
                : 'opacity-40 border-dashed border-border/40 text-muted-foreground'
            }`}>
              <Smartphone className="w-5 h-5 text-emerald-400" />
              <span className="text-xs">Android</span>
              <span className="text-[10px] text-muted-foreground">
                {compat?.android ? 'APK package' : 'No release'}
              </span>
            </div>
          </div>
        </div>

        {/* Game ISO / ROM Association Section */}
        <div className="p-5 rounded-xl border border-border/60 bg-card/60 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg ${hasIso ? 'bg-emerald-500/15 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                <Disc className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Game Disc / ROM (ISO)</h3>
                <p className="text-xs text-muted-foreground">
                  Expected format: <span className="font-mono text-foreground font-medium">{game.requiredFileType}</span> ({game.requiredFileDesc})
                </p>
              </div>
            </div>

            {hasIso ? (
              <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 gap-1 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                ISO Linked (Auto-load)
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-muted border-border/60 text-muted-foreground gap-1 text-xs">
                No ISO Linked (Optional)
              </Badge>
            )}
          </div>

          {/* Linked File Details */}
          {hasIso && game.linkedIso ? (
            <div className="p-3.5 rounded-lg bg-muted/40 border border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5 min-w-0">
                <div className="font-semibold text-foreground flex items-center gap-2 truncate">
                  <FileCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="truncate">{game.linkedIso.fileName}</span>
                  <Badge variant="secondary" className="uppercase text-[10px]">
                    .{game.linkedIso.format}
                  </Badge>
                </div>
                <div className="text-[11px] text-muted-foreground font-mono truncate">
                  {game.linkedIso.path}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Size: {formatBytes(game.linkedIso.sizeBytes)} • Linked {formatDate(game.linkedIso.linkedAt)}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSelectIso(game)}
                  className="text-xs cursor-pointer"
                >
                  Change File...
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onOpenFolder(game.linkedIso!.path)}
                  className="text-xs cursor-pointer"
                  title="Reveal ISO in Finder / Explorer"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-muted/30 border border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1 text-xs">
                <p className="font-medium text-foreground">
                  Optional: Link an ISO/ROM file to auto-pass it to the game when launching.
                </p>
                <p className="text-muted-foreground text-[11px]">
                  You can also launch the game directly without an ISO — many recompilations have their own in-game file prompt or internal game folder.
                </p>
              </div>
              <Button
                onClick={() => onSelectIso(game)}
                size="sm"
                variant="outline"
                className="font-medium shrink-0 text-xs cursor-pointer gap-1.5"
              >
                <Disc className="w-3.5 h-3.5" />
                Link ISO File...
              </Button>
            </div>
          )}
        </div>

        {/* Tabbed Info (Overview, Changelog, Settings) */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="overview" className="text-xs cursor-pointer">
              Overview
            </TabsTrigger>
            <TabsTrigger value="notes" className="text-xs cursor-pointer">
              Changelog & Notes
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs cursor-pointer">
              Launch Options
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 pt-4 text-xs">
            <div className="p-4 rounded-xl border border-border/40 bg-card/40 space-y-2">
              <h4 className="font-bold text-foreground">About {game.title}</h4>
              <p className="text-muted-foreground leading-relaxed">
                {game.description}
              </p>
            </div>

            {isInstalled && (
              <div className="p-4 rounded-xl border border-border/40 bg-card/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-foreground">Installed Recompilation Package</h4>
                    <p className="text-muted-foreground text-[11px]">
                      Version: <span className="font-mono font-medium text-foreground">{game.installedVersion}</span>
                      {game.installedAt && ` • Installed on ${formatDate(game.installedAt)}`}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUninstallModal(true)}
                    className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive text-xs gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Uninstall Recomp
                  </Button>
                </div>
              </div>
            )}

            {game.isCustom && (
              <div className="pt-2 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteGame(game.id)}
                  className="text-destructive hover:bg-destructive/10 text-xs gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove from Library
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Changelog Tab */}
          <TabsContent value="notes" className="pt-4 text-xs">
            <div className="p-4 rounded-xl border border-border/40 bg-card/40 space-y-3">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="font-bold text-foreground">
                  Release Notes: {game.latestRelease?.name || game.latestRelease?.tagName || 'Latest'}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Published {formatDate(game.latestRelease?.publishedAt)}
                </span>
              </div>
              <div className="whitespace-pre-wrap font-mono text-[11px] text-muted-foreground max-h-72 overflow-y-auto leading-relaxed">
                {game.latestRelease?.body || 'No release notes provided for this version.'}
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="pt-4 space-y-4 text-xs">
            <div className="p-4 rounded-xl border border-border/40 bg-card/40 space-y-3">
              <h4 className="font-bold text-foreground">Custom Launch Arguments</h4>
              <p className="text-muted-foreground text-[11px]">
                Pass additional command line flags to the recompilation executable when launching (e.g. <span className="font-mono bg-muted px-1 py-0.5 rounded">--fullscreen --debug</span>).
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customArgs}
                  onChange={(e) => setCustomArgs(e.target.value)}
                  placeholder="e.g. --fullscreen"
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
                <Button
                  size="sm"
                  onClick={() => onSaveCustomArgs(game, customArgs)}
                  className="text-xs cursor-pointer"
                >
                  Save Args
                </Button>
              </div>
            </div>

            {/* Game Installation Folder */}
            <div className="p-4 rounded-xl border border-border/40 bg-card/40 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-foreground flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5 text-primary" />
                  Game Installation Folder
                </h4>
                {installFolder && (
                  <button
                    type="button"
                    onClick={() => onOpenFolder(installFolder)}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <FolderOpen className="w-3 h-3" />
                    Open in Finder
                  </button>
                )}
              </div>
              <p className="text-muted-foreground text-[11px]">
                The folder on your drive where this recompilation is extracted and stored.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={installFolder}
                  onChange={(e) => setInstallFolder(e.target.value)}
                  placeholder="/path/to/installation/folder"
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs font-mono"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const dir = await window.recompAPI.selectDirectory(`Select Folder for ${game.title}`);
                    if (dir) setInstallFolder(dir);
                  }}
                  className="text-xs shrink-0 cursor-pointer gap-1.5"
                >
                  <Folder className="w-3.5 h-3.5" />
                  Browse...
                </Button>
                <Button
                  size="sm"
                  onClick={async () => {
                    const updated = {
                      ...game,
                      installPath: installFolder.trim() || undefined,
                      executablePath: installFolder.trim() || game.executablePath,
                    };
                    await window.recompAPI.saveGame(updated);
                  }}
                  className="text-xs cursor-pointer"
                >
                  Save Folder
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Uninstall Confirmation Modal */}
      {showUninstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Uninstall {game.title}?</h3>
                <p className="text-xs text-muted-foreground font-mono">Version: {game.installedVersion}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              This will delete the installed recompilation application and binaries from your computer. Your linked game ISO, saves, and custom settings will remain safe.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUninstallModal(false)}
                className="text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  setShowUninstallModal(false);
                  onUninstall(game);
                }}
                className="text-xs gap-1.5 cursor-pointer font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Yes, Uninstall
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
