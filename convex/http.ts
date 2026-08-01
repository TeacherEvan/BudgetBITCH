import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { lineWebhook } from "./line";
import { ingestReceipt } from "./receipts";

const http = httpRouter();

auth.addHttpRoutes(http);

// LINE Messaging API webhook for the receipt bot (HMAC-verified).
http.route({
  path: "/line/webhook",
  method: "POST",
  handler: lineWebhook,
});

// Budget Boss receipt ingestion from TeacherBOY (Bearer token verified).
http.route({
  path: "/receipts/ingest",
  method: "POST",
  handler: ingestReceipt,
});

export default http;
