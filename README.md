# 24L Time Logger

24L is a Next.js-based time logging application designed to help users track work hours efficiently. It features automatic hour calculation (including overnight shifts), a modern UI, and persistent storage using Prisma with Neon serverless database.

## Features

- Log work hours with date, start time, and end time
- Automatic calculation of hours (supports overnight shifts)
- View, delete, and manage worklog entries
- Total hours and amount calculation
- Responsive UI built with Shadcn/ui and TailwindCSS

## Technology Stack

- **Next.js** (TypeScript)
- **Prisma ORM** (Neon serverless database)
- **TailwindCSS**
- **Shadcn/ui components**

## Getting Started

### Prerequisites

- Node.js 18+
- Neon database account (or PostgreSQL)

### Installation

```bash
yarn
```

### Environment Setup

Create a `.env` file and set your database connection string:

```
DATABASE_URL="your-neon-database-url"
```

### Database Setup

Run Prisma migrations:

```bash
npx prisma migrate deploy
```

### Development

Start the development server:

```bash
yarn dev
```

### Production

Build and start:

```bash
yarn build
yarn start
```

## Usage

- Fill in the date, start time, and end time in the form.
- Submit to log your work hours.
- View all entries in the table, with total hours and amount calculated.
- Delete entries as needed.

## Project Structure

- `src/app/page.tsx` - Main application logic and UI
- `prisma/schema.prisma` - Database schema
- `components/ui/*` - Reusable UI components
