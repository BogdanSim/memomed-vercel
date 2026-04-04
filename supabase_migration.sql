-- =========================================
-- Rulează acest fișier în Supabase SQL Editor
-- =========================================

-- Tabelul profiles (date personale per utilizator)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not')),
  notifications_push BOOLEAN DEFAULT true,
  notifications_email BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilizatorii văd doar profilul propriu"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Utilizatorii pot insera propriul profil"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Utilizatorii pot actualiza propriul profil"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Tabelul addresses (adrese de livrare)
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Acasă',
  first_name TEXT,
  last_name TEXT,
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  county TEXT NOT NULL,
  postal_code TEXT,
  phone TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilizatorii gestionează doar adresele proprii"
  ON addresses FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);
