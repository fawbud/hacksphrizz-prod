# Database Schema Documentation

## Tabel yang perlu dibuat di Supabase

### 1. Queue Table
```sql
CREATE TABLE IF NOT EXISTS queue (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'passed', 'processing')),
  enqueued_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  trust_score INTEGER DEFAULT 100 CHECK (trust_score >= 0 AND trust_score <= 100),
  trust_level VARCHAR(10) DEFAULT 'High' CHECK (trust_level IN ('High', 'Medium', 'Low')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes untuk performa
CREATE INDEX IF NOT EXISTS idx_queue_status_enqueued ON queue(status, enqueued_at);
CREATE INDEX IF NOT EXISTS idx_queue_user_id ON queue(user_id);
CREATE INDEX IF NOT EXISTS idx_queue_status ON queue(status);
```

### 2. Behavior Logs Table (For comprehensive behavior analysis)
```sql
CREATE TABLE IF NOT EXISTS behavior_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES queue(user_id),
  metrics JSONB NOT NULL,
  trust_score INTEGER,
  trust_level VARCHAR(10),
  reasons TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index untuk queries
CREATE INDEX IF NOT EXISTS idx_behavior_logs_user_id ON behavior_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_behavior_logs_created_at ON behavior_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_behavior_logs_trust_score ON behavior_logs(trust_score);
```

### 3. Bookings Table Enhancement
```sql
-- Add trust_score column to existing bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS trust_score INTEGER CHECK (trust_score >= 0 AND trust_score <= 100);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS behavior_verified BOOLEAN DEFAULT false;

-- Index for trust score analysis
CREATE INDEX IF NOT EXISTS idx_bookings_trust_score ON bookings(trust_score);
```

### 3. Config Table
```sql
CREATE TABLE IF NOT EXISTS config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  is_waiting_room_active BOOLEAN DEFAULT false,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ai_confidence DECIMAL(3,2),
  trigger_reason TEXT,
  CONSTRAINT single_config_row CHECK (id = 1)
);

-- Insert default config
INSERT INTO config (id, is_waiting_room_active) 
VALUES (1, false) 
ON CONFLICT (id) DO NOTHING;
```

### 4. Database Function untuk Dequeue
```sql
CREATE OR REPLACE FUNCTION dequeue_users(limit_count INTEGER)
RETURNS TABLE (dequeued_user_id UUID)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH users_to_process AS (
    SELECT user_id
    FROM queue
    WHERE status = 'waiting'
    ORDER BY enqueued_at
    LIMIT limit_count
    FOR UPDATE SKIP LOCKED -- Kunci baris agar tidak diambil proses lain
  )
  UPDATE queue
  SET status = 'passed', updated_at = now()
  WHERE queue.user_id IN (SELECT user_id FROM users_to_process)
  RETURNING queue.user_id;
END;
$$;
```

### 5. RLS (Row Level Security) Policies
```sql
-- Enable RLS
ALTER TABLE queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavior_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

-- Policies untuk queue table
CREATE POLICY "Users can read their own queue data" ON queue
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Service role can manage all queue data" ON queue
  FOR ALL USING (auth.role() = 'service_role');

-- Policies untuk behavior_logs
CREATE POLICY "Service role can manage behavior logs" ON behavior_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Policies untuk config
CREATE POLICY "Anyone can read config" ON config
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage config" ON config
  FOR ALL USING (auth.role() = 'service_role');
```

## Environment Variables yang dibutuhkan
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Security
QUEUE_SECRET=your-secret-key-here

# Captcha (pilih salah satu atau keduanya)
HCAPTCHA_SECRET_KEY=your_hcaptcha_secret
RECAPTCHA_SECRET_KEY=your_recaptcha_secret
```

## API Endpoints Summary

### Queue Management
- `POST /api/queue/enqueue` - Add user to queue
- `GET /api/queue/status?userId=xxx` - Check queue position
- `POST /api/queue/dequeue` - Remove users from queue (admin)

### Behavior Tracking
- `POST /api/behavior/track` - Update trust score based on behavior

### Verification
- `POST /api/verify/captcha` - Verify captcha and update trust

### AI Demand Prediction
- `GET /api/demand/predict` - Check if waiting room should be active
- `POST /api/demand/predict` - Update waiting room status (admin)