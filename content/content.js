const CONFIG = {
    VIEWER_BUTTON_SELECTOR: '.xzueoph',
    VIEWER_MODAL_SELECTOR: '[role="dialog"]',
    VIEWER_ITEM_SELECTOR: 'a[href^="/"]',
    NEXT_STORY_SELECTOR: '[aria-label="Sonraki"]',
    STORY_IMAGE_SELECTOR: 'img[style*="object-fit"]',
    STORY_VIDEO_SELECTOR: 'video',
    WAIT_FOR_MODAL: 2000,
    SCROLL_STEP: 240,            // Her scroll adımı (px) - yaklaşık 1 satır
    NO_CHANGE_LIMIT: 25         // Kaç scroll sonrası yeni eleman gelmezse dur
};

let isExtracting = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'EXTRACT_VIEWERS') {
        extractAllViewers(message.watchlist)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ error: error.message }));
        return true; // Keep channel open for async response
    }
});

async function extractAllViewers(watchlist = []) {
    if (isExtracting) {
        return { error: 'Extraction already in progress' };
    }
    
    isExtracting = true;
    
    try {
        // Hikaye bilgilerini al
        const storyInfo = getStoryInfo();
        
        // Görüntüleyenleri çek (profil resimleriyle)
        const viewers = await extractViewersFromCurrentStory();
        
        // Watchlist eşleşmelerini kontrol et
        const watchlistLower = watchlist.map(u => u.toLowerCase());
        const matches = viewers.filter(v => watchlistLower.includes(v.username.toLowerCase()));
        
        // Background'a gönder
        const result = {
            success: true,
            storyId: storyInfo.storyId,
            storyUrl: storyInfo.storyUrl,
            thumbnailUrl: storyInfo.thumbnailUrl,
            viewers: viewers,
            matches: matches.map(m => m.username),
            totalViewers: viewers.length
        };
        
        chrome.runtime.sendMessage({
            type: 'VIEWER_LIST',
            ...result
        });
        
        return result;
        
    } catch (error) {
        console.error('Extraction error:', error);
        return { error: error.message };
    } finally {
        isExtracting = false;
    }
}

function getStoryInfo() {
    const url = window.location.href;
    
    // Story ID'yi URL'den çek
    // Format: https://www.instagram.com/stories/username/STORY_ID/
    const match = url.match(/stories\/[^\/]+\/(\d+)/);
    const storyId = match ? match[1] : Date.now().toString();
    
    // Thumbnail URL - hikaye görselini bul
    let thumbnailUrl = '';
    
    // Önce video poster'ını dene
    const video = document.querySelector(CONFIG.STORY_VIDEO_SELECTOR);
    if (video && video.poster) {
        thumbnailUrl = video.poster;
    }
    
    // Video yoksa veya poster yoksa, img'yi dene
    if (!thumbnailUrl) {
        // Ana hikaye görseli
        const storyImages = document.querySelectorAll('img');
        for (const img of storyImages) {
            const src = img.src;
            // Instagram CDN'den gelen büyük hikaye görselleri
            if (src && src.includes('instagram') && 
                (src.includes('scontent') || src.includes('cdninstagram')) &&
                img.offsetWidth > 200) {
                thumbnailUrl = src;
                break;
            }
        }
    }
    
    return {
        storyId,
        storyUrl: url,
        thumbnailUrl
    };
}

async function extractViewersFromCurrentStory() {
    const viewersMap = new Map();
    
    // Görüntüleyenler butonunu bul ve tıkla
    const viewersButton = findViewersButton();
    
    if (!viewersButton) {
        console.log('📸 Viewers button not found');
        return [];
    }
    
    viewersButton.click();
    console.log('📸 Clicked viewers button, waiting for modal...');
    
    // Modal'ın açılmasını bekle - daha uzun süre
    await wait(3000);
    
    // Modal'ı bul
    const modal = document.querySelector('[role="dialog"]');
    
    if (!modal) {
        console.log('📸 ❌ Modal bulunamadı!');
        return [];
    }
    console.log('📸 ✅ Modal bulundu');
    
    // Scroll container'ın yüklenmesi için ekstra bekle
    await wait(1000);
    
    // Scroll container'ı bul - style attribute'a bakarak
    let scrollContainer = null;
    const allDivs = modal.querySelectorAll('div');
    
    console.log('📸 Modal içinde', allDivs.length, 'div bulundu');
    
    for (const div of allDivs) {
        const style = div.getAttribute('style') || '';
        if (style.includes('overflow') && style.includes('auto')) {
            scrollContainer = div;
            console.log('📸 ✅ Scroll container bulundu:', style.substring(0, 60));
            console.log('📸 scrollHeight:', scrollContainer.scrollHeight, 'clientHeight:', scrollContainer.clientHeight);
            break;
        }
    }
    
    // Backup: computed style ile ara
    if (!scrollContainer) {
        console.log('📸 Style attribute ile bulunamadı, computed style deneniyor...');
        for (const div of allDivs) {
            const computed = window.getComputedStyle(div);
            if (computed.overflowY === 'auto' && div.scrollHeight > div.clientHeight) {
                scrollContainer = div;
                console.log('📸 ✅ Scroll container bulundu (computed style)');
                break;
            }
        }
    }
    
    if (!scrollContainer) {
        console.log('📸 ❌ Scroll container bulunamadı! Sadece görünen kullanıcılar alınacak.');
        extractVisibleViewers(modal, viewersMap);
        closeModal();
        return mapToArray(viewersMap);
    }
    
    console.log('📸 📏 Container:', {
        scrollHeight: scrollContainer.scrollHeight,
        clientHeight: scrollContainer.clientHeight
    });
    
    // İlk görünenleri al
    extractVisibleViewers(modal, viewersMap);
    console.log(`📸 Initial: ${viewersMap.size} viewers`);
    
    // Scroll gerekli mi kontrol et
    const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
    if (maxScroll <= 10) {
        console.log('📸 Scroll gerekli değil, tüm içerik görünüyor');
        closeModal();
        return mapToArray(viewersMap);
    }
    
    // YAVAŞ SCROLL - Test scriptiyle aynı mantık
    console.log('📸 🔄 Yavaş scroll başlıyor... maxScroll:', maxScroll);
    
    const scrollStep = 60;
    let currentScroll = 0;
    let step = 0;
    const maxSteps = 100;
    
    while (step < maxSteps) {
        step++;
        currentScroll += scrollStep;
        
        // Direkt scrollTop ata (test scriptindeki gibi)
        scrollContainer.scrollTop = currentScroll;
        
        // Her 10 adımda bir log at
        if (step % 10 === 0 || step <= 3) {
            console.log(`📸 Scroll adım ${step}: scrollTop=${scrollContainer.scrollTop}, hedef=${currentScroll}`);
        }
        
        // 300ms bekle
        await wait(300);
        
        // Her adımda yeni kullanıcıları topla
        const prevSize = viewersMap.size;
        extractVisibleViewers(modal, viewersMap);
        const newCount = viewersMap.size - prevSize;
        
        if (newCount > 0) {
            console.log(`📸 Adım ${step}: +${newCount} yeni (toplam: ${viewersMap.size})`);
        }
        
        // Scroll sona ulaştı mı?
        if (scrollContainer.scrollTop >= maxScroll - 10) {
            console.log('📸 ✅ Sona ulaşıldı!');
            break;
        }
    }
    
    console.log(`📸 ✅ Tamamlandı: ${viewersMap.size} toplam viewer`);
    
    // Modal'ı kapat
    closeModal();
    
    return mapToArray(viewersMap);
}

// Map'i array'e çevir
function mapToArray(viewersMap) {
    const viewers = [];
    let position = 1;
    
    for (const [username, data] of viewersMap) {
        viewers.push({
            username: data.username,
            position: position++
        });
    }
    
    return viewers;
}

function extractVisibleViewers(modal, viewersMap) {
    const links = modal.querySelectorAll('a[href^="/"]');
    
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (!href || !isValidUserLink(href)) return;
        
        const username = extractUsername(href);
        if (!username) return;
        
        // Zaten var mı kontrol et
        if (viewersMap.has(username)) return;
        
        // Container'ı bul
        const container = link.closest('div[class]');
        if (!container) return;
        
        // Map'e ekle
        viewersMap.set(username, {
            username: username
        });
    });
}



function findViewersButton() {
    // Method 1: Find by class
    let button = document.querySelector(CONFIG.VIEWER_BUTTON_SELECTOR);
    
    if (button) {
        const clickable = button.closest('[role="button"]');
        return clickable || button;
    }
    
    // Method 2: Find by "kişi gördü" text
    const spans = document.querySelectorAll('span');
    for (const span of spans) {
        if (span.textContent.includes('kişi gördü') || span.textContent.includes('viewer')) {
            const clickable = span.closest('[role="button"]');
            if (clickable) return clickable;
        }
    }
    
    // Method 3: Find by viewer avatars
    const avatarContainers = document.querySelectorAll('[class*="x1i10hfl"]');
    for (const container of avatarContainers) {
        const imgs = container.querySelectorAll('img');
        if (imgs.length >= 2) {
            const clickable = container.closest('[role="button"]');
            if (clickable) return clickable;
        }
    }
    
    return null;
}

function isValidUserLink(href) {
    const excludePatterns = [
        '/stories/',
        '/reels/',
        '/explore/',
        '/direct/',
        '/accounts/',
        '/p/',
        '/tv/',
        '/reel/'
    ];
    
    return !excludePatterns.some(pattern => href.includes(pattern));
}

function extractUsername(href) {
    const parts = href.split('/').filter(Boolean);
    return parts[0]?.toLowerCase() || null;
}

function closeModal() {
    // Method 1: Press Escape
    document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        keyCode: 27,
        which: 27,
        bubbles: true
    }));
    
    // Method 2: Click close button
    setTimeout(() => {
        const closeButton = document.querySelector('[aria-label="Kapat"]') || 
                           document.querySelector('[aria-label="Close"]');
        if (closeButton) {
            closeButton.click();
        }
    }, 100);
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function showInPageNotification(username, type = 'first') {
    const emoji = type === 'repeat' ? '🔄' : '🎉';
    const text = type === 'repeat' ? 'tekrar görüntüledi!' : 'hikayenizi görüntüledi!';
    
    const notification = document.createElement('div');
    notification.className = 'story-tracker-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">${emoji}</div>
            <div class="notification-text">
                <strong>@${username}</strong> ${text}
            </div>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
    
    notification.querySelector('.notification-close').onclick = () => {
        notification.remove();
    };
}

console.log('📸 Instagram Story Tracker content script loaded');
