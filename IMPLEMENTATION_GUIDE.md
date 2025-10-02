# Implementation Guide - Backend (Dev 2)

## ✅ Yang Sudah Dibuat

### 1. API Routes
- ✅ `/api/queue/enqueue` - Tambah user ke antrian
- ✅ `/api/queue/status` - Cek posisi & status user  
- ✅ `/api/queue/dequeue` - Keluarkan user dari antrian (admin)
- ✅ `/api/behavior/track` - Update trust score berdasarkan behavior
- ✅ `/api/verify/captcha` - Verifikasi captcha & update trust
- ✅ `/api/demand/predict` - AI demand prediction (dummy)

### 2. Utils & Libraries
- ✅ Trust scoring engine (`/src/utils/scoring.js`)
- ✅ Supabase client setup (`/src/utils/supabase.js`)
- ✅ Behavior tracker untuk frontend (`/src/utils/behaviorTracker.js`)

### 3. Documentation
- ✅ Database schema (`DATABASE_SCHEMA.md`)
- ✅ Implementation guide (file ini)

## 🔄 Langkah Selanjutnya

### Langkah 1: Setup Database di Supabase
1. Buka Supabase Dashboard: https://app.supabase.com
2. Pilih project Anda
3. Pergi ke **SQL Editor**
4. Copy-paste semua SQL dari `DATABASE_SCHEMA.md` dan jalankan

### Langkah 2: Update Environment Variables
1. Buka Supabase Dashboard > Settings > API
2. Copy **service_role** key (bukan anon key!)
3. Update `SUPABASE_SERVICE_KEY` di `.env.local`
4. Ganti `QUEUE_SECRET` dengan random string yang aman

### Langkah 3: Test API Endpoints
Jalankan development server:
```bash
npm run dev
```

Test dengan curl atau Postman:

#### Test Enqueue
```bash
curl -X POST http://localhost:3000/api/queue/enqueue \
  -H "Content-Type: application/json"
```

#### Test Status  
```bash
curl "http://localhost:3000/api/queue/status?userId=USER_ID_DARI_ENQUEUE"
```

#### Test Behavior Tracking
```bash
curl -X POST http://localhost:3000/api/behavior/track \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "metrics": {
      "mouseData": {
        "avgSpeed": 1500,
        "variance": 200,
        "totalDistance": 5000,
        "clickAccuracy": 0.85
      },
      "sessionData": {
        "timeOnPage": 120000,
        "interactionCount": 25,
        "focusChanges": 2
      }
    }
  }'
```

### Langkah 4: Koordinasi dengan Tim

#### Untuk Dev 1 (Frontend/UI):
Berikan informasi API endpoints:

**Enqueue User:**
```javascript
const response = await fetch('/api/queue/enqueue', {
  method: 'POST'
});
const { userId } = await response.json();
```

**Check Queue Status:**
```javascript
const response = await fetch(`/api/queue/status?userId=${userId}`);
const { position, status, requiresCaptcha } = await response.json();
```

**Behavior Tracking:**
```javascript
import { initializeBehaviorTracking } from '../utils/behaviorTracker';

const tracker = initializeBehaviorTracking(userId);
const intervalId = tracker.startPeriodicTracking(30000); // Kirim setiap 30 detik
```

#### Untuk Dev 3 (Infra/Realtime):
- Realtime updates bisa dilakukan dengan polling `/api/queue/status` setiap 2-3 detik
- Atau setup Supabase realtime subscription pada tabel `queue`
- Admin dashboard bisa query langsung ke database untuk monitoring

### Langkah 5: Additional Features (Optional)

#### Analytics Dashboard API
```javascript
// /api/admin/analytics
// - Total users per trust level
// - Queue performance metrics  
// - Behavior analysis summary
```

#### Webhook untuk External Integration
```javascript
// /api/webhooks/queue-events
// - Notify external systems saat user lolos antrian
// - Integration dengan payment atau booking system
```

## 🔧 Testing Scenarios

### Test Case 1: Normal User Flow
1. User masuk → API enqueue
2. User main game → Behavior tracking update trust score
3. User check status → Position + trust level
4. User lolos antrian → Status = "passed"

### Test Case 2: Suspicious User (Bot)
1. User dengan mouse movement terlalu cepat/konsisten
2. Trust score turun → Level = "Low"
3. Status check return `requiresCaptcha: true`
4. Frontend tampilkan captcha
5. Captcha berhasil → Trust level naik ke "Medium"

### Test Case 3: High Traffic
1. Multiple users enqueue bersamaan
2. AI prediction aktifkan waiting room
3. Admin dequeue beberapa user bersamaan
4. Check race condition handling

## 📋 Checklist Completion

- [ ] Database setup di Supabase
- [ ] Environment variables configured  
- [ ] All API endpoints tested
- [ ] Frontend integration dengan Dev 1
- [ ] Realtime setup dengan Dev 3
- [ ] Error handling & logging
- [ ] Security testing (rate limiting, input validation)
- [ ] Performance testing dengan multiple users

## 🚀 Deployment Notes

- Pastikan semua environment variables ter-set di production
- Database indexes sudah optimal untuk performa
- Rate limiting untuk mencegah spam API calls
- Monitoring & logging untuk debugging

## 🤝 Tim Coordination

**Daily Standup Items:**
- Status API endpoints development
- Integration blockers dengan frontend
- Database performance issues
- Security concerns atau vulnerabilities found

**Demo Preparation:**
- Prepare test data untuk demo
- Mock high traffic scenarios
- Show trust scoring in action
- Demo adaptive verification (captcha)