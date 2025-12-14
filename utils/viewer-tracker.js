import { log, now } from './helpers.js';
import { saveStories, saveViewerPositions, addLog } from './storage.js';
import { 
    playSound, 
    showFirstViewNotification, 
    showRepeatViewNotification,
    notifyPopup 
} from './notifications.js';

export function processViewers(viewers, storyId, storyUrl, thumbnailUrl, stories, watchlist, lastPositions, settings) {
    const watchlistLower = watchlist.map(u => u.toLowerCase());
    const timestamp = now();
    
    // Bu hikaye için önceki pozisyonlar
    const previousPositions = lastPositions[storyId] || {};
    const currentPositions = {};
    
    // Hikaye yoksa oluştur
    if (!stories[storyId]) {
        stories[storyId] = {
            storyId,
            storyUrl,
            thumbnailUrl: thumbnailUrl || '',
            createdAt: timestamp,
            viewers: {},
            totalViewers: 0
        };
    }
    
    const story = stories[storyId];
    
    // Thumbnail güncelle
    if (thumbnailUrl) {
        story.thumbnailUrl = thumbnailUrl;
    }
    
    let firstViewCount = 0;
    let repeatViewCount = 0;
    let newViewersCount = 0;
    
    log(`Pozisyon karşılaştırma başlıyor. Önceki pozisyon sayısı: ${Object.keys(previousPositions).length}`, 'info');
    
    // HER görüntüleyiciyi kaydet
    viewers.forEach(viewer => {
        const username = viewer.username.toLowerCase();
        const displayName = viewer.username;
        currentPositions[username] = viewer.position;
        
        const prevPosition = previousPositions[username];
        const currentPosition = viewer.position;
        const isInWatchlist = watchlistLower.includes(username);
        
        // İlk 5 kullanıcı için debug log
        if (viewer.position < 5) {
            log(`Debug [${displayName}]: Şuanki=${currentPosition}, Önceki=${prevPosition}, Fark=${prevPosition !== undefined ? prevPosition - currentPosition : 'yok'}`, 'info');
        }
        
        // Bu hikayeyi daha önce görmüş mü?
        if (story.viewers[username]) {
            // Mevcut görüntüleyiciyi güncelle
            const existing = story.viewers[username];
            
            // TEKRAR GÖRÜNTÜLEME KONTROLÜ
            // Pozisyon yukarı gittiyse (daha küçük numara) = tekrar baktı
            if (prevPosition !== undefined && currentPosition < prevPosition) {
                existing.viewCount++;
                existing.lastSeen = timestamp;
                existing.positionHistory.push({
                    position: currentPosition,
                    time: timestamp
                });
                
                log(`🔄 TEKRAR GÖRÜNTÜLEME: ${displayName} (${prevPosition} → ${currentPosition}) viewCount: ${existing.viewCount}`, 'info');
                
                // Profil resmi güncelle
                if (viewer.profilePicUrl) {
                    existing.profilePicUrl = viewer.profilePicUrl;
                }
                
                // Watchlist'teyse bildirim gönder
                if (isInWatchlist) {
                    handleRepeatViewNotification(displayName, storyUrl, settings);
                    repeatViewCount++;
                }
            }
            
            // Pozisyon değişse de güncelle
            existing.position = currentPosition;
            if (viewer.profilePicUrl) {
                existing.profilePicUrl = viewer.profilePicUrl;
            }
            
        } else {
            // YENİ görüntüleyici - kaydet
            story.viewers[username] = {
                username: displayName,
                profilePicUrl: viewer.profilePicUrl || '',
                position: currentPosition,
                firstSeen: timestamp,
                lastSeen: timestamp,
                viewCount: 1,
                positionHistory: [{
                    position: currentPosition,
                    time: timestamp
                }]
            };
            story.totalViewers++;
            newViewersCount++;
            
            // Watchlist'teyse bildirim gönder
            if (isInWatchlist) {
                handleFirstViewNotification(displayName, storyUrl, settings);
                firstViewCount++;
            }
        }
    });
    
    // Pozisyonları güncelle
    lastPositions[storyId] = currentPositions;
    
    log(`İşlem: ${newViewersCount} yeni, ${firstViewCount} watchlist ilk, ${repeatViewCount} tekrar görüntüleme`, 'info');
    
    return {
        stories,
        positions: lastPositions,
        stats: {
            newViewers: newViewersCount,
            firstViews: firstViewCount,
            repeatViews: repeatViewCount,
            totalViewers: Object.keys(story.viewers).length
        }
    };
}

function handleFirstViewNotification(username, storyUrl, settings) {
    log(`🆕 İlk görüntüleme: @${username}`, 'first');
    
    // Ses çal
    if (settings.soundEnabled) {
        playSound();
    }
    
    // Masaüstü bildirimi
    if (settings.notifyFirstView && settings.desktopNotification) {
        showFirstViewNotification(username, storyUrl);
    }
    
    // Popup'a bildir
    notifyPopup('FIRST_VIEW', { username, storyUrl });
    
    // Log kaydet
    addLog(`@${username} hikayenizi ilk kez görüntüledi`, 'first');
}

function handleRepeatViewNotification(username, storyUrl, settings) {
    log(`🔄 Tekrar görüntüleme: @${username}`, 'repeat');
    
    // Ses çal
    if (settings.soundEnabled) {
        playSound('repeat');
    }
    
    // Masaüstü bildirimi
    if (settings.notifyRepeatView && settings.desktopNotification) {
        showRepeatViewNotification(username, storyUrl);
    }
    
    // Popup'a bildir
    notifyPopup('REPEAT_VIEW', { username, storyUrl });
    
    // Log kaydet
    addLog(`@${username} hikayenizi tekrar görüntüledi!`, 'repeat');
}

export function getStoriesStats(stories) {
    const storyList = Object.values(stories);
    
    return {
        totalStories: storyList.length,
        totalViewers: storyList.reduce((sum, s) => sum + (s.totalViewers || 0), 0),
        recentStories: storyList
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10)
    };
}

export function getUserViewHistory(stories, username) {
    const usernameLower = username.toLowerCase();
    const history = [];
    
    for (const storyId in stories) {
        const story = stories[storyId];
        const viewer = story.viewers[usernameLower];
        
        if (viewer) {
            history.push({
                storyId,
                storyUrl: story.storyUrl,
                thumbnailUrl: story.thumbnailUrl,
                viewCount: viewer.viewCount,
                firstSeen: viewer.firstSeen,
                lastSeen: viewer.lastSeen,
                positionHistory: viewer.positionHistory
            });
        }
    }
    
    return history.sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));
}
