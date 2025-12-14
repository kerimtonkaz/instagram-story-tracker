const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);
const el = {
    themeToggle: $('themeToggle'),
    statusDot: $('statusDot'),
    statusPing: $('statusPing'),
    lastCheck: $('lastCheck'),
    nextCheckText: $('nextCheckText'),
    progressContainer: $('progressContainer'),
    progressBar: $('progressBar'),
    tabBtns: $$('.tab-btn'),
    tabContents: $$('.tab-content'),
    username: $('username'),
    checkInterval: $('checkInterval'),
    intervalValue: $('intervalValue'),
    notifyFirstView: $('notifyFirstView'),
    notifyRepeatView: $('notifyRepeatView'),
    soundEnabled: $('soundEnabled'),
    desktopNotification: $('desktopNotification'),
    testSound: $('testSound'),
    saveSettings: $('saveSettings'),
    storyList: $('storyList'),
    storyCount: $('storyCount'),
    emptyStories: $('emptyStories'),
    newUsername: $('newUsername'),
    addUserBtn: $('addUserBtn'),
    userList: $('userList'),
    userCount: $('userCount'),
    emptyState: $('emptyState'),
    manualCheck: $('manualCheck'),
    manualCheckIcon: $('manualCheckIcon'),
    manualCheckText: $('manualCheckText'),
    startTracking: $('startTracking'),
    stopTracking: $('stopTracking'),
    storyDetailModal: $('storyDetailModal'),
    closeStoryModal: $('closeStoryModal'),
    storyThumbnail: $('storyThumbnail'),
    storyThumbnailImg: $('storyThumbnailImg'),
    storyThumbnailIcon: $('storyThumbnailIcon'),
    storyMeta: $('storyMeta'),
    storyViewerCount: $('storyViewerCount'),
    storyWatchlistCount: $('storyWatchlistCount'),
    searchViewer: $('searchViewer'),
    storyViewersList: $('storyViewersList'),
    openStoryLink: $('openStoryLink'),
    deleteStoryData: $('deleteStoryData'),
    userDetailModal: $('userDetailModal'),
    closeModal: $('closeModal'),
    modalUserAvatar: $('modalUserAvatar'),
    modalUsername: $('modalUsername'),
    modalUserMeta: $('modalUserMeta'),
    modalTotalViews: $('modalTotalViews'),
    modalStoryCount: $('modalStoryCount'),
    modalLastSeen: $('modalLastSeen'),
    modalStoryList: $('modalStoryList'),
    modalActivityList: $('modalActivityList'),
    deleteUserData: $('deleteUserData')
};
let state = {
    username: '',
    checkInterval: 5,
    notifyFirstView: true,
    notifyRepeatView: true,
    soundEnabled: true,
    desktopNotification: true,
    theme: 'light',
    stories: {},
    watchlist: [],
    isTracking: false,
    lastCheck: null,
    stats: {
        totalChecks: 0,
        totalMatches: 0,
        totalReviews: 0
    },
    currentStory: null,
    currentModalUser: null
};
let progressInterval = null;
document.addEventListener('DOMContentLoaded', async () => {
    await loadState();
    setupEventListeners();
    renderAll();
    startProgressTimer();
    if (state.theme === 'dark') {
        document.documentElement.classList.add('dark');
    }
});
async function loadState() {
    try {
        const result = await chrome.storage.local.get([
            'username', 'checkInterval', 'notifyFirstView', 'notifyRepeatView',
            'soundEnabled', 'desktopNotification', 'theme',
            'stories', 'watchlist', 'isTracking', 'lastCheck', 'stats'
        ]);
        state.username = result.username || '';
        state.checkInterval = result.checkInterval || 5;
        state.notifyFirstView = result.notifyFirstView !== false;
        state.notifyRepeatView = result.notifyRepeatView !== false;
        state.soundEnabled = result.soundEnabled !== false;
        state.desktopNotification = result.desktopNotification !== false;
        state.theme = result.theme || 'light';
        state.stories = result.stories || {};
        if (result.watchlist && typeof result.watchlist === 'object' && !Array.isArray(result.watchlist)) {
            state.watchlist = Object.keys(result.watchlist);
        } else {
            state.watchlist = result.watchlist || [];
        }
        state.isTracking = result.isTracking || false;
        state.lastCheck = result.lastCheck || null;
        state.stats = result.stats || { totalChecks: 0, totalMatches: 0, totalReviews: 0 };
    } catch (error) {
        console.error('State load error:', error);
    }
}
function startProgressTimer() {
    if (progressInterval) clearInterval(progressInterval);
    updateProgressBar();
    progressInterval = setInterval(updateProgressBar, 1000);
}
function updateProgressBar() {
    if (!state.isTracking || !state.lastCheck) {
        el.progressContainer.style.opacity = '0';
        el.nextCheckText.style.opacity = '0';
        return;
    }
    const intervalMs = state.checkInterval * 60 * 1000;
    const elapsed = Date.now() - state.lastCheck;
    const remaining = Math.max(0, intervalMs - elapsed);
    const progress = Math.min(100, (elapsed / intervalMs) * 100);
    el.progressContainer.style.opacity = '1';
    el.nextCheckText.style.opacity = '1';
    el.progressBar.style.width = `${progress}%`;
    if (remaining <= 0) {
        el.nextCheckText.textContent = '🔄 Kontrol ediliyor...';
        el.progressBar.classList.add('animate-pulse');
    } else {
        el.progressBar.classList.remove('animate-pulse');
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        if (mins > 0) {
            el.nextCheckText.textContent = `⏱️ ${mins}dk ${secs}sn`;
        } else {
            el.nextCheckText.textContent = `⏱️ ${secs}sn`;
        }
    }
}
async function checkAlarmStatus() {
    try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_ALARM_STATUS' });
        if (response.alarm) {
            const nextRun = new Date(response.alarm.scheduledTime);
            const now = Date.now();
            const diffSec = Math.round((response.alarm.scheduledTime - now) / 1000);
            toast(`⏰ Alarm: ${diffSec}sn sonra (${nextRun.toLocaleTimeString('tr-TR')})`, 'info');
        } else {
            toast('❌ Alarm kurulu değil!', 'error');
        }
        console.log('Alarm durumu:', response);
    } catch (e) {
        toast('Alarm kontrol edilemedi: ' + e.message, 'error');
    }
}
async function saveState() {
    try {
        await chrome.storage.local.set({
            username: state.username,
            checkInterval: state.checkInterval,
            notifyFirstView: state.notifyFirstView,
            notifyRepeatView: state.notifyRepeatView,
            soundEnabled: state.soundEnabled,
            desktopNotification: state.desktopNotification,
            theme: state.theme,
            stories: state.stories,
            watchlist: state.watchlist,
            isTracking: state.isTracking,
            lastCheck: state.lastCheck,
            stats: state.stats
        });
    } catch (error) {
        console.error('State save error:', error);
    }
}
function setupEventListeners() {
    el.themeToggle.addEventListener('click', toggleTheme);
    el.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    el.checkInterval.addEventListener('input', (e) => {
        el.intervalValue.textContent = `${e.target.value} dakika`;
    });
    el.saveSettings.addEventListener('click', saveSettings);
    el.testSound.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'TEST_SOUND' });
    });
    el.addUserBtn.addEventListener('click', addUser);
    el.newUsername.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addUser();
    });
    el.manualCheck.addEventListener('click', manualCheck);
    el.startTracking.addEventListener('click', startTracking);
    el.stopTracking.addEventListener('click', stopTracking);
    el.progressContainer.addEventListener('click', checkAlarmStatus);
    el.closeStoryModal.addEventListener('click', closeStoryModal);
    el.storyDetailModal.addEventListener('click', (e) => {
        if (e.target === el.storyDetailModal) closeStoryModal();
    });
    el.searchViewer.addEventListener('input', filterViewers);
    el.deleteStoryData.addEventListener('click', deleteCurrentStory);
    el.closeModal.addEventListener('click', closeUserModal);
    el.userDetailModal.addEventListener('click', (e) => {
        if (e.target === el.userDetailModal) closeUserModal();
    });
    el.deleteUserData.addEventListener('click', () => {
        if (state.currentModalUser) {
            removeUser(state.currentModalUser);
            closeUserModal();
        }
    });
    chrome.runtime.onMessage.addListener(handleMessage);
}
function switchTab(tabId) {
    el.tabBtns.forEach(btn => {
        const isActive = btn.dataset.tab === tabId;
        btn.classList.toggle('text-pink-600', isActive);
        btn.classList.toggle('dark:text-pink-400', isActive);
        btn.classList.toggle('border-pink-500', isActive);
        btn.classList.toggle('text-gray-500', !isActive);
        btn.classList.toggle('dark:text-gray-400', !isActive);
        btn.classList.toggle('border-transparent', !isActive);
    });
    el.tabContents.forEach(content => {
        content.classList.toggle('hidden', content.id !== tabId);
    });
}
function toggleTheme() {
    if (state.theme === 'light') {
        state.theme = 'dark';
        document.documentElement.classList.add('dark');
    } else {
        state.theme = 'light';
        document.documentElement.classList.remove('dark');
    }
    saveState();
}
function renderAll() {
    renderSettings();
    renderStories();
    renderWatchlist();
    updateUI();
}
function renderSettings() {
    el.username.value = state.username;
    el.checkInterval.value = state.checkInterval;
    el.intervalValue.textContent = `${state.checkInterval} dakika`;
    el.notifyFirstView.checked = state.notifyFirstView;
    el.notifyRepeatView.checked = state.notifyRepeatView;
    el.soundEnabled.checked = state.soundEnabled;
    el.desktopNotification.checked = state.desktopNotification;
}
function renderStories() {
    const storyIds = Object.keys(state.stories);
    el.storyCount.textContent = storyIds.length;
    if (storyIds.length === 0) {
        el.storyList.innerHTML = `
            <div id="emptyStories" class="p-8 text-center">
                <div class="text-4xl mb-2">📭</div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Henüz hikaye verisi yok</p>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Kontrol başlatın veya manuel kontrol yapın</p>
            </div>
        `;
        return;
    }
    
    const sortedStories = storyIds
        .map(id => state.stories[id])
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    el.storyList.innerHTML = sortedStories.map(story => {
        const viewerCount = Object.keys(story.viewers || {}).length;
        const watchlistInStory = Object.keys(story.viewers || {})
            .filter(u => state.watchlist.includes(u.toLowerCase())).length;
        const date = formatDate(story.createdAt);
        return `
            <div class="story-item p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors" data-story-id="${story.storyId}">
                <div class="flex items-center gap-3">
                    <div class="w-14 h-20 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        ${story.thumbnailUrl 
                            ? `<img src="${story.thumbnailUrl}" alt="Story" class="w-full h-full object-cover" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span class="text-2xl hidden">📖</span>`
                            : `<span class="text-2xl">📖</span>`
                        }
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between">
                            <span class="text-sm font-medium text-gray-800 dark:text-white">Hikaye</span>
                            <span class="text-xs text-gray-400">${date}</span>
                        </div>
                        <div class="flex items-center gap-3 mt-1">
                            <span class="text-xs text-gray-500 dark:text-gray-400">
                                👀 ${viewerCount} görüntüleyen
                            </span>
                            ${watchlistInStory > 0 ? `
                                <span class="text-xs text-pink-500">
                                    🔔 ${watchlistInStory} listeden
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    <button class="delete-story p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" data-story-id="${story.storyId}" title="Hikayeyi Sil">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                    </button>
                    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                </div>
            </div>
        `;
    }).join('');
    el.storyList.querySelectorAll('.story-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.delete-story')) {
                openStoryModal(item.dataset.storyId);
            }
        });
    });
    el.storyList.querySelectorAll('.delete-story').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteStory(btn.dataset.storyId);
        });
    });
}
function renderWatchlist() {
    el.userCount.textContent = state.watchlist.length;
    if (state.watchlist.length === 0) {
        el.userList.innerHTML = `
            <li id="emptyState" class="p-8 text-center">
                <div class="text-4xl mb-2">🔕</div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Bildirim listesi boş</p>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Bildirim almak istediğiniz kişileri ekleyin</p>
            </li>
        `;
        return;
    }
    el.userList.innerHTML = state.watchlist.map(username => {
        const userStats = getUserStats(username);
        return `
            <li class="user-item flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors" data-username="${username}">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        ${username[0].toUpperCase()}
                    </div>
                    <div class="user-info">
                        <div class="text-sm font-medium text-gray-800 dark:text-white">@${username}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">
                            ${userStats.viewCount > 0 ? `👀 ${userStats.viewCount} görüntüleme` : 'Henüz görüntülemedi'}
                        </div>
                    </div>
                </div>
                <button class="remove-user p-2 text-gray-400 hover:text-red-500 transition-colors" data-username="${username}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </li>
        `;
    }).join('');
    el.userList.querySelectorAll('.user-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.remove-user')) {
                openUserModal(item.dataset.username);
            }
        });
    });
    el.userList.querySelectorAll('.remove-user').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeUser(btn.dataset.username);
        });
    });
}
function updateUI() {
    if (state.isTracking) {
        el.statusDot.classList.remove('bg-gray-300', 'dark:bg-gray-600');
        el.statusDot.classList.add('bg-green-500');
        el.statusPing.classList.remove('hidden');
        el.startTracking.classList.add('hidden');
        el.stopTracking.classList.remove('hidden');
    } else {
        el.statusDot.classList.add('bg-gray-300', 'dark:bg-gray-600');
        el.statusDot.classList.remove('bg-green-500');
        el.statusPing.classList.add('hidden');
        el.startTracking.classList.remove('hidden');
        el.stopTracking.classList.add('hidden');
    }
    el.lastCheck.textContent = state.lastCheck 
        ? formatDate(state.lastCheck, true)
        : 'Henüz yok';
}
function getUserStats(username) {
    const usernameLower = username.toLowerCase();
    let viewCount = 0;
    let lastSeen = null;
    // Tüm hikayelerde bu kullanıcıyı ara
    for (const storyId in state.stories) {
        const story = state.stories[storyId];
        const viewer = story.viewers?.[usernameLower];
        if (viewer) {
            viewCount += viewer.viewCount || 1;
            if (!lastSeen || new Date(viewer.lastSeen) > new Date(lastSeen)) {
                lastSeen = viewer.lastSeen;
            }
        }
    }
    return { viewCount, lastSeen };
}
function addUser() {
    const username = el.newUsername.value.trim().toLowerCase().replace('@', '');
    if (!username) {
        toast('Kullanıcı adı girin', 'warning');
        return;
    }
    if (state.watchlist.includes(username)) {
        toast('Bu kullanıcı zaten listede', 'info');
        return;
    }
    state.watchlist.push(username);
    el.newUsername.value = '';
    saveState();
    renderWatchlist();
    chrome.runtime.sendMessage({
        type: 'UPDATE_WATCHLIST',
        watchlist: state.watchlist
    });
    toast(`@${username} bildirim listesine eklendi`, 'success');
}
function removeUser(username) {
    state.watchlist = state.watchlist.filter(u => u !== username);
    saveState();
    renderWatchlist();
    chrome.runtime.sendMessage({
        type: 'UPDATE_WATCHLIST',
        watchlist: state.watchlist
    });
    toast(`@${username} listeden kaldırıldı`, 'info');
}
function saveSettings() {
    state.username = el.username.value.trim().replace('@', '');
    state.checkInterval = parseInt(el.checkInterval.value);
    state.notifyFirstView = el.notifyFirstView.checked;
    state.notifyRepeatView = el.notifyRepeatView.checked;
    state.soundEnabled = el.soundEnabled.checked;
    state.desktopNotification = el.desktopNotification.checked;
    saveState();
    chrome.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        settings: {
            username: state.username,
            checkInterval: state.checkInterval,
            notifyFirstView: state.notifyFirstView,
            notifyRepeatView: state.notifyRepeatView,
            soundEnabled: state.soundEnabled,
            desktopNotification: state.desktopNotification
        }
    });
    toast('Ayarlar kaydedildi ✓', 'success');
}
let isManualChecking = false;
async function manualCheck() {
    if (isManualChecking) return;
    if (!state.username) {
        toast('Önce kullanıcı adınızı girin', 'warning');
        switchTab('settings');
        el.username.focus();
        return;
    }
    isManualChecking = true;
    el.manualCheckIcon.textContent = '⏳';
    el.manualCheckText.textContent = 'Kontrol Ediliyor...';
    el.manualCheck.classList.add('opacity-75', 'cursor-wait');
    el.manualCheck.disabled = true;
    try {
        const response = await chrome.runtime.sendMessage({
            type: 'MANUAL_CHECK',
            settings: {
                username: state.username,
                checkInterval: state.checkInterval,
                watchlist: state.watchlist,
                notifyFirstView: state.notifyFirstView,
                notifyRepeatView: state.notifyRepeatView,
                soundEnabled: state.soundEnabled,
                desktopNotification: state.desktopNotification
            }
        });
        if (response && response.success) {
            state.stats.totalChecks++;
            state.lastCheck = Date.now();
            saveState();
            updateProgressBar();
            await loadState();
            renderAll();
            toast('Kontrol tamamlandı ✓', 'success');
        } else {
            toast(response?.error || 'Kontrol başarısız', 'error');
        }
    } catch (error) {
        console.error('Manual check error:', error);
        toast('Kontrol sırasında hata oluştu', 'error');
    } finally {
        isManualChecking = false;
        el.manualCheckIcon.textContent = '🔍';
        el.manualCheckText.textContent = 'Şimdi Kontrol Et';
        el.manualCheck.classList.remove('opacity-75', 'cursor-wait');
        el.manualCheck.disabled = false;
    }
}
function startTracking() {
    if (!state.username) {
        toast('Önce kullanıcı adınızı girin', 'warning');
        switchTab('settings');
        el.username.focus();
        return;
    }
    state.isTracking = true;
    state.lastCheck = Date.now();
    saveState();
    chrome.runtime.sendMessage({
        type: 'START_TRACKING',
        settings: {
            username: state.username,
            checkInterval: state.checkInterval,
            watchlist: state.watchlist,
            notifyFirstView: state.notifyFirstView,
            notifyRepeatView: state.notifyRepeatView,
            soundEnabled: state.soundEnabled,
            desktopNotification: state.desktopNotification
        }
    });
    updateUI();
    updateProgressBar();
    toast('Takip başladı! 🚀', 'success');
}
function stopTracking() {
    state.isTracking = false;
    saveState();
    chrome.runtime.sendMessage({ type: 'STOP_TRACKING' });
    updateUI();
    updateProgressBar();
    toast('Takip durduruldu', 'info');
}
function openStoryModal(storyId) {
    const story = state.stories[storyId];
    if (!story) return;
    state.currentStory = storyId;
    if (story.thumbnailUrl) {
        el.storyThumbnailImg.src = story.thumbnailUrl;
        el.storyThumbnailImg.classList.remove('hidden');
        el.storyThumbnailIcon.classList.add('hidden');
    } else {
        el.storyThumbnailImg.classList.add('hidden');
        el.storyThumbnailIcon.classList.remove('hidden');
    }
    el.storyMeta.textContent = formatDate(story.createdAt);
    el.openStoryLink.href = story.storyUrl || '#';
    const viewers = Object.values(story.viewers || {});
    const watchlistViewers = viewers.filter(v => 
        state.watchlist.includes(v.username.toLowerCase())
    );
    el.storyViewerCount.textContent = viewers.length;
    el.storyWatchlistCount.textContent = watchlistViewers.length;
    renderStoryViewers(viewers);
    el.storyDetailModal.classList.remove('hidden');
}
function renderStoryViewers(viewers, filter = '') {
    if (viewers.length === 0) {
        el.storyViewersList.innerHTML = `
            <div class="p-8 text-center">
                <div class="text-4xl mb-2">👀</div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Henüz görüntüleyen yok</p>
            </div>
        `;
        return;
    }
    let filtered = viewers;
    if (filter) {
        filtered = viewers.filter(v => 
            v.username.toLowerCase().includes(filter.toLowerCase())
        );
    }

    filtered.sort((a, b) => a.position - b.position);
    el.storyViewersList.innerHTML = filtered.map(viewer => {
        const isInWatchlist = state.watchlist.includes(viewer.username.toLowerCase());
        return `
            <div class="viewer-item flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div class="flex items-center gap-3">
                    <div class="relative">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            ${viewer.username[0].toUpperCase()}
                        </div>
                        ${isInWatchlist ? `
                            <div class="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center">
                                <span class="text-[8px]">🔔</span>
                            </div>
                        ` : ''}
                    </div>
                    <div>
                        <div class="text-sm font-medium text-gray-800 dark:text-white">@${viewer.username}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">
                            ${viewer.viewCount > 1 ? `🔄 ${viewer.viewCount}x görüntüledi` : '👁️ 1x görüntüledi'}
                        </div>
                    </div>
                </div>
                <div class="text-xs text-gray-400">
                    #${viewer.position}
                </div>
            </div>
        `;
    }).join('');
}
function filterViewers() {
    const story = state.stories[state.currentStory];
    if (!story) return;
    const filter = el.searchViewer.value;
    renderStoryViewers(Object.values(story.viewers || {}), filter);
}
function closeStoryModal() {
    el.storyDetailModal.classList.add('hidden');
    el.searchViewer.value = '';
    state.currentStory = null;
}
function deleteCurrentStory() {
    if (!state.currentStory) return;
    deleteStory(state.currentStory, true);
}
function deleteStory(storyId, fromModal = false) {
    if (!storyId || !state.stories[storyId]) return;
    if (confirm('Bu hikayenin verilerini silmek istediğinize emin misiniz?')) {
        delete state.stories[storyId];
        saveState();
        if (fromModal) {
            closeStoryModal();
        }
        renderStories();
        toast('Hikaye verisi silindi', 'info');
    }
}
function openUserModal(username) {
    state.currentModalUser = username;
    const stats = getUserStats(username);
    el.modalUserAvatar.textContent = username[0].toUpperCase();
    el.modalUsername.textContent = `@${username}`;
    el.modalUserMeta.textContent = stats.lastSeen ? `Son: ${formatDate(stats.lastSeen)}` : 'Henüz görüntülemedi';
    el.modalTotalViews.textContent = stats.viewCount;

    let storyCount = 0;
    const storyViews = [];
    for (const storyId in state.stories) {
        const story = state.stories[storyId];
        const viewer = story.viewers?.[username.toLowerCase()];
        if (viewer) {
            storyCount++;
            storyViews.push({
                storyId,
                thumbnailUrl: story.thumbnailUrl,
                viewCount: viewer.viewCount,
                lastSeen: viewer.lastSeen
            });
        }
    }
    el.modalStoryCount.textContent = storyCount;
    el.modalLastSeen.textContent = stats.lastSeen ? formatDate(stats.lastSeen, true) : '-';
    if (storyViews.length > 0) {
        el.modalStoryList.innerHTML = storyViews.map(sv => `
            <li class="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div class="w-8 h-12 rounded bg-gradient-to-br from-pink-500 to-purple-600 overflow-hidden flex items-center justify-center">
                    ${sv.thumbnailUrl 
                        ? `<img src="${sv.thumbnailUrl}" class="w-full h-full object-cover">`
                        : `<span class="text-sm">📖</span>`
                    }
                </div>
                <div class="flex-1">
                    <div class="text-xs text-gray-600 dark:text-gray-300">${sv.viewCount}x görüntüledi</div>
                    <div class="text-xs text-gray-400">${formatDate(sv.lastSeen)}</div>
                </div>
            </li>
        `).join('');
    } else {
        el.modalStoryList.innerHTML = '<li class="text-center text-sm text-gray-400 py-4">Henüz görüntüleme yok</li>';
    }
    el.modalActivityList.innerHTML = '<li class="text-center text-sm text-gray-400 py-2">-</li>';
    el.userDetailModal.classList.remove('hidden');
}
function closeUserModal() {
    el.userDetailModal.classList.add('hidden');
    state.currentModalUser = null;
}
function handleMessage(msg) {
    switch (msg.type) {
        case 'FIRST_VIEW':
        case 'REPEAT_VIEW':
            loadState().then(() => {
                renderStories();
                renderWatchlist();
            });
            break;
        case 'CHECK_STARTED':
            el.nextCheckText.textContent = '🔄 Kontrol ediliyor...';
            el.progressBar.style.width = '100%';
            el.progressBar.classList.add('animate-pulse');
            break;
        case 'CHECK_COMPLETE':
            loadState().then(() => {
                state.lastCheck = Date.now();
                state.stats.totalChecks++;
                saveState();
                updateProgressBar();
                updateUI();
                renderStories();
                if (state.currentStory && state.stories[state.currentStory]) {
                    const story = state.stories[state.currentStory];
                    const viewers = Object.values(story.viewers || {});
                    renderStoryViewers(viewers);
                    el.storyViewerCount.textContent = viewers.length;
                }
            });
            break;
    }
}
function formatDate(date, withTime = false) {
    if (!date) return '-';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    if (diff < 24 * 60 * 60 * 1000 && d.getDate() === now.getDate()) {
        return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }
    if (diff < 7 * 24 * 60 * 60 * 1000) {
        const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
        return days[d.getDay()] + (withTime ? ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '');
    }
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}
function toast(message, type = 'info') {
    const colors = {
        success: { background: '#10B981', icon: '✓' },
        error: { background: '#EF4444', icon: '✕' },
        warning: { background: '#F59E0B', icon: '⚠' },
        info: { background: '#3B82F6', icon: 'ℹ' }
    };
    const config = colors[type] || colors.info;
    if (typeof iziToast !== 'undefined') {
        iziToast.show({
            message: message,
            backgroundColor: config.background,
            messageColor: '#fff',
            position: 'topCenter',
            timeout: 2500,
            progressBar: false,
            transitionIn: 'fadeInDown',
            transitionOut: 'fadeOutUp'
        });
    } else {
        console.log(`[${type}] ${message}`);
    }
}
