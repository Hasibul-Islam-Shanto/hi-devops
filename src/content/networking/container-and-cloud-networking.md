---
title: "Container & Cloud Networking"
description: "Docker networking modes, Kubernetes pod networking and services, and cloud VPC architecture."
order: 10
topic: "networking"
---

## Docker Networking

When you run containers with Docker, they need to communicate with each other and with the outside world. Docker creates virtual networks for this.

### Docker Network Types

**Bridge (default):** Containers on the same bridge network can communicate. Traffic to the outside goes through NAT.

```bash
docker network create my-network
docker run --network my-network --name app my-app
docker run --network my-network --name db postgres
# 'app' can reach 'db' by hostname 'db'
```

**Host:** Container shares the host's network namespace directly. No network isolation — useful for performance-sensitive workloads.

**None:** Container has no network access.

**Overlay:** Used in Docker Swarm — allows containers on different hosts to communicate.

### Port Mapping

```bash
# Map host port 8080 to container port 80
docker run -p 8080:80 nginx

# Now requests to host:8080 → container:80
```

### DNS in Docker

Docker has a built-in DNS server. On a custom bridge network, containers can reach each other by **container name**. This is why microservices in `docker-compose` can reference each other by service name.

```yaml
# docker-compose.yml
services:
  web:
    image: my-app
    depends_on:
      - db
  db:
    image: postgres
# 'web' can connect to postgres at hostname 'db'
```

---

## Kubernetes Networking

Kubernetes networking follows a flat model: **every Pod gets its own IP** and can reach any other Pod in the cluster without NAT.

### Key Networking Concepts

**Pod-to-Pod communication:** All pods in a cluster can communicate directly (via a CNI plugin like Calico, Flannel, or Cilium).

**Service:** A stable virtual IP (ClusterIP) that load-balances traffic to a set of pods. Pods come and go; the Service IP stays the same.

```
Client → Service (ClusterIP: 10.100.0.5) → Pod A (10.244.0.5)
                                          → Pod B (10.244.0.6)
                                          → Pod C (10.244.1.2)
```

### Service Types

| Type         | Accessibility       | Use case                            |
| ------------ | ------------------- | ----------------------------------- |
| ClusterIP    | Inside cluster only | Internal microservice communication |
| NodePort     | Host IP + node port | Simple external access (testing)    |
| LoadBalancer | External cloud LB   | Production external access          |
| ExternalName | DNS alias           | Redirect to external service        |

### Ingress

An **Ingress** is an L7 load balancer/reverse proxy inside Kubernetes. It routes external HTTP/HTTPS traffic to internal services based on hostname or path.

```yaml
# Example Ingress rule
rules:
  - host: api.example.com
    http:
      paths:
        - path: /users
          backend: user-service:80
        - path: /orders
          backend: order-service:80
```

### DNS in Kubernetes

Every Service gets a DNS name: `<service-name>.<namespace>.svc.cluster.local`

```
user-service.default.svc.cluster.local → 10.100.0.5
```

---

## Cloud Networking (VPC)

A **VPC (Virtual Private Cloud)** is your own isolated section of the cloud provider's network. You have full control over IP ranges, subnets, route tables, and gateways.

### AWS VPC Example Architecture

```
VPC: 10.0.0.0/16
│
├── Public Subnet: 10.0.1.0/24   (has Internet Gateway route)
│       ├── Load Balancer
│       └── Bastion Host (SSH jump server)
│
├── Private Subnet: 10.0.2.0/24  (no direct internet access)
│       ├── App Servers
│       └── Kubernetes Nodes
│
└── Database Subnet: 10.0.3.0/24 (most restricted)
        └── RDS / PostgreSQL
```

### Key Components

| Component        | Purpose                                                                 |
| ---------------- | ----------------------------------------------------------------------- |
| Internet Gateway | Allows public subnets to reach the internet                             |
| NAT Gateway      | Lets private subnet instances reach the internet (outbound only)        |
| Route Table      | Rules for where network traffic is directed                             |
| Security Group   | Stateful firewall for instances                                         |
| NACL             | Stateless firewall at the subnet level                                  |
| VPC Peering      | Connect two VPCs together                                               |
| Bastion Host     | A hardened jump server in a public subnet to SSH into private instances |

### Best Practices

- Keep databases and app servers in **private subnets**.
- Only expose what needs to be public via **load balancers** in public subnets.
- Use **bastion hosts** or **VPN** for admin access — never expose SSH to the internet.
- Use **least-privilege security groups** — only allow traffic on specific ports from specific sources.
