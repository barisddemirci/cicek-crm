# 🌸 Çiçek CRM

Çiçekçiler için müşteri hatırlatma ve ilişki yönetim sistemi.

## Özellikler

- 📋 Müşteri yönetimi
- 📸 Fotoğraf yükleme ve kolaj oluşturma
- ⏰ Otomatik hatırlatmalar (1 yıl sonra)
- 📧 E-posta ile bildirim
- 👥 Multi-tenant yapı (birden fazla çiçekçi)
- 🔐 Admin paneli

## Kurulum

### 1. Bağımlılıkları yükle

```bash
npm install
```

### 2. Geliştirme sunucusunu başlat

```bash
npm run dev
```

### 3. Production build

```bash
npm run build
```

## Teknolojiler

- **Frontend**: React + Vite + TailwindCSS
- **Backend/DB**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Hosting**: Vercel

## Ortam Değişkenleri

Supabase bilgileri `src/services/supabase.js` dosyasında tanımlıdır.

## Lisans

MIT
