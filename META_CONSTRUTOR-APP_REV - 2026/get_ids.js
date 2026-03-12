const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const s = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);
(async () => {
    const { data: o } = await s.from('obras').select('id').limit(1);
    const { data: r } = await s.from('rdos').select('id').limit(1);
    require('fs').writeFileSync(
        'ids.txt',
        'OBRA=' + (o && o[0] ? o[0].id : 'none') + '\n' +
        'RDO=' + (r && r[0] ? r[0].id : 'none')
    );
    console.log('DONE');
})();
