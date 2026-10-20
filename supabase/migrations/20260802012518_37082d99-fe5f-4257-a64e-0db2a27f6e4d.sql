CREATE OR REPLACE FUNCTION public.nearby_health_posts(_lat double precision, _lng double precision, _limit integer DEFAULT 30, _donations_only boolean DEFAULT false)
RETURNS TABLE (
  id uuid,
  name text,
  address text,
  city text,
  state text,
  cep text,
  phone text,
  lat double precision,
  lng double precision,
  accepts_donations boolean,
  distance_km double precision
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT h.id, h.name, h.address, h.city, h.state, h.cep, h.phone, h.lat, h.lng, h.accepts_donations,
         6371 * 2 * asin(sqrt(
           power(sin(radians(h.lat - _lat) / 2), 2) +
           cos(radians(_lat)) * cos(radians(h.lat)) * power(sin(radians(h.lng - _lng) / 2), 2)
         )) AS distance_km
  FROM public.health_posts h
  WHERE (NOT _donations_only OR h.accepts_donations)
    AND h.lat BETWEEN _lat - 1.5 AND _lat + 1.5
    AND h.lng BETWEEN _lng - 1.5 AND _lng + 1.5
  ORDER BY distance_km
  LIMIT LEAST(GREATEST(COALESCE(_limit, 30), 1), 100);
$$;

GRANT EXECUTE ON FUNCTION public.nearby_health_posts(double precision, double precision, integer, boolean) TO anon, authenticated;