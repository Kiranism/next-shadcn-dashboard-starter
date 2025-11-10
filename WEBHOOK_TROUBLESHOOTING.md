# Clerk Webhook Setup Guide

This guide will help you set up Clerk webhooks to automatically sync users to MongoDB.

## Prerequisites

1. A Clerk account with a project set up
2. MongoDB database running (local or Atlas)
3. Your Next.js app running locally or deployed

## Setup Steps

### Step 1: Configure Environment Variables

Create a `.env.local` file in your project root with:

```env
# Clerk Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
CLERK_WEBHOOK_SECRET=your_webhook_secret

# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/auth/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/auth/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard/overview"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard/overview"
```

### Step 2: Test Database Connection

Before setting up webhooks, verify your database connection works:

1. Start your development server:
   ```bash
   pnpm dev
   ```

2. Test the database connection:
   ```bash
   curl http://localhost:3000/api/test-db
   ```

   You should see:
   ```json
   {
     "success": true,
     "message": "Database connection successful",
     "userCount": 0,
     "users": []
   }
   ```

3. Test user creation:
   ```bash
   curl -X POST http://localhost:3000/api/test-db
   ```

   You should see:
   ```json
   {
     "success": true,
     "message": "Test user created",
     "user": { ... }
   }
   ```

### Step 3: Set Up Clerk Webhook

#### For Local Development (using ngrok or similar):

1. Install ngrok (if not already installed):
   ```bash
   brew install ngrok  # macOS
   # or download from https://ngrok.com/download
   ```

2. Start ngrok to expose your local server:
   ```bash
   ngrok http 3000
   ```

3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

4. Go to Clerk Dashboard:
   - Navigate to **Webhooks** in the sidebar
   - Click **Add Endpoint**
   - Endpoint URL: `https://abc123.ngrok.io/api/webhooks/clerk`
   - Subscribe to events:
     - `user.created`
     - `user.updated`
     - `user.deleted`
   - Click **Create**

5. Copy the **Signing Secret** and add it to your `.env.local`:
   ```env
   CLERK_WEBHOOK_SECRET=whsec_...
   ```

6. Restart your dev server to load the new environment variable

#### For Production (Deployed App):

1. Go to Clerk Dashboard → Webhooks → Add Endpoint
2. Endpoint URL: `https://yourdomain.com/api/webhooks/clerk`
3. Subscribe to the same events: `user.created`, `user.updated`, `user.deleted`
4. Copy the signing secret and add it to your production environment variables

### Step 4: Test the Webhook

1. Check your server logs (terminal where `pnpm dev` is running)

2. Sign up a new user in your app

3. You should see logs like:
   ```
   Webhook received
   Webhook verified successfully, type: user.created
   Connecting to database...
   Database connected successfully
   Handling user.created event for: user_xxx
   Creating user with email: test@example.com
   User created successfully
   ```

4. Verify the user was created:
   ```bash
   curl http://localhost:3000/api/test-db
   ```

   You should now see your newly created user in the response.

## Troubleshooting

### Webhook Not Receiving Events

1. **Check ngrok is running**: Make sure ngrok tunnel is active
2. **Check Clerk Dashboard**: Go to Webhooks → Your Endpoint → Logs
   - You should see delivery attempts
   - Check for errors

### "Webhook secret not configured" Error

1. Make sure `CLERK_WEBHOOK_SECRET` is in your `.env.local`
2. Restart your dev server after adding the variable
3. The secret should start with `whsec_`

### "Invalid signature" Error

1. Verify the webhook secret matches exactly what Clerk shows
2. Make sure there are no extra spaces or newlines
3. Try creating a new webhook endpoint in Clerk

### Database Connection Issues

1. Test the connection:
   ```bash
   curl http://localhost:3000/api/test-db
   ```

2. Check `MONGODB_URI` is correct in `.env.local`
3. For MongoDB Atlas:
   - Whitelist your IP address
   - Check username/password are correct
   - Verify database name in connection string

### User Not Created in Database

1. Check server logs for errors
2. Verify webhook is being called (check Clerk Dashboard → Webhooks → Logs)
3. Test database write permissions:
   ```bash
   curl -X POST http://localhost:3000/api/test-db
   ```

## Monitoring

### Check Webhook Logs

Visit Clerk Dashboard → Webhooks → Your Endpoint → View Logs to see:
- Delivery status (success/failed)
- Response codes
- Retry attempts

### Check Server Logs

Your Next.js server logs will show:
- Webhook receipt
- Verification status
- Database operations
- Any errors

### Verify Users in Database

Query your database directly or use the test endpoint:
```bash
curl http://localhost:3000/api/test-db
```

## Security Notes

1. **Never commit `.env.local`** to version control
2. **Regenerate secrets** if they're exposed
3. **Use HTTPS** for webhook endpoints (required by Clerk)
4. **Validate webhook signatures** (already handled by Svix)

## Next Steps

Once webhooks are working:

1. Remove the test endpoint (`/api/test-db/route.ts`) in production
2. Add additional user fields as needed
3. Implement error monitoring (Sentry recommended)
4. Set up webhook retry logic if needed

## Support

If you encounter issues:
1. Check Clerk documentation: https://clerk.com/docs/webhooks
2. Review server logs carefully
3. Test database connection independently
4. Verify all environment variables are set
