import { log } from './helpers.js';

const DEFAULT_SETTINGS = {
    username: '',
    checkInterval: 5,
    notifyFirstView: true,
    notifyRepeatView: true,
    soundEnabled: true,
    desktopNotification: true,
    theme: 'light',
    language: 'tr'
};

const DEFAULT_STATE = {
    isTracking: false,
    lastCheck: null,
    stats: {
        totalChecks: 0,
        totalMatches: 0,
        totalReviews: 0
    }
};

export async function loadSettings() {
    try {
        const result = await chrome.storage.local.get([
            'username',
            'checkInterval',
            'notifyFirstView',
            'notifyRepeatView',
            'soundEnabled',
            'desktopNotification',
            'theme',
            'language'
        ]);
        
        return { ...DEFAULT_SETTINGS, ...result };
    } catch (error) {
        log('Ayarlar yüklenirken hata: ' + error.message, 'error');
        return DEFAULT_SETTINGS;
    }
}

export async function saveSettings(settings) {
    try {
        await chrome.storage.local.set(settings);
        log('Ayarlar kaydedildi', 'success');
    } catch (error) {
        log('Ayarlar kaydedilirken hata: ' + error.message, 'error');
    }
}

export async function loadWatchlist() {
    try {
        const result = await chrome.storage.local.get('watchlist');
        // Eski format (object) ise array'e çevir
        if (result.watchlist && typeof result.watchlist === 'object' && !Array.isArray(result.watchlist)) {
            return Object.keys(result.watchlist);
        }
        return result.watchlist || [];
    } catch (error) {
        log('Watchlist yüklenirken hata: ' + error.message, 'error');
        return [];
    }
}

export async function saveWatchlist(watchlist) {
    try {
        await chrome.storage.local.set({ watchlist });
    } catch (error) {
        log('Watchlist kaydedilirken hata: ' + error.message, 'error');
    }
}

export async function loadStories() {
    try {
        const result = await chrome.storage.local.get('stories');
        return result.stories || {};
    } catch (error) {
        log('Hikayeler yüklenirken hata: ' + error.message, 'error');
        return {};
    }
}

export async function saveStories(stories) {
    try {
        await chrome.storage.local.set({ stories });
    } catch (error) {
        log('Hikayeler kaydedilirken hata: ' + error.message, 'error');
    }
}

export async function updateStory(storyId, storyData) {
    try {
        const stories = await loadStories();
        stories[storyId] = {
            ...stories[storyId],
            ...storyData,
            updatedAt: new Date().toISOString()
        };
        await saveStories(stories);
        return stories[storyId];
    } catch (error) {
        log('Hikaye güncellenirken hata: ' + error.message, 'error');
        return null;
    }
}

export async function addViewerToStory(storyId, viewer) {
    try {
        const stories = await loadStories();
        
        if (!stories[storyId]) {
            stories[storyId] = {
                storyId,
                createdAt: new Date().toISOString(),
                viewers: {},
                totalViewers: 0
            };
        }
        
        const story = stories[storyId];
        const username = viewer.username.toLowerCase();
        const now = new Date().toISOString();
        
        if (story.viewers[username]) {
            // Mevcut görüntüleyiciyi güncelle
            const existing = story.viewers[username];
            existing.lastSeen = now;
            existing.position = viewer.position;
            existing.viewCount = (existing.viewCount || 1) + 1;
            existing.positionHistory.push({
                position: viewer.position,
                time: now
            });
        } else {
            // Yeni görüntüleyici
            story.viewers[username] = {
                username: viewer.username,
                position: viewer.position,
                firstSeen: now,
                lastSeen: now,
                viewCount: 1,
                positionHistory: [{
                    position: viewer.position,
                    time: now
                }]
            };
            story.totalViewers++;
        }
        
        await saveStories(stories);
        return story;
    } catch (error) {
        log('Görüntüleyici eklenirken hata: ' + error.message, 'error');
        return null;
    }
}

export async function loadState() {
    try {
        const result = await chrome.storage.local.get([
            'isTracking',
            'lastCheck',
            'stats'
        ]);
        
        return {
            isTracking: result.isTracking || false,
            lastCheck: result.lastCheck || null,
            stats: { ...DEFAULT_STATE.stats, ...result.stats }
        };
    } catch (error) {
        log('State yüklenirken hata: ' + error.message, 'error');
        return DEFAULT_STATE;
    }
}

export async function saveState(state) {
    try {
        await chrome.storage.local.set(state);
    } catch (error) {
        log('State kaydedilirken hata: ' + error.message, 'error');
    }
}

export async function loadViewerPositions() {
    try {
        const result = await chrome.storage.local.get('lastViewerPositions');
        return result.lastViewerPositions || {};
    } catch (error) {
        log('Pozisyonlar yüklenirken hata: ' + error.message, 'error');
        return {};
    }
}

export async function saveViewerPositions(positions) {
    try {
        await chrome.storage.local.set({ lastViewerPositions: positions });
    } catch (error) {
        log('Pozisyonlar kaydedilirken hata: ' + error.message, 'error');
    }
}

export async function loadLogs() {
    try {
        const result = await chrome.storage.local.get('logs');
        return result.logs || [];
    } catch (error) {
        return [];
    }
}

export async function addLog(message, type = 'info') {
    try {
        const logs = await loadLogs();
        logs.push({
            message,
            type,
            time: new Date().toLocaleString('tr-TR')
        });
        
        // Son 100 log'u tut
        const trimmedLogs = logs.slice(-100);
        await chrome.storage.local.set({ logs: trimmedLogs });
    } catch (error) {
        log('Log eklenirken hata: ' + error.message, 'error');
    }
}

export async function cleanupExpiredStories() {
    try {
        const stories = await loadStories();
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 saat
        
        let cleaned = 0;
        for (const storyId in stories) {
            const createdAt = new Date(stories[storyId].createdAt).getTime();
            if (now - createdAt > maxAge) {
                delete stories[storyId];
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            await saveStories(stories);
            log(`${cleaned} eski hikaye temizlendi`, 'info');
        }
    } catch (error) {
        log('Temizlik sırasında hata: ' + error.message, 'error');
    }
}

export async function clearAll() {
    try {
        await chrome.storage.local.clear();
        log('Tüm veriler temizlendi', 'success');
    } catch (error) {
        log('Veriler temizlenirken hata: ' + error.message, 'error');
    }
}
