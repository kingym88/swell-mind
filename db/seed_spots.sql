-- SwellMind - Seed Portugal Surf Spots
-- Run this after schema.sql

INSERT INTO public.spots (name, region, lat, lng, orientation_degrees, break_type, difficulty, description) VALUES

-- Ericeira Area
('Ribeira d''Ilhas', 'ericeira', 38.9847, -9.4189, 270, 'point', 'intermediate', 
 'World-class right-hand point break. Part of the World Surfing Reserve.'),

('Coxos', 'ericeira', 38.9756, -9.4231, 280, 'reef', 'expert', 
 'Heavy, powerful right-hander. One of Portugal''s best waves.'),

('Cave', 'ericeira', 38.9633, -9.4203, 270, 'reef', 'advanced', 
 'Fast, hollow left and right. Best on medium-sized swells.'),

('Foz do Lizandro', 'ericeira', 38.9417, -9.4172, 270, 'beach', 'beginner', 
 'Mellow beach break at river mouth. Great for beginners.'),

-- Peniche Area
('Supertubos', 'peniche', 39.3456, -9.3628, 270, 'beach', 'expert', 
 'One of Europe''s heaviest beach breaks. Hosts WSL events.'),

('Baleal', 'peniche', 39.3742, -9.3394, 270, 'beach', 'beginner', 
 'Gentle beach break, perfect for learning. Multiple peaks.'),

('Molho Leste', 'peniche', 39.3567, -9.3578, 180, 'point', 'intermediate', 
 'Protected from north winds. Works on big swells.'),

('Lagide', 'peniche', 39.3689, -9.3478, 290, 'reef', 'advanced', 
 'Powerful right-hander. Needs solid swell.'),

-- Lisbon Coast
('Guincho', 'lisbon', 38.7297, -9.4744, 270, 'beach', 'intermediate', 
 'Exposed beach break, often windy. Beautiful setting near Sintra.'),

('Carcavelos', 'lisbon', 38.6756, -9.3344, 220, 'beach', 'beginner', 
 'Most popular surf beach in Lisbon. Consistent waves, crowds.'),

('Costa da Caparica', 'lisbon', 38.6453, -9.2356, 270, 'beach', 'beginner', 
 'Long stretch of beach breaks south of Lisbon. Something for everyone.'),

('Fonte da Telha', 'lisbon', 38.5656, -9.1889, 270, 'beach', 'intermediate', 
 'Less crowded beach south of Caparica. Good peaks at low tide.'),

('São Pedro do Estoril', 'lisbon', 38.6933, -9.3794, 240, 'reef', 'intermediate', 
 'Reef break with defined peaks. Sheltered from north swell.'),

-- Cascais
('Praia do Guincho-Cascais', 'cascais', 38.7267, -9.4711, 270, 'beach', 'intermediate', 
 'Northern end of Guincho. Scenic waves with Sintra backdrop.'),

('Bafureira', 'cascais', 38.6889, -9.3700, 260, 'reef', 'advanced', 
 'Fast reef break near Cascais marina. Localized.');
