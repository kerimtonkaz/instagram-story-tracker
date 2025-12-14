import { log } from './helpers.js';

const ALARM_NAME = 'storyCheck';
const CLEANUP_ALARM = 'cleanup';

export function startCheckAlarm(intervalMinutes) {
    chrome.alarms.clear(ALARM_NAME);
    
    const safeInterval = Math.max(1, intervalMinutes);
    
    chrome.alarms.create(ALARM_NAME, {
        delayInMinutes: safeInterval,
        periodInMinutes: safeInterval
    });
    
    log(`Kontrol alarmı kuruldu: Her ${safeInterval} dakikada bir`, 'success');
}

export function stopCheckAlarm() {
    chrome.alarms.clear(ALARM_NAME);
    log('Kontrol alarmı durduruldu', 'info');
}

export function startCleanupAlarm() {
    chrome.alarms.create(CLEANUP_ALARM, {
        delayInMinutes: 60,
        periodInMinutes: 60
    });
}

export async function isAlarmActive() {
    const alarm = await chrome.alarms.get(ALARM_NAME);
    return !!alarm;
}
