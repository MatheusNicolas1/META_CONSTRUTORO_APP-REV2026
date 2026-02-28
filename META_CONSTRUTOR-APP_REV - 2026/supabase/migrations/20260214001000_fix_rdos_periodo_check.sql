ALTER TABLE public.rdos DROP CONSTRAINT IF EXISTS rdos_periodo_check;
ALTER TABLE public.rdos ADD CONSTRAINT rdos_periodo_check CHECK (periodo IN ('Manhã', 'Tarde', 'Noite', 'Integral', 'Meio período', 'Turno noturno', 'Turno estendido', 'Personalizado', 'Múltiplos'));
