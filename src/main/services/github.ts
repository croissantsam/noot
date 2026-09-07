import { GithubRelease, OSCompatibility, ReleaseAsset, SupportedOS } from '../types';

export interface RepoInfo {
  name: string;
  fullName: string;
  description: string;
  stars: number;
  owner: string;
  htmlUrl: string;
  defaultBranch: string;
  topics: string[];
}

export class GithubService {
  private apiToken?: string;

  constructor(token?: string) {
    this.apiToken = token;
  }

  setToken(token?: string): void {
    this.apiToken = token;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Recomp-Decomp-Launcher/1.0',
    };
    if (this.apiToken && this.apiToken.trim().length > 0) {
      headers['Authorization'] = `token ${this.apiToken.trim()}`;
    }
    return headers;
  }

  public parseRepoUrl(input: string): { owner: string; repo: string } | null {
    const trimmed = input.trim();
    // Support "owner/repo"
    if (/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(trimmed)) {
      const [owner, repo] = trimmed.split('/');
      return { owner, repo };
    }

    // Support "https://github.com/owner/repo" or "http://..."
    const match = trimmed.match(/github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/);
    if (match) {
      return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
    }

    return null;
  }

  public async fetchRepoInfo(owner: string, repo: string): Promise<RepoInfo> {
    const url = `https://api.github.com/repos/${owner}/${repo}`;
    const res = await fetch(url, { headers: this.getHeaders() });
    if (!res.ok) {
      throw new Error(`Failed to fetch repo ${owner}/${repo}: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    return {
      name: data.name,
      fullName: data.full_name,
      description: data.description || '',
      stars: data.stargazers_count || 0,
      owner: data.owner?.login || owner,
      htmlUrl: data.html_url,
      defaultBranch: data.default_branch || 'main',
      topics: data.topics || [],
    };
  }

  public async fetchReleases(owner: string, repo: string): Promise<GithubRelease[]> {
    const url = `https://api.github.com/repos/${owner}/${repo}/releases?per_page=15`;
    const res = await fetch(url, { headers: this.getHeaders() });
    if (!res.ok) {
      throw new Error(`Failed to fetch releases for ${owner}/${repo}: ${res.status} ${res.statusText}`);
    }
    const list = await res.json();
    if (!Array.isArray(list)) return [];

    return list.map((item: any) => {
      const assets: ReleaseAsset[] = (item.assets || []).map((a: any) => {
        const { detectedOS, detectedArch } = this.classifyAsset(a.name);
        return {
          id: a.id,
          name: a.name,
          size: a.size,
          downloadUrl: a.browser_download_url,
          contentType: a.content_type,
          detectedOS,
          detectedArch,
        };
      });

      return {
        id: item.id,
        tagName: item.tag_name,
        name: item.name || item.tag_name,
        body: item.body || '',
        publishedAt: item.published_at,
        prerelease: Boolean(item.prerelease),
        htmlUrl: item.html_url,
        assets,
      };
    });
  }

  public async fetchLatestRelease(owner: string, repo: string): Promise<GithubRelease | null> {
    const releases = await this.fetchReleases(owner, repo);
    if (releases.length === 0) return null;
    // Prefer the first non-prerelease, or fallback to first
    const stable = releases.find((r) => !r.prerelease);
    return stable || releases[0];
  }

  public classifyAsset(name: string): {
    detectedOS?: SupportedOS;
    detectedArch?: 'arm64' | 'x64' | 'universal' | 'other';
  } {
    const lower = name.toLowerCase();

    let detectedOS: SupportedOS | undefined;
    let detectedArch: 'arm64' | 'x64' | 'universal' | 'other' = 'other';

    // Architecture
    if (lower.includes('arm64') || lower.includes('aarch64')) {
      detectedArch = 'arm64';
    } else if (lower.includes('x86_64') || lower.includes('x64') || lower.includes('amd64')) {
      detectedArch = 'x64';
    } else if (lower.includes('universal')) {
      detectedArch = 'universal';
    }

    // OS matching
    // Android
    if (lower.endsWith('.apk') || lower.includes('android')) {
      detectedOS = 'android';
    }
    // iOS
    else if (lower.endsWith('.ipa') || lower.includes('ios') || lower.includes('tvos')) {
      detectedOS = 'ios';
    }
    // macOS
    else if (
      lower.includes('macos') ||
      lower.includes('darwin') ||
      lower.includes('osx') ||
      lower.endsWith('.dmg') ||
      (lower.includes('mac') && !lower.includes('machine'))
    ) {
      detectedOS = 'macos';
    }
    // Windows
    else if (
      lower.includes('win32') ||
      lower.includes('win64') ||
      lower.includes('windows') ||
      lower.endsWith('.exe') ||
      lower.endsWith('.msi')
    ) {
      detectedOS = 'windows';
    }
    // Linux
    else if (
      lower.endsWith('.appimage') ||
      lower.includes('linux') ||
      lower.endsWith('.deb') ||
      lower.endsWith('.rpm') ||
      lower.endsWith('.flatpak')
    ) {
      detectedOS = 'linux';
    }

    return { detectedOS, detectedArch };
  }

  public computeCompatibility(
    release: GithubRelease | null,
    hostPlatform: 'darwin' | 'win32' | 'linux',
    hostArch: string
  ): OSCompatibility {
    if (!release || !release.assets || release.assets.length === 0) {
      return {
        macos: false,
        windows: false,
        linux: false,
        ios: false,
        android: false,
        isHostCompatible: false,
      };
    }

    const hasMac = release.assets.some((a) => a.detectedOS === 'macos');
    const hasWin = release.assets.some((a) => a.detectedOS === 'windows');
    const hasLinux = release.assets.some((a) => a.detectedOS === 'linux');
    const hasIos = release.assets.some((a) => a.detectedOS === 'ios');
    const hasAndroid = release.assets.some((a) => a.detectedOS === 'android');

    // Find best asset for current host
    let targetOS: SupportedOS = 'macos';
    if (hostPlatform === 'win32') targetOS = 'windows';
    if (hostPlatform === 'linux') targetOS = 'linux';

    const matchingAssets = release.assets.filter((a) => a.detectedOS === targetOS);

    // Prioritize architecture match (e.g. arm64 on Apple Silicon)
    let bestAsset: ReleaseAsset | undefined;
    if (hostArch === 'arm64') {
      bestAsset =
        matchingAssets.find((a) => a.detectedArch === 'arm64') ||
        matchingAssets.find((a) => a.detectedArch === 'universal') ||
        matchingAssets[0];
    } else {
      bestAsset =
        matchingAssets.find((a) => a.detectedArch === 'x64') ||
        matchingAssets.find((a) => a.detectedArch === 'universal') ||
        matchingAssets[0];
    }

    return {
      macos: hasMac,
      windows: hasWin,
      linux: hasLinux,
      ios: hasIos,
      android: hasAndroid,
      isHostCompatible: Boolean(bestAsset),
      compatibleAsset: bestAsset,
    };
  }
}
