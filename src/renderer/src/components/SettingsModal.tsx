import React, { useState, useEffect } from 'react';
import { Settings, Folder, FolderOpen, Key, X, Check, Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from './theme-provider';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useTheme();
  const [gamesDir, setGamesDir] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      window.recompAPI.getSettings().then((s: any) => {
        if (s?.gamesDir) setGamesDir(s.gamesDir);
        if (s?.githubToken) setGithubToken(s.githubToken);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBrowseFolder = async () => {
    try {
      const selected = await window.recompAPI.selectDirectory('Select Installation Folder');
      if (selected) {
        setGamesDir(selected);
      }
    } catch (err) {
      console.error('Failed to browse folder:', err);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await window.recompAPI.saveSettings({
      gamesDir: gamesDir.trim(),
      githubToken: githubToken.trim(),
    });
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">Launcher Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Theme selector */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Appearance Theme</label>
            <div className="flex gap-2">
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('dark')}
                className="flex-1 gap-1.5 text-xs cursor-pointer"
              >
                <Moon className="w-3.5 h-3.5" />
                Dark
              </Button>
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('light')}
                className="flex-1 gap-1.5 text-xs cursor-pointer"
              >
                <Sun className="w-3.5 h-3.5" />
                Light
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('system')}
                className="flex-1 text-xs cursor-pointer"
              >
                System
              </Button>
            </div>
          </div>

          {/* Games Directory */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-foreground flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-primary" />
                Recomps Installation Folder
              </label>
              {gamesDir && (
                <button
                  type="button"
                  onClick={() => window.recompAPI.openFolder(gamesDir)}
                  className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <FolderOpen className="w-3 h-3" />
                  Open in Finder
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={gamesDir}
                onChange={(e) => setGamesDir(e.target.value)}
                placeholder="/path/to/installation/folder"
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs font-mono"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleBrowseFolder}
                className="text-xs shrink-0 cursor-pointer gap-1.5"
              >
                <Folder className="w-3.5 h-3.5" />
                Browse...
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Location where all recompilation binaries, archives, and app bundles are installed.
            </p>
          </div>

          {/* GitHub Token */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-500" />
              GitHub Personal Access Token (Optional)
            </label>
            <input
              type="password"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs font-mono"
            />
            <p className="text-[11px] text-muted-foreground">
              GitHub limits unauthenticated API queries to 60 requests/hour. Providing a personal token raises your limit to 5,000 requests/hour.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-end gap-2 bg-muted/20">
          <Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="cursor-pointer text-xs gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};
