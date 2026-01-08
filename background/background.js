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
import {
    loadAutoBlockTargets,
    saveAutoBlockTargets,
    PROFILE_STATUS
} from '../utils/auto-block.js';

let appState = {
    settings: {},
    watchlist: [],
    stories: {},
    positions: {},
    isTracking: false,
    // Auto-Block state
    autoBlockTargets: [],
    isAutoBlockActive: false
};

chrome.alarms.onAlarm.addListener(async (alarm) => {
    log(`Alarm tetiklendi: ${alarm.name}`, 'info');
    
    if (alarm.name === 'storyCheck') {
        await ensureInitialized();
        await checkStoryViewers();
    } else if (alarm.name === 'cleanup') {
        await performCleanup();
    }
    // autoBlockCheck artık setInterval ile yönetiliyor
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
    
    // Auto-Block state yükle
    appState.autoBlockTargets = await loadAutoBlockTargets();
    const autoBlockState = await chrome.storage.local.get('isAutoBlockActive');
    appState.isAutoBlockActive = autoBlockState.isAutoBlockActive || false;
    
    setupNotificationClickHandler(appState.settings.username);
    
    startCleanupAlarm();
    
    if (appState.isTracking) {
        startCheckAlarm(appState.settings.checkInterval);
        log('Takip devam ediyor...', 'info');
    }
    
    // Auto-Block aktifse başlat
    if (appState.isAutoBlockActive && appState.autoBlockTargets.length > 0) {
        startAutoBlockAlarm();
        log('Otomatik engelleme devam ediyor...', 'info');
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
        
        // Auto-Block handlers
        case 'UPDATE_AUTO_BLOCK_TARGETS':
            return await handleUpdateAutoBlockTargets(message.targets);
            
        case 'START_AUTO_BLOCK':
            return await handleStartAutoBlock(message.targets);
            
        case 'STOP_AUTO_BLOCK':
            return await handleStopAutoBlock();
            
        case 'AUTO_BLOCK_PROFILE_CHECK_RESULT':
            return await handleAutoBlockProfileCheckResult(message);
            
        case 'AUTO_BLOCK_EXECUTE_RESULT':
            return await handleAutoBlockExecuteResult(message);
            
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

// ============================================
// AUTO-BLOCK FUNCTIONS
// ============================================

let autoBlockIntervalId = null;

function startAutoBlockAlarm() {
    // Önceki interval'ı temizle
    if (autoBlockIntervalId) {
        clearInterval(autoBlockIntervalId);
    }
    
    // Her 2 saniyede kontrol et - her hedefin kendi zamanı var
    autoBlockIntervalId = setInterval(async () => {
        if (appState.isAutoBlockActive) {
            await checkAutoBlockTargets();
        }
    }, 2000); // Her 2 saniye kontrol
    
    log('Auto-block interval başlatıldı (2 saniye)', 'info');
}

function stopAutoBlockAlarm() {
    if (autoBlockIntervalId) {
        clearInterval(autoBlockIntervalId);
        autoBlockIntervalId = null;
    }
    chrome.alarms.clear('autoBlockCheck');
    log('Auto-block interval durduruldu', 'info');
}

async function handleUpdateAutoBlockTargets(targets) {
    appState.autoBlockTargets = targets || [];
    await saveAutoBlockTargets(appState.autoBlockTargets);
    
    // Aktifse interval'ı yeniden başlat (yeni interval değerleri için)
    if (appState.isAutoBlockActive) {
        startAutoBlockAlarm();
    }
    
    log('Auto-block hedefleri güncellendi', 'success');
    return { success: true };
}

async function handleStartAutoBlock(targets) {
    if (targets) {
        appState.autoBlockTargets = targets;
        await saveAutoBlockTargets(targets);
    }
    
    appState.isAutoBlockActive = true;
    await chrome.storage.local.set({ isAutoBlockActive: true });
    
    startAutoBlockAlarm();
    
    // İlk kontrolü hemen yap
    await checkAutoBlockTargets();
    
    log('Otomatik engelleme başlatıldı!', 'success');
    await addLog('Otomatik engelleme başlatıldı', 'info');
    
    return { success: true };
}

async function handleStopAutoBlock() {
    appState.isAutoBlockActive = false;
    await chrome.storage.local.set({ isAutoBlockActive: false });
    
    stopAutoBlockAlarm();
    
    log('Otomatik engelleme durduruldu', 'info');
    await addLog('Otomatik engelleme durduruldu', 'info');
    
    return { success: true };
}

async function checkAutoBlockTargets() {
    if (!appState.isAutoBlockActive) return;
    
    const now = Date.now();
    
    // CHECKING durumunda takılı kalan hedefleri kurtarma (30 saniyeden fazla checking'de kalanlar)
    for (const target of appState.autoBlockTargets) {
        if (target.status === PROFILE_STATUS.CHECKING && target.checkStartTime) {
            const checkingDuration = now - target.checkStartTime;
            if (checkingDuration > 30000) { // 30 saniyeden fazla checking'de
                log(`@${target.username} kontrolü takıldı, sıfırlanıyor...`, 'warning');
                target.status = PROFILE_STATUS.NOT_FOUND;
                target.lastCheck = now;
                delete target.checkStartTime;
                await saveAutoBlockTargets(appState.autoBlockTargets);
                notifyPopup('AUTO_BLOCK_STATUS_UPDATE', {
                    username: target.username,
                    status: target.status,
                    lastCheck: target.lastCheck
                });
            }
        }
    }
    
    // Sadece aktif (engellenmemiş ve şu anda kontrol edilmeyen) hedefleri kontrol et
    const activeTargets = appState.autoBlockTargets.filter(t => 
        t.status !== PROFILE_STATUS.BLOCKED && 
        t.status !== PROFILE_STATUS.CHECKING
    );
    
    // Tüm hedefler engellenmişse otomatik engellemeyi durdur
    const nonBlockedTargets = appState.autoBlockTargets.filter(t => t.status !== PROFILE_STATUS.BLOCKED);
    if (nonBlockedTargets.length === 0 && appState.autoBlockTargets.length > 0) {
        log('Tüm hedefler engellendi, otomatik engelleme durduruluyor...', 'success');
        await handleStopAutoBlock();
        return;
    }
    
    // Kontrol zamanı gelen hedefleri bul
    const targetsToCheck = [];
    for (const target of activeTargets) {
        if (target.lastCheck) {
            const timeSinceLastCheck = now - target.lastCheck;
            if (timeSinceLastCheck >= (target.checkInterval * 1000)) {
                targetsToCheck.push(target);
            }
        } else {
            // İlk kontrol
            targetsToCheck.push(target);
        }
    }
    
    // Sıralı kontrol yap (bir seferde bir hedef)
    for (const target of targetsToCheck) {
        try {
            await checkProfileAndBlock(target);
        } catch (err) {
            log(`Kontrol hatası @${target.username}: ${err.message}`, 'error');
        }
    }
}

async function checkProfileAndBlock(target) {
    log(`Profil kontrol ediliyor: @${target.username}`, 'info');
    
    // Kontrol başlangıç zamanını kaydet (timeout için)
    const checkStartTime = Date.now();
    target.checkStartTime = checkStartTime;
    
    // Status güncelle - checking (lastCheck henüz güncellenmez)
    target.status = PROFILE_STATUS.CHECKING;
    target.checkCount = (target.checkCount || 0) + 1;
    await saveAutoBlockTargets(appState.autoBlockTargets);
    
    // Popup'a bildir
    notifyPopup('AUTO_BLOCK_STATUS_UPDATE', {
        username: target.username,
        status: PROFILE_STATUS.CHECKING
    });
    
    try {
        // Profil sayfasını aç
        const profileUrl = `https://www.instagram.com/${target.username}/`;
        
        const tab = await chrome.tabs.create({ 
            url: profileUrl, 
            active: false 
        });
        
        // Sayfa yüklenmesini bekle
        await new Promise(resolve => {
            const listener = (tabId, changeInfo) => {
                if (tabId === tab.id && changeInfo.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    resolve();
                }
            };
            chrome.tabs.onUpdated.addListener(listener);
            
            // Timeout ekle
            setTimeout(() => {
                chrome.tabs.onUpdated.removeListener(listener);
                resolve();
            }, 10000);
        });
        
        // Ekstra bekleme
        await new Promise(r => setTimeout(r, 3000));
        
        // Content script'i inject et (manifest'teki otomatik yükleme bazen gecikebilir)
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content/auto-block-content.js']
            });
        } catch (e) {
            log(`Content script zaten yüklü veya inject hatası: ${e.message}`, 'info');
        }
        
        // Biraz bekle
        await new Promise(r => setTimeout(r, 500));
        
        // Profil durumunu kontrol et (doğrudan script çalıştır)
        let profileCheckResult;
        try {
            const [{ result }] = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    const pageText = document.body.innerText;
                    
                    // Not found göstergeleri
                    const notFoundIndicators = [
                        'Profile mevcut değil',
                        'Sorry, this page isn\'t available',
                        'Bağlantı bozuk olabilir',
                        'The link you followed may be broken',
                        'Bu sayfa mevcut değil'
                    ];
                    
                    for (const indicator of notFoundIndicators) {
                        if (pageText.includes(indicator)) {
                            return { profileAvailable: false, reason: 'not_found' };
                        }
                    }
                    
                    // Profil mevcut göstergeleri
                    const availableIndicators = ['gönderi', 'takipçi', 'takip', 'posts', 'followers', 'following'];
                    let count = 0;
                    for (const indicator of availableIndicators) {
                        if (pageText.includes(indicator)) count++;
                    }
                    
                    return { profileAvailable: count >= 2, reason: count >= 2 ? 'available' : 'unknown' };
                }
            });
            profileCheckResult = result;
        } catch (scriptError) {
            log(`Script çalıştırma hatası: ${scriptError.message}`, 'error');
            profileCheckResult = { profileAvailable: false, reason: 'error' };
        }
        
        log(`@${target.username} profil kontrol sonucu: ${JSON.stringify(profileCheckResult)}`, 'info');
        
        if (profileCheckResult && profileCheckResult.profileAvailable) {
            // Profil mevcut! Engelleme işlemini başlat
            log(`@${target.username} profili açık! Engelleme başlatılıyor...`, 'success');
            
            target.status = PROFILE_STATUS.AVAILABLE;
            
            // Engelleme işlemini dene
            try {
                const blockResult = await chrome.tabs.sendMessage(tab.id, {
                    type: 'EXECUTE_BLOCK',
                    username: target.username
                });
                
                if (blockResult && blockResult.success) {
                    target.status = PROFILE_STATUS.BLOCKED;
                    
                    notifyPopup('AUTO_BLOCK_SUCCESS', {
                        username: target.username
                    });
                    
                    // Masaüstü bildirimi gönder
                    chrome.notifications.create({
                        type: 'basic',
                        iconUrl: '/assets/icons/icon128.png',
                        title: '🚫 Otomatik Engelleme',
                        message: `@${target.username} başarıyla engellendi!`
                    });
                    
                    // Log kaydı ekle
                    await addLog(`@${target.username} otomatik olarak engellendi`, 'success');
                    
                    log(`@${target.username} başarıyla engellendi!`, 'success');
                } else {
                    log(`Engelleme başarısız: ${blockResult?.error || 'Bilinmeyen hata'}`, 'error');
                    target.status = PROFILE_STATUS.AVAILABLE; // Tekrar denenecek
                }
            } catch (blockError) {
                log(`Engelleme hatası: ${blockError.message}`, 'error');
                target.status = PROFILE_STATUS.AVAILABLE; // Tekrar denenecek
            }
        } else {
            // Profil hala mevcut değil
            target.status = PROFILE_STATUS.NOT_FOUND;
            log(`@${target.username} profili hala mevcut değil`, 'info');
        }
        
        // Tab'ı kapat ve lastCheck'i güncelle
        target.lastCheck = Date.now(); // Kontrol tamamlandı, geri sayımı sıfırla
        delete target.checkStartTime; // Timeout tracker'ı temizle
        
        // Status'u not_found'a geri çevir (eğer hala checking ise)
        if (target.status === PROFILE_STATUS.CHECKING) {
            target.status = PROFILE_STATUS.NOT_FOUND;
        }
        
        await saveAutoBlockTargets(appState.autoBlockTargets);
        
        // Popup'a kontrol tamamlandı bildirimi
        notifyPopup('AUTO_BLOCK_STATUS_UPDATE', {
            username: target.username,
            status: target.status,
            lastCheck: target.lastCheck
        });
        
        setTimeout(async () => {
            try {
                await chrome.tabs.remove(tab.id);
            } catch (e) {
                // Tab zaten kapatılmış olabilir
            }
        }, 2000);
        
    } catch (error) {
        log(`@${target.username} kontrol hatası: ${error.message}`, 'error');
        
        target.status = PROFILE_STATUS.ERROR;
        target.lastError = error.message;
        target.lastCheck = Date.now(); // Hata durumunda da geri sayımı sıfırla
        delete target.checkStartTime; // Timeout tracker'ı temizle
        await saveAutoBlockTargets(appState.autoBlockTargets);
        
        // Popup'a hata bildirimi
        notifyPopup('AUTO_BLOCK_STATUS_UPDATE', {
            username: target.username,
            status: PROFILE_STATUS.ERROR,
            error: error.message,
            lastCheck: target.lastCheck
        });
    }
}

async function handleAutoBlockProfileCheckResult(message) {
    const { username, profileAvailable } = message;
    
    const target = appState.autoBlockTargets.find(t => t.username === username);
    if (!target) return { success: false };
    
    if (profileAvailable) {
        target.status = PROFILE_STATUS.AVAILABLE;
    } else {
        target.status = PROFILE_STATUS.NOT_FOUND;
    }
    
    target.lastCheck = Date.now();
    await saveAutoBlockTargets(appState.autoBlockTargets);
    
    notifyPopup('AUTO_BLOCK_STATUS_UPDATE', {
        username,
        status: target.status
    });
    
    return { success: true, shouldBlock: profileAvailable };
}

async function handleAutoBlockExecuteResult(message) {
    const { username, success, error } = message;
    
    const target = appState.autoBlockTargets.find(t => t.username === username);
    if (!target) return { success: false };
    
    if (success) {
        target.status = PROFILE_STATUS.BLOCKED;
        notifyPopup('AUTO_BLOCK_SUCCESS', { username });
        
        chrome.notifications.create({
            type: 'basic',
            iconUrl: '/assets/icons/icon128.png',
            title: '🚫 Otomatik Engelleme',
            message: `@${username} başarıyla engellendi!`
        });
    } else {
        target.status = PROFILE_STATUS.ERROR;
        target.lastError = error;
        notifyPopup('AUTO_BLOCK_FAILED', { username, error });
    }
    
    await saveAutoBlockTargets(appState.autoBlockTargets);
    
    return { success: true };
}
