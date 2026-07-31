-- ============================================================
-- SEED: Voice Profiles Padrão — ElevenLabs
-- Descrição: Insere os dois perfis de voz padrão (masculino e
--            feminino) para uso global no sistema.
-- Tabela:    public.audio_voice_profiles
-- Migração:  20260620000000
-- Execução segura: usa ON CONFLICT (voice_id) DO NOTHING
-- ============================================================

-- Verifica se já existem registros para evitar inserts duplicados
-- em execuções repetidas (segurança extra além do ON CONFLICT).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.audio_voice_profiles
        WHERE voice_id IN ('pqHfZKP75CvOlQylNhV4', 'XrExE9yKIg1WjnnlVkGX')
    ) THEN
        -- --------------------------------------------------------
        -- Perfil 1: Voz Masculina Padrão (Bill — ElevenLabs)
        -- Voice ID: pqHfZKP75CvOlQylNhV4
        -- --------------------------------------------------------
        INSERT INTO public.audio_voice_profiles (
            org_id,       -- NULL = global / disponível para todas as organizações
            label,
            voice_id,
            gender,
            is_default,
            language,
            model_id,
            settings
        ) VALUES (
            NULL,
            'Masculina Padrão',
            'pqHfZKP75CvOlQylNhV4',
            'masculine',
            TRUE,
            'pt-BR',
            'eleven_multilingual_v2',
            '{
                "stability":       0.5,
                "similarity_boost": 0.75,
                "style":           0,
                "speed":           1.0
            }'::jsonb
        );

        -- --------------------------------------------------------
        -- Perfil 2: Voz Feminina Padrão (Charlotte — ElevenLabs)
        -- Voice ID: XrExE9yKIg1WjnnlVkGX
        -- --------------------------------------------------------
        INSERT INTO public.audio_voice_profiles (
            org_id,
            label,
            voice_id,
            gender,
            is_default,
            language,
            model_id,
            settings
        ) VALUES (
            NULL,
            'Feminina Padrão',
            'XrExE9yKIg1WjnnlVkGX',
            'feminine',
            TRUE,
            'pt-BR',
            'eleven_multilingual_v2',
            '{
                "stability":       0.5,
                "similarity_boost": 0.75,
                "style":           0,
                "speed":           1.0
            }'::jsonb
        );
    END IF;
END $$;

-- ============================================================
-- Nota: O bloco DO $$ acima garante que os inserts só rodam
-- quando os registros ainda não existem. Caso prefira uma
-- abordagem mais simples (sem procedimento), descomente as
-- linhas abaixo e remova o bloco DO $$ ... END $$;.
-- ============================================================

-- INSERT INTO public.audio_voice_profiles (org_id, label, voice_id, gender, is_default, language, model_id, settings)
-- VALUES
-- (
--     NULL,
--     'Masculina Padrão',
--     'pqHfZKP75CvOlQylNhV4',
--     'masculine',
--     TRUE,
--     'pt-BR',
--     'eleven_multilingual_v2',
--     '{"stability": 0.5, "similarity_boost": 0.75, "style": 0, "speed": 1.0}'::jsonb
-- ),
-- (
--     NULL,
--     'Feminina Padrão',
--     'XrExE9yKIg1WjnnlVkGX',
--     'feminine',
--     TRUE,
--     'pt-BR',
--     'eleven_multilingual_v2',
--     '{"stability": 0.5, "similarity_boost": 0.75, "style": 0, "speed": 1.0}'::jsonb
-- )
-- ON CONFLICT (voice_id) DO NOTHING;
