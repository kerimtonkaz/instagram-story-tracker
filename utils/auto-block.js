import { log } from './helpers.js';

/**
 * Otomatik Engelleme Sistemi
 * 
 * Bu modül, belirli bir Instagram kullanıcısının profilini periyodik olarak kontrol eder.
 * Eğer profil "mevcut değil" durumundan "mevcut" durumuna geçerse,
 * otomatik olarak Seçenekler > Engelle > Engelle (onay) akışını çalıştırır.
 */

// Auto-block ayarları için varsayılan değerler
export const DEFAULT_AUTO_BLOCK_SETTINGS = {
    autoBlockEnabled: false,
    autoBlockTargets: [], // [{username, checkInterval, lastCheck, status, createdAt}]
};

// Profil durumları
export const PROFILE_STATUS = {
    NOT_FOUND: 'not_found',      // "Profile mevcut değil" - hala engellenmiş
    AVAILABLE: 'available',      // Profil görünür - engel kaldırılmış
    BLOCKED: 'blocked',          // Başarıyla engellendi
    ERROR: 'error',              // Hata oluştu
    CHECKING: 'checking'         // Kontrol ediliyor
};

// Auto-block hedeflerini yükle
export async function loadAutoBlockTargets() {
    try {
        const result = await chrome.storage.local.get('autoBlockTargets');
        return result.autoBlockTargets || [];
    } catch (error) {
        log('Auto-block hedefleri yüklenirken hata: ' + error.message, 'error');
        return [];
    }
}

// Auto-block hedeflerini kaydet
export async function saveAutoBlockTargets(targets) {
    try {
        await chrome.storage.local.set({ autoBlockTargets: targets });
        log('Auto-block hedefleri kaydedildi', 'success');
    } catch (error) {
        log('Auto-block hedefleri kaydedilirken hata: ' + error.message, 'error');
    }
}

// Yeni hedef ekle
export async function addAutoBlockTarget(username, checkIntervalSeconds = 60) {
    const targets = await loadAutoBlockTargets();
    
    // Zaten var mı kontrol et
    const exists = targets.find(t => t.username.toLowerCase() === username.toLowerCase());
    if (exists) {
        return { success: false, error: 'already_exists' };
    }
    
    const newTarget = {
        username: username.toLowerCase(),
        checkInterval: checkIntervalSeconds, // saniye cinsinden
        lastCheck: null,
        status: PROFILE_STATUS.NOT_FOUND,
        createdAt: Date.now(),
        checkCount: 0,
        lastError: null
    };
    
    targets.push(newTarget);
    await saveAutoBlockTargets(targets);
    
    return { success: true, target: newTarget };
}

// Hedefi kaldır
export async function removeAutoBlockTarget(username) {
    let targets = await loadAutoBlockTargets();
    const initialLength = targets.length;
    
    targets = targets.filter(t => t.username.toLowerCase() !== username.toLowerCase());
    
    if (targets.length < initialLength) {
        await saveAutoBlockTargets(targets);
        return { success: true };
    }
    
    return { success: false, error: 'not_found' };
}

// Hedef durumunu güncelle
export async function updateAutoBlockTargetStatus(username, status, error = null) {
    const targets = await loadAutoBlockTargets();
    const target = targets.find(t => t.username.toLowerCase() === username.toLowerCase());
    
    if (target) {
        target.status = status;
        target.lastCheck = Date.now();
        target.checkCount++;
        target.lastError = error;
        
        await saveAutoBlockTargets(targets);
        return { success: true, target };
    }
    
    return { success: false, error: 'not_found' };
}

// Auto-block alarm başlat
export function startAutoBlockAlarm() {
    // Her 30 saniyede bir kontrol et (minimum alarm aralığı)
    chrome.alarms.create('autoBlockCheck', { 
        delayInMinutes: 0.5, // 30 saniye sonra başla
        periodInMinutes: 0.5 // Her 30 saniyede bir
    });
    log('Auto-block alarm başlatıldı', 'info');
}

// Auto-block alarm durdur
export function stopAutoBlockAlarm() {
    chrome.alarms.clear('autoBlockCheck');
    log('Auto-block alarm durduruldu', 'info');
}

// Kontrol edilmesi gereken hedefleri al
export async function getTargetsToCheck() {
    const targets = await loadAutoBlockTargets();
    const now = Date.now();
    
    return targets.filter(target => {
        // Zaten engellenmişse kontrol etme
        if (target.status === PROFILE_STATUS.BLOCKED) {
            return false;
        }
        
        // Hiç kontrol edilmemişse kontrol et
        if (!target.lastCheck) {
            return true;
        }
        
        // Kontrol aralığı geçmişse kontrol et
        const timeSinceLastCheck = now - target.lastCheck;
        return timeSinceLastCheck >= (target.checkInterval * 1000);
    });
}

// Profil kontrol sonucu işle
export function parseProfileCheckResult(pageContent) {
    // "Profile mevcut değil" veya benzeri metinler
    const notFoundIndicators = [
        'Profile mevcut değil',
        'Sorry, this page isn\'t available',
        'Bağlantı bozuk olabilir veya profil kaldırılmış olabilir',
        'The link you followed may be broken'
    ];
    
    // Profil mevcut göstergeleri (gönderi, takipçi, takip sayıları)
    const availableIndicators = [
        'gönderi',
        'takipçi',
        'takip',
        'posts',
        'followers',
        'following',
        'Takip Et',
        'Follow'
    ];
    
    // Not found kontrolü
    for (const indicator of notFoundIndicators) {
        if (pageContent.includes(indicator)) {
            return PROFILE_STATUS.NOT_FOUND;
        }
    }
    
    // Available kontrolü
    let availableCount = 0;
    for (const indicator of availableIndicators) {
        if (pageContent.includes(indicator)) {
            availableCount++;
        }
    }
    
    // En az 2 gösterge varsa profil mevcut
    if (availableCount >= 2) {
        return PROFILE_STATUS.AVAILABLE;
    }
    
    return PROFILE_STATUS.ERROR;
}

// İstatistikleri al
export async function getAutoBlockStats() {
    const targets = await loadAutoBlockTargets();
    
    return {
        total: targets.length,
        waiting: targets.filter(t => t.status === PROFILE_STATUS.NOT_FOUND).length,
        blocked: targets.filter(t => t.status === PROFILE_STATUS.BLOCKED).length,
        errors: targets.filter(t => t.status === PROFILE_STATUS.ERROR).length,
        checking: targets.filter(t => t.status === PROFILE_STATUS.CHECKING).length
    };
}
