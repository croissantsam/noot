import { useState, useEffect, useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Search, Gamepad2, Plus } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { GameCard } from '@/components/GameCard';
import { GameDetail } from '@/components/GameDetail';
import { AddGameModal } from '@/components/AddGameModal';
import { SettingsModal } from '@/components/SettingsModal';
import { Button } from '@/components/ui/button';
import {
  RecompGame,
  LibraryFilter,
  SystemInfo,
  InstallProgress,
} from '@/types/recomp';

export const Route = createFileRoute('/')({
  component: LauncherDashboard,
});

function LauncherDashboard() {
  const [games, setGames] = useState<RecompGame[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<LibraryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);

  // Loading & Progress states
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState<InstallProgress | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    async function init() {
      try {
        const sys = await window.recompAPI.getSystemInfo();
        setSystemInfo(sys);

        const lib = await window.recompAPI.getLibrary();
        setGames(lib);
        if (lib.length > 0) {
          setSelectedGameId(lib[0].id);
        }

        // Automatic background update check
        checkUpdatesBackground();
      } catch (err) {
        console.error('Failed to initialize launcher:', err);
      }
    }

    init();

    // Listen for download/extract progress
    const unsubscribe = window.recompAPI.onInstallProgress((progress) => {
      setInstallProgress(progress);
      if (progress.stage === 'completed') {
        setIsInstalling(false);
        setInstallProgress(null);
      } else if (progress.stage === 'error') {
        setIsInstalling(false);
        toast.error(progress.message || 'Installation error');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const checkUpdatesBackground = async () => {
    try {
      const updatedLib = await window.recompAPI.checkUpdates();
      setGames(updatedLib);
    } catch {
      // Background check error ignored
    }
  };

  // Actions
  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    toast.info('Checking GitHub releases for all recomps...');
    try {
      const updated = await window.recompAPI.checkUpdates();
      setGames(updated);
      const updatesCount = updated.filter((g) => g.updateAvailable).length;
      if (updatesCount > 0) {
        toast.success(`Found ${updatesCount} update(s) available!`);
      } else {
        toast.success('All recomps are up to date with latest GitHub releases!');
      }
    } catch (err: any) {
      toast.error(`Update check failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefreshGame = async (gameId: string) => {
    setIsRefreshing(true);
    toast.info('Checking updates for this recomp...');
    try {
      const updated = await window.recompAPI.checkUpdates(gameId);
      setGames(updated);
      const game = updated.find((g) => g.id === gameId);
      if (game?.updateAvailable) {
        toast.success(`New version available: ${game.latestRelease?.tagName}!`);
      } else {
        toast.success(`${game?.title || 'Game'} is up to date.`);
      }
    } catch (err: any) {
      toast.error(`Update check failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSelectIso = async (game: RecompGame) => {
    try {
      const iso = await window.recompAPI.selectIso(
        `Select ${game.title} Retail Disc / ROM dump (${game.requiredFileType})`
      );
      if (iso) {
        const updatedGame = { ...game, linkedIso: iso };
        await window.recompAPI.saveGame(updatedGame);
        setGames((prev) => prev.map((g) => (g.id === game.id ? updatedGame : g)));
        toast.success(`Linked ${iso.fileName} to ${game.title}!`);
      }
    } catch (err: any) {
      toast.error(`Failed to link ISO: ${err.message}`);
    }
  };

  const handleInstall = async (game: RecompGame) => {
    setIsInstalling(true);
    toast.info(`Starting installation of ${game.title}...`);
    try {
      const updatedGame = await window.recompAPI.install(game.id);
      setGames((prev) => prev.map((g) => (g.id === game.id ? updatedGame : g)));
      toast.success(`${game.title} successfully installed and ready!`);
    } catch (err: any) {
      toast.error(`Installation failed: ${err.message}`);
    } finally {
      setIsInstalling(false);
      setInstallProgress(null);
    }
  };

  const handleUninstall = async (game: RecompGame) => {
    if (!confirm(`Are you sure you want to uninstall ${game.title}? Your linked ISO will NOT be deleted.`)) {
      return;
    }

    try {
      const result = await window.recompAPI.uninstall(game.id);
      if (result) {
        setGames((prev) => prev.map((g) => (g.id === game.id ? (result as RecompGame) : g)));
        toast.success(`${game.title} uninstalled.`);
      }
    } catch (err: any) {
      toast.error(`Uninstall failed: ${err.message}`);
    }
  };

  const handleLaunch = async (game: RecompGame) => {
    toast.info(`Launching ${game.title}...`);
    try {
      const res = await window.recompAPI.launch(game.id);
      if (res.success) {
        toast.success(`${game.title} launched!`);
      } else {
        toast.error(`Launch failed: ${res.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      toast.error(`Launch failed: ${err.message}`);
    }
  };

  const handleOpenFolder = async (path: string) => {
    await window.recompAPI.openFolder(path);
  };

  const handleSaveCustomArgs = async (game: RecompGame, args: string) => {
    const updated = { ...game, customLaunchArgs: args };
    await window.recompAPI.saveGame(updated);
    setGames((prev) => prev.map((g) => (g.id === game.id ? updated : g)));
    toast.success('Launch arguments saved.');
  };

  const handleAddGame = async (newGame: RecompGame) => {
    await window.recompAPI.saveGame(newGame);
    setGames((prev) => [...prev, newGame]);
    setSelectedGameId(newGame.id);
    toast.success(`Added ${newGame.title} from GitHub!`);
  };

  const handleDeleteGame = async (gameId: string) => {
    if (!confirm('Remove this game from your launcher library?')) return;
    await window.recompAPI.deleteGame(gameId);
    setGames((prev) => prev.filter((g) => g.id !== gameId));
    if (selectedGameId === gameId) {
      const remaining = games.filter((g) => g.id !== gameId);
      setSelectedGameId(remaining[0]?.id || null);
    }
    toast.success('Game removed from library.');
  };

  // Filter & Search
  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          g.title.toLowerCase().includes(q) ||
          (g.subtitle && g.subtitle.toLowerCase().includes(q)) ||
          g.repoName.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Tab filter
      if (currentFilter === 'installed') {
        return Boolean(g.installedVersion);
      }
      if (currentFilter === 'updates') {
        return Boolean(g.updateAvailable);
      }
      if (currentFilter === 'missing-iso') {
        return !g.linkedIso;
      }

      return true;
    });
  }, [games, currentFilter, searchQuery]);

  const selectedGame = games.find((g) => g.id === selectedGameId) || filteredGames[0] || null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Navigation Sidebar */}
      <Sidebar
        games={games}
        currentFilter={currentFilter}
        onFilterChange={setCurrentFilter}
        onRefreshAll={handleRefreshAll}
        isRefreshing={isRefreshing}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        systemInfo={systemInfo}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Game Grid / Browser */}
        <div className="w-80 md:w-96 flex-shrink-0 flex flex-col border-r border-border/60 bg-muted/10 h-full">
          {/* Search Header */}
          <div className="p-3 border-b border-border/60 bg-background/50 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recomps..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
              <span>
                Showing {filteredGames.length} of {games.length}
              </span>
              {currentFilter !== 'all' && (
                <button
                  onClick={() => setCurrentFilter('all')}
                  className="text-primary hover:underline cursor-pointer"
                >
                  Clear filter
                </button>
              )}
            </div>
          </div>

          {/* Cards List / Grid */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {filteredGames.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-muted-foreground space-y-2">
                <Gamepad2 className="w-8 h-8 opacity-40" />
                <p className="text-xs">No recomps match your filter.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(true)}
                  className="text-xs mt-2 cursor-pointer gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Recomp
                </Button>
              </div>
            ) : (
              filteredGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  isSelected={selectedGame?.id === game.id}
                  onSelect={() => setSelectedGameId(game.id)}
                  systemInfo={systemInfo}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Column: Game Details View */}
        {selectedGame ? (
          <GameDetail
            game={selectedGame}
            onLaunch={handleLaunch}
            onInstall={handleInstall}
            onUninstall={handleUninstall}
            onDeleteGame={handleDeleteGame}
            onSelectIso={handleSelectIso}
            onRefreshGame={handleRefreshGame}
            onOpenFolder={handleOpenFolder}
            onSaveCustomArgs={handleSaveCustomArgs}
            isInstalling={isInstalling && installProgress?.gameId === selectedGame.id}
            installProgress={installProgress?.gameId === selectedGame.id ? installProgress : null}
            isRefreshing={isRefreshing}
            systemInfo={systemInfo}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-3">
            <Gamepad2 className="w-12 h-12 opacity-30" />
            <h3 className="text-base font-semibold text-foreground">Select a Recompilation Game</h3>
            <p className="text-xs max-w-sm">
              Choose a project from the left or add a new recompilation repo from GitHub to get started.
            </p>
          </div>
        )}
      </div>

      {/* Add Game Modal */}
      <AddGameModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddGame={handleAddGame}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
}
