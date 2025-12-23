-- Pricing table for packages and add-ons
CREATE TABLE IF NOT EXISTS public.pricing (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('package', 'addon')),
    price NUMERIC NOT NULL,
    duration TEXT,
    features JSONB,
    display_order INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Seed initial packages
INSERT INTO public.pricing (slug, name, category, price, duration, features, display_order)
VALUES
    ('essential', 'Essential', 'package', 150000, '6 hours', '["6 hours coverage","300+ photos","Online gallery","2 photographers"]', 1),
    ('premium', 'Premium', 'package', 225000, '8 hours', '["8 hours coverage","500+ photos","Online gallery","2 photographers","Engagement session","Premium album"]', 2),
    ('luxury', 'Luxury', 'package', 300000, '10 hours', '["10 hours coverage","700+ photos","Online gallery","2 photographers","Engagement session","Premium album","Drone photography"]', 3)
ON CONFLICT (slug) DO NOTHING;

-- Seed initial add-ons
INSERT INTO public.pricing (slug, name, category, price, features, display_order)
VALUES
    ('drone', 'Drone Photography', 'addon', 25000, '[]', 1),
    ('videography', 'Wedding Videography', 'addon', 65000, '[]', 2),
    ('album', 'Premium Album', 'addon', 40000, '[]', 3),
    ('prints', 'Print Package', 'addon', 15000, '[]', 4),
    ('rush', 'Rush Delivery', 'addon', 20000, '[]', 5)
ON CONFLICT (slug) DO NOTHING;

-- Index for category/order
CREATE INDEX IF NOT EXISTS idx_pricing_category ON public.pricing(category);
CREATE INDEX IF NOT EXISTS idx_pricing_display_order ON public.pricing(display_order);

