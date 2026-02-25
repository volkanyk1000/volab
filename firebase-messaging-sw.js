/**
 * VOLAB PREMIUM - FIREBASE CLOUD MESSAGING SERVICE WORKER
 * Bu dosya arka planda (background) çalışarak bildirimleri yakalar.
 * DİKKAT: Bu dosya projenin ANA DİZİNİNDE (index.html ile aynı yerde) olmalıdır!
 */

// 1. Firebase çekirdek dosyalarını arka planda yükle
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// 2. KENDİ FIREBASE AYARLARINI BURAYA YAPIŞTIR!
// (js/firebase-config.js dosyasındaki ayarların aynısı)
const firebaseConfig = {
    apiKey: "AIzaSyAqafcoMBzz2rfs3KkRq1y9eUdD1ExyqAQ",
    authDomain: "volab-21618.firebaseapp.com",
    projectId: "volab-21618",
    storageBucket: "volab-21618.firebasestorage.app",
    messagingSenderId: "1071296771341",
    appId: "1:1071296771341:web:d8739ec15473a965c82c44",
    measurementId: "G-YQESP95948"
};

// 3. Firebase'i arka planda başlat
firebase.initializeApp(firebaseConfig);

// 4. Messaging servisini çağır
const messaging = firebase.messaging();

// 5. Arka planda bildirim geldiğinde ne olacağını belirle
messaging.onBackgroundMessage(function(payload) {
    console.log('[VoLab] Arka planda bildirim alındı: ', payload);
    
    // Bildirim başlığı ve içeriği
    const notificationTitle = payload.notification.title || 'VoLab Premium';
    const notificationOptions = {
        body: payload.notification.body || 'Yeni bir gelişme var!',
        icon: '/logos/default.png', // Uygulamanın logosu (ana dizine göre yol)
        badge: '/logos/default.png',
        vibrate: [200, 100, 200, 100, 200, 100, 200] // Titreşim deseni (Premium hissiyat)
    };
    
    // Bildirimi ekranda göster
    return self.registration.showNotification(notificationTitle, notificationOptions);
});