
// nodeB.ts
import express from "express";
import { Facilitator, createExpressAdapter, startGatewayRegistration } from "x402-open";
import { baseSepolia } from "viem/chains";
import dotenv from "dotenv";
import morgan from "morgan";

dotenv.config();

const app = express();
app.use(express.json());
app.use(morgan("dev"));

// Log all incoming requests with payload
app.use((req, res, next) => {
  console.log("\n=== NODE C RECEIVED ===");
  console.log(`${req.method} ${req.url}`);
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("Body:", JSON.stringify(req.body, null, 2));
  }
  console.log("======================\n");
  
  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    console.log("\n=== NODE C SENDING ===");
    console.log(`Response to ${req.method} ${req.url}`);
    console.log("Status:", res.statusCode);
    if (data) {
      try {
        console.log("Body:", typeof data === 'string' ? data : JSON.stringify(data, null, 2));
      } catch (e) {
        console.log("Body:", data);
      }
    }
    console.log("======================\n");
    return originalSend.call(this, data);
  };
  
  next();
});
const facilitator = new Facilitator({
  evmPrivateKey: process.env.PRIVATE_KEY,
  svmPrivateKey: process.env.SOLANA_PRIVATE_KEY,
  evmNetworks: [baseSepolia],
  svmNetworks: ["solana-devnet"],
});

createExpressAdapter(facilitator, app, "/facilitator");

startGatewayRegistration({
  gatewayUrls: process.env.GATEWAY_URLS
    ? process.env.GATEWAY_URLS.split(",").map((u) => u.trim()).filter(Boolean)
    : ["http://localhost:8080/facilitator"],
  nodeBaseUrl: process.env.NODE_BASE_URL || "http://localhost:4103/facilitator",
  kindsProvider: async () => {
    const res = await fetch("http://localhost:4103/facilitator/supported");
    const j = await res.json();
    return j?.kinds ?? [];
  },
  debug: true,
});

(async () => {
  await facilitator.p2p?.start();
  app.listen(4103, () => console.log("Node C HTTP on 4103"));
})();