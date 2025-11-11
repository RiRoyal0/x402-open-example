import express from "express";
import { createHttpGatewayAdapter } from "x402-open";
import morgan from "morgan";

const app = express();
app.use(express.json());
app.use(morgan("dev"));

const PORT = process.env.GATEWAY_PORT ? Number(process.env.GATEWAY_PORT) : 8080;

// Log all incoming requests with payload
app.use((req, res, next) => {
  console.log("\n=== GATEWAY RECEIVED ===");
  console.log(`${req.method} ${req.url}`);
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("Body:", JSON.stringify(req.body, null, 2));
  }
  console.log("======================\n");
  
  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    console.log("\n=== GATEWAY SENDING ===");
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
createHttpGatewayAdapter(app, {
  basePath: "/facilitator",
  selection: "headerHash",
  debug: true,
});

app.listen(PORT, () => console.log(`HTTP Gateway on http://localhost:${PORT}`));