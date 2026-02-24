# Database Setup Instructions

Your PostgreSQL database needs to be configured. Please follow ONE of these options:

## Option 1: Quick Setup (Manual - 2 minutes)

Run these commands in your terminal:

```bash
# 1. Connect to PostgreSQL (you'll be prompted for password)
psql postgres

# 2. Once connected, run these SQL commands:
CREATE DATABASE medimind;
\q

# 3. Then run migrations
cd /Users/theophilusogieva/Desktop/MediMindPlus/MediMindPlus/backend
npx prisma db push

# 4. Start the backend
npm run dev
```

## Option 2: If you don't know your PostgreSQL password

### Reset PostgreSQL Password (macOS with Homebrew):

```bash
# 1. Find pg_hba.conf file
psql -U postgres -c "SHOW hba_file;" 2>/dev/null || echo "Run: psql postgres -c 'SHOW hba_file;'"

# 2. Edit the file (use sudo if needed) and change:
#    FROM: local   all   postgres   md5
#    TO:   local   all   postgres   trust

# 3. Restart PostgreSQL
brew services restart postgresql

# 4. Now you can connect without password
psql postgres

# 5. Set a new password
ALTER USER postgres PASSWORD 'postgres';
\q

# 6. Revert pg_hba.conf back to 'md5'

# 7. Restart PostgreSQL again
brew services restart postgresql
```

## Option 3: Use Docker PostgreSQL (Easiest)

```bash
# 1. Start Docker

# 2. Run PostgreSQL container
docker run --name medimind-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=medimind \
  -p 5432:5432 \
  -d postgres:15

# 3. The backend .env is already configured!

# 4. Run migrations
cd /Users/theophilusogieva/Desktop/MediMindPlus/MediMindPlus/backend
npx prisma db push

# 5. Start the backend
npm run dev
```

## Current Configuration

Your `.env` file is configured with:
```
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=medimind
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/medimind?schema=public"
```

Once the database is created, run:
```bash
cd backend
npx prisma db push
npm run dev
```

## Verification

After setup, you can verify the database connection:
```bash
cd backend
npx prisma db push
```

If successful, you'll see: "Your database is now in sync with your Prisma schema."
