import React, { useEffect, useState, useCallback } from 'react';
import { ServerContext } from '@/state/server';
import http from '@/api/http';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faSlidersH, faDownload, faHeart, faClock, faHdd, faCloudDownloadAlt, faSpinner, faCheck, faExclamationCircle, faTimes, faCube } from '@fortawesome/free-solid-svg-icons';
import debounce from 'lodash-es/debounce';
import tw from 'twin.macro';
import styled from 'styled-components/macro';

// Platform type
type Platform = 'modrinth' | 'spigotmc';

// Styled Components to match the "Glassmorphism" look provided
const GlassPanel = styled.div`
    ${tw`rounded-2xl p-6 mb-8`};
    background: rgba(30, 41, 59, 0.4);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
`;

const GlassCard = styled.div`
    ${tw`rounded-xl p-6 cursor-pointer transition-all duration-300 relative`};
    background: rgba(30, 41, 59, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.05);
    &:hover {
        background: rgba(30, 41, 59, 0.5);
        border-color: rgba(99, 102, 241, 0.4);
        transform: translateY(-4px);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
    }
`;

const TagBadge = styled.span`
    ${tw`text-xs px-2 py-0.5 rounded-full font-medium tracking-wide`};
    background: rgba(99, 102, 241, 0.2);
    color: rgb(129, 140, 248);
`;

const CustomSelect = styled.select`
    ${tw`w-full bg-neutral-900 border border-neutral-700 text-neutral-300 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none block`};
    background-color: rgba(15, 23, 42, 0.5);
`;

const PlatformTab = styled.button<{ active: boolean; color: string }>`
    ${tw`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2`};
    background: ${props => props.active ? props.color : 'rgba(30, 41, 59, 0.3)'};
    color: ${props => props.active ? 'white' : 'rgb(156, 163, 175)'};
    border: 1px solid ${props => props.active ? props.color : 'rgba(255, 255, 255, 0.05)'};
    &:hover {
        background: ${props => props.active ? props.color : 'rgba(30, 41, 59, 0.5)'};
    }
`;

const modrinthCategories = [
    { id: 'adventure', name: 'Adventure' },
    { id: 'cursed', name: 'Cursed' },
    { id: 'decoration', name: 'Decoration' },
    { id: 'economy', name: 'Economy' },
    { id: 'equipment', name: 'Equipment' },
    { id: 'food', name: 'Food' },
    { id: 'game-mechanics', name: 'Game Mechanics' },
    { id: 'library', name: 'Library' },
    { id: 'magic', name: 'Magic' },
    { id: 'management', name: 'Management' },
    { id: 'minigame', name: 'Minigame' },
    { id: 'mobs', name: 'Mobs' },
    { id: 'optimization', name: 'Optimization' },
    { id: 'social', name: 'Social' },
    { id: 'storage', name: 'Storage' },
    { id: 'technology', name: 'Technology' },
    { id: 'transportation', name: 'Transportation' },
    { id: 'utility', name: 'Utility' },
    { id: 'worldgen', name: 'World Generation' },
];

const spigotCategories = [
    { id: '2', name: 'Bungee - Spigot' },
    { id: '4', name: 'Spigot' },
    { id: '5', name: 'Transportation' },
    { id: '6', name: 'Chat' },
    { id: '7', name: 'Tools and Utilities' },
    { id: '8', name: 'Misc' },
    { id: '9', name: 'Libraries / APIs' },
    { id: '10', name: 'Transportation' },
    { id: '11', name: 'Chat' },
    { id: '12', name: 'Tools and Utilities' },
    { id: '17', name: 'Economy' },
    { id: '18', name: 'Game Mode' },
    { id: '22', name: 'World Management' },
    { id: '23', name: 'Mechanics' },
    { id: '24', name: 'Fun' },
];

const loadersList = [
    'paper', 'purpur', 'spigot', 'bukkit', 'folia', 'velocity', 'waterfall', 'bungeecord'
];

// Unified Plugin Interface
interface UnifiedPlugin {
    id: string;
    title: string;
    description: string;
    author: string;
    downloads: number;
    icon_url: string;
    categories: string[];
    date_modified: string;
    platform: Platform;
}

// Modrinth Version interface
interface ModrinthVersion {
    id: string;
    name: string;
    version_type: string;
    date_published: string;
    downloads: number;
    files: {
        url: string;
        filename: string;
        primary: boolean;
        size: number;
    }[];
    game_versions: string[];
    loaders: string[];
}

// Spigot Version interface
interface SpigotVersion {
    id: number;
    name: string;
    releaseDate: number;
}

// Unified Version interface
interface UnifiedVersion {
    id: string;
    name: string;
    version_type: string;
    date_published: string;
    downloads: number;
    files: {
        url: string;
        filename: string;
        primary: boolean;
        size: number;
    }[];
    game_versions: string[];
    loaders: string[];
}

export default () => {
    const server = ServerContext.useStoreState(state => state.server.data);
    const [platform, setPlatform] = useState<Platform>('modrinth');
    const [query, setQuery] = useState('');
    const [filters, setFilters] = useState({ category: '', loader: '', sort: 'relevance' });
    const [plugins, setPlugins] = useState<UnifiedPlugin[]>([]);
    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [totalHits, setTotalHits] = useState(0);
    const [page, setPage] = useState(0);

    // Modal State
    const [selectedPlugin, setSelectedPlugin] = useState<UnifiedPlugin | null>(null);
    const [versions, setVersions] = useState<UnifiedVersion[]>([]);
    const [versionFilters, setVersionFilters] = useState({ gameVersion: '', loader: '', type: '' });
    const [loadingVersions, setLoadingVersions] = useState(false);

    // Derived state for version filtering
    const [availableGameVersions, setAvailableGameVersions] = useState<string[]>([]);
    const [availableLoaders, setAvailableLoaders] = useState<string[]>([]);

    // ===== Modrinth API =====
    const searchModrinth = async (q: string, offset: number): Promise<{ plugins: UnifiedPlugin[], total: number }> => {
        const facets = [['project_type:plugin']];
        if (filters.category) facets.push([`categories:${filters.category}`]);
        if (filters.loader) facets.push([`categories:${filters.loader}`]);

        const params = new URLSearchParams({
            facets: JSON.stringify(facets),
            limit: '12',
            offset: offset.toString(),
            index: filters.sort,
        });

        if (q) params.append('query', q);

        const res = await fetch(`https://api.modrinth.com/v2/search?${params.toString()}`);
        const data = await res.json();

        const plugins: UnifiedPlugin[] = data.hits.map((p: any) => ({
            id: p.project_id,
            title: p.title,
            description: p.description,
            author: p.author,
            downloads: p.downloads,
            icon_url: p.icon_url,
            categories: p.categories,
            date_modified: p.date_modified,
            platform: 'modrinth' as Platform,
        }));

        return { plugins, total: data.total_hits };
    };

    // ===== SpigotMC (Spiget) API =====
    const searchSpigot = async (q: string, offset: number): Promise<{ plugins: UnifiedPlugin[], total: number }> => {
        const pageNum = Math.floor(offset / 12) + 1;

        let url: string;
        if (q) {
            url = `https://api.spiget.org/v2/search/resources/${encodeURIComponent(q)}?field=name&size=12&page=${pageNum}&sort=-downloads`;
        } else {
            // Browse all resources sorted by downloads
            let sortParam = '-downloads';
            if (filters.sort === 'newest') sortParam = '-releaseDate';
            if (filters.sort === 'updated') sortParam = '-updateDate';

            url = `https://api.spiget.org/v2/resources?size=12&page=${pageNum}&sort=${sortParam}`;
            if (filters.category) {
                url = `https://api.spiget.org/v2/categories/${filters.category}/resources?size=12&page=${pageNum}&sort=${sortParam}`;
            }
        }

        const res = await fetch(url);
        const data = await res.json();

        // Spiget doesn't return total count in search, estimate high
        const plugins: UnifiedPlugin[] = (Array.isArray(data) ? data : []).map((p: any) => ({
            id: p.id.toString(),
            title: p.name,
            description: p.tag || '',
            author: p.author?.name || 'Unknown',
            downloads: p.downloads || 0,
            icon_url: p.icon?.url ? `https://www.spigotmc.org/${p.icon.url}` : '',
            categories: p.category ? [p.category.name || 'Plugin'] : ['Plugin'],
            date_modified: new Date(p.updateDate * 1000).toISOString(),
            platform: 'spigotmc' as Platform,
        }));

        return { plugins, total: 1000 }; // Spiget doesn't provide total
    };

    // ===== Unified Search =====
    const searchPlugins = useCallback(async (q: string, offset: number) => {
        setLoading(true);
        try {
            let result;
            if (platform === 'modrinth') {
                result = await searchModrinth(q, offset);
            } else {
                result = await searchSpigot(q, offset);
            }
            setPlugins(result.plugins);
            setTotalHits(result.total);
        } catch (e) {
            console.error(e);
            setPlugins([]);
        } finally {
            setLoading(false);
        }
    }, [platform, filters]);

    // Debounced Search
    const debouncedSearch = useCallback(debounce((q) => {
        setPage(0);
        searchPlugins(q, 0);
    }, 600), [searchPlugins]);

    useEffect(() => {
        debouncedSearch(query);
    }, [query, filters, platform]);

    useEffect(() => {
        if (page > 0) {
            searchPlugins(query, page * 12);
        }
    }, [page]);

    // Reset filters when platform changes
    useEffect(() => {
        setFilters({ category: '', loader: '', sort: 'relevance' });
        setQuery('');
        setPage(0);
    }, [platform]);

    // ===== Load Versions =====
    const loadVersions = async (plugin: UnifiedPlugin) => {
        setSelectedPlugin(plugin);
        setLoadingVersions(true);
        setVersionFilters({ gameVersion: '', loader: '', type: '' });

        try {
            if (plugin.platform === 'modrinth') {
                const res = await fetch(`https://api.modrinth.com/v2/project/${plugin.id}/version`);
                const data: ModrinthVersion[] = await res.json();
                setVersions(data);
                setAvailableGameVersions([...new Set(data.flatMap(v => v.game_versions))].sort().reverse());
                setAvailableLoaders([...new Set(data.flatMap(v => v.loaders))]);
            } else {
                // SpigotMC - get versions and create download link
                const res = await fetch(`https://api.spiget.org/v2/resources/${plugin.id}/versions?size=20&sort=-releaseDate`);
                const data: SpigotVersion[] = await res.json();

                const versions: UnifiedVersion[] = data.map((v, idx) => ({
                    id: v.id.toString(),
                    name: v.name || `Version ${v.id}`,
                    version_type: 'release',
                    date_published: new Date(v.releaseDate * 1000).toISOString(),
                    downloads: 0,
                    files: [{
                        url: `https://api.spiget.org/v2/resources/${plugin.id}/versions/${v.id}/download`,
                        filename: `${plugin.title.replace(/[^a-zA-Z0-9]/g, '_')}.jar`,
                        primary: true,
                        size: 0,
                    }],
                    game_versions: [],
                    loaders: ['spigot', 'paper', 'bukkit'],
                }));

                setVersions(versions);
                setAvailableGameVersions([]);
                setAvailableLoaders(['spigot', 'paper', 'bukkit']);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingVersions(false);
        }
    };

    const downloadVersion = async (version: UnifiedVersion, file: UnifiedVersion['files'][0], btn: HTMLButtonElement) => {
        if (!server) return;

        const originalText = btn.innerText;
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Downloading...`;
        btn.classList.add('opacity-75', 'cursor-not-allowed');

        try {
            await http.post(`/extensions/modrinthbrowser/download`, {
                downloadUrl: file.url,
                filename: file.filename,
                serverUuid: server.uuid
            });

            btn.innerHTML = `<i class="fas fa-check"></i> Success`;
            btn.classList.replace('bg-indigo-600', 'bg-green-600');
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.classList.replace('bg-green-600', 'bg-indigo-600');
                btn.classList.remove('opacity-75', 'cursor-not-allowed');
            }, 3000);
        } catch (e: any) {
            console.error(e);
            btn.innerHTML = `<i class="fas fa-exclamation-circle"></i> Error`;
            btn.classList.replace('bg-indigo-600', 'bg-red-600');
            alert('Failed to download: ' + (e.response?.data?.message || e.message));
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.classList.replace('bg-red-600', 'bg-indigo-600');
                btn.classList.remove('opacity-75', 'cursor-not-allowed');
            }, 3000);
        }
    };

    const filteredVersions = versions.filter(v => {
        if (versionFilters.gameVersion && !v.game_versions.includes(versionFilters.gameVersion)) return false;
        if (versionFilters.loader && !v.loaders.includes(versionFilters.loader)) return false;
        if (versionFilters.type && v.version_type !== versionFilters.type) return false;
        return true;
    });

    const currentCategories = platform === 'modrinth' ? modrinthCategories : spigotCategories;

    return (
        <div className="min-h-screen text-neutral-200 font-sans" style={{ background: '#0f1016' }}>
            <div className="max-w-7xl mx-auto p-4 md:p-8">
                {/* Header */}
                <GlassPanel className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <FontAwesomeIcon icon={faCube} className="text-2xl" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Plugin Browser</h1>
                            <p className="text-neutral-400 text-sm">
                                {platform === 'modrinth' ? 'Powered by Modrinth API' : 'Powered by Spiget API (SpigotMC)'}
                            </p>
                        </div>
                    </div>

                    {/* Platform Selector */}
                    <div className="flex gap-2">
                        <PlatformTab
                            active={platform === 'modrinth'}
                            color="rgb(30, 215, 96)"
                            onClick={() => setPlatform('modrinth')}
                        >
                            <svg viewBox="0 0 512 514" className="w-5 h-5" fill="currentColor">
                                <path d="M503.16 323.56C514.55 281.47 515.32 235.91 503.2 190.76C466.57 54.2299 326.04 -26.8001 189.33 9.77991C83.8101 38.0199 11.3899 128.07 0.689941 230.47H43.99C54.29 147.33 113.74 74.7298 199.75 51.7098C306.05 23.2598 415.13 80.6699 453.17 181.38L411.03 192.65C391.64 145.8 352.57 111.45 306.3 96.8198L298.56 140.66C335.09 154.13 364.72 184.5 375.56 224.91C391.36 283.8 361.94 344.14 308.56 369.17L320.09 412.16C390.25 383.21 432.4 310.3 422.43 235.14L464.41 223.91C468.91 252.62 467.35 281.16 460.55 308.07L503.16 323.56Z" />
                                <path d="M321.99 504.22C185.27 540.8 44.7501 459.77 8.11011 323.24C3.84011 307.31 1.17 291.33 0 275.46H43.27C44.36 287.37 46.4699 299.35 49.6799 311.29C53.0399 323.8 57.45 335.75 62.79 347.07L101.38 323.92C98.1299 316.42 95.39 308.6 93.21 300.47C69.17 210.87 122.41 118.77 212.13 94.7601C229.13 90.2101 246.23 88.4401 262.93 89.1501L255.19 133C244.73 133.05 234.11 134.42 223.53 137.25C157.31 154.98 118.01 222.95 135.75 289.09C136.85 293.16 138.13 297.13 139.59 300.99L188.94 271.38L174.07 231.95L220.67 184.36L279.72 171.55L293.49 215.73L237.05 234.2L252.13 274.67L311.09 249.12L360.74 273.53L324.74 296.71L281.83 279.14L227.18 296.96L209.68 350.02L252.62 366.63L277.5 331.34L322.68 349.12L371.83 321.51L382.05 363.1L329.57 389.95L291.99 408.36L258.45 362.82L214.59 345.23L175.45 369.62C196.85 391.39 224.33 407.96 256.16 416.58C326.12 435.32 396.69 400.61 432.71 338.05L472.07 358.34C430.12 437.82 340.08 483.93 249.56 483.93C239.21 483.93 228.9 483.02 218.69 481.08L210.68 524.92C298.68 539.56 398.73 487.67 452.72 401.62L493.94 426.79C470.56 466.72 438.88 499.28 398.74 522.12C377.1 534.34 353.83 543.46 329.24 548.99L321.99 504.22Z" />
                            </svg>
                            Modrinth
                        </PlatformTab>
                        <PlatformTab
                            active={false}
                            color="gray"
                            className="opacity-50 cursor-not-allowed"
                            onClick={(e) => e.preventDefault()}
                            style={{ background: 'rgba(128, 128, 128, 0.2)' }}
                        >
                            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                                <path d="M13.606 23.333c1.97-1.127 3.553-2.95 4.97-4.707 3.033-3.76 1.76-10.274-1.28-12.727-2.733-2.147-3.693-1.073-4.14-1.073-.447 0-1.407-1.074-4.14 1.073-3.04 2.453-4.314 8.967-1.28 12.727 1.413 1.76 3 3.6 4.97 4.707.24.126.66.126.9.006v-.006Zm-.553-15.68c.533.4 1.253.307 1.633.007.247-.194.254-.38.007-.58-.58-.46-1.547-.46-2.126 0-.247.2-.24.386.006.58.38.3 1.1.4 1.633-.007-.353-.273-.86-.273-1.213 0 .02-.02.046-.033.06-.033.012 0 .04.013.06.033-.147.113-.374.113-.52-.007v.007Zm1.166 4.633c1.78.687 2.067 2.767 1.227 4.887-.807 2.227-2.9 3.06-4.993 2.127-1.994-.88-2.614-3.567-1.254-5.467 1.247-1.873 3.327-2.193 5.02-1.547Zm-.447.887c-1.34-.693-3.06.08-3.666 1.587-.554 1.373.187 3.066 1.673 3.493 1.5.427 3.073-.787 3.353-2.313.294-1.587-1.28-2.767-1.36-2.767ZM12.006 2a1.2 1.2 0 0 1 1.2 1.2c0 .66-.54 1.2-1.2 1.2a1.2 1.2 0 0 1-1.2-1.2 1.2 1.2 0 0 1 1.2-1.2Zm0-2a3.2 3.2 0 0 1 3.2 3.2c0 1.767-1.433 3.2-3.2 3.2a3.2 3.2 0 0 1-3.2-3.2 3.2 3.2 0 0 1 3.2-3.2Z" />
                            </svg>
                            CurseForge
                        </PlatformTab>
                    </div>
                </GlassPanel>

                {/* Search Bar */}
                <GlassPanel>
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                            <input
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                className="w-full bg-neutral-800/50 border border-neutral-700 text-neutral-200 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 block pl-10 p-2.5 transition-all outline-none placeholder-neutral-500"
                                placeholder={platform === 'modrinth' ? 'Search Modrinth plugins...' : 'Search SpigotMC plugins...'}
                            />
                        </div>
                        <button onClick={() => setShowFilters(!showFilters)} className="px-4 py-2 bg-neutral-800/50 hover:bg-neutral-700/50 border border-neutral-700 text-neutral-300 rounded-xl transition-all flex items-center gap-2">
                            <FontAwesomeIcon icon={faSlidersH} /> <span className="hidden sm:inline">Filter</span>
                        </button>
                    </div>
                </GlassPanel>

                {/* Filters */}
                {showFilters && (
                    <GlassPanel className="animate-fade-in-down">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block mb-2 text-sm font-medium text-neutral-300">Category</label>
                                <CustomSelect value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}>
                                    <option value="">All Categories</option>
                                    {currentCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </CustomSelect>
                            </div>
                            {platform === 'modrinth' && (
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-neutral-300">Loader</label>
                                    <CustomSelect value={filters.loader} onChange={e => setFilters({ ...filters, loader: e.target.value })}>
                                        <option value="">All Loaders</option>
                                        {loadersList.map(l => <option key={l} value={l}>{l}</option>)}
                                    </CustomSelect>
                                </div>
                            )}
                            <div>
                                <label className="block mb-2 text-sm font-medium text-neutral-300">Sort By</label>
                                <CustomSelect value={filters.sort} onChange={e => setFilters({ ...filters, sort: e.target.value })}>
                                    <option value="relevance">Relevance</option>
                                    <option value="downloads">Downloads</option>
                                    {platform === 'modrinth' && <option value="follows">Popularity</option>}
                                    <option value="newest">Newest</option>
                                    <option value="updated">Updated</option>
                                </CustomSelect>
                            </div>
                        </div>
                    </GlassPanel>
                )}

                {/* Loading / Results */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        <div className="mb-4 text-neutral-400 text-sm">
                            Showing {plugins.length} of {totalHits} results
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                            {plugins.map(plugin => (
                                <GlassCard key={`${plugin.platform}-${plugin.id}`} onClick={() => loadVersions(plugin)}>
                                    <div className="flex gap-4 mb-4">
                                        <img
                                            src={plugin.icon_url || 'https://via.placeholder.com/64'}
                                            alt={plugin.title}
                                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64'; }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-bold text-white mb-1 truncate">{plugin.title}</h3>
                                            <p className="text-neutral-400 text-xs truncate">{plugin.author}</p>
                                        </div>
                                    </div>
                                    <p className="text-neutral-300 text-sm mb-4 line-clamp-2 h-10 overflow-hidden">{plugin.description}</p>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {plugin.categories.slice(0, 3).map(cat => (
                                            <TagBadge key={cat}>{cat}</TagBadge>
                                        ))}
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-neutral-400 border-t border-neutral-700/50 pt-4">
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center gap-1"><FontAwesomeIcon icon={faDownload} /> {(plugin.downloads / 1000).toFixed(1)}k</span>
                                        </div>
                                        <span className="flex items-center gap-1"><FontAwesomeIcon icon={faClock} /> {new Date(plugin.date_modified).toLocaleDateString()}</span>
                                    </div>
                                </GlassCard>
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="flex justify-center gap-2">
                            <button disabled={page === 0} onClick={() => setPage(page - 1)} className="px-4 py-2 bg-neutral-800 text-neutral-300 rounded-lg disabled:opacity-50">Prev</button>
                            <span className="px-4 py-2 text-neutral-400">Page {page + 1}</span>
                            <button disabled={(page + 1) * 12 >= totalHits} onClick={() => setPage(page + 1)} className="px-4 py-2 bg-neutral-800 text-neutral-300 rounded-lg disabled:opacity-50">Next</button>
                        </div>
                    </>
                )}

                {/* Version Modal */}
                {selectedPlugin && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
                        <GlassPanel className="max-w-4xl w-full max-h-[85vh] flex flex-col !mb-0 !p-0 overflow-hidden">
                            <div className="p-6 border-b border-neutral-700/50 flex justify-between items-center bg-neutral-900/50">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{selectedPlugin.title}</h2>
                                    <p className="text-neutral-400 text-sm">
                                        {selectedPlugin.platform === 'modrinth' ? 'Modrinth' : 'SpigotMC'} • Select a version to download
                                    </p>
                                </div>
                                <button onClick={() => setSelectedPlugin(null)} className="w-10 h-10 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center">
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>

                            {selectedPlugin.platform === 'modrinth' && (
                                <div className="p-6 space-y-4 bg-neutral-900/30">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-neutral-300">Game Version</label>
                                            <CustomSelect value={versionFilters.gameVersion} onChange={e => setVersionFilters({ ...versionFilters, gameVersion: e.target.value })}>
                                                <option value="">All Versions</option>
                                                {availableGameVersions.map(v => <option key={v} value={v}>{v}</option>)}
                                            </CustomSelect>
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-neutral-300">Loader</label>
                                            <CustomSelect value={versionFilters.loader} onChange={e => setVersionFilters({ ...versionFilters, loader: e.target.value })}>
                                                <option value="">All Loaders</option>
                                                {availableLoaders.map(v => <option key={v} value={v}>{v}</option>)}
                                            </CustomSelect>
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-neutral-300">Type</label>
                                            <CustomSelect value={versionFilters.type} onChange={e => setVersionFilters({ ...versionFilters, type: e.target.value })}>
                                                <option value="">All Types</option>
                                                <option value="release">Release</option>
                                                <option value="beta">Beta</option>
                                                <option value="alpha">Alpha</option>
                                            </CustomSelect>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-neutral-900/30">
                                {loadingVersions ? (
                                    <div className="text-center py-8"><FontAwesomeIcon icon={faSpinner} spin className="text-3xl text-indigo-500" /></div>
                                ) : filteredVersions.length === 0 ? (
                                    <p className="text-center text-neutral-400">No versions found matching filters.</p>
                                ) : (
                                    filteredVersions.map(v => {
                                        const file = v.files.find(f => f.primary) || v.files[0];
                                        if (!file) return null;
                                        return (
                                            <div key={v.id} className="bg-neutral-800/40 rounded-lg p-4 flex items-center justify-between gap-4 border border-white/5">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-semibold text-neutral-200">{v.name}</span>
                                                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${v.version_type === 'release' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>{v.version_type}</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-3 text-xs text-neutral-400">
                                                        <span className="flex items-center gap-1"><FontAwesomeIcon icon={faClock} /> {new Date(v.date_published).toLocaleDateString()}</span>
                                                        {v.downloads > 0 && <span className="flex items-center gap-1"><FontAwesomeIcon icon={faCloudDownloadAlt} /> {v.downloads}</span>}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => downloadVersion(v, file, e.currentTarget)}
                                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap"
                                                >
                                                    <FontAwesomeIcon icon={faDownload} /> Download
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </GlassPanel>
                    </div>
                )}
            </div>
        </div>
    );
};
