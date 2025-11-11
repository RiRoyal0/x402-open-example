import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { paymentMiddleware } from "x402-hono";
import { logger } from 'hono/logger'

const app = new Hono();
app.use("*", logger());

// Log all incoming requests with detailed payload information
app.use("*", async (c, next) => {
  console.log("\n=== SELLER RECEIVED ===");
  console.log(`${c.req.method} ${c.req.url}`);
  console.log("Headers:", JSON.stringify(Object.fromEntries(c.req.raw.headers.entries()), null, 2));
  
  // Try to log body if it exists
  try {
    const contentType = c.req.header("content-type");
    if (contentType?.includes("application/json")) {
      const bodyText = await c.req.text();
      if (bodyText) {
        console.log("Body:", bodyText);
        // Need to create a new request with the body since we consumed it
        c.req = new Request(c.req.raw, {
          method: c.req.method,
          headers: c.req.raw.headers,
          body: bodyText
        });
      }
    }
  } catch (e) {
    // Body already consumed or error reading
  }
  console.log("======================\n");
  
  await next();
  
  console.log("\n=== SELLER SENDING ===");
  console.log(`Response to ${c.req.method} ${c.req.url}`);
  console.log("Status:", c.res.status);
  console.log("======================\n");
});
// Configure the payment middleware
app.use(paymentMiddleware(
    "AtLXsCWXL1fVybD7gLBKW7QNHkHFCQGtvF252sUaYTZV", // your receiving wallet address 
    {  // Route configurations for protected endpoints
        "/weather": {
            price: "$0.001",
            network: "solana-devnet", // for mainnet, see Running on Mainnet section
            config: {
                description: "Access to premium content",
            }
        }
    },
    {
        url: "http://localhost:8080/facilitator", // for testnet
    }
));

// Implement your route
app.get("/weather", (c) => {
    return c.json({ message: "This content is behind a paywall" });
});

console.log("Starting server on port 4021");
serve({
  fetch: app.fetch,
  port: 4021
});