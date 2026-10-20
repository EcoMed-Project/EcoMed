ALTER TABLE public.health_posts
  ADD COLUMN IF NOT EXISTS cnes_code TEXT,
  ADD COLUMN IF NOT EXISTS neighborhood TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS health_posts_cnes_code_key ON public.health_posts (cnes_code) WHERE cnes_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS health_posts_city_state_idx ON public.health_posts (state, city);
CREATE INDEX IF NOT EXISTS health_posts_lat_lng_idx ON public.health_posts (lat, lng);