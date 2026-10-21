-- Route Sense Mumbai — Production Database Schema & Row Level Security (RLS)
-- Supports authenticated user profiles, saved places, commute history, disruption tracking, and AI chat.

-- 1. Profiles Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'COMMUTER' CHECK (role IN ('COMMUTER', 'STAFF', 'ADMIN')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. Saved Places (Home, Work, Frequent Hubs)
CREATE TABLE IF NOT EXISTS public.saved_places (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL, -- e.g. 'Home', 'Work', 'Gym'
  display_name TEXT NOT NULL,
  formatted_address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  category TEXT DEFAULT 'custom',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.saved_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved places"
  ON public.saved_places FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Favourite Routes
CREATE TABLE IF NOT EXISTS public.favourite_routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  origin_name TEXT NOT NULL,
  dest_name TEXT NOT NULL,
  origin_lat DOUBLE PRECISION,
  origin_lng DOUBLE PRECISION,
  dest_lat DOUBLE PRECISION,
  dest_lng DOUBLE PRECISION,
  preferred_mode TEXT,
  custom_label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.favourite_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own favourite routes"
  ON public.favourite_routes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Commute Records & Actual Duration Logs
CREATE TABLE IF NOT EXISTS public.commute_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  transport_mode TEXT NOT NULL,
  scheduled_duration_min INTEGER NOT NULL,
  actual_duration_min INTEGER NOT NULL,
  fare_paid_inr NUMERIC(10, 2) NOT NULL,
  travel_date DATE NOT NULL DEFAULT CURRENT_DATE,
  delay_min INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.commute_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own commute records"
  ON public.commute_records FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. User Preferences & Commute Budget
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  monthly_budget_inr NUMERIC(10, 2) DEFAULT 3000.00,
  preferred_modes TEXT[] DEFAULT ARRAY['TRAIN', 'BUS', 'METRO'],
  max_walking_distance_m INTEGER DEFAULT 800,
  max_transfers INTEGER DEFAULT 1,
  accessibility_required BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences"
  ON public.user_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Disruption Alerts (Public read, Staff/Admin write)
CREATE TABLE IF NOT EXISTS public.disruptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency TEXT NOT NULL, -- 'Central Railway', 'Western Railway', 'BEST', 'Maha Metro'
  corridor TEXT NOT NULL, -- e.g. 'Harbour Line', 'WEH', 'Aqua Line 3'
  title TEXT NOT NULL,
  severity TEXT DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RESOLVED', 'SCHEDULED')),
  description TEXT NOT NULL,
  link_url TEXT,
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

ALTER TABLE public.disruptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Disruptions are readable by all authenticated users"
  ON public.disruptions FOR SELECT
  USING (true);

-- 7. Chat Conversations & Messages
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT 'Mumbai Transit Enquiry',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own chat conversations"
  ON public.chat_conversations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own chat messages"
  ON public.chat_messages FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
