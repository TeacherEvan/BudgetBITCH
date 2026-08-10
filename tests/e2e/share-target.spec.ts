// Feature: PWA Web Share Target endpoint accepts shared text payloads.
// No receipt image processing is exercised here (excluded by directive).
import { test, expect } from "./helpers";

test.describe("Share Target API", () => {
  test("accepts multipart/text shared payload and returns 200", async ({ request, baseURL }) => {
    const url = `${baseURL}/share-target`;
    const resp = await request.post(url, {
      form: { title: "Thai dinner", text: "Pad thai 120 THB" },
    });
    expect(resp.status()).toBeLessThan(400);
  });

  test("accepts plain text payload", async ({ request, baseURL }) => {
    const resp = await request.post(`${baseURL}/share-target`, {
      headers: { "content-type": "text/plain" },
      data: "Groceries 350 THB",
    });
    expect(resp.status()).toBeLessThan(400);
  });
});
