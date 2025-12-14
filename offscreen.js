// Offscreen document for playing audio in Manifest V3
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'PLAY_SOUND') {
        const audio = new Audio(chrome.runtime.getURL('assets/sounds/notification.mp3'));
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Ses çalma hatası:', e));
    }
});
