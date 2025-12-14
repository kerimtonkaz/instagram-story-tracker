export function formatDate(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function formatTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Az önce';
    if (minutes < 60) return `${minutes} dk önce`;
    if (hours < 24) return `${hours} saat önce`;
    if (days < 7) return `${days} gün önce`;
    return formatDate(date);
}

export function now() {
    return new Date().toISOString();
}

export function nowLocale() {
    return new Date().toLocaleString('tr-TR');
}

export function extractStoryId(url) {
    const match = url.match(/stories\/[^\/]+\/(\d+)/);
    return match ? match[1] : `unknown_${Date.now()}`;
}

export function cleanUsername(username) {
    return username.trim().replace('@', '').toLowerCase();
}

export function isEmpty(obj) {
    return !obj || Object.keys(obj).length === 0;
}

export function log(message, type = 'info') {
    const icons = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        first: '🆕',
        repeat: '🔄'
    };
    console.log(`${icons[type] || 'ℹ️'} [StoryTracker] ${message}`);
}
