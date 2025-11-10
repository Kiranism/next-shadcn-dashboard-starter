# Clerk User Synchronization Setup

This guide shows how to automatically sync users from Clerk to MongoDB when they sign up.

## 🎯 What This Does

- ✅ Automatically creates users in MongoDB when they sign up via Clerk
- ✅ Updates user info when changed in Clerk
- ✅ Marks users inactive when deleted from Clerk
- ✅ Syncs users when they visit protected routes (fallback)

## 📋 Prerequisites

1. Clerk account and project set up
2. MongoDB database (local or Atlas)
3. Next.js app with Clerk configured

## 🔧 Setup Steps

### 1. Environment Variables

Copy `env.example.txt` to `.env` and fill in:

```env
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_secret_here
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Database
MONGODB_URI=mongodb://localhost:27017/sehetyarr
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sehetyarr
```

### 2. Configure Clerk Webhook

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Navigate to **Webhooks** in the sidebar
4. Click **Add Endpoint**
5. Set the endpoint URL to:
   ```
   https://your-domain.com/api/webhooks/clerk
   ```
   For local development with ngrok:
   ```
   https://your-ngrok-url.ngrok.io/api/webhooks/clerk
   ```

6. Select these events:
   - ✅ `user.created`
   - ✅ `user.updated`
   - ✅ `user.deleted`

7. Click **Create**
8. Copy the **Signing Secret** and add it to your `.env` as `CLERK_WEBHOOK_SECRET`

### 3. For Local Development (Optional)

Install ngrok to test webhooks locally:

```bash
# Install ngrok
brew install ngrok  # macOS
# or download from https://ngrok.com

# Start your Next.js app
pnpm dev

# In another terminal, expose your local server
ngrok http 3000
```

Use the ngrok HTTPS URL for your webhook endpoint.

## 🔄 How It Works

### Webhook Flow
1. User signs up/updates/deletes in Clerk
2. Clerk sends webhook to `/api/webhooks/clerk`
3. Webhook verifies authenticity using `CLERK_WEBHOOK_SECRET`
4. User data is created/updated/soft-deleted in MongoDB

### Fallback Sync
- If webhook fails, users are synced when visiting protected routes
- Handled by middleware in `src/middleware.ts`

## 📊 User Data Stored

The following data from Clerk is stored in MongoDB:

```typescript
{
  clerkId: string;           // Clerk's user ID
  email: string;             // Primary email
  role: Role;                // STUDENT (default), TEACHER, ADMIN
  name?: string;             // Full name
  profile: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    imageUrl?: string;
    phoneNumber?: string;
    birthday?: string;
    gender?: string;
  };
  location?: {               // Not captured yet - extend as needed
    country?: string;
    city?: string;
    state?: string;
    timezone?: string;
  };
  lastSignInAt?: Date;
  emailVerified: boolean;
  phoneVerified: boolean;
  isActive: boolean;         // false when user deleted
  createdAt: Date;
  updatedAt: Date;
}
```

## 🛠️ Customization

### Adding More User Fields

1. Update the User model in `src/lib/models/user.model.ts`
2. Update webhook handlers in `src/app/api/webhooks/clerk/route.ts`
3. Update sync utility in `src/lib/utils/sync-user.ts`

### Changing Default Role

Edit the default role in:
- `src/app/api/webhooks/clerk/route.ts` (line with `role: Role.STUDENT`)
- `src/lib/utils/sync-user.ts` (line with `role: Role.STUDENT`)

## 🧪 Testing

1. Sign up a new user via your sign-up page
2. Check MongoDB to see if user was created
3. Update user profile in Clerk Dashboard
4. Verify changes are reflected in MongoDB
5. Check logs for any errors

## 🚨 Troubleshooting

### Webhook Not Triggered
- Verify webhook URL is correct and accessible
- Check webhook secret matches `.env`
- Ensure webhook events are selected correctly
- Check Clerk webhook logs in dashboard

### Database Connection Issues
- Verify `MONGODB_URI` is correct
- Ensure MongoDB is running (if local)
- Check network connectivity to MongoDB Atlas (if cloud)

### User Not Created
- Check webhook payload in Clerk dashboard
- Review Next.js logs for errors
- Verify user model validation passes

## 📝 Files Created/Modified

- ✅ `src/app/api/webhooks/clerk/route.ts` - Webhook handler
- ✅ `src/lib/utils/sync-user.ts` - User sync utility  
- ✅ `src/lib/utils/logger.ts` - Logging utility
- ✅ `src/middleware.ts` - Enhanced with user sync
- ✅ `src/lib/models/user.model.ts` - User model (already existed)
- ✅ `env.example.txt` - Added required variables

## 🎉 You're All Set!

Users will now automatically be synchronized to your MongoDB database when they sign up with Clerk!