# BidBase Tender Listing

A Next.js application for browsing and searching government tenders with advanced filtering capabilities.

## Tech Stack

- **Framework**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database**: Supabase
- **Data Fetching**: SWR
- **Testing**: Vitest with React Testing Library

## Getting Started

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase project credentials

4. Run the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:ui` - Run tests with UI

## Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── tender/         # Tender-specific components
│   ├── search/         # Search components
│   ├── filters/        # Filter components
│   └── stats/          # Statistics components
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── test/               # Test setup and utilities
```

## Environment Variables

Required environment variables (see `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for server-side operations)
