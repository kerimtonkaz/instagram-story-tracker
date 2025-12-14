import { log } from '../utils/helpers.js';
import { 
    loadSettings, 
    saveSettings,
    loadWatchlist, 
    saveWatchlist,
    loadStories,
    saveStories,
    loadState,
    saveState,
    loadViewerPositions,
    saveViewerPositions,
    addLog,
    cleanupExpiredStories
} from '../utils/storage.js';
import { 
    playSound,
    notifyPopup,
    setupNotificationClickHandler 
} from '../utils/notifications.js';
import { processViewers } from '../utils/viewer-tracker.js';
import { 
    startCheckAlarm, 
    stopCheckAlarm, 
    startCleanupAlarm
} from '../utils/alarms.js';
import { 
    openStoryPage, 
    injectViewerExtractor 
} from '../utils/instagram.js';

let appState = {
    settings: {},
    watchlist: [],
    stories: {},
    positions: {},
    isTracking: false
};

chrome.alarms.onAlarm.addListener(async (alarm) => {
    log(`Alarm tetiklendi: ${alarm.name}`, 'info');
    
    if (alarm.name === 'storyCheck') {
        await ensureInitialized();
        await checkStoryViewers();
    } else if (alarm.name === 'cleanup') {
        await performCleanup();
    }
});

let isInitialized = false;

async function ensureInitialized() {
    if (!isInitialized) {
        await initialize();
    }
}

chrome.runtime.onInstalled.addListener(async () => {
    log('Instagram Hikaye Takipçisi kuruldu!', 'success');
    await initialize();
});

chrome.runtime.onStartup.addListener(async () => {
    log('Extension başlatıldı', 'info');
    await initialize();
});

async function initialize() {
    if (isInitialized) return;
    
    appState.settings = await loadSettings();
    appState.watchlist = await loadWatchlist();
    appState.stories = await loadStories();
    appState.positions = await loadViewerPositions();
    
    const state = await loadState();
    appState.isTracking = state.isTracking;
    
    setupNotificationClickHandler(appState.settings.username);
    
    startCleanupAlarm();
    
    if (appState.isTracking) {
        startCheckAlarm(appState.settings.checkInterval);
        log('Takip devam ediyor...', 'info');
    }
    
    isInitialized = true;
    log('Background başlatıldı', 'success');
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message, sender).then(response => {
        sendResponse(response);
    });
    return true; // Async response için
});

async function handleMessage(message, sender = null) {
    switch (message.type) {
        case 'UPDATE_SETTINGS':
            return await handleUpdateSettings(message.settings);
            
        case 'UPDATE_WATCHLIST':
            return await handleUpdateWatchlist(message.watchlist);
            
        case 'START_TRACKING':
            return await handleStartTracking(message.settings);
            
        case 'STOP_TRACKING':
            return await handleStopTracking();
            
        case 'MANUAL_CHECK':
            return await handleManualCheck(message.settings);
            
        case 'TEST_SOUND':
            playSound();
            return { success: true };
            
        case 'VIEWER_LIST':
            return await handleViewerList(message, sender);
        
        case 'GET_ALARM_STATUS':
            const alarm = await chrome.alarms.get('storyCheck');
            return { 
                success: true, 
                alarm: alarm ? {
                    name: alarm.name,
                    scheduledTime: alarm.scheduledTime,
                    periodInMinutes: alarm.periodInMinutes
                } : null,
                isTracking: appState.isTracking,
                isInitialized: isInitialized
            };
            
        default:
            log(`Bilinmeyen mesaj tipi: ${message.type}`, 'warning');
            return { success: false };
    }
}

async function handleUpdateSettings(newSettings) {
    // Language'ı korumak için mevcut language değerini al
    const currentLang = await chrome.storage.local.get('language');
    
    appState.settings = { ...appState.settings, ...newSettings };
    
    // Language popup tarafından yönetiliyor, background değiştirmesin
    // Sadece belirtilen ayarları kaydet, language'a dokunma
    const settingsToSave = {
        username: appState.settings.username,
        checkInterval: appState.settings.checkInterval,
        notifyFirstView: appState.settings.notifyFirstView,
        notifyRepeatView: appState.settings.notifyRepeatView,
        soundEnabled: appState.settings.soundEnabled,
        desktopNotification: appState.settings.desktopNotification,
        theme: appState.settings.theme
        // language burada YOK - popup yönetiyor
    };
    
    await chrome.storage.local.set(settingsToSave);
    
    // Takip aktifse alarm aralığını güncelle
    if (appState.isTracking) {
        startCheckAlarm(appState.settings.checkInterval);
    }
    
    log('Ayarlar güncellendi', 'success');
    return { success: true };
}

async function handleUpdateWatchlist(newWatchlist) {
    // Artık array olarak geliyor
    appState.watchlist = Array.isArray(newWatchlist) ? newWatchlist : [];
    await saveWatchlist(appState.watchlist);
    
    log('Bildirim listesi güncellendi', 'success');
    return { success: true };
}

async function handleStartTracking(settings) {
    if (settings) {
        appState.settings = { ...appState.settings, ...settings };
        if (settings.watchlist) {
            appState.watchlist = Array.isArray(settings.watchlist) ? settings.watchlist : [];
        }
    }
    
    appState.isTracking = true;
    const lastCheck = Date.now();
    await saveState({ isTracking: true, lastCheck });
    
    startCheckAlarm(appState.settings.checkInterval);
    
    await checkStoryViewers();
    
    log('Takip başlatıldı!', 'success');
    await addLog('Hikaye takibi başlatıldı', 'info');
    
    return { success: true, lastCheck };
}

async function handleStopTracking() {
    appState.isTracking = false;
    await saveState({ isTracking: false });
    
    // Alarmı durdur
    stopCheckAlarm();
    
    log('Takip durduruldu', 'info');
    await addLog('Hikaye takibi durduruldu', 'info');
    
    return { success: true };
}

async function handleManualCheck(settings) {
    try {
        // Geçici olarak ayarları güncelle
        if (settings) {
            appState.settings = { ...appState.settings, ...settings };
            if (settings.watchlist) {
                appState.watchlist = Array.isArray(settings.watchlist) ? settings.watchlist : [];
            }
        }
        
        log('Manuel kontrol başlatılıyor...', 'info');
        
        // Hikaye kontrolünü yap
        await checkStoryViewers();
        
        log('Manuel kontrol tamamlandı', 'success');
        await addLog('Manuel hikaye kontrolü yapıldı', 'info');
        
        return { success: true };
    } catch (error) {
        log(`Manuel kontrol hatası: ${error.message}`, 'error');
        return { success: false, error: error.message };
    }
}

async function handleViewerList(message, sender = null) {
    const { viewers, storyId, storyUrl, thumbnailUrl } = message;
    
    if (!storyId || !viewers) {
        log('Geçersiz görüntüleyici verisi', 'warning');
        return { success: false };
    }
    
    // Hikayeleri yükle
    appState.stories = await loadStories();
    appState.positions = await loadViewerPositions();
    
    // Görüntüleyici listesini işle (TÜM görüntüleyicileri kaydet)
    const result = processViewers(
        viewers,
        storyId,
        storyUrl,
        thumbnailUrl,
        appState.stories,
        appState.watchlist,
        appState.positions,
        appState.settings
    );
    
    // State'i güncelle
    appState.stories = result.stories;
    appState.positions = result.positions;
    
    // Storage'a kaydet
    await saveStories(appState.stories);
    await saveViewerPositions(appState.positions);
    
    const lastCheck = Date.now(); // Timestamp olarak kaydet
    await saveState({ lastCheck });
    
    // Popup'a bildir
    notifyPopup('CHECK_COMPLETE', {
        storyId,
        viewerCount: viewers.length,
        lastCheck: lastCheck,
        stats: result.stats
    });
    
    log(`Kontrol tamamlandı: ${viewers.length} görüntüleyici, ${result.stats.newViewers} yeni`, 'success');
    
    // Kontrol tamamlandı, sekmeyi kapat (ayarlara göre)
    if (sender?.tab?.id && appState.settings.autoCloseTab !== false) {
        try {
            // Biraz bekle ki kullanıcı sonucu görebilsin
            setTimeout(async () => {
                try {
                    await chrome.tabs.remove(sender.tab.id);
                    log('Hikaye sekmesi kapatıldı', 'info');
                } catch (e) {
                    // Sekme zaten kapatılmış olabilir
                }
            }, 1500);
        } catch (e) {
            log('Sekme kapatılamadı: ' + e.message, 'warning');
        }
    }
    
    return { success: true, stats: result.stats };
}

async function checkStoryViewers() {
    const username = appState.settings.username;
    
    if (!username) {
        log('Kullanıcı adı tanımlı değil', 'warning');
        notifyPopup('ERROR', { error: 'Lütfen kullanıcı adınızı girin' });
        return;
    }
    
    notifyPopup('CHECK_STARTED', { timestamp: Date.now() });
    
    try {
        const tab = await openStoryPage(username);
        
        await injectViewerExtractor(tab.id, appState.watchlist);
        
        log('Hikaye kontrolü başlatıldı', 'info');
        
    } catch (error) {
        log('Hikaye kontrol hatası: ' + error.message, 'error');
        notifyPopup('ERROR', { error: 'Hikaye kontrol edilemedi: ' + error.message });
    }
}

async function performCleanup() {
    await cleanupExpiredStories();
    log('Eski hikayeler temizlendi', 'info');
}
