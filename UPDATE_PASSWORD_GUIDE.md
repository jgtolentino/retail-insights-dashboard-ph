# 🔐 Database Password Update Guide

## Step 1: Update your .env file

Add this line to your `.env` file with your new password:

```bash
SUPABASE_DB_URL=postgresql://postgres:YOUR_NEW_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

## Step 2: URL encode special characters in your password

If your password contains special characters, encode them:
- `@` becomes `%40`
- `$` becomes `%24`
- `#` becomes `%23`
- `%` becomes `%25`
- `&` becomes `%26`

Example: If password is `MyPass@123$`, use `MyPass%40123%24`

## Step 3: Test the connection

Run this to verify it works:
```bash
npm run verify:env
```

## Step 4: Test SQL scripts

Once the password is updated, you can run:
```bash
node scripts/check-sprint2-status.js
```

## Security Notes

- ✅ The SUPABASE_DB_URL is only in your local .env file
- ✅ Scripts now use environment variables instead of hardcoded credentials  
- ✅ Your password is never committed to git
- ✅ The validation scripts will work with your updated credentials

## After updating, you can run:

- `npm run validate:pre-deploy` - Full validation suite
- `npm run test:all` - Same validation
- All SQL scripts will use your secure credentials