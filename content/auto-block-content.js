/**
 * Auto-Block Content Script
 * 
 * Instagram profil sayfasında profil durumunu kontrol eder ve
 * engelleme işlemini gerçekleştirir.
 */

// Mesaj dinleyici
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CHECK_PROFILE_STATUS') {
        checkProfileStatus(message.username)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ error: error.message }));
        return true;
    }
    
    if (message.type === 'EXECUTE_BLOCK') {
        executeBlockSequence(message.username)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
});

/**
 * Profil durumunu kontrol et
 */
async function checkProfileStatus(username) {
    console.log(`[AutoBlock] Profil durumu kontrol ediliyor: @${username}`);
    
    const pageText = document.body.innerText;
    
    // "Profile mevcut değil" göstergeleri
    const notFoundIndicators = [
        'Profile mevcut değil',
        'Sorry, this page isn\'t available',
        'Bağlantı bozuk olabilir veya profil kaldırılmış olabilir',
        'The link you followed may be broken',
        'Bu sayfa mevcut değil'
    ];
    
    // Profil mevcut göstergeleri
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
        if (pageText.includes(indicator)) {
            console.log(`[AutoBlock] Profil mevcut değil: "${indicator}" bulundu`);
            return { profileAvailable: false, reason: 'not_found' };
        }
    }
    
    // Available kontrolü
    let availableCount = 0;
    for (const indicator of availableIndicators) {
        if (pageText.includes(indicator)) {
            availableCount++;
        }
    }
    
    if (availableCount >= 2) {
        console.log(`[AutoBlock] Profil mevcut! ${availableCount} gösterge bulundu`);
        return { profileAvailable: true, reason: 'available' };
    }
    
    console.log(`[AutoBlock] Profil durumu belirsiz`);
    return { profileAvailable: false, reason: 'unknown' };
}

/**
 * Engelleme sırasını çalıştır
 * 1. Seçenekler butonuna tıkla
 * 2. Engelle butonuna tıkla
 * 3. Onay ekranında tekrar Engelle butonuna tıkla
 */
async function executeBlockSequence(username) {
    console.log(`[AutoBlock] Engelleme sırası başlatılıyor: @${username}`);
    
    try {
        // 1. Seçenekler butonunu bul ve tıkla
        const optionsButton = await findAndClickOptionsButton();
        if (!optionsButton) {
            throw new Error('Seçenekler butonu bulunamadı');
        }
        console.log('[AutoBlock] Seçenekler butonuna tıklandı');
        
        // Menünün açılmasını bekle
        await wait(1500);
        
        // 2. Engelle butonunu bul ve tıkla
        const blockButton = await findAndClickBlockButton();
        if (!blockButton) {
            throw new Error('Engelle butonu bulunamadı');
        }
        console.log('[AutoBlock] Engelle butonuna tıklandı');
        
        // Onay dialogunun açılmasını bekle
        await wait(1500);
        
        // 3. Onay ekranında Engelle butonuna tıkla
        const confirmButton = await findAndClickConfirmBlockButton();
        if (!confirmButton) {
            throw new Error('Onay Engelle butonu bulunamadı');
        }
        console.log('[AutoBlock] Onay Engelle butonuna tıklandı');
        
        // İşlemin tamamlanmasını bekle
        await wait(2000);
        
        console.log(`[AutoBlock] @${username} başarıyla engellendi!`);
        return { success: true };
        
    } catch (error) {
        console.error(`[AutoBlock] Engelleme hatası: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Seçenekler (üç nokta) butonunu bul ve tıkla
 */
async function findAndClickOptionsButton() {
    // SVG içinde "Seçenekler" veya "Options" title'ı ara
    const svgs = document.querySelectorAll('svg');
    
    for (const svg of svgs) {
        const title = svg.querySelector('title');
        if (title && (title.textContent === 'Seçenekler' || title.textContent === 'Options')) {
            // SVG'nin parent button'ını bul
            let parent = svg.parentElement;
            while (parent && parent.tagName !== 'BUTTON' && !parent.getAttribute('role')?.includes('button')) {
                parent = parent.parentElement;
            }
            
            if (parent) {
                parent.click();
                return parent;
            } else {
                // Parent bulunamazsa direkt SVG'ye tıkla
                svg.click();
                return svg;
            }
        }
    }
    
    // Alternatif: role="button" ve içinde üç nokta SVG'si olan element
    const buttons = document.querySelectorAll('[role="button"]');
    for (const btn of buttons) {
        const svg = btn.querySelector('svg');
        if (svg) {
            const circles = svg.querySelectorAll('circle');
            // Üç nokta ikonu genellikle 3 circle içerir
            if (circles.length === 3) {
                btn.click();
                return btn;
            }
        }
    }
    
    return null;
}

/**
 * Açılan menüde "Engelle" butonunu bul ve tıkla
 */
async function findAndClickBlockButton() {
    // Retry mekanizması
    for (let i = 0; i < 5; i++) {
        // Tüm butonları kontrol et
        const buttons = document.querySelectorAll('button');
        
        for (const btn of buttons) {
            const text = btn.textContent?.trim();
            if (text === 'Engelle' || text === 'Block') {
                btn.click();
                return btn;
            }
        }
        
        // Bulunamadıysa bekle ve tekrar dene
        await wait(500);
    }
    
    return null;
}

/**
 * Onay dialogunda "Engelle" butonunu bul ve tıkla
 */
async function findAndClickConfirmBlockButton() {
    // Retry mekanizması
    for (let i = 0; i < 5; i++) {
        // Dialog içindeki butonları ara
        const dialogs = document.querySelectorAll('[role="dialog"]');
        
        for (const dialog of dialogs) {
            // Dialog içinde "engellensin mi?" metni var mı kontrol et
            const dialogText = dialog.textContent;
            if (dialogText.includes('engellensin mi') || dialogText.includes('Block')) {
                const buttons = dialog.querySelectorAll('button');
                
                for (const btn of buttons) {
                    const text = btn.textContent?.trim();
                    // İlk "Engelle" butonu (İptal değil)
                    if (text === 'Engelle' || text === 'Block') {
                        btn.click();
                        return btn;
                    }
                }
            }
        }
        
        // Alternatif: Tüm butonları tara
        const allButtons = document.querySelectorAll('button');
        let engelleBtnCount = 0;
        let lastEngelleBtn = null;
        
        for (const btn of allButtons) {
            const text = btn.textContent?.trim();
            if (text === 'Engelle' || text === 'Block') {
                engelleBtnCount++;
                lastEngelleBtn = btn;
            }
        }
        
        // Eğer birden fazla "Engelle" butonu varsa, sonuncusu onay butonu
        if (engelleBtnCount >= 2 && lastEngelleBtn) {
            lastEngelleBtn.click();
            return lastEngelleBtn;
        }
        
        await wait(500);
    }
    
    return null;
}

/**
 * Yardımcı: Belirli süre bekle
 */
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Sayfa yüklendiğinde log
console.log('[AutoBlock] Content script yüklendi');
