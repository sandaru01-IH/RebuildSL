# Quick Setup Guide

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for database to be ready

2. **Run Database Migration**
   - Go to SQL Editor in Supabase dashboard
   - Copy contents of `supabase/migrations/001_initial_schema.sql`
   - Paste and run in SQL Editor

3. **Create Storage Bucket**
   - Go to Storage in Supabase dashboard
   - Click "New bucket"
   - Name: `damage-photos`
   - Make it public (or configure RLS as needed)

4. **Get API Keys**
   - Go to Project Settings > API
   - Copy:
     - Project URL
     - anon/public key
     - service_role key (keep secret!)

### 3. Configure Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_EMAIL=your-admin@email.com
```

### 4. Add GND GeoJSON

1. Place your GND GeoJSON file in `public/gnd.geojson`
2. Ensure it has `gnd_code` and `gnd_name` in properties
3. See `public/gnd.geojson.example` for format

### 5. Create Admin User

**Option A: Via Supabase Dashboard**
1. Go to Authentication > Users
2. Create a new user with your admin email
3. Note the user ID
4. Go to SQL Editor and run:
   ```sql
   INSERT INTO admin_users (id, email, role)
   VALUES ('user-id-from-auth', 'your-admin@email.com', 'admin');
   ```

**Option B: Via Sign Up**
1. Start the dev server: `npm run dev`
2. Go to `/admin` and sign up with your email
3. Get the user ID from Supabase dashboard
4. Add to admin_users table as above

### 6. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Troubleshooting

### Map Not Loading
- Ensure `public/gnd.geojson` exists
- Check browser console for errors
- Verify GeoJSON format is valid

### Authentication Issues
- Verify environment variables are set correctly
- Check Supabase project is active
- Ensure admin_users table has your user ID

### Photo Upload Fails
- Verify `damage-photos` bucket exists in Supabase Storage
- Check bucket is set to public or RLS policies allow uploads
- Verify file size is under 5MB

### GND Matching Not Working
- Check GeoJSON file format
- Verify coordinates are in [lng, lat] format
- Ensure GND properties match expected names (gnd_code, gnd_name)

## Production Deployment

### Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add all environment variables
4. Deploy!

### GND GeoJSON for Production

- Option 1: Keep in `public/` folder (served at `/gnd.geojson`)
- Option 2: Upload to Supabase Storage and use public URL
- Option 3: Host on CDN and set `GND_GEOJSON_URL` env variable

## Next Steps

1. Customize homepage content for your specific disaster
2. Add your GND GeoJSON data
3. Test all forms and workflows
4. Set up monitoring and analytics
5. Train admin users on dashboard usage

