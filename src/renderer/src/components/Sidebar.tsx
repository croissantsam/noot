import React from 'react';
import {
  Gamepad2,
  RefreshCw,
  Plus,
  Settings,
  Disc,
  ArrowDownCircle,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { LibraryFilter, RecompGame, SystemInfo } from '../types/recomp';

interface SidebarProps {
  games: RecompGame[];
  currentFilter: LibraryFilter;
  onFilterChange: (filter: LibraryFilter) => void;
  onRefreshAll: () => void;
  isRefreshing: boolean;
  onOpenAddModal: () => void;
  onOpenSettingsModal: () => void;
  systemInfo: SystemInfo | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  games,
  currentFilter,
  onFilterChange,
  onRefreshAll,
  isRefreshing,
  onOpenAddModal,
  onOpenSettingsModal,
  systemInfo,
}) => {
  const installedCount = games.filter((g) => Boolean(g.installedVersion)).length;
  const updatesCount = games.filter((g) => Boolean(g.updateAvailable)).length;
  const missingIsoCount = games.filter((g) => !g.linkedIso).length;

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col h-full bg-sidebar border-r border-sidebar-border select-none">
      {/* App Header / Logo */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-sidebar-foreground">Recomp Launcher</h1>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              {systemInfo?.isMac ? ' macOS' : systemInfo?.isWindows ? '⊞ Windows' : '🐧 Linux'} • {systemInfo?.arch || 'system'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-b border-sidebar-border flex items-center gap-2">
        <Button
          onClick={onOpenAddModal}
          size="sm"
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm gap-1.5 text-xs font-medium cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Recomp
        </Button>
        <Button
          onClick={onRefreshAll}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          title="Refresh releases from GitHub"
          className="px-2.5 cursor-pointer border-sidebar-border hover:bg-sidebar-accent"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
        </Button>
      </div>

      {/* Navigation Filter Groups */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Library
        </div>

        <button
          onClick={() => onFilterChange('all')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            currentFilter === 'all'
              ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-xs'
              : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-violet-500" />
            <span>All Recomps</span>
          </div>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
            {games.length}
          </Badge>
        </button>

        <button
          onClick={() => onFilterChange('installed')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            currentFilter === 'installed'
              ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-xs'
              : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Ready to Play</span>
          </div>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
            {installedCount}
          </Badge>
        </button>

        <button
          onClick={() => onFilterChange('updates')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            currentFilter === 'updates'
              ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-xs'
              : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <ArrowDownCircle className="w-4 h-4 text-amber-500" />
            <span>Updates Available</span>
          </div>
          {updatesCount > 0 ? (
            <Badge className="text-[10px] px-1.5 py-0 h-5 bg-amber-500 hover:bg-amber-600 text-white font-bold animate-pulse">
              {updatesCount}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
              0
            </Badge>
          )}
        </button>

        <button
          onClick={() => onFilterChange('missing-iso')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            currentFilter === 'missing-iso'
              ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-xs'
              : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Disc className="w-4 h-4 text-violet-400" />
            <span>Unlinked ISO</span>
          </div>
          {missingIsoCount > 0 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-border text-muted-foreground">
              {missingIsoCount}
            </Badge>
          )}
        </button>
      </nav>

      {/* Footer Settings */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={onOpenSettingsModal}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4 text-muted-foreground" />
          <span>Launcher Settings</span>
        </button>
      </div>
    </aside>
  );
};
