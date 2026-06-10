99|BEGIN
100|    LOOP
101|        code := 'MC';

102|        FOR i IN 1..8 LOOP
103|            code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);

104|        END LOOP;

105|        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.affiliate_profiles WHERE affiliate_code = code);

106|    END LOOP;