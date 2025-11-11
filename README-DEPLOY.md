## Deploy 3 nodes + 2 gateways behind Nginx (cost-effective, single VM)

This setup runs:
- nodeA (`4101`), nodeB (`4102`), nodeC (`4103`)
- two gateway processes (`8081`, `8082`)
- Nginx load balancer on ports `80` and `8080` proxying to both gateways

All services are on one VM via Docker Compose (cheapest: 1 small EC2/Lightsail).

### 1) Provision a small instance
- Recommended: AWS Lightsail $5 or EC2 `t3.micro` (or `t4g.nano` if ARM).
- Open inbound ports: 80 (HTTP). If you need raw gateway port, 8080 as well.

### 2) Install Docker and Compose
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Compose plugin (if not included)
DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
mkdir -p $DOCKER_CONFIG/cli-plugins
curl -SL https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-linux-x86_64 -o $DOCKER_CONFIG/cli-plugins/docker-compose
chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose
docker compose version
```

### 3) Copy project to server
```bash
scp -r . <user>@<server>:/opt/x402
ssh <user>@<server>
cd /opt/x402
```

### 4) Set environment
Create `.env` from the example and set keys:
```bash
cp env.example .env
vi .env
# Set PRIVATE_KEY and SOLANA_PRIVATE_KEY
```

### 5) Build and run
```bash
docker compose build
docker compose up -d
docker compose ps
```

Nginx listens on `80` and `8080`. The nodes register to `http://nginx:8080/facilitator` inside the Docker network, and external clients hit port `80` (or `8080`) on the VM.

### 6) Update
```bash
git pull
docker compose build
docker compose up -d
```

### Notes
- You can bind a domain to the VM public IP and use port `80`.
- For SSL, place an Nginx TLS server block or front with a free Cloudflare proxy.
- For more resilience, split gateways onto separate machines behind a managed ALB (higher cost). This single-VM Nginx approach is the cheapest.


