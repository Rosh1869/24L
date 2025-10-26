# AI Agent Instructions for 24L Time Logger

## Project Overview

24L is a Next.js-based time logging application that helps track work hours. The application uses Prisma with Neon serverless database for data persistence and Shadcn/ui components for the UI.

## Key Technologies

- Next.js with TypeScript
- Prisma ORM
- Neon Serverless Database
- TailwindCSS
- Shadcn/ui components

## Core Architecture

### Data Model

The main data model is the `Worklog` type defined in `src/app/page.tsx`:

```typescript
type Worklog = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
};
```

### Key Components

1. **Time Logger Form** (`src/app/page.tsx`)
   - Handles work hour submissions
   - Calculates hours automatically including overnight shifts
   - Validates and formats date/time inputs

2. **Worklog Display** (`src/app/page.tsx`)
   - Shows all logged entries in a table format
   - Provides deletion functionality
   - Calculates total hours and amount (£6 per hour)

## Database Integration

- Uses Neon serverless database through Prisma
- Main operations are defined in `src/app/page.tsx`:
  - SELECT for fetching worklogs
  - INSERT for creating new entries
  - DELETE for removing entries

## Project Conventions

1. **Date Handling**
   - Dates are stored in ISO format
   - Display format: DD/MM/YYYY
   - Time format: 24-hour with hours and minutes

2. **State Management**
   - Uses React's useState and useEffect for local state
   - Implements useCallback for memoized functions

3. **Error Handling**
   - Database operations are wrapped in try-catch blocks
   - Environment variable checks for DATABASE_URL

## Common Development Tasks

1. **Working with Time Calculations**
   - Hours are calculated by converting times to minutes
   - Special handling for overnight shifts when end time < start time

## Important Files

- `src/app/page.tsx` - Main application logic and UI
- `prisma/schema.prisma` - Database schema
- `components/ui/*` - Reusable UI components
