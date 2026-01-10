# X402 Open Example

This repository provides an example implementation of the X402 decentralized payment network for APIs. X402 enables micro-payments for API access using blockchain networks like Ethereum and Solana, allowing API providers to monetize their services without intermediaries.

## What is X402?

X402 is a protocol that integrates payments directly into HTTP requests. When a client tries to access a paid API endpoint:

1. The server responds with a 402 Payment Required status
2. The client automatically processes the payment via the configured blockchain
3. The server verifies the payment and serves the content

This enables:
- Direct API monetization
- Micro-payments (fractions of a cent)
- Decentralized payment processing
- Support for multiple blockchains (Ethereum, Solana)

## Bounty: Integrate X402

This bounty is for integrating X402 into the First Dollar Money platform. The goal is to enable seamless micro-payments for API services within the platform.

### Bounty Requirements
- Implement X402 payment middleware in the platform's API layer
- Support both Ethereum and Solana networks
- Ensure secure key management
- Provide documentation and examples
- Test integration with real transactions

### Reward
[Check the bounty page for details: https://app.firstdollar.money/company/x402open/bounty/integrate]

## Project Structure

- `buyer.js` - Ethereum buyer example
- `buyer_solana.js` - Solana buyer example
- `seller.js` - Express server with payment middleware
- `seller_hono.js` - Hono server example
- `gateway.js` - HTTP gateway for the network
- `nodeA.js`, `nodeB.js`, `nodeC.js` - Network nodes/facilitators
- `docker-compose.yml` - Multi-node deployment setup
- `nginx/nginx.conf` - Load balancer configuration

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm
- Docker (for deployment)

### Installation
```bash
pnpm install
```

### Environment Setup
Create a `.env` file:
```bash
cp env.example .env
```

Set the following variables:
- `PRIVATE_KEY` - Ethereum private key for facilitator
- `SOLANA_PRIVATE_KEY` - Solana private key
- `PAYER_PRIVATE_KEY` - Private key for buyer scripts

### Running the Example

1. Start a seller server:
```bash
node seller.js
```

2. In another terminal, run the buyer:
```bash
node buyer_solana.js
```

This will demonstrate the payment flow where the buyer pays to access the `/weather` endpoint.

### Network Deployment

For a full network setup with multiple nodes and gateways:

```bash
docker compose build
docker compose up -d
```

See [README-DEPLOY.md](README-DEPLOY.md) for detailed deployment instructions.

## API Usage

### For Sellers (API Providers)

Add payment middleware to your Express app:

```javascript
import { paymentMiddleware } from "x402-express";

app.use(paymentMiddleware(
  "YOUR_WALLET_ADDRESS",
  {
    "GET /api/data": {
      price: "$0.01",
      network: "solana-devnet"
    }
  },
  {
    url: "https://facilitator.x402open.org"
  }
));
```

**Note:** For local development, use `http://localhost:4021/facilitator`. For production deployments, use the public facilitator at `https://facilitator.x402open.org`.

### For Buyers (API Consumers)

Use the payment interceptor:

```javascript
import { withPaymentInterceptor } from "x402-axios";

const api = withPaymentInterceptor(axios.create(), walletClient);
const response = await api.get("/api/data");
```

## Supported Frameworks

- Express.js (`x402-express`)
- Hono (`x402-hono`)
- Axios client (`x402-axios`)
- Fetch API (`x402-fetch`)

## Networks Supported

- Ethereum (Base Sepolia testnet)
- Solana (Devnet)

## Contributing to the Bounty

1. Fork this repository
2. Create a feature branch
3. Implement the integration
4. Test thoroughly
5. Submit a pull request with documentation

## Resources

- [X402 Documentation](https://x402.org)
- [First Dollar Money](https://firstdollar.money)
- [Bounty Details](https://app.firstdollar.money/company/x402open/bounty/integrate)

## License

ISC