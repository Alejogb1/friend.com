import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/character(.*)", // Add this if you want it public
    "/api/webhook",
]);

export default clerkMiddleware(async (auth, request) => {
  console.log("Middleware processing request:", request.url);
  
  if (!isPublicRoute(request)) {
    console.log("Route is protected, applying auth.protect()");
    try {
      await auth.protect();
      console.log("Auth protection applied successfully");
    } catch (error) {
      console.error("Auth protection failed:", error);
      throw error;
    }
  } else {
    console.log("Route is public, skipping auth.protect()");
  }
}
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

