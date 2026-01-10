# x402-open Example

This repository provides working examples and reference implementations for integrating **[x402-open](https://github.com/VanshSahay/x402-open)** into your projects. `x402-open` is a decentralized facilitator toolkit for the X402 protocol that enables micro-payments for API access using blockchain networks.

## About x402-open

[x402-open](https://github.com/VanshSahay/x402-open) is an open-source decentralized implementation of the X402 protocol that allows you to:

- **Run facilitator nodes** - Support both EVM (Ethereum, Base, etc.) and SVM (Solana) networks
- **Create HTTP gateways** - Route `verify` and `settle` requests across multiple nodes for high availability
- **Auto-registration** - Nodes can self-register with gateways without manual configuration
- **Framework integration** - Works with Express.js and other popular Node.js frameworks

### What is the X402 Protocol?

X402 is a protocol that integrates payments directly into HTTP requests. When a client tries to access a paid API endpoint:

1. The server responds with a 402 Payment Required status
2. The client automatically processes the payment via the configured blockchain network
3. The server verifies the payment and serves the content

This enables:
- Direct API monetization without intermediaries
- Micro-payments (fractions of a cent)
- Decentralized payment processing
- Support for multiple blockchains (Ethereum, Base Sepolia, Solana Devnet)

## Installation

Install x402-open and required dependencies:

```bash
pnpm add x402-open express viem
# or
npm i x402-open express viem
```

Note: `express` is a peer dependency of `x402-open`.

## Project Structure

This example repository demonstrates various integration patterns for x402-open:

- `buyer.js` - Ethereum/EVM buyer example using `x402-axios`
- `buyer_solana.js` - Solana buyer example
- `seller.js` - Express server with payment middleware and co-located facilitator node
- `seller_hono.js` - Hono server example
- `gateway.js` - HTTP gateway that routes requests across multiple facilitator nodes
- `nodeA.js`, `nodeB.js`, `nodeC.js` - Standalone facilitator nodes with auto-registration
- `docker-compose.yml` - Multi-node deployment setup
- `nginx/nginx.conf` - Load balancer configuration

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm (or npm)
- Docker (for multi-node deployment)
- Private keys for facilitator nodes (EVM and/or Solana)

### Installation
```bash
pnpm install
```

### Environment Setup
Create a `.env` file with the following variables:
- `PRIVATE_KEY` - Ethereum private key for facilitator (EVM networks)
- `SOLANA_PRIVATE_KEY` - Solana private key (optional, for Solana support)
- `PAYER_PRIVATE_KEY` - Private key for buyer scripts
- `GATEWAY_URLS` - Comma-separated list of gateway URLs for auto-registration (optional)
- `NODE_BASE_URL` - Base URL for this node (for auto-registration)

### Running Examples

#### Example 1: Seller with Co-located Facilitator Node

This demonstrates a server that handles payments and runs its own facilitator:

```bash
node seller.js
```

The server will:
- Start a facilitator node on `/facilitator` endpoint
- Protect routes using `x402-express` payment middleware
- Handle payment verification and settlement

#### Example 2: Standalone Facilitator Node

Run a facilitator node that can be used by other services:

```bash
node nodeA.js
```

This node will:
- Start on `http://localhost:4101/facilitator`
- Support EVM (Base Sepolia) and Solana (Devnet) networks
- Auto-register with configured gateways
- Expose endpoints: `GET /facilitator/supported`, `POST /facilitator/verify`, `POST /facilitator/settle`

#### Example 3: HTTP Gateway

Run a gateway that routes requests across multiple facilitator nodes:

```bash
node gateway.js
```

The gateway will:
- Aggregate supported networks from all registered nodes
- Route `verify` requests to random nodes
- Ensure `settle` requests go to the same node as `verify` (sticky routing)

#### Example 4: Complete Payment Flow

1. Start a seller server:
```bash
node seller.js
```

2. In another terminal, run the buyer:
```bash
node buyer.js
# or for Solana
node buyer_solana.js
```

This demonstrates the complete payment flow where the buyer pays to access the `/weather` endpoint.

### Network Deployment

For a full network setup with multiple nodes and gateways:

```bash
docker compose build
docker compose up -d
```

## Integration Examples

### For Sellers (API Providers)

#### Option 1: Server with Co-located Facilitator Node

Run a facilitator node alongside your API server. See `seller.js` for a complete example:

```javascript
import express from "express";
import { paymentMiddleware } from "x402-express";
import { Facilitator, createExpressAdapter } from "x402-open";
import { baseSepolia } from "viem/chains";

const app = express();
app.use(express.json());

// Create and mount facilitator node
const facilitator = new Facilitator({
  evmPrivateKey: process.env.PRIVATE_KEY,
  evmNetworks: [baseSepolia],
  // Optional: Add Solana support
  // svmPrivateKey: process.env.SOLANA_PRIVATE_KEY,
  // svmNetworks: ["solana-devnet"],
});

// Exposes: GET /facilitator/supported, POST /facilitator/verify, POST /facilitator/settle
createExpressAdapter(facilitator, app, "/facilitator");

// Add payment middleware pointing to local facilitator
app.use(paymentMiddleware(
  "YOUR_WALLET_ADDRESS",
  {
    "GET /weather": {
      price: "$0.0001",
      network: "base-sepolia" // or "solana-devnet"
    }
  },
  {
    url: "http://localhost:4021/facilitator"
  }
));

app.get("/weather", (req, res) => {
  res.json({ weather: "sunny", temperature: 70 });
});

app.listen(4021, () => console.log("Server on http://localhost:4021"));
```

#### Option 2: Use Public Gateway or External Facilitator

Point your payment middleware to an external facilitator or gateway:

```javascript
import { paymentMiddleware } from "x402-express";

app.use(paymentMiddleware(
  "YOUR_WALLET_ADDRESS",
  {
    "GET /api/data": {
      price: "$0.01",
      network: "base-sepolia" // or "solana-devnet"
    }
  },
  {
    url: "https://facilitator.x402open.org/facilitator" // Public gateway
  }
));
```

**Note:** For local development, use `http://localhost:8080/facilitator` (your local gateway) or `http://localhost:4021/facilitator` (co-located node). For production, use the public facilitator at `https://facilitator.x402open.org/facilitator`.

### Running a Standalone Facilitator Node

Run a facilitator node that other services can use. See `nodeA.js` for a complete example:

```javascript
import express from "express";
import { Facilitator, createExpressAdapter, startGatewayRegistration } from "x402-open";
import { baseSepolia } from "viem/chains";

const app = express();
app.use(express.json());

const facilitator = new Facilitator({
  evmPrivateKey: process.env.PRIVATE_KEY,
  evmNetworks: [baseSepolia],
  svmNetworks: ["solana-devnet"], // Optional Solana support
});

createExpressAdapter(facilitator, app, "/facilitator");

// Auto-register with gateway(s)
startGatewayRegistration({
  gatewayUrls: ["http://localhost:8080/facilitator"],
  nodeBaseUrl: "http://localhost:4101/facilitator",
  kindsProvider: async () => {
    const res = await fetch("http://localhost:4101/facilitator/supported");
    const j = await res.json();
    return j?.kinds ?? [];
  },
  debug: true,
});

app.listen(4101, () => console.log("Facilitator node on http://localhost:4101"));
```

### Running an HTTP Gateway

Create a gateway that routes requests across multiple facilitator nodes. See `gateway.js` for a complete example:

```javascript
import express from "express";
import { createHttpGatewayAdapter } from "x402-open";

const app = express();
app.use(express.json());

createHttpGatewayAdapter(app, {
  basePath: "/facilitator",
  // Optional: Static peer list (nodes can also auto-register)
  httpPeers: [
    "http://localhost:4101/facilitator",
    "http://localhost:4102/facilitator",
    "http://localhost:4103/facilitator",
  ],
  debug: true,
});

app.listen(8080, () => console.log("Gateway on http://localhost:8080"));
```

### For Buyers (API Consumers)

Use the payment interceptor with your HTTP client. See `buyer.js` for a complete example:

```javascript
import { withPaymentInterceptor } from "x402-axios";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import axios from "axios";

// Create wallet client
const account = privateKeyToAccount(process.env.PAYER_PRIVATE_KEY);
const client = createWalletClient({
  account,
  transport: http(),
  chain: baseSepolia,
});

// Create Axios instance with payment handling
const api = withPaymentInterceptor(axios.create(), client);

// Make request to paid endpoint
const response = await api.get("/weather");
console.log(response.data);
```

For Solana, use the Solana-specific buyer example (`buyer_solana.js`).

## x402-open Key Features

### Facilitator Configuration

The `Facilitator` class supports both EVM and Solana networks:

```javascript
const facilitator = new Facilitator({
  // EVM support (Ethereum, Base, etc.)
  evmPrivateKey: process.env.PRIVATE_KEY,
  evmNetworks: [baseSepolia], // or any viem chain
  
  // SVM (Solana) support (optional)
  svmPrivateKey: process.env.SOLANA_PRIVATE_KEY,
  svmNetworks: ["solana-devnet"], // or "solana-mainnet"
});
```

- `GET /facilitator/supported` - Returns supported payment schemes and networks
- `POST /facilitator/verify` - Verifies a payment payload
- `POST /facilitator/settle` - Settles a verified payment

### Gateway Behavior

The HTTP gateway provides:
- **Random node selection** for `verify` requests
- **Sticky routing** for `settle` requests (same node as `verify` by payer/header)
- **Network aggregation** - Combines supported networks from all nodes
- **Auto-registration** - Nodes can self-register without manual config
- **Fallback handling** - Routes to alternative nodes on errors

### Auto-Registration

Nodes can automatically register with one or more gateways:

```javascript
import { startGatewayRegistration } from "x402-open";

const stop = startGatewayRegistration({
  gatewayUrls: ["http://localhost:8080/facilitator"],
  nodeBaseUrl: "http://localhost:4101/facilitator",
  kindsProvider: async () => {
    const res = await fetch("http://localhost:4101/facilitator/supported");
    const j = await res.json();
    return j?.kinds ?? [];
  },
  debug: true,
});

// Call stop() to stop heartbeats
```

Nodes send periodic heartbeats; gateways expire entries after ~2 minutes of inactivity.

## Supported Frameworks

x402-open integrates with popular Node.js frameworks:

- **Express.js** - `x402-express` (see `seller.js` example)
- **Hono** - `x402-hono` (see `seller_hono.js` example)
- **Axios client** - `x402-axios` (see `buyer.js` example)
- **Fetch API** - `x402-fetch` for native fetch with payment handling

## Supported Networks

- **EVM Networks** - Ethereum, Base Sepolia (testnet), and other EVM-compatible chains
- **Solana** - Devnet and Mainnet

Check the [x402-open GitHub repository](https://github.com/VanshSahay/x402-open) for the latest supported networks.

## Integration Checklist

When integrating x402-open into your project:

- [ ] Install `x402-open` and required dependencies (`express`, `viem`)
- [ ] Set up environment variables (`PRIVATE_KEY`, optional `SOLANA_PRIVATE_KEY`)
- [ ] Create a `Facilitator` instance with your network configuration
- [ ] Mount facilitator endpoints using `createExpressAdapter`
- [ ] (Optional) Set up auto-registration with gateway(s)
- [ ] Add payment middleware to your API routes using `x402-express` or `x402-hono`
- [ ] Configure route pricing and network requirements
- [ ] Test with buyer clients using `x402-axios` or `x402-fetch`

## Resources

- **[x402-open GitHub Repository](https://github.com/VanshSahay/x402-open)** - Source code and full documentation
- [X402 Protocol Documentation](https://x402.org) - Protocol specification and details

## License

ISC

---

**Note:** This is an example repository demonstrating x402-open integration patterns. For production use, refer to the [official x402-open documentation](https://github.com/VanshSahay/x402-open).