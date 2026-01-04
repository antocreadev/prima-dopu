import * as Sentry from "@sentry/astro";

Sentry.init({
  dsn: "https://2a29d2cf34830c052d250fffec3a7559@o4510654490083328.ingest.de.sentry.io/4510654492901456",
  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/astro/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});
