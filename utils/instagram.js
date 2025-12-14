import { log } from './helpers.js';

export async function findStoryTab() {
    const tabs = await chrome.tabs.query({
        url: 'https://www.instagram.com/*'
    });
    
    return tabs.find(tab => tab.url?.includes('/stories/')) || null;
}

export async function openStoryPage(username) {
    const storyUrl = `https://www.instagram.com/stories/${username}/`;
    let tab = await findStoryTab();
    
    if (!tab) {
        // Yeni sekme aç (arka planda)
        tab = await chrome.tabs.create({
            url: storyUrl,
            active: false
        });
        log(`Yeni hikaye sekmesi açıldı: ${storyUrl}`, 'info');
    } else {
        // Mevcut sekmeyi güncelle
        await chrome.tabs.update(tab.id, { url: storyUrl });
        log(`Hikaye sekmesi güncellendi: ${storyUrl}`, 'info');
    }
    
    // Sayfanın yüklenmesini bekle
    await waitForTabLoad(tab.id);
    
    return tab;
}

export function waitForTabLoad(tabId, timeout = 30000) {
    return new Promise((resolve) => {
        const listener = (updatedTabId, changeInfo) => {
            if (updatedTabId === tabId && changeInfo.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(listener);
                // Dinamik içerik için ekstra bekleme
                setTimeout(resolve, 3000);
            }
        };
        
        chrome.tabs.onUpdated.addListener(listener);
        
        // Timeout
        setTimeout(() => {
            chrome.tabs.onUpdated.removeListener(listener);
            resolve();
        }, timeout);
    });
}

export async function injectViewerExtractor(tabId, watchlistUsernames) {
    try {
        await chrome.scripting.executeScript({
            target: { tabId },
            func: extractViewersFromPage,
            args: [watchlistUsernames]
        });
        log('Görüntüleyici çıkarma scripti enjekte edildi', 'success');
    } catch (error) {
        log('Script enjekte edilemedi: ' + error.message, 'error');
        throw error;
    }
}

function extractViewersFromPage(watchlist) {
    async function getViewersWithPositions() {
        const url = window.location.href;
        const urlMatch = url.match(/stories\/([^\/\?]+)(?:\/(\d+))?/);
        
        let storyOwner;
        let storyItemId;
        let storyId;
        
        if (urlMatch) {
            storyOwner = urlMatch[1];
            storyItemId = urlMatch[2] || null; // Belirli hikaye ID'si (varsa)
        } else {
            storyOwner = 'unknown';
            storyItemId = null;
        }
        
        // storyId = kullanıcı adı (tüm hikayeler tek kayıtta toplanır)
        // Eğer belirli bir hikaye ID'si varsa onu kullan, yoksa kullanıcı adını kullan
        storyId = storyItemId || storyOwner;
        
        const storyUrl = storyItemId 
            ? `https://www.instagram.com/stories/${storyOwner}/${storyItemId}/`
            : `https://www.instagram.com/stories/${storyOwner}/`;
        
        console.log(`[StoryTracker] Hikaye tespit edildi - Owner: ${storyOwner}, ItemID: ${storyItemId}, StoryID: ${storyId}`);
        
        // Görüntüleyenler butonunu bul
        const viewersButton = findViewersButton();
        
        if (!viewersButton) {
            console.log('[StoryTracker] Görüntüleyenler butonu bulunamadı');
            sendResults([], storyId, storyUrl);
            return;
        }
        
        // Modal'ı aç
        viewersButton.click();
        await sleep(2500);
        
        // Tüm görüntüleyenleri yükle ve topla (yeni fonksiyon)
        const viewers = await loadAllViewersAndCollect();
        
        console.log(`[StoryTracker] Toplam ${viewers.length} görüntüleyici bulundu`);
        
        // Modal'ı kapat
        closeModal();
        
        sendResults(viewers, storyId, storyUrl);
    }
    
    function findViewersButton() {
        // Instagram'ın farklı UI versiyonları için birden fazla seçici dene
        const selectors = [
            '[role="button"] .xzueoph',
            '[data-visualcompletion="ignore"] svg',
            'button[aria-label*="viewer"]',
            '[role="button"][tabindex="0"]'
        ];
        
        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el) {
                // SVG ise parent button'ı al
                const button = el.closest('[role="button"]') || el;
                // Görüntüleyenler butonu olduğunu doğrula
                if (isViewersButton(button)) {
                    return button;
                }
            }
        }
        
        return null;
    }
    
    function isViewersButton(element) {
        // Görüntüleyenler butonunu tanıma mantığı
        const text = element.textContent?.toLowerCase() || '';
        const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';
        
        return text.includes('gör') || 
               text.includes('viewer') || 
               ariaLabel.includes('viewer') ||
               element.querySelector('img[alt]'); // Profil fotoğrafları
    }
    
    async function loadAllViewersAndCollect() {
        const modal = document.querySelector('[role="dialog"]');
        if (!modal) {
            console.log('[StoryTracker] Modal bulunamadı');
            return [];
        }
        
        // Scroll container'ı bul - style attribute'a bakarak
        let scrollContainer = null;
        const allDivs = modal.querySelectorAll('div');
        
        for (const div of allDivs) {
            const style = div.getAttribute('style') || '';
            if (style.includes('overflow') && style.includes('auto')) {
                scrollContainer = div;
                console.log('[StoryTracker] Scroll container bulundu');
                break;
            }
        }
        
        if (!scrollContainer) {
            console.log('[StoryTracker] Scroll container bulunamadı!');
            return collectViewersFromModal(modal);
        }
        
        console.log('[StoryTracker] Scroll başlıyor...', {
            scrollHeight: scrollContainer.scrollHeight,
            clientHeight: scrollContainer.clientHeight
        });
        
        // Kullanıcıları toplamak için Map
        const viewersMap = new Map();
        
        // İlk görünenleri topla
        collectViewersFromModal(modal).forEach(v => viewersMap.set(v.username, v));
        console.log(`[StoryTracker] İlk: ${viewersMap.size} kullanıcı`);
        
        // YAVAŞ SCROLL
        const scrollStep = 240;
        let currentScroll = 0;
        let step = 0;
        const maxSteps = 100;
        
        while (step < maxSteps) {
            step++;
            currentScroll += scrollStep;
            
            // Direkt scrollTop ata
            scrollContainer.scrollTop = currentScroll;
            
            // 300ms bekle
            await sleep(300);
            
            // Her adımda yeni kullanıcıları topla
            const prevSize = viewersMap.size;
            collectViewersFromModal(modal).forEach(v => viewersMap.set(v.username, v));
            
            const newCount = viewersMap.size - prevSize;
            if (newCount > 0) {
                console.log(`[StoryTracker] Adım ${step}: +${newCount} yeni (toplam: ${viewersMap.size})`);
            }
            
            // Sona ulaştı mı?
            const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
            if (scrollContainer.scrollTop >= maxScroll - 10) {
                console.log('[StoryTracker] Scroll sona ulaştı!');
                break;
            }
        }
        
        console.log(`[StoryTracker] Tamamlandı: ${viewersMap.size} toplam kullanıcı`);
        
        // Map'i array'e çevir
        const viewers = [];
        let position = 0;
        for (const [username, data] of viewersMap) {
            viewers.push({
                username: username,
                position: position++
            });
        }
        
        return viewers;
    }
    
    function collectViewersFromModal(modal) {
        const viewers = [];
        
        // Kullanıcı linkleri
        const links = modal.querySelectorAll('a[href^="/"]');
        
        links.forEach(link => {
            const href = link.getAttribute('href');
            
            // Geçersiz linkleri filtrele
            if (!href || 
                href.includes('/stories/') || 
                href.includes('/explore/') ||
                href.includes('/p/') ||
                href.includes('/reel/')) {
                return;
            }
            
            const username = href.replace(/\//g, '').toLowerCase();
            
            if (username && username.length > 0 && username.length < 50) {
                viewers.push({
                    username: username
                });
            }
        });
        
        return viewers;
    }
    
    function closeModal() {
        // ESC tuşu ile kapat
        document.dispatchEvent(new KeyboardEvent('keydown', { 
            key: 'Escape', 
            bubbles: true 
        }));
    }
    
    function sendResults(viewers, storyId, storyUrl) {
        chrome.runtime.sendMessage({
            type: 'VIEWER_LIST',
            viewers: viewers,
            storyId: storyId,
            storyUrl: storyUrl
        });
    }
    
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Çalıştır
    getViewersWithPositions().catch(error => {
        console.error('[StoryTracker] Hata:', error);
        chrome.runtime.sendMessage({
            type: 'ERROR',
            error: error.message
        });
    });
}
