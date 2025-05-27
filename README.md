# Retail Insights Dashboard PH

Real-time retail analytics dashboard for sari-sari stores in the Philippines.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/jgtolentino/retail-insights-dashboard-ph.git
   cd retail-insights-dashboard-ph
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example env file
   cp .env.example .env.local
   
   # Edit .env.local with your Supabase credentials
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   npm run preview  # Test the production build locally
   ```

## 📊 Database Schema

The dashboard expects the following Supabase tables:

### brands
- `id` (int8, primary key)
- `name` (text)
- `is_tbwa` (boolean)
- `category` (text)
- `created_at` (timestamp)

### products
- `id` (int8, primary key)
- `name` (text)
- `brand_id` (int8, foreign key → brands.id)
- `price` (numeric)
- `created_at` (timestamp)

### transaction_items
- `id` (int8, primary key)
- `product_id` (int8, foreign key → products.id)
- `quantity` (int4)
- `price` (numeric)
- `transaction_date` (timestamp)
- `created_at` (timestamp)

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel
- **Build Tool**: Vite

## 📝 Common Issues & Solutions

### Blank Dashboard
- **Check Supabase connection**: Ensure your environment variables are set correctly
- **Verify data exists**: The dashboard needs data in the tables to display
- **Check browser console**: Look for any connection errors

### Build Errors
- **Clear node_modules**: `rm -rf node_modules && npm install`
- **Check TypeScript errors**: `npm run type-check`
- **Verify all imports**: Make sure you're using the correct import paths

### Deployment Issues
- **Environment variables**: Ensure they're set in your deployment platform
- **Build command**: Use `npm run build`
- **Output directory**: Set to `dist`

## 🧪 Testing Checklist

Before deploying:
- [ ] Run locally with `npm run dev`
- [ ] Check browser console for errors
- [ ] Test with empty database
- [ ] Test with sample data
- [ ] Build locally with `npm run build`
- [ ] Test the build with `npm run preview`
- [ ] Verify all environment variables
- [ ] Check Supabase connection

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test thoroughly
4. Commit: `git commit -m "feat: add new feature"`
5. Push: `git push origin feature/your-feature`
6. Create a Pull Request

## 📄 License

MIT

---

*Originally created with [Lovable](https://lovable.dev/projects/1d517f38-8a42-4920-b574-0a192238853b)*
