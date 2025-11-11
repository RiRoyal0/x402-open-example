import express from "express";
import { paymentMiddleware } from "x402-express";
import { Facilitator, createExpressAdapter } from "x402-open";
import { baseSepolia } from "viem/chains";
import dotenv from "dotenv"
import morgan from "morgan";

dotenv.config();

const app = express();
app.use(express.json());
app.use(morgan("dev"));
const facilitator = new Facilitator({
  evmPrivateKey: process.env.PRIVATE_KEY,
  networks: [baseSepolia],
});

createExpressAdapter(facilitator, app, "/facilitator");

app.use(paymentMiddleware(
  "0xDA2A94C3D177238308d41019a9b718d09b2b51e5", // your receiving wallet address
  {  // Route configurations for protected endpoints
    "GET /weather": {
      // USDC amount in dollars
      price: "$0.0001",
      network: "base-sepolia", // for mainnet, see Running on Mainnet section
    },
  },
  {
    url: "http://localhost:4021/facilitator",
  }
));

// Implement your route
app.get("/weather", (req, res) => {
  res.send({
    report: {
      weather: "sunny",
      temperature: 70,
    },
  });
});

app.listen(4021, () => {
  console.log(`Server listening at http://localhost:4021`);
});