# Rebuild Sri Lanka

A comprehensive national post-disaster damage-assessment and resource-allocation platform designed to help Sri Lanka recover from major floods. This system enables citizens to report property damage, visualizes aggregated damage data by GND (Grama Niladhari Division), and supports government and NGO decision-making for equitable funding distribution and rebuilding.

## Features

- **Public Damage Reporting**: Citizens can submit detailed property damage reports with photos, location data, and property information
- **GND Classification**: Automatic matching of submissions to GND polygons using GeoJSON data
- **Interactive Map Dashboard**: Visualize aggregated damage by GND with color-coded severity levels
- **Admin Dashboard**: Protected access for administrators to view all submissions, filter, sort, and export data
- **Support & Rebuild Section**: NGOs and volunteers can post available resources and support
- **Mobile Responsive**: Optimized for low-bandwidth connections and mobile devices
- **Privacy-First**: Public users can only view aggregated statistics; personal data is protected

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL with PostGIS)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (for photos)
- **Maps**: Leaflet, React-Leaflet
- **Deployment**: Vercel (optimized for free tier)

## Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account (free tier works)
- GND GeoJSON file (Grama Niladhari Division boundaries)

## Setup Instructions

### 1. Clone and Install

```bash
# Install dependencies
npm install
```

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the migration file:
   ```sql
   -- Copy and paste contents of supabase/migrations/001_initial_schema.sql
   ```
3. Create a storage bucket named `damage-photos`:
   - Go to Storage in Supabase dashboard
   - Create new bucket: `damage-photos`
   - Set it to public (or configure RLS policies as needed)

4. Set up authentication:
   - Go to Authentication > Settings
   - Configure email/password authentication
   - Add your admin email to the `admin_users` table:
     ```sql
     INSERT INTO admin_users (email, role)
     VALUES ('your-admin-email@example.com', 'admin');
     ```

5. Get your Supabase credentials:
   - Go to Project Settings > API
   - Copy your Project URL and anon key
   - Copy your service_role key (keep this secret!)

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ADMIN_EMAIL=your_admin_email@example.com
GND_GEOJSON_URL=https://your-domain.com/gnd.geojson  # Optional: URL to your GND GeoJSON
```

### 4. GND GeoJSON Setup

1. Place your GND GeoJSON file in the `public` directory as `gnd.geojson`
2. Ensure the GeoJSON has the following structure:
   ```json
   {
     "type": "FeatureCollection",
     "features": [
       {
         "type": "Feature",
         "properties": {
           "gnd_code": "12345",
           "gnd_name": "GND Name"
         },
         "geometry": {
           "type": "Polygon",
           "coordinates": [...]
         }
       }
     ]
   }
   ```
3. The properties can also use `code`/`name` or `GND_CODE`/`GND_NAME` - the system will try all variations

### 5. Create Admin User

After setting up Supabase, create your admin user:

1. Sign up for an account using your admin email in Supabase Auth
2. Get the user ID from Supabase dashboard
3. Insert into admin_users table:
   ```sql
   INSERT INTO admin_users (id, email, role)
   VALUES ('user-uuid-from-auth', 'your-admin-email@example.com', 'admin');
   ```

Alternatively, you can use the Supabase dashboard to manually add the user.

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_EMAIL`
   - `GND_GEOJSON_URL` (optional)

4. Deploy!

### GND GeoJSON for Production

For production, you have several options:

1. **Host in public folder**: Place `gnd.geojson` in `public/` - it will be served at `/gnd.geojson`
2. **Supabase Storage**: Upload to Supabase Storage and use the public URL
3. **CDN**: Host on a CDN and set `GND_GEOJSON_URL` environment variable
4. **GitHub**: Host in a GitHub repository and use raw file URL

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── reports/       # Damage report endpoints
│   │   ├── support/       # Support post endpoints
│   │   └── upload/        # File upload endpoint
│   ├── admin/             # Admin dashboard
│   ├── map/               # Map visualization
│   ├── report/            # Damage report form
│   ├── support/           # Support & Rebuild section
│   └── page.tsx           # Homepage
├── components/            # React components
│   ├── AdminDashboard.tsx
│   ├── DamageMap.tsx
│   ├── DamageReportForm.tsx
│   └── ...
├── lib/                   # Utilities and helpers
│   ├── supabase/         # Supabase client configuration
│   └── utils/            # Utility functions
├── supabase/             # Database migrations
│   └── migrations/
└── public/               # Static files (including gnd.geojson)
```

## API Endpoints

### Public Endpoints

- `POST /api/reports/submit` - Submit damage report
- `GET /api/reports/aggregate` - Get aggregated damage data by GND
- `POST /api/support/submit` - Submit support post
- `GET /api/support/list` - List active support posts
- `POST /api/upload` - Upload photo

### Admin Endpoints (Requires Authentication)

- `GET /api/reports/list` - List all damage reports (with filters)
- `GET /api/reports/export` - Export reports (CSV/Excel/GeoJSON)

## Database Schema

### damage_reports
- `id` (UUID)
- `created_at` (Timestamp)
- `gnd_code` (Text)
- `gnd_name` (Text)
- `location` (PostGIS Point)
- `property_type` (Text)
- `property_condition` (Text)
- `damage_level` (Integer 1-10)
- `estimated_damage_lkr` (Numeric)
- `affected_residents` (Integer)
- `description` (Text)
- `contact_name` (Text, optional)
- `contact_phone` (Text, optional)
- `contact_email` (Text, optional)
- `photos` (Text array)
- `status` (pending/verified/rejected)
- `verified_by` (UUID, foreign key)
- `verified_at` (Timestamp)

### support_posts
- `id` (UUID)
- `created_at` (Timestamp)
- `organization_name` (Text)
- `contact_name` (Text)
- `contact_phone` (Text)
- `contact_email` (Text, optional)
- `support_type` (Text)
- `description` (Text)
- `location_preference` (Text, optional)
- `status` (active/fulfilled/inactive)

### admin_users
- `id` (UUID, foreign key to auth.users)
- `email` (Text)
- `created_at` (Timestamp)
- `role` (admin/government_agent)

## Security

- Row Level Security (RLS) enabled on all tables
- Public users can only insert reports and view aggregated stats
- Admin authentication required for sensitive operations
- Photo uploads validated for type and size
- Input validation on all forms

## Performance Optimizations

- Image optimization for low-bandwidth users
- Lazy loading of map components
- Pagination for admin dashboard
- Caching of aggregated data
- Compressed responses

## Future Enhancements

- Real-time updates via Supabase subscriptions
- SMS notifications for report submissions
- Advanced analytics and reporting
- Integration with government systems
- Mobile app version
- Multi-language support (Sinhala/Tamil)

## Contributing

This is a production-ready system designed for national-scale deployment. When contributing:

1. Maintain code quality and TypeScript types
2. Follow existing patterns and structure
3. Test thoroughly before deployment
4. Consider low-bandwidth users in optimizations
5. Ensure accessibility standards

## License

This project is built for public service and disaster relief in Sri Lanka.

## Support

For issues or questions, please contact through the admin portal or create an issue in the repository.

---

**Built with ❤️ for Sri Lanka**

