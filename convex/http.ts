import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { lineWebhook } from "./line";

const http = httpRouter();

auth.addHttpRoutes(http);

// LINE Messaging API webhook for the receipt bot (HMAC-verified).
http.route({
  path: "/line/webhook",
  method: "POST",
  handler: lineWebhook,
});

export default http;
