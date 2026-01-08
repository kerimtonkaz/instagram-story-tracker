// Dil çevirileri
export const translations = {
    tr: {
        // Header
        appName: 'Hikaye Takipçisi',
        lastCheck: 'Son kontrol',
        notYet: 'Henüz yok',
        checking: 'Kontrol ediliyor...',
        
        // Tabs
        tabStories: '📖 Hikayeler',
        tabNotifications: '🔔 Bildirim',
        tabSettings: '⚙️ Ayarlar',
        
        // Stories Tab
        yourStories: '📖 Hikayeleriniz',
        noStoryData: 'Henüz hikaye verisi yok',
        noStoryDataHint: 'Kontrol başlatın veya manuel kontrol yapın',
        story: 'Hikaye',
        viewers: 'görüntüleyen',
        fromList: 'listeden',
        deleteStory: 'Hikayeyi Sil',
        
        // Settings Tab
        instagramUsername: 'Instagram Kullanıcı Adınız',
        usernamePlaceholder: 'kullaniciadi',
        checkInterval: 'Kontrol Aralığı',
        minute: 'dakika',
        minutes: 'dakika',
        notifications: 'Bildirimler',
        firstView: '🆕 İlk görüntüleme',
        repeatView: '🔄 Tekrar görüntüleme',
        notificationSound: '🔔 Bildirim sesi',
        desktopNotification: '💻 Masaüstü bildirimi',
        testSound: '▶️ Sesi Test Et',
        saveSettings: '💾 Ayarları Kaydet',
        settingsSaved: 'Ayarlar kaydedildi ✓',
        
        // Language
        language: '🌐 Dil',
        languageTurkish: 'Türkçe',
        languageEnglish: 'English',
        
        // Watchlist Tab
        watchlistInfo: '🔔 Bu listeye eklediğiniz kişiler hikayenizi görüntülediğinde bildirim alırsınız.',
        addUserPlaceholder: 'kullanici_adi',
        notificationList: 'Bildirim Listesi',
        emptyList: 'Bildirim listesi boş',
        emptyListHint: 'Bildirim almak istediğiniz kişileri ekleyin',
        noViewYet: 'Henüz görüntülemedi',
        views: 'görüntüleme',
        
        // Footer
        checkNow: 'Şimdi Kontrol Et',
        startTracking: 'Takibi Başlat',
        stopTracking: 'Takibi Durdur',
        
        // User Modal
        added: 'Eklendi',
        viewCount: 'Görüntüleme',
        storyCount: 'Hikaye',
        lastActivity: 'Son Aktivite',
        storyViews: '📖 Hikaye Görüntülemeleri',
        noViewsYet: 'Henüz görüntüleme yok',
        activity: '📋 Aktivite',
        noActivityYet: 'Henüz aktivite yok',
        deleteUser: '🗑️ Kullanıcıyı Sil',
        
        // Story Modal
        storyDetail: 'Hikaye Detayı',
        viewerCount: 'Görüntüleyen',
        fromListCount: 'Listeden',
        searchViewer: 'Görüntüleyen ara...',
        noViewersYet: 'Henüz görüntüleyen yok',
        openStory: '🔗 Hikayeyi Aç',
        deleteData: '🗑️ Veriyi Sil',
        viewedTimes: 'görüntüledi',
        
        // Toasts
        enterUsername: 'Kullanıcı adı girin',
        userAlreadyInList: 'Bu kullanıcı zaten listede',
        userAdded: 'bildirim listesine eklendi',
        userRemoved: 'listeden kaldırıldı',
        enterYourUsername: 'Önce kullanıcı adınızı girin',
        checkComplete: 'Kontrol tamamlandı ✓',
        checkFailed: 'Kontrol başarısız',
        errorOccurred: 'Kontrol sırasında hata oluştu',
        trackingStarted: 'Takip başladı! 🚀',
        trackingStopped: 'Takip durduruldu',
        storyDataDeleted: 'Hikaye verisi silindi',
        confirmDeleteStory: 'Bu hikayenin verilerini silmek istediğinize emin misiniz?',
        
        // Date formatting
        dayNames: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
        
        // Notifications
        firstViewTitle: '🆕 Hikayenizi Gördü!',
        firstViewMessage: 'hikayenizi ilk kez görüntüledi!',
        repeatViewTitle: '🔄 Tekrar Baktı!',
        repeatViewMessage: 'hikayenize tekrar baktı!',
        times: 'kez',
        
        // Time
        secondsShort: 'sn',
        minutesShort: 'dk',
        
        // Auto-Block
        tabAutoBlock: '🚫 Oto-Engel',
        autoBlockInfo: '🔒 Sizi engelleyen kişiler engelini kaldırdığında otomatik olarak engelleyin.',
        autoBlockTargetPlaceholder: 'kullanici_adi',
        autoBlockList: 'Engelleme Listesi',
        autoBlockEmpty: 'Engelleme listesi boş',
        autoBlockEmptyHint: 'Otomatik engellemek istediğiniz kişileri ekleyin',
        autoBlockStatus: 'Durum',
        autoBlockInterval: 'Kontrol Aralığı',
        autoBlockSeconds: 'sn',
        autoBlockWaiting: 'Bekliyor...',
        autoBlockBlocked: 'Engellendi ✓',
        autoBlockError: 'Hata',
        autoBlockChecking: 'Kontrol ediliyor...',
        autoBlockProfileNotFound: 'Profil mevcut değil',
        autoBlockProfileAvailable: 'Profil açık - engelleniyor!',
        autoBlockStarted: 'Otomatik engelleme başlatıldı 🚀',
        autoBlockStopped: 'Otomatik engelleme durduruldu',
        autoBlockSuccess: 'başarıyla engellendi! 🎉',
        autoBlockFailed: 'engellenemedi',
        autoBlockAlreadyInList: 'Bu kullanıcı zaten listede',
        autoBlockAdded: 'engelleme listesine eklendi',
        autoBlockRemoved: 'engelleme listesinden kaldırıldı',
        autoBlockCheckCount: 'Kontrol sayısı',
        autoBlockLastCheck: 'Son kontrol',
        autoBlockDeleteTarget: '🗑️ Hedefi Sil',
        autoBlockConfirmDelete: 'Bu hedefi silmek istediğinize emin misiniz?',
        autoBlockEnableTracking: '🔒 Oto-Engeli Başlat',
        autoBlockDisableTracking: '🔓 Oto-Engeli Durdur',
        autoBlockNotification: 'Otomatik engellendi!'
    },
    en: {
        // Header
        appName: 'Story Tracker',
        lastCheck: 'Last check',
        notYet: 'Not yet',
        checking: 'Checking...',
        
        // Tabs
        tabStories: '📖 Stories',
        tabNotifications: '🔔 Notifications',
        tabSettings: '⚙️ Settings',
        
        // Stories Tab
        yourStories: '📖 Your Stories',
        noStoryData: 'No story data yet',
        noStoryDataHint: 'Start tracking or check manually',
        story: 'Story',
        viewers: 'viewers',
        fromList: 'from list',
        deleteStory: 'Delete Story',
        
        // Settings Tab
        instagramUsername: 'Your Instagram Username',
        usernamePlaceholder: 'username',
        checkInterval: 'Check Interval',
        minute: 'minute',
        minutes: 'minutes',
        notifications: 'Notifications',
        firstView: '🆕 First view',
        repeatView: '🔄 Repeat view',
        notificationSound: '🔔 Notification sound',
        desktopNotification: '💻 Desktop notification',
        testSound: '▶️ Test Sound',
        saveSettings: '💾 Save Settings',
        settingsSaved: 'Settings saved ✓',
        
        // Language
        language: '🌐 Language',
        languageTurkish: 'Türkçe',
        languageEnglish: 'English',
        
        // Watchlist Tab
        watchlistInfo: '🔔 You will receive notifications when people on this list view your story.',
        addUserPlaceholder: 'username',
        notificationList: 'Notification List',
        emptyList: 'Notification list is empty',
        emptyListHint: 'Add people you want to get notifications for',
        noViewYet: 'Not viewed yet',
        views: 'views',
        
        // Footer
        checkNow: 'Check Now',
        startTracking: 'Start Tracking',
        stopTracking: 'Stop Tracking',
        
        // User Modal
        added: 'Added',
        viewCount: 'Views',
        storyCount: 'Stories',
        lastActivity: 'Last Activity',
        storyViews: '📖 Story Views',
        noViewsYet: 'No views yet',
        activity: '📋 Activity',
        noActivityYet: 'No activity yet',
        deleteUser: '🗑️ Delete User',
        
        // Story Modal
        storyDetail: 'Story Detail',
        viewerCount: 'Viewers',
        fromListCount: 'From List',
        searchViewer: 'Search viewer...',
        noViewersYet: 'No viewers yet',
        openStory: '🔗 Open Story',
        deleteData: '🗑️ Delete Data',
        viewedTimes: 'viewed',
        
        // Toasts
        enterUsername: 'Enter username',
        userAlreadyInList: 'This user is already in the list',
        userAdded: 'added to notification list',
        userRemoved: 'removed from list',
        enterYourUsername: 'Enter your username first',
        checkComplete: 'Check complete ✓',
        checkFailed: 'Check failed',
        errorOccurred: 'Error occurred during check',
        trackingStarted: 'Tracking started! 🚀',
        trackingStopped: 'Tracking stopped',
        storyDataDeleted: 'Story data deleted',
        confirmDeleteStory: 'Are you sure you want to delete this story data?',
        
        // Date formatting
        dayNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        
        // Notifications
        firstViewTitle: '🆕 Viewed Your Story!',
        firstViewMessage: 'viewed your story for the first time!',
        repeatViewTitle: '🔄 Viewed Again!',
        repeatViewMessage: 'viewed your story again!',
        times: 'times',
        
        // Time
        secondsShort: 's',
        minutesShort: 'm',
        
        // Auto-Block
        tabAutoBlock: '🚫 Auto-Block',
        autoBlockInfo: '🔒 Automatically block people who blocked you when they unblock.',
        autoBlockTargetPlaceholder: 'username',
        autoBlockList: 'Block List',
        autoBlockEmpty: 'Block list is empty',
        autoBlockEmptyHint: 'Add people you want to auto-block',
        autoBlockStatus: 'Status',
        autoBlockInterval: 'Check Interval',
        autoBlockSeconds: 's',
        autoBlockWaiting: 'Waiting...',
        autoBlockBlocked: 'Blocked ✓',
        autoBlockError: 'Error',
        autoBlockChecking: 'Checking...',
        autoBlockProfileNotFound: 'Profile not available',
        autoBlockProfileAvailable: 'Profile available - blocking!',
        autoBlockStarted: 'Auto-block started 🚀',
        autoBlockStopped: 'Auto-block stopped',
        autoBlockSuccess: 'successfully blocked! 🎉',
        autoBlockFailed: 'could not be blocked',
        autoBlockAlreadyInList: 'This user is already in the list',
        autoBlockAdded: 'added to block list',
        autoBlockRemoved: 'removed from block list',
        autoBlockCheckCount: 'Check count',
        autoBlockLastCheck: 'Last check',
        autoBlockDeleteTarget: '🗑️ Delete Target',
        autoBlockConfirmDelete: 'Are you sure you want to delete this target?',
        autoBlockEnableTracking: '🔒 Start Auto-Block',
        autoBlockDisableTracking: '🔓 Stop Auto-Block',
        autoBlockNotification: 'Auto-blocked!'
    }
};

// Aktif dili sakla
let currentLanguage = 'tr';

// Dil al
export function getLanguage() {
    return currentLanguage;
}

// Dil değiştir
export function setLanguage(lang) {
    if (translations[lang]) {
        currentLanguage = lang;
        return true;
    }
    return false;
}

// Çeviri al
export function t(key) {
    return translations[currentLanguage]?.[key] || translations['tr'][key] || key;
}

// Dili storage'dan yükle
export async function loadLanguage() {
    try {
        const result = await chrome.storage.local.get('language');
        if (result.language && translations[result.language]) {
            currentLanguage = result.language;
        }
        return currentLanguage;
    } catch (error) {
        console.error('Language load error:', error);
        return currentLanguage;
    }
}

// Dili storage'a kaydet
export async function saveLanguage(lang) {
    try {
        await chrome.storage.local.set({ language: lang });
        setLanguage(lang);
        return true;
    } catch (error) {
        console.error('Language save error:', error);
        return false;
    }
}
