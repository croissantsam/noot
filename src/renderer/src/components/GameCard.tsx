import React from 'react';
import {
  Apple,
  Monitor,
  Smartphone,
  ArrowDownCircle,
  Play,
} from 'lucide-react';
import { Badge } from './ui/badge';
import { RecompGame, SystemInfo } from '../types/recomp';

interface GameCardProps {
  game: RecompGame;
  isSelected: boolean;
  onSelect: () => void;
  systemInfo: SystemInfo | null;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  isSelected,
  onSelect,
  systemInfo,
}) => {
  const isInstalled = Boolean(game.installedVersion);
  const isUpdate = Boolean(game.updateAvailable);

  const compat = game.osCompatibility;

  return (
    <div
      onClick={onSelect}
      className={`group relative rounded-2xl border transition-all duration-200 overflow-hidden cursor-pointer flex flex-col ${
        isSelected
          ? 'border-primary ring-2 ring-primary/30 shadow-lg bg-card'
          : 'border-border/60 hover:border-primary/50 hover:shadow-md bg-card/60 backdrop-blur-xs'
      }`}
    >
      {/* Top Banner / Artwork */}
      <div className="relative h-36 w-full bg-gradient-to-br from-indigo-950 via-slate-900 to-zinc-900 overflow-hidden flex items-center justify-center">
        {game.bannerUrl ? (
          <img
            src={game.bannerUrl}
            alt={game.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : null}

        {/* Ambient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

        {/* Status Badge in Banner */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
          {isUpdate ? (
            <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-[11px] shadow-sm flex items-center gap-1 animate-pulse">
              <ArrowDownCircle className="w-3 h-3" />
              Update
            </Badge>
          ) : isInstalled ? (
            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px] shadow-sm flex items-center gap-1">
              <Play className="w-2.5 h-2.5 fill-current" />
              Ready
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[11px] opacity-70">
              Not Installed
            </Badge>
          )}
        </div>

        {/* Game Title Preview in Banner */}
        <div className="absolute bottom-2.5 left-3 right-3 z-10">
          <h3 className="text-white font-bold text-base tracking-tight truncate drop-shadow-sm">
            {game.title}
          </h3>
          {game.subtitle && (
            <p className="text-zinc-300 text-xs truncate drop-shadow-xs">
              {game.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {game.description}
        </p>

        {/* Footer: OS Compatibility Badges & Version */}
        <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
          {/* OS Badges */}
          <div className="flex items-center gap-1.5" title="Detected OS Compatibility from GitHub releases">
            {compat?.macos && (
              <span className={`p-1 rounded-md ${systemInfo?.isMac ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                <Apple className="w-3.5 h-3.5" />
              </span>
            )}
            {compat?.windows && (
              <span className={`p-1 rounded-md ${systemInfo?.isWindows ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                <Monitor className="w-3.5 h-3.5" />
              </span>
            )}
            {compat?.linux && (
              <span className={`p-1 rounded-md text-[10px] font-bold px-1 ${systemInfo?.isLinux ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                LINUX
              </span>
            )}
            {(compat?.ios || compat?.android) && (
              <span className="p-1 rounded-md bg-muted text-muted-foreground">
                <Smartphone className="w-3.5 h-3.5" />
              </span>
            )}
            {!compat && (
              <span className="text-muted-foreground text-[10px]">GitHub Recomp</span>
            )}
          </div>

          {/* Version tag */}
          <div className="text-muted-foreground font-mono text-[10px]">
            {game.installedVersion ? (
              <span className="text-foreground font-medium">{game.installedVersion}</span>
            ) : game.latestRelease?.tagName ? (
              <span>{game.latestRelease.tagName}</span>
            ) : (
              <span>GitHub</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
