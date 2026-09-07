import React, { useState } from 'react';
import {
  X,
  Plus,
  GitBranch,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Apple,
  Monitor,
  Smartphone,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { RecompGame, OSCompatibility, GithubRelease } from '../types/recomp';

interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGame: (game: RecompGame) => void;
}

export const AddGameModal: React.FC<AddGameModalProps> = ({
  isOpen,
  onClose,
  onAddGame,
}) => {
  const [repoInput, setRepoInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inspected info
  const [inspectedInfo, setInspectedInfo] = useState<{
    repoInfo: any;
    latestRelease: GithubRelease | null;
    osCompatibility: OSCompatibility;
  } | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [requiredFileType, setRequiredFileType] = useState('.iso, .rvz, .gcm');
  const [requiredFileDesc, setRequiredFileDesc] = useState('Game Disc / ROM dump');

  if (!isOpen) return null;

  const handleFetch = async () => {
    if (!repoInput.trim()) return;
    setIsLoading(true);
    setError(null);
    setInspectedInfo(null);

    try {
      const data = await window.recompAPI.fetchGithubRepo(repoInput.trim());
      setInspectedInfo(data);

      setTitle(data.repoInfo.name);
      setDescription(data.repoInfo.description || '');

      // Guess required format based on repo name or description
      const text = `${data.repoInfo.name} ${data.repoInfo.description || ''}`.toLowerCase();
      if (text.includes('n64') || text.includes('64') || text.includes('z64')) {
        setRequiredFileType('.z64, .n64');
        setRequiredFileDesc('Nintendo 64 ROM dump');
      } else if (text.includes('ps1') || text.includes('playstation') || text.includes('ctr')) {
        setRequiredFileType('.bin, .iso, .cue');
        setRequiredFileDesc('PlayStation 1 Disc dump');
      } else {
        setRequiredFileType('.iso, .rvz, .gcm');
        setRequiredFileDesc('GameCube / Wii Disc dump');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to inspect GitHub repository');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!inspectedInfo || !title.trim()) return;

    const newGame: RecompGame = {
      id: `${inspectedInfo.repoInfo.owner}-${inspectedInfo.repoInfo.name}`.toLowerCase(),
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      description: description.trim(),
      repoOwner: inspectedInfo.repoInfo.owner,
      repoName: inspectedInfo.repoInfo.name,
      githubUrl: inspectedInfo.repoInfo.htmlUrl,
      requiredFileType: requiredFileType.trim(),
      requiredFileDesc: requiredFileDesc.trim(),
      latestRelease: inspectedInfo.latestRelease || undefined,
      osCompatibility: inspectedInfo.osCompatibility,
      isCustom: true,
      lastCheckedAt: new Date().toISOString(),
    };

    onAddGame(newGame);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-card border border-border rounded-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">Add Recomp from GitHub</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Input repo URL */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">
              GitHub Repository URL or owner/repo
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                placeholder="e.g. chrissotraidis/kartpad or https://github.com/TwilitRealm/dusklight"
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
              <Button
                onClick={handleFetch}
                disabled={isLoading || !repoInput.trim()}
                size="sm"
                className="cursor-pointer gap-1.5"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Inspect'}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Paste the link of any static recompilation or decompilation GitHub project.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Inspected Results Preview */}
          {inspectedInfo && (
            <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3 animate-in fade-in-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground text-sm">
                    {inspectedInfo.repoInfo.fullName}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    ★ {inspectedInfo.repoInfo.stars} stars • Latest: {inspectedInfo.latestRelease?.tagName || 'No releases'}
                  </p>
                </div>
                {inspectedInfo.osCompatibility.isHostCompatible ? (
                  <Badge variant="outline" className="bg-emerald-500/15 border-emerald-500/40 text-emerald-500 text-[10px] gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Compatible with your OS
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-500/15 border-amber-500/40 text-amber-500 text-[10px] gap-1">
                    <AlertCircle className="w-3 h-3" /> No build for current OS
                  </Badge>
                )}
              </div>

              {/* Detected OS Badges */}
              <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                <span className="text-muted-foreground text-[10px]">Detected Platforms:</span>
                {inspectedInfo.osCompatibility.macos && (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <Apple className="w-3 h-3" /> macOS
                  </Badge>
                )}
                {inspectedInfo.osCompatibility.windows && (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <Monitor className="w-3 h-3" /> Windows
                  </Badge>
                )}
                {inspectedInfo.osCompatibility.linux && (
                  <Badge variant="secondary" className="text-[10px]">
                    Linux
                  </Badge>
                )}
                {inspectedInfo.osCompatibility.ios && (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <Smartphone className="w-3 h-3" /> iOS
                  </Badge>
                )}
                {inspectedInfo.osCompatibility.android && (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <Smartphone className="w-3 h-3" /> Android
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Form Configuration */}
          {inspectedInfo && (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Game Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Subtitle (Optional)</label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="e.g. Mario Kart: Double Dash"
                    className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Required ISO / ROM Format</label>
                  <input
                    type="text"
                    value={requiredFileType}
                    onChange={(e) => setRequiredFileType(e.target.value)}
                    placeholder=".iso, .rvz, .gcm"
                    className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Required File Description</label>
                  <input
                    type="text"
                    value={requiredFileDesc}
                    onChange={(e) => setRequiredFileDesc(e.target.value)}
                    placeholder="e.g. Retail Disc Dump"
                    className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border flex items-center justify-end gap-2 bg-muted/20">
          <Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!inspectedInfo || !title.trim()}
            onClick={handleSave}
            className="cursor-pointer text-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add to Library
          </Button>
        </div>
      </div>
    </div>
  );
};
