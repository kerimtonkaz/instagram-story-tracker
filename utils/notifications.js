import { log } from './helpers.js';

export function playSound() {
    // Önce offscreen document dene (MV3 uyumlu)
    try {
        chrome.offscreen?.createDocument?.({
            url: 'offscreen.html',
            reasons: ['AUDIO_PLAYBACK'],
            justification: 'Playing notification sound'
        }).then(() => {
            // Offscreen document'a ses çalma mesajı gönder
            chrome.runtime.sendMessage({ type: 'PLAY_SOUND' });
        }).catch(() => {
            // Zaten var, direkt mesaj gönder
            chrome.runtime.sendMessage({ type: 'PLAY_SOUND' });
        });
    } catch (e) {
        // Offscreen desteklenmiyor, alternatif yöntem
    }
    
    // Alternatif: Instagram sekmesinde çal (chrome:// sayfalarında çalışmaz)
    chrome.tabs.query({ url: 'https://www.instagram.com/*' }, (tabs) => {
        if (tabs[0]) {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: (soundUrl) => {
                    const audio = new Audio(soundUrl);
                    audio.volume = 0.5;
                    audio.play().catch(e => console.log('Ses çalma hatası:', e));
                },
                args: [chrome.runtime.getURL('assets/sounds/notification.mp3')]
            }).catch(e => {
                // Instagram sekmesi yoksa veya erişilemezse sessiz devam et
            });
        }
    });
}

export function showFirstViewNotification(username) {
    chrome.notifications.create(`first_${Date.now()}`, {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('assets/icons/icon128.png'),
        title: '🆕 Hikayenizi Gördü!',
        message: `@${username} hikayenizi ilk kez görüntüledi!`,
        priority: 2,
        requireInteraction: true
    });
    
    log(`İlk görüntüleme bildirimi: @${username}`, 'first');
}

export function showRepeatViewNotification(username, viewCount) {
    chrome.notifications.create(`repeat_${Date.now()}`, {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('assets/icons/icon128.png'),
        title: '🔄 Tekrar Baktı!',
        message: `@${username} hikayenize tekrar baktı! (${viewCount}. kez)`,
        priority: 2,
        requireInteraction: true
    });
    
    log(`Tekrar görüntüleme bildirimi: @${username} (${viewCount}x)`, 'repeat');
}

export function showNotification(title, message) {
    chrome.notifications.create(`general_${Date.now()}`, {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('assets/icons/icon128.png'),
        title: title,
        message: message,
        priority: 1
    });
}

export function notifyPopup(type, data = {}) {
    chrome.runtime.sendMessage({
        type,
        ...data
    }).catch(() => {
        // Popup kapalı olabilir, hata yok
    });
}

export function setupNotificationClickHandler(username) {
    chrome.notifications.onClicked.addListener((notificationId) => {
        chrome.tabs.create({
            url: `https://www.instagram.com/stories/${username}/`
        });
        chrome.notifications.clear(notificationId);
    });
}
