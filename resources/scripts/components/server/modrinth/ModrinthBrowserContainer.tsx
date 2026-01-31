import React, { useEffect, useState, useCallback } from 'react';
import { ServerContext } from '@/state/server';
import http from '@/api/http';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faSlidersH, faDownload, faHeart, faClock, faHdd, faCloudDownloadAlt, faSpinner, faCheck, faExclamationCircle, faTimes, faCube } from '@fortawesome/free-solid-svg-icons';
import debounce from 'lodash-es/debounce';
import tw from 'twin.macro';
import styled from 'styled-components/macro';

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
        transform: tranneutralY(-4px);
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

const categoriesList = [
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

const loadersList = [
    'paper', 'purpur', 'spigot', 'bukkit', 'folia', 'velocity', 'waterfall', 'bungeecord'
];

interface Plugin {
    project_id: string;
    description: string;
    downloads: number;
    follows: number;
    icon_url: string;
    title: string;
    author: string;
    categories: string[];
    date_modified: string;
}

interface Version {
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
    const [query, setQuery] = useState('');
    const [filters, setFilters] = useState({ category: '', loader: '', sort: 'relevance' });
    const [plugins, setPlugins] = useState<Plugin[]>([]);
    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [totalHits, setTotalHits] = useState(0);
    const [page, setPage] = useState(0);

    // Modal State
    const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
    const [versions, setVersions] = useState<Version[]>([]);
    const [versionFilters, setVersionFilters] = useState({ gameVersion: '', loader: '', type: '' });
    const [loadingVersions, setLoadingVersions] = useState(false);

    // Derived state for version filtering
    const [availableGameVersions, setAvailableGameVersions] = useState<string[]>([]);
    const [availableLoaders, setAvailableLoaders] = useState<string[]>([]);

    const searchPlugins = useCallback(async (q: string, offset: number) => {
        setLoading(true);
        try {
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

            setPlugins(data.hits);
            setTotalHits(data.total_hits);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    // Debounced Search
    const debouncedSearch = useCallback(debounce((q) => {
        setPage(0);
        searchPlugins(q, 0);
    }, 600), [searchPlugins]);

    useEffect(() => {
        debouncedSearch(query);
    }, [query, filters]); // Trigger on query or filter change

    useEffect(() => {
        // Handle pagination
        if (page > 0) {
            searchPlugins(query, page * 12);
        }
    }, [page]);


    const loadVersions = async (plugin: Plugin) => {
        setSelectedPlugin(plugin);
        setLoadingVersions(true);
        setVersionFilters({ gameVersion: '', loader: '', type: '' });
        try {
            const res = await fetch(`https://api.modrinth.com/v2/project/${plugin.project_id}/version`);
            const data: Version[] = await res.json();
            setVersions(data);

            // Extract unique values for filters
            setAvailableGameVersions([...new Set(data.flatMap(v => v.game_versions))].sort().reverse());
            setAvailableLoaders([...new Set(data.flatMap(v => v.loaders))]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingVersions(false);
        }
    };

    const downloadVersion = async (version: Version, file: Version['files'][0], btn: HTMLButtonElement) => {
        if (!server) return;

        // Simple UI feedback
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
                            <p className="text-neutral-400 text-sm">Powered by Modrinth API</p>
                        </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -tranneutral-y-1/2 text-neutral-400" />
                            <input
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                className="w-full bg-neutral-800/50 border border-neutral-700 text-neutral-200 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 block pl-10 p-2.5 transition-all outline-none placeholder-neutral-500"
                                placeholder="Search plugins..."
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
                                    {categoriesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </CustomSelect>
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium text-neutral-300">Loader</label>
                                <CustomSelect value={filters.loader} onChange={e => setFilters({ ...filters, loader: e.target.value })}>
                                    <option value="">All Loaders</option>
                                    {loadersList.map(l => <option key={l} value={l}>{l}</option>)}
                                </CustomSelect>
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium text-neutral-300">Sort By</label>
                                <CustomSelect value={filters.sort} onChange={e => setFilters({ ...filters, sort: e.target.value })}>
                                    <option value="relevance">Relevance</option>
                                    <option value="downloads">Downloads</option>
                                    <option value="follows">Popularity</option>
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
                                <GlassCard key={plugin.project_id} onClick={() => loadVersions(plugin)}>
                                    <div className="flex gap-4 mb-4">
                                        <img src={plugin.icon_url || 'https://via.placeholder.com/64'} alt={plugin.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
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
                                            <span className="flex items-center gap-1"><FontAwesomeIcon icon={faHeart} /> {plugin.follows}</span>
                                        </div>
                                        <span className="flex items-center gap-1"><FontAwesomeIcon icon={faClock} /> {new Date(plugin.date_modified).toLocaleDateString()}</span>
                                    </div>
                                </GlassCard>
                            ))}
                        </div>

                        {/* Pagination Simple */}
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
                                <h2 className="text-2xl font-bold text-white">{selectedPlugin.title} Versions</h2>
                                <button onClick={() => setSelectedPlugin(null)} className="w-10 h-10 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center">
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>

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
                                                        <span className="flex items-center gap-1"><FontAwesomeIcon icon={faCloudDownloadAlt} /> {v.downloads}</span>
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
