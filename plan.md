# Desktop Widget App Uygulama Planı

Bu proje sıfırdan bir Electron.js uygulaması olarak yapılandırılacaktır.

## 1. Proje Kurulumu ve Bağımlılıklar
- `npm init -y` ile proje başlatılacak.
- Gerekli paketlerin kurulumu: `npm install electron electron-builder windows-media-sessions`
- Geliştirme bağımlılıklarının kurulumu (TailwindCSS): `npm install -D tailwindcss postcss autoprefixer`
- TailwindCSS yapılandırması: `npx tailwindcss init`
- `package.json` içerisine `start` (electron .) ve `pack`/`build` (electron-builder) scriptleri eklenecek.

## 2. Ana Uygulama Mimarisi (main.js)
- Uygulama başladığında ana "Dashboard" (Widget Kontrol Paneli) penceresini (`index.html`) açacak.
- IPC (Inter-Process Communication) ile Dashboard'dan gelen talepleri dinleyip, istenilen widget (Saat, Kronometre, Geri Sayım, Medya) için yeni şeffaf, çerçevesiz (`frame: false, transparent: true`) pencereler oluşturacak.
- Medya widget'ı için arka planda Windows System Media Transport Controls (SMTC) dinlenecek (`windows-media-sessions` ile).

## 3. Arayüz Tasarımı (TailwindCSS & Glassmorphism)
- Tüm sayfalar modern cam efekti ve koyu/açık tema (Dark/Light Mode) desteği ile tasarlanacak.
- Masaüstüne konumlanacak widget'lar için CSS'te `-webkit-app-region: drag` kullanılarak pencerelerin her yere sürüklenebilmesi sağlanacak.

## 4. Dosya Yapısı
- `main.js`: Electron ana prosesi.
- `index.html` & `dashboard.js`: Ana kontrol paneli.
- Widget'lar:
  - `clock.html` / `clock.js`: Dijital saat.
  - `stopwatch.html` / `stopwatch.js`: Kronometre (Başlat, Durdur, Sıfırlama işlevli).
  - `countdown.html` / `countdown.js`: Kullanıcının süre girebildiği geri sayım sayacı.
  - `media.html` / `media.js`: Anlık PC medyasını dinleyen araç takımı.
- `styles.css`: Tailwind'in derleneceği ana CSS dosyası.

## 5. Test ve Paketleme
- Tüm widget'ların bağımsız açılıp kapanması, veri doğruluğu ve tema geçişleri test edilecek.
- İşlemler tamamlandığında `electron-builder` ile kurulum (exe) dosyası oluşturulacak.
