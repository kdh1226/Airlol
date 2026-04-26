import { describe, it, expect } from "vitest";

const BASE = "http://localhost:3000";

describe("Webhook Sync Endpoint", () => {
  it("should reject requests without secret", async () => {
    const res = await fetch(`${BASE}/api/webhook/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Invalid webhook secret");
  });

  it("should reject requests with wrong secret", async () => {
    const res = await fetch(`${BASE}/api/webhook/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": "wrong_secret",
      },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(401);
  });

  it("should reject requests with empty secret", async () => {
    const res = await fetch(`${BASE}/api/webhook/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": "",
      },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(401);
  });
});
