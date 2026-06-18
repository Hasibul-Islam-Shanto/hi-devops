---
title: "VPN & Tunneling"
description: "Virtual Private Networks for secure connectivity, and SSH tunneling for port forwarding."
order: 9
topic: "networking"
---

## VPN — Virtual Private Network

A **VPN (Virtual Private Network)** creates an encrypted tunnel over the public internet, making remote devices appear as if they're on the same local network.

```
Your Laptop ──[Encrypted Tunnel]──→ VPN Server ──→ Private Network
```

**DevOps uses:**

- Access private cloud resources (databases, internal services) securely.
- Connect office networks (site-to-site VPN).
- Access staging environments without exposing them to the internet.

---

## SSH Tunneling (Port Forwarding)

A quick alternative to VPN for accessing a specific remote service:

```bash
# Access a remote database (port 5432) as if it's local (localhost:5433)
ssh -L 5433:localhost:5432 user@bastion-server

# Now connect your DB client to localhost:5433
```
