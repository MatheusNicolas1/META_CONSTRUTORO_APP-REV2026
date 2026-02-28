import dotenv from 'dotenv';
dotenv.config();
console.log('URL:', process.env.VITE_SUPABASE_URL);
console.log('HAS_ANON:', !!process.env.VITE_SUPABASE_ANON_KEY);
console.log('HAS_SERVICE:', !!process.env.SUPABASE_SERVICE_ROLE_KEY || !!process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
console.log('DB_URL_EXISTS:', !!process.env.DATABASE_URL);
