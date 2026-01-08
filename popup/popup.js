// i18n modülünden çevirileri al
import { translations, t, setLanguage, getLanguage, loadLanguage, saveLanguage } from '../utils/i18n.js';

// currentLang artık i18n.js'den yönetiliyor
let currentLang = 'tr';

const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);
const el = {
    htmlRoot: $('htmlRoot'),
    appName: $('appName'),
    lastCheckLabel: $('lastCheckLabel'),
    themeToggle: $('themeToggle'),
    statusDot: $('statusDot'),
    statusPing: $('statusPing'),
    lastCheck: $('lastCheck'),
    nextCheckText: $('nextCheckText'),
    progressContainer: $('progressContainer'),
    progressBar: $('progressBar'),
    tabBtns: $$('.tab-btn'),
    tabContents: $$('.tab-content'),
    tabStories: $('tabStories'),
    tabWatchlist: $('tabWatchlist'),
    tabSettings: $('tabSettings'),
    yourStoriesLabel: $('yourStoriesLabel'),
    noStoryText: $('noStoryText'),
    noStoryHint: $('noStoryHint'),
    usernameLabel: $('usernameLabel'),
    username: $('username'),
    intervalLabel: $('intervalLabel'),
    checkInterval: $('checkInterval'),
    intervalValue: $('intervalValue'),
    notificationsLabel: $('notificationsLabel'),
    firstViewLabel: $('firstViewLabel'),
    repeatViewLabel: $('repeatViewLabel'),
    soundLabel: $('soundLabel'),
    desktopLabel: $('desktopLabel'),
    notifyFirstView: $('notifyFirstView'),
    notifyRepeatView: $('notifyRepeatView'),
    soundEnabled: $('soundEnabled'),
    desktopNotification: $('desktopNotification'),
    testSound: $('testSound'),
    languageLabel: $('languageLabel'),
    langTr: $('langTr'),
    langEn: $('langEn'),
    saveSettings: $('saveSettings'),
    storyList: $('storyList'),
    storyCount: $('storyCount'),
    emptyStories: $('emptyStories'),
    watchlistInfo: $('watchlistInfo'),
    newUsername: $('newUsername'),
    addUserBtn: $('addUserBtn'),
    notificationListLabel: $('notificationListLabel'),
    userList: $('userList'),
    userCount: $('userCount'),
    emptyState: $('emptyState'),
    emptyListText: $('emptyListText'),
    emptyListHint: $('emptyListHint'),
    manualCheck: $('manualCheck'),
    manualCheckIcon: $('manualCheckIcon'),
    manualCheckText: $('manualCheckText'),
    startTracking: $('startTracking'),
    startTrackingText: $('startTrackingText'),
    stopTracking: $('stopTracking'),
    stopTrackingText: $('stopTrackingText'),
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
    deleteUserData: $('deleteUserData'),
    // User modal labels
    modalViewCountLabel: $('modalViewCountLabel'),
    modalStoryCountLabel: $('modalStoryCountLabel'),
    modalLastActivityLabel: $('modalLastActivityLabel'),
    modalStoryViewsLabel: $('modalStoryViewsLabel'),
    modalActivityLabel: $('modalActivityLabel'),
    deleteUserLabel: $('deleteUserLabel'),
    // Auto-Block elements
    tabAutoBlock: $('tabAutoBlock'),
    autoBlockInfo: $('autoBlockInfo'),
    autoBlockUsername: $('autoBlockUsername'),
    addAutoBlockBtn: $('addAutoBlockBtn'),
    autoBlockIntervalLabel: $('autoBlockIntervalLabel'),
    autoBlockInterval: $('autoBlockInterval'),
    autoBlockSecondsLabel: $('autoBlockSecondsLabel'),
    autoBlockListLabel: $('autoBlockListLabel'),
    autoBlockCount: $('autoBlockCount'),
    autoBlockList: $('autoBlockList'),
    autoBlockEmptyState: $('autoBlockEmptyState'),
    autoBlockEmptyText: $('autoBlockEmptyText'),
    autoBlockEmptyHint: $('autoBlockEmptyHint'),
    startAutoBlock: $('startAutoBlock'),
    startAutoBlockText: $('startAutoBlockText'),
    stopAutoBlock: $('stopAutoBlock'),
    stopAutoBlockText: $('stopAutoBlockText')
};
let state = {
    username: '',
    checkInterval: 5,
    notifyFirstView: true,
    notifyRepeatView: true,
    soundEnabled: true,
    desktopNotification: true,
    theme: 'light',
    language: 'tr',
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
    currentModalUser: null,
    // Auto-Block state
    autoBlockTargets: [],
    isAutoBlockActive: false
};
let progressInterval = null;
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[LANG] === Popup başlatılıyor ===');
    
    // Önce direkt storage'dan oku
    const directCheck = await chrome.storage.local.get('language');
    console.log('[LANG] Direkt storage kontrolü:', directCheck);
    
    await loadState();
    console.log('[LANG] loadState sonrası state.language:', state.language, 'currentLang:', currentLang);
    
    setupEventListeners();
    applyLanguage();
    updateLanguageButtons();
    renderAll();
    startProgressTimer();
    
    // Auto-block timer'ını başlat (eğer aktifse)
    if (state.isAutoBlockActive) {
        startAutoBlockTimer();
    }
    
    if (state.theme === 'dark') {
        document.documentElement.classList.add('dark');
    }
});
// Auto-Block state'ini storage'dan yükle
async function loadAutoBlockState() {
    try {
        const result = await chrome.storage.local.get(['autoBlockTargets', 'isAutoBlockActive']);
        state.autoBlockTargets = result.autoBlockTargets || [];
        state.isAutoBlockActive = result.isAutoBlockActive || false;
    } catch (error) {
        console.error('Auto-block state load error:', error);
    }
}

async function loadState() {
    try {
        const result = await chrome.storage.local.get([
            'username', 'checkInterval', 'notifyFirstView', 'notifyRepeatView',
            'soundEnabled', 'desktopNotification', 'theme', 'language',
            'stories', 'watchlist', 'isTracking', 'lastCheck', 'stats',
            'autoBlockTargets', 'isAutoBlockActive'
        ]);
        console.log('[LANG] loadState - Storage result.language:', result.language);
        state.username = result.username || '';
        state.checkInterval = result.checkInterval || 5;
        state.notifyFirstView = result.notifyFirstView !== false;
        state.notifyRepeatView = result.notifyRepeatView !== false;
        state.soundEnabled = result.soundEnabled !== false;
        state.desktopNotification = result.desktopNotification !== false;
        state.theme = result.theme || 'light';
        
        // Dil yükleme - i18n.js'deki loadLanguage fonksiyonunu kullan
        const loadedLang = await loadLanguage();
        state.language = loadedLang;
        currentLang = loadedLang;
        setLanguage(loadedLang); // i18n.js modülünü de senkronize et
        console.log('[LANG] loadState - Yüklenen dil:', state.language);
        
        state.stories = result.stories || {};
        if (result.watchlist && typeof result.watchlist === 'object' && !Array.isArray(result.watchlist)) {
            state.watchlist = Object.keys(result.watchlist);
        } else {
            state.watchlist = result.watchlist || [];
        }
        state.isTracking = result.isTracking || false;
        state.lastCheck = result.lastCheck || null;
        state.stats = result.stats || { totalChecks: 0, totalMatches: 0, totalReviews: 0 };
        // Auto-Block state
        state.autoBlockTargets = result.autoBlockTargets || [];
        state.isAutoBlockActive = result.isAutoBlockActive || false;
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
        el.nextCheckText.textContent = `🔄 ${t('checking')}`;
        el.progressBar.classList.add('animate-pulse');
    } else {
        el.progressBar.classList.remove('animate-pulse');
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        if (mins > 0) {
            el.nextCheckText.textContent = `⏱️ ${mins}${t('minutesShort')} ${secs}${t('secondsShort')}`;
        } else {
            el.nextCheckText.textContent = `⏱️ ${secs}${t('secondsShort')}`;
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
            language: state.language,
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
        el.intervalValue.textContent = `${e.target.value} ${t('minute')}`;
    });
    el.saveSettings.addEventListener('click', saveSettings);
    el.testSound.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'TEST_SOUND' });
    });
    // Language buttons
    el.langTr.addEventListener('click', () => changeLanguage('tr'));
    el.langEn.addEventListener('click', () => changeLanguage('en'));
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
    // Auto-Block event listeners
    el.addAutoBlockBtn?.addEventListener('click', addAutoBlockTarget);
    el.autoBlockUsername?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addAutoBlockTarget();
    });
    el.startAutoBlock?.addEventListener('click', startAutoBlockTracking);
    el.stopAutoBlock?.addEventListener('click', stopAutoBlockTracking);
    
    chrome.runtime.onMessage.addListener(handleMessage);
}

async function changeLanguage(lang) {
    console.log('[LANG] changeLanguage çağrıldı:', lang);
    state.language = lang;
    setLanguage(lang); // i18n.js'deki currentLang'ı güncelle
    currentLang = lang;
    
    try {
        await saveLanguage(lang); // i18n.js'deki saveLanguage kullan
        console.log('[LANG] Storage\'a kaydedildi:', lang);
        
        // Doğrulama için tekrar oku
        const check = await chrome.storage.local.get('language');
        console.log('[LANG] Doğrulama - storage\'dan okunan:', check.language);
        
        // Toast ile bildir
        toast(lang === 'en' ? 'Language saved: English' : 'Dil kaydedildi: Türkçe', 'success');
    } catch (e) {
        console.error('[LANG] Kaydetme hatası:', e);
        toast('Dil kaydedilemedi!', 'error');
    }
    
    applyLanguage();
    renderAll();
    updateLanguageButtons();
}

function updateLanguageButtons() {
    if (currentLang === 'tr') {
        el.langTr.classList.add('border-pink-500', 'bg-pink-50', 'dark:bg-pink-900/30', 'text-pink-600', 'dark:text-pink-400');
        el.langTr.classList.remove('border-gray-200', 'dark:border-gray-600', 'text-gray-600', 'dark:text-gray-400');
        el.langEn.classList.remove('border-pink-500', 'bg-pink-50', 'dark:bg-pink-900/30', 'text-pink-600', 'dark:text-pink-400');
        el.langEn.classList.add('border-gray-200', 'dark:border-gray-600', 'text-gray-600', 'dark:text-gray-400');
    } else {
        el.langEn.classList.add('border-pink-500', 'bg-pink-50', 'dark:bg-pink-900/30', 'text-pink-600', 'dark:text-pink-400');
        el.langEn.classList.remove('border-gray-200', 'dark:border-gray-600', 'text-gray-600', 'dark:text-gray-400');
        el.langTr.classList.remove('border-pink-500', 'bg-pink-50', 'dark:bg-pink-900/30', 'text-pink-600', 'dark:text-pink-400');
        el.langTr.classList.add('border-gray-200', 'dark:border-gray-600', 'text-gray-600', 'dark:text-gray-400');
    }
}

function applyLanguage() {
    // Update HTML lang attribute
    el.htmlRoot?.setAttribute('lang', currentLang);
    
    // Header
    if (el.appName) el.appName.textContent = t('appName');
    if (el.lastCheckLabel) el.lastCheckLabel.textContent = t('lastCheck');
    
    // Tabs
    if (el.tabStories) el.tabStories.textContent = t('tabStories');
    if (el.tabWatchlist) el.tabWatchlist.textContent = t('tabNotifications');
    if (el.tabAutoBlock) el.tabAutoBlock.textContent = t('tabAutoBlock');
    if (el.tabSettings) el.tabSettings.textContent = t('tabSettings');
    
    // Stories section
    if (el.yourStoriesLabel) el.yourStoriesLabel.textContent = t('yourStories');
    if (el.noStoryText) el.noStoryText.textContent = t('noStoryData');
    if (el.noStoryHint) el.noStoryHint.textContent = t('noStoryDataHint');
    
    // Settings section
    if (el.usernameLabel) el.usernameLabel.textContent = t('instagramUsername');
    if (el.username) el.username.placeholder = t('usernamePlaceholder');
    if (el.intervalLabel) el.intervalLabel.textContent = t('checkInterval');
    if (el.notificationsLabel) el.notificationsLabel.textContent = t('notifications');
    if (el.firstViewLabel) el.firstViewLabel.textContent = t('firstView');
    if (el.repeatViewLabel) el.repeatViewLabel.textContent = t('repeatView');
    if (el.soundLabel) el.soundLabel.textContent = t('notificationSound');
    if (el.desktopLabel) el.desktopLabel.textContent = t('desktopNotification');
    if (el.testSound) el.testSound.textContent = t('testSound');
    if (el.languageLabel) el.languageLabel.textContent = t('language');
    if (el.saveSettings) el.saveSettings.textContent = t('saveSettings');
    
    // Watchlist section
    if (el.watchlistInfo) el.watchlistInfo.textContent = t('watchlistInfo');
    if (el.newUsername) el.newUsername.placeholder = t('addUserPlaceholder');
    if (el.notificationListLabel) el.notificationListLabel.textContent = t('notificationList');
    if (el.emptyListText) el.emptyListText.textContent = t('emptyList');
    if (el.emptyListHint) el.emptyListHint.textContent = t('emptyListHint');
    
    // Footer buttons
    if (el.manualCheckText) el.manualCheckText.textContent = t('checkNow');
    if (el.startTrackingText) el.startTrackingText.textContent = t('startTracking');
    if (el.stopTrackingText) el.stopTrackingText.textContent = t('stopTracking');
    
    // Search viewer placeholder
    if (el.searchViewer) el.searchViewer.placeholder = t('searchViewer');
    
    // Auto-Block section
    if (el.autoBlockInfo) el.autoBlockInfo.textContent = t('autoBlockInfo');
    if (el.autoBlockUsername) el.autoBlockUsername.placeholder = t('autoBlockTargetPlaceholder');
    if (el.autoBlockIntervalLabel) el.autoBlockIntervalLabel.textContent = t('autoBlockInterval') + ':';
    if (el.autoBlockSecondsLabel) el.autoBlockSecondsLabel.textContent = t('autoBlockSeconds');
    if (el.autoBlockListLabel) el.autoBlockListLabel.textContent = t('autoBlockList');
    if (el.autoBlockEmptyText) el.autoBlockEmptyText.textContent = t('autoBlockEmpty');
    if (el.autoBlockEmptyHint) el.autoBlockEmptyHint.textContent = t('autoBlockEmptyHint');
    if (el.startAutoBlockText) el.startAutoBlockText.textContent = t('autoBlockEnableTracking');
    if (el.stopAutoBlockText) el.stopAutoBlockText.textContent = t('autoBlockDisableTracking');
    
    // User Detail Modal
    if (el.modalViewCountLabel) el.modalViewCountLabel.textContent = t('viewCount');
    if (el.modalStoryCountLabel) el.modalStoryCountLabel.textContent = t('storyCount');
    if (el.modalLastActivityLabel) el.modalLastActivityLabel.textContent = t('lastActivity');
    if (el.modalStoryViewsLabel) el.modalStoryViewsLabel.textContent = t('storyViews');
    if (el.modalActivityLabel) el.modalActivityLabel.textContent = t('activity');
    if (el.deleteUserLabel) el.deleteUserLabel.textContent = t('deleteUser');
    
    // Update language buttons
    updateLanguageButtons();
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
    renderAutoBlockList();
    updateUI();
}
function renderSettings() {
    el.username.value = state.username;
    el.checkInterval.value = state.checkInterval;
    el.intervalValue.textContent = `${state.checkInterval} ${t('minute')}`;
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
                <p class="text-sm text-gray-500 dark:text-gray-400">${t('noStoryData')}</p>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">${t('noStoryDataHint')}</p>
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
                            <span class="text-sm font-medium text-gray-800 dark:text-white">${t('story')}</span>
                            <span class="text-xs text-gray-400">${date}</span>
                        </div>
                        <div class="flex items-center gap-3 mt-1">
                            <span class="text-xs text-gray-500 dark:text-gray-400">
                                👀 ${viewerCount} ${t('viewers')}
                            </span>
                            ${watchlistInStory > 0 ? `
                                <span class="text-xs text-pink-500">
                                    🔔 ${watchlistInStory} ${t('fromList')}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    <button class="delete-story p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" data-story-id="${story.storyId}" title="${t('deleteStory')}">
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
                <p class="text-sm text-gray-500 dark:text-gray-400">${t('emptyList')}</p>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">${t('emptyListHint')}</p>
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
                            ${userStats.viewCount > 0 ? `👀 ${userStats.viewCount} ${t('views')}` : t('noViewYet')}
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
        : t('notYet');
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
        toast(t('enterUsername'), 'warning');
        return;
    }
    if (state.watchlist.includes(username)) {
        toast(t('userAlreadyInList'), 'info');
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
    toast(`@${username} ${t('userAdded')}`, 'success');
}
function removeUser(username) {
    state.watchlist = state.watchlist.filter(u => u !== username);
    saveState();
    renderWatchlist();
    chrome.runtime.sendMessage({
        type: 'UPDATE_WATCHLIST',
        watchlist: state.watchlist
    });
    toast(`@${username} ${t('userRemoved')}`, 'info');
}
function saveSettings() {
    state.username = el.username.value.trim().replace('@', '');
    state.checkInterval = parseInt(el.checkInterval.value);
    state.notifyFirstView = el.notifyFirstView.checked;
    state.notifyRepeatView = el.notifyRepeatView.checked;
    state.soundEnabled = el.soundEnabled.checked;
    state.desktopNotification = el.desktopNotification.checked;
    // language zaten state içinde güncel, saveState ile birlikte kaydedilecek
    chrome.storage.local.set({
        username: state.username,
        checkInterval: state.checkInterval,
        notifyFirstView: state.notifyFirstView,
        notifyRepeatView: state.notifyRepeatView,
        soundEnabled: state.soundEnabled,
        desktopNotification: state.desktopNotification,
        language: state.language
    }).then(() => {
        console.log('Ayarlar kaydedildi, dil:', state.language);
    });
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
    toast(t('settingsSaved'), 'success');
}
let isManualChecking = false;
async function manualCheck() {
    if (isManualChecking) return;
    if (!state.username) {
        toast(t('enterYourUsername'), 'warning');
        switchTab('settings');
        el.username.focus();
        return;
    }
    isManualChecking = true;
    el.manualCheckIcon.textContent = '⏳';
    el.manualCheckText.textContent = t('checking');
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
            toast(t('checkComplete'), 'success');
        } else {
            toast(response?.error || t('checkFailed'), 'error');
        }
    } catch (error) {
        console.error('Manual check error:', error);
        toast(t('errorOccurred'), 'error');
    } finally {
        isManualChecking = false;
        el.manualCheckIcon.textContent = '🔍';
        el.manualCheckText.textContent = t('checkNow');
        el.manualCheck.classList.remove('opacity-75', 'cursor-wait');
        el.manualCheck.disabled = false;
    }
}
function startTracking() {
    if (!state.username) {
        toast(t('enterYourUsername'), 'warning');
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
    toast(t('trackingStarted'), 'success');
}
function stopTracking() {
    state.isTracking = false;
    saveState();
    chrome.runtime.sendMessage({ type: 'STOP_TRACKING' });
    updateUI();
    updateProgressBar();
    toast(t('trackingStopped'), 'info');
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
                <p class="text-sm text-gray-500 dark:text-gray-400">${t('noViewersYet')}</p>
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
                            ${viewer.viewCount > 1 ? `🔄 ${viewer.viewCount}x ${t('viewedTimes')}` : `👁️ 1x ${t('viewedTimes')}`}
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
    if (confirm(t('confirmDeleteStory'))) {
        delete state.stories[storyId];
        saveState();
        if (fromModal) {
            closeStoryModal();
        }
        renderStories();
        toast(t('storyDataDeleted'), 'info');
    }
}
function openUserModal(username) {
    state.currentModalUser = username;
    const stats = getUserStats(username);
    el.modalUserAvatar.textContent = username[0].toUpperCase();
    el.modalUsername.textContent = `@${username}`;
    el.modalUserMeta.textContent = stats.lastSeen ? `${t('lastCheck')}: ${formatDate(stats.lastSeen)}` : t('noViewYet');
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
                    <div class="text-xs text-gray-600 dark:text-gray-300">${sv.viewCount}x ${t('viewedTimes')}</div>
                    <div class="text-xs text-gray-400">${formatDate(sv.lastSeen)}</div>
                </div>
            </li>
        `).join('');
    } else {
        el.modalStoryList.innerHTML = `<li class="text-center text-sm text-gray-400 py-4">${t('noViewsYet')}</li>`;
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
        // Auto-Block messages
        case 'AUTO_BLOCK_STATUS_UPDATE':
            // Storage'dan güncel hedefleri yükle
            loadAutoBlockState().then(() => {
                renderAutoBlockList();
            });
            break;
        case 'AUTO_BLOCK_SUCCESS':
            // User was successfully blocked
            loadState().then(() => {
                renderAutoBlockList();
                updateAutoBlockUI();
                
                // Tüm hedefler engellenmişse timer'ı durdur
                const activeTargets = state.autoBlockTargets.filter(t => t.status !== 'blocked');
                if (activeTargets.length === 0) {
                    stopAutoBlockTimer();
                }
                
                toast(`@${msg.username} ${t('autoBlockSuccess')}`, 'success');
            });
            break;
        case 'AUTO_BLOCK_FAILED':
            loadState().then(() => {
                renderAutoBlockList();
                toast(`@${msg.username} ${t('autoBlockFailed')}: ${msg.error}`, 'error');
            });
            break;
    }
}
function formatDate(date, withTime = false) {
    if (!date) return '-';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const locale = currentLang === 'tr' ? 'tr-TR' : 'en-US';
    if (diff < 24 * 60 * 60 * 1000 && d.getDate() === now.getDate()) {
        return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    }
    if (diff < 7 * 24 * 60 * 60 * 1000) {
        const days = t('dayNames');
        return days[d.getDay()] + (withTime ? ' ' + d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : '');
    }
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
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

// ============================================
// AUTO-BLOCK FUNCTIONS
// ============================================

function renderAutoBlockList() {
    if (!el.autoBlockList || !el.autoBlockCount) return;
    
    // Sadece aktif (engellenmeyen) hedefleri say
    const activeTargets = state.autoBlockTargets.filter(t => t.status !== 'blocked');
    el.autoBlockCount.textContent = state.autoBlockTargets.length;
    
    if (state.autoBlockTargets.length === 0) {
        el.autoBlockList.innerHTML = `
            <li id="autoBlockEmptyState" class="p-8 text-center">
                <div class="text-4xl mb-2">🔓</div>
                <p class="text-sm text-gray-500 dark:text-gray-400">${t('autoBlockEmpty')}</p>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">${t('autoBlockEmptyHint')}</p>
            </li>
        `;
        return;
    }
    
    el.autoBlockList.innerHTML = state.autoBlockTargets.map(target => {
        const statusInfo = getAutoBlockStatusInfo(target.status);
        const lastCheckText = target.lastCheck ? formatDate(target.lastCheck, true) : '-';
        const isBlocked = target.status === 'blocked';
        
        // Geri sayım hesapla (sadece aktif, engellenmemiş ve kontrol edilmeyen hedefler için)
        let countdownText = '';
        const isChecking = target.status === 'checking';
        
        if (!isBlocked && !isChecking && state.isAutoBlockActive && target.lastCheck) {
            const elapsed = Date.now() - target.lastCheck;
            const remaining = Math.max(0, (target.checkInterval * 1000) - elapsed);
            if (remaining > 0) {
                const secs = Math.ceil(remaining / 1000);
                countdownText = `⏱️ ${secs}${t('autoBlockSeconds')}`;
            }
        }
        
        return `
            <li class="autoblock-item flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${isBlocked ? 'opacity-60' : ''}" data-username="${target.username}">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full ${isBlocked ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-rose-600'} flex items-center justify-center text-white font-bold">
                        ${target.username[0].toUpperCase()}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="text-sm font-medium text-gray-800 dark:text-gray-100">@${target.username}</div>
                        <div class="flex items-center gap-2 mt-0.5 flex-wrap">
                            ${countdownText 
                                ? `<span class="text-[10px] text-purple-600 dark:text-purple-400 font-medium bg-purple-100 dark:bg-purple-500/20 px-1.5 py-0.5 rounded">${countdownText}</span>`
                                : `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${statusInfo.class}">${statusInfo.icon} ${statusInfo.text}</span>`
                            }
                        </div>
                        <div class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                            ${t('autoBlockCheckCount')}: ${target.checkCount || 0} | ${target.checkInterval || 30}sn | ${lastCheckText}
                        </div>
                    </div>
                </div>
                <button class="remove-autoblock p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors" data-username="${target.username}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </li>
        `;
    }).join('');
    
    // Event listeners for remove buttons
    el.autoBlockList.querySelectorAll('.remove-autoblock').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeAutoBlockTarget(btn.dataset.username);
        });
    });
    
    // Update start/stop buttons visibility
    updateAutoBlockUI();
}

function getAutoBlockStatusInfo(status) {
    const statuses = {
        'not_found': { 
            text: t('autoBlockWaiting'), 
            icon: '⏳', 
            class: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300' 
        },
        'available': { 
            text: t('autoBlockProfileAvailable'), 
            icon: '🎯', 
            class: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300' 
        },
        'blocked': { 
            text: t('autoBlockBlocked'), 
            icon: '✓', 
            class: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300' 
        },
        'error': { 
            text: t('autoBlockError'), 
            icon: '⚠', 
            class: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300' 
        },
        'checking': { 
            text: t('autoBlockChecking'), 
            icon: '🔄', 
            class: 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300' 
        }
    };
    return statuses[status] || statuses['not_found'];
}

function updateAutoBlockUI() {
    if (!el.startAutoBlock || !el.stopAutoBlock) return;
    
    // Aktif (engellenmemiş) hedef sayısını kontrol et
    const activeTargets = state.autoBlockTargets.filter(t => t.status !== 'blocked');
    
    if (state.isAutoBlockActive) {
        el.startAutoBlock.classList.add('hidden');
        el.stopAutoBlock.classList.remove('hidden');
    } else {
        el.startAutoBlock.classList.remove('hidden');
        el.stopAutoBlock.classList.add('hidden');
        
        // Aktif hedef yoksa başlat butonunu devre dışı bırak
        if (activeTargets.length === 0 && state.autoBlockTargets.length > 0) {
            el.startAutoBlock.disabled = true;
            el.startAutoBlock.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            el.startAutoBlock.disabled = false;
            el.startAutoBlock.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }
}

async function addAutoBlockTarget() {
    const username = el.autoBlockUsername?.value.trim().toLowerCase().replace('@', '');
    const interval = parseInt(el.autoBlockInterval?.value) || 30;
    
    if (!username) {
        toast(t('enterUsername'), 'warning');
        return;
    }
    
    // Check if already exists
    if (state.autoBlockTargets.find(t => t.username === username)) {
        toast(t('autoBlockAlreadyInList'), 'info');
        return;
    }
    
    const newTarget = {
        username: username,
        checkInterval: Math.max(10, Math.min(300, interval)), // 10-300 saniye arası
        lastCheck: null,
        status: 'not_found',
        createdAt: Date.now(),
        checkCount: 0,
        lastError: null
    };
    
    state.autoBlockTargets.push(newTarget);
    el.autoBlockUsername.value = '';
    
    // Save to storage
    await chrome.storage.local.set({ autoBlockTargets: state.autoBlockTargets });
    
    // Notify background
    chrome.runtime.sendMessage({
        type: 'UPDATE_AUTO_BLOCK_TARGETS',
        targets: state.autoBlockTargets
    });
    
    renderAutoBlockList();
    toast(`@${username} ${t('autoBlockAdded')}`, 'success');
}

async function removeAutoBlockTarget(username) {
    state.autoBlockTargets = state.autoBlockTargets.filter(t => t.username !== username);
    
    // Save to storage
    await chrome.storage.local.set({ autoBlockTargets: state.autoBlockTargets });
    
    // Notify background
    chrome.runtime.sendMessage({
        type: 'UPDATE_AUTO_BLOCK_TARGETS',
        targets: state.autoBlockTargets
    });
    
    renderAutoBlockList();
    toast(`@${username} ${t('autoBlockRemoved')}`, 'info');
}

// Auto-block geri sayım timer'ı
let autoBlockTimerInterval = null;

function startAutoBlockTimer() {
    if (autoBlockTimerInterval) clearInterval(autoBlockTimerInterval);
    autoBlockTimerInterval = setInterval(() => {
        if (state.isAutoBlockActive) {
            renderAutoBlockList();
        }
    }, 1000);
}

function stopAutoBlockTimer() {
    if (autoBlockTimerInterval) {
        clearInterval(autoBlockTimerInterval);
        autoBlockTimerInterval = null;
    }
}

async function startAutoBlockTracking() {
    // Sadece engellenmemiş hedefleri kontrol et
    const activeTargets = state.autoBlockTargets.filter(t => t.status !== 'blocked');
    
    if (activeTargets.length === 0) {
        toast(t('autoBlockEmpty'), 'warning');
        return;
    }
    
    state.isAutoBlockActive = true;
    await chrome.storage.local.set({ isAutoBlockActive: true });
    
    chrome.runtime.sendMessage({
        type: 'START_AUTO_BLOCK',
        targets: state.autoBlockTargets
    });
    
    updateAutoBlockUI();
    startAutoBlockTimer();
    toast(t('autoBlockStarted'), 'success');
}

async function stopAutoBlockTracking() {
    state.isAutoBlockActive = false;
    await chrome.storage.local.set({ isAutoBlockActive: false });
    
    chrome.runtime.sendMessage({
        type: 'STOP_AUTO_BLOCK'
    });
    
    updateAutoBlockUI();
    stopAutoBlockTimer();
    toast(t('autoBlockStopped'), 'info');
}
