# 🧪 AI Test Controls - Quick Guide

## Tombol Test yang Sudah Ditambahkan

### 1. **Banner Test di Atas (Development Mode)**
- **Lokasi**: Sticky banner di bagian atas halaman booking
- **Fitur**:
  - ✅ Real-time trust score display
  - ✅ Event counter (mouse + keyboard)
  - ✅ Status analyzer (analyzing/ready)
  - ✅ Quick test buttons

### 2. **Floating Panel (Kanan Bawah)**
- **Lokasi**: Fixed position di pojok kanan bawah
- **Fitur**:
  - ✅ Detailed trust score breakdown
  - ✅ Status monitoring
  - ✅ Component statistics
  - ✅ Real-time updates

### 3. **Inline Test Controls (Checkout Step)**
- **Lokasi**: Di dalam form checkout
- **Fitur**:
  - ✅ Quick access buttons
  - ✅ Status indicator
  - ✅ Integrated with form flow

## Cara Testing AI

### 🤖 **Analyze My Behavior**
1. Klik tombol "🤖 Analyze" di banner/panel
2. Sistem akan menganalisis behavior data yang sudah terkumpul
3. Trust score akan diupdate secara real-time
4. Hasil ditampilkan di semua panel

### 🎭 **Simulate Bot Behavior**
1. Klik tombol "🎭 Bot" 
2. Sistem akan inject data bot (perfect timing, linear movement)
3. Trust score akan turun drastis (biasanya < 0.3)
4. Captcha akan muncul otomatis jika score ≤ 0.5

### 🔄 **Reset Data**
1. Klik tombol "🔄 Reset"
2. Semua behavior data akan dibersihkan
3. Trust score kembali ke default (1.0)
4. Tracking dimulai dari awal

## Lokasi Test Controls

```
📱 Booking Page Layout:
┌─────────────────────────────────────┐
│ 🧪 AI Test Banner (Sticky Top)     │ ← Paling mudah diakses
├─────────────────────────────────────┤
│ Timer & Price Section              │
│                                     │
│ ▶ Booking Steps                     │
│   ├─ Step 1: Passengers            │
│   ├─ Step 2: Seats                 │
│   ├─ Step 3: Protections           │
│   ├─ Step 4: Meal & Cab            │
│   └─ Step 5: Checkout              │
│       └─ 🧪 Inline Test Panel      │ ← Test saat checkout
│                                     │
│                    🧪 Floating     │ ← Always visible
│                       Panel        │
└─────────────────────────────────────┘
```

## Status Monitoring

### Trust Score Levels:
- **🟢 HIGH (80-100%)**: Trusted user, no captcha
- **🟡 MEDIUM (60-79%)**: Normal verification
- **🟠 LOW (40-59%)**: Monitor closely
- **🔴 SUSPICIOUS (0-39%)**: Captcha required

### Event Counters:
- **Mouse Events**: Gerakan, click, scroll
- **Keyboard Events**: Typing patterns, timing
- **Form Events**: Focus, blur, interactions

## Tips Testing

1. **Normal User Testing**:
   - Gerakkan mouse secara natural
   - Ketik dengan kecepatan normal
   - Isi form dengan wajar
   - Score biasanya 0.7-0.9

2. **Bot Simulation**:
   - Klik "🎭 Bot" untuk instant bot simulation
   - Score akan turun ke 0.2-0.4
   - Captcha akan muncul otomatis

3. **Performance Testing**:
   - Monitor banner untuk event count
   - Check response time (should be < 2 seconds)
   - Test timeout fallback (5-second limit)

## URL Testing

- **Main App**: http://localhost:3003/book
- **Test Page**: http://localhost:3003/test-behavior-tracking.html

## Console Commands (Development)

```javascript
// Manual trigger dari browser console
window.testAnalyzeBehavior();  // Analyze current behavior
window.testSimulateBot();      // Inject bot data  
window.testReset();            // Reset all data
```

## Troubleshooting

### Jika Tombol Tidak Muncul:
1. Pastikan `NODE_ENV=development`
2. Refresh browser (Ctrl+F5)
3. Check browser console untuk error

### Jika AI Tidak Respond:
1. Check network tab untuk API calls
2. Verify behavior data di floating panel
3. Test dengan "Reset" dulu

### Jika Trust Score Tidak Update:
1. Pastikan user sudah login
2. Check floating panel untuk event count
3. Coba generate lebih banyak events (mouse/keyboard)

---
**Status**: ✅ All test controls active
**Environment**: Development mode only
**Last Updated**: October 3, 2025