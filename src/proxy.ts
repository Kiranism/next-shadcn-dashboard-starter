import { clerkMiddleware } from '@clerk/nextjs/server';

// Each /dashboard page and API route checks auth itself (`auth.protect()` / `auth()`).
// clerkMiddleware() only attaches the auth context to every request.
export default clerkMiddleware();
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)'
  ]
};
