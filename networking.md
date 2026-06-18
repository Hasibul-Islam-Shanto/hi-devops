# Networking for DevOps Engineers

### A Complete Guide — From Fundamentals to Production

---

## Table of Contents

1. [What is the Internet?](#1-what-is-the-internet)
2. [IP Addressing](#2-ip-addressing)
3. [Subnetting & CIDR](#3-subnetting--cidr)
4. [MAC Address & Data Link Layer](#4-mac-address--data-link-layer)
5. [Packets & How Data Travels](#5-packets--how-data-travels)
6. [UDP — User Datagram Protocol](#6-udp--user-datagram-protocol)
7. [TCP — Transmission Control Protocol](#7-tcp--transmission-control-protocol)
8. [Ports](#8-ports)
9. [DNS — Domain Name System](#9-dns--domain-name-system)
10. [HTTP & HTTPS](#10-http--https)
11. [TLS/SSL — Securing the Connection](#11-tlsssl--securing-the-connection)
12. [SSH — Secure Shell](#12-ssh--secure-shell)
13. [OSI Model](#13-osi-model)
14. [TCP/IP Model](#14-tcpip-model)
15. [NAT, DHCP & Private Networks](#15-nat-dhcp--private-networks)
16. [Firewalls & Security Groups](#16-firewalls--security-groups)
17. [Load Balancing](#17-load-balancing)
18. [Reverse Proxy](#18-reverse-proxy)
19. [VPN & Tunneling](#19-vpn--tunneling)
20. [Docker Networking](#20-docker-networking)
21. [Kubernetes Networking](#21-kubernetes-networking)
22. [Cloud Networking (VPC)](#22-cloud-networking-vpc)
23. [Network Troubleshooting Tools](#23-network-troubleshooting-tools)

---

## 1. What is the Internet?

The **Internet** is an interconnected network of billions of devices, with a collection of protocols that define a consistent communication format for devices to send and receive data to and from one another.

Think of it as a giant highway system where every car (data packet) follows the same traffic rules (protocols) regardless of where it came from or where it is going.

**Key idea:** No single company owns the internet. It is a cooperative system of networks run by ISPs, governments, universities, and private companies — all agreeing to use the same protocols.

---

## 2. IP Addressing

Every device on a network has an **IP (Internet Protocol) address** — a unique identifier that allows data to be routed to the right destination.

### IPv4

The most common format. Written as four groups of numbers separated by dots:

```
192.168.1.10
```

Each group is a number from **0 to 255** (8 bits), making the full address **32 bits** long. This allows for ~4.3 billion unique addresses.

### IPv6

Because IPv4 addresses are running out, IPv6 was introduced. It uses **128 bits** and is written in hexadecimal:

```
2001:0db8:85a3:0000:0000:8a2e:0370:7334
```

### Public vs. Private IP Addresses

| Type    | Range                                     | Use                        |
| ------- | ----------------------------------------- | -------------------------- |
| Private | 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 | Internal networks (LAN)    |
| Public  | Everything else                           | Accessible on the internet |

**IP Address = Network portion + Host portion**

The network portion identifies which network the device is on. The host portion identifies the specific device within that network.

---

## 3. Subnetting & CIDR

### CIDR — Classless Inter-Domain Routing

CIDR is a method for efficiently allocating IP addresses. Instead of rigid class-based blocks, CIDR uses a **prefix length** (subnet mask) to define how many bits are the network portion.

```
192.168.1.0/24
```

The `/24` means the first **24 bits** are the network part. The remaining **8 bits** are for hosts.

```
Network:  192.168.1   (24 bits)
Hosts:              .0 → .255  (8 bits = 256 addresses, 254 usable)
```

### Common Subnet Sizes

| CIDR | Subnet Mask     | Hosts (usable) | Common Use                   |
| ---- | --------------- | -------------- | ---------------------------- |
| /8   | 255.0.0.0       | 16,777,214     | Large ISP networks           |
| /16  | 255.255.0.0     | 65,534         | Large company network        |
| /24  | 255.255.255.0   | 254            | Typical office/home network  |
| /28  | 255.255.255.240 | 14             | Small server subnet          |
| /30  | 255.255.255.252 | 2              | Point-to-point links         |
| /32  | 255.255.255.255 | 1              | Single host (used in routes) |

### Why DevOps Engineers Need Subnetting

In cloud environments (AWS, GCP, Azure), you design your own network. You need to:

- Create a **VPC** with a CIDR block (e.g., `10.0.0.0/16`)
- Divide it into **subnets** (public: `10.0.1.0/24`, private: `10.0.2.0/24`)
- Ensure subnets don't overlap

---

## 4. MAC Address & Data Link Layer

**MAC (Media Access Control)** address is the addressing mechanism used when a message is traveling **inside a LAN** (Local Area Network).

- It is a **hardware address** burned into the network interface card (NIC).
- Written as 6 pairs of hex digits: `00:1A:2B:3C:4D:5E`
- The first 3 pairs identify the manufacturer; the last 3 identify the device.

**IP vs. MAC:**

| Feature | IP Address        | MAC Address         |
| ------- | ----------------- | ------------------- |
| Scope   | Global / Internet | Local network only  |
| Changes | Can change        | Fixed to hardware   |
| Layer   | Network (Layer 3) | Data Link (Layer 2) |

When data moves across a local network, the binary representation of the IP address is prefixed to the data as a **header** — this is how routers know where to send it next.

**ARP (Address Resolution Protocol):** When a device knows the IP address of a target but needs the MAC address to send a frame on the local network, it broadcasts an ARP request: _"Who has IP 192.168.1.5?"_ The device with that IP replies with its MAC address.

---

## 5. Packets & How Data Travels

**Packets** are the collection of bits that travel across a network. Every packet contains:

- A **header** (IP address of source and destination, packet number, etc.)
- A **payload** (the actual data being sent)

Large messages are broken into multiple packets and reassembled at the destination.

```
        Original Message
   ┌──────────────────────────┐
   │         Data             │
   └──────────────────────────┘
              │
    Split into packets
              │
   ┌──────────┬──────────┬──────────┐
   │ Packet 1 │ Packet 2 │ Packet 3 │
   │IP add│Data│IP add│Data│IP add│Data│
   └──────────┴──────────┴──────────┘
              │
   Travel independently across the network
              │
   Reassembled at destination
```

Each packet may take a **different route** across the internet. This is by design — it makes the internet resilient. If one router fails, packets reroute automatically.

---

## 6. UDP — User Datagram Protocol

UDP is a **transport layer protocol** that operates on top of IP.

### Structure of a UDP Packet

```
┌──────────┬────────────────────┬──────────────┐
│ IP Head  │  Port + Checksum   │ Data Payload │
│          │   (UDP header)     │              │
└──────────┴────────────────────┴──────────────┘
```

### Two Main Features UDP Adds to IP

**1. Port Numbers** — Identify which application/program the packet is intended for on the destination device.

**2. Checksum** — Detects data corruption:

- Sender runs a checksum algorithm on the data payload and inserts the result into the UDP header.
- Receiver runs the same algorithm and compares. If they match → data is intact. If not → data is corrupt.

### What UDP Does NOT Have

- No acknowledgement that data arrived
- No re-sending of lost packets
- No guaranteed ordering

### When to Use UDP

UDP is used when **speed matters more than reliability**:

| Use Case        | Why UDP?                                     |
| --------------- | -------------------------------------------- |
| Video streaming | A dropped frame is better than a pause       |
| Online gaming   | Low latency is critical                      |
| DNS queries     | Short request/response, fast enough          |
| VoIP calls      | Real-time, occasional packet loss acceptable |

---

## 7. TCP — Transmission Control Protocol

TCP solves the problems UDP ignores. It adds **reliability** on top of IP.

### Why TCP Exists

Because the internet routes packets independently:

- Packets can arrive **out of order**
- Packets can be **lost** or **corrupted**
- UDP has no way to handle these situations

### Two Major Features of TCP

**1. Acknowledgement (ACK)**

- When a TCP packet arrives at the destination, the receiver sends back an **ACK** (acknowledgement) to the sender.
- If the sender doesn't receive an ACK within a timeout window, it **re-sends** the packet.
- This guarantees delivery and fixes lost/corrupted packets.

**2. Sequential Ordering**

- Every TCP packet has a **sequence number**.
- Even if packets arrive out of order, the receiver reassembles them in the correct order using sequence numbers.

### TCP 3-Way Handshake (Connection Setup)

Before any data is sent, TCP establishes a connection:

```
   Client                     Server
     │                           │
     │──────── SYN ────────────→ │  "I want to connect"
     │                           │
     │ ←──── SYN + ACK ──────── │  "OK, I'm ready"
     │                           │
     │──────── ACK ────────────→ │  "Great, let's go"
     │                           │
     │   ←── Data flows ──→      │
```

### TCP 4-Way Handshake (Connection Teardown)

```
   Client                     Server
     │──────── FIN ────────────→ │
     │ ←──────── ACK ─────────── │
     │ ←──────── FIN ─────────── │
     │──────── ACK ────────────→ │
```

### TCP vs. UDP Comparison

| Feature     | TCP              | UDP              |
| ----------- | ---------------- | ---------------- |
| Connection  | Connection-based | Connectionless   |
| Reliability | Guaranteed       | Not guaranteed   |
| Ordering    | Guaranteed       | Not guaranteed   |
| Speed       | Slower           | Faster           |
| Use cases   | HTTP, SSH, email | DNS, video, VoIP |

---

## 8. Ports

A **port number** is an addressing mechanism that identifies which **application or service** on a host machine should receive the data. IP gets data to the right machine; port gets it to the right program.

### Types of Ports

| Type                | Range         | Description                             |
| ------------------- | ------------- | --------------------------------------- |
| Well-known Ports    | 0 – 1023      | Reserved for standard services          |
| Registered Ports    | 1024 – 49151  | Assigned to applications                |
| Ephemeral / Private | 49152 – 65535 | Dynamically assigned to client sessions |

### Common Port Numbers DevOps Engineers Must Know

| Port | Protocol | Service                   |
| ---- | -------- | ------------------------- |
| 22   | TCP      | SSH                       |
| 25   | TCP      | SMTP (email)              |
| 53   | UDP/TCP  | DNS                       |
| 80   | TCP      | HTTP                      |
| 443  | TCP      | HTTPS                     |
| 3306 | TCP      | MySQL                     |
| 5432 | TCP      | PostgreSQL                |
| 6379 | TCP      | Redis                     |
| 8080 | TCP      | Common app/proxy port     |
| 2379 | TCP      | etcd (used by Kubernetes) |
| 6443 | TCP      | Kubernetes API server     |

---

## 9. DNS — Domain Name System

The **DNS** is a massive, distributed database that maps **human-readable domain names** to **IP addresses**.

Without DNS, you would need to type `142.250.191.46` instead of `google.com`.

### DNS Resolution Flow

```
You type: google.com
    │
    ▼
Browser checks local cache
    │ (not found)
    ▼
OS checks /etc/hosts file
    │ (not found)
    ▼
Query sent to Recursive Resolver (your ISP or 8.8.8.8)
    │
    ▼
Recursive Resolver checks its cache
    │ (not found)
    ▼
Query to Root DNS Server (knows where .com lives)
    │
    ▼
Query to TLD Server (.com nameserver)
    │
    ▼
Query to Authoritative DNS Server (knows google.com)
    │
    ▼
Returns IP address → Browser connects
```

### DNS Record Types

| Record | Purpose                                     | Example                       |
| ------ | ------------------------------------------- | ----------------------------- |
| A      | Maps domain to IPv4 address                 | `google.com → 142.250.191.46` |
| AAAA   | Maps domain to IPv6 address                 | `google.com → 2607:f8b0:...`  |
| CNAME  | Alias — one domain points to another        | `www → google.com`            |
| MX     | Mail server for the domain                  | `mail.google.com`             |
| TXT    | Arbitrary text (used for verification, SPF) | `"v=spf1 include:..."`        |
| NS     | Nameservers responsible for the domain      | `ns1.google.com`              |
| PTR    | Reverse DNS — IP to domain name             | `142.250.191.46 → google.com` |

### TTL (Time to Live)

Each DNS record has a TTL — how long (in seconds) resolvers should cache it. Lower TTL = faster propagation during changes (useful during deployments), but more DNS queries.

---

## 10. HTTP & HTTPS

**HTTP (HyperText Transfer Protocol)** is the protocol used to transfer data between a client (browser) and a web server. It runs over TCP on port **80**.

**HTTPS** is HTTP with encryption (TLS). Runs on port **443**.

### HTTP Request Structure

```
GET /index.html HTTP/1.1
Host: example.com
User-Agent: Mozilla/5.0
Accept: text/html
```

### HTTP Response Structure

```
HTTP/1.1 200 OK
Content-Type: text/html
Content-Length: 1234

<html>...</html>
```

### Common HTTP Methods

| Method | Purpose                         |
| ------ | ------------------------------- |
| GET    | Retrieve a resource             |
| POST   | Submit data / create a resource |
| PUT    | Replace a resource              |
| PATCH  | Partially update a resource     |
| DELETE | Delete a resource               |

### HTTP Status Codes

| Code Range | Category      | Examples                                                            |
| ---------- | ------------- | ------------------------------------------------------------------- |
| 1xx        | Informational | 100 Continue                                                        |
| 2xx        | Success       | 200 OK, 201 Created, 204 No Content                                 |
| 3xx        | Redirect      | 301 Moved Permanently, 302 Found                                    |
| 4xx        | Client Error  | 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found     |
| 5xx        | Server Error  | 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable |

### HTTP/1.1 vs HTTP/2 vs HTTP/3

| Version  | Key Feature                                        |
| -------- | -------------------------------------------------- |
| HTTP/1.1 | One request per connection (keep-alive helps)      |
| HTTP/2   | Multiplexing — multiple requests over one TCP conn |
| HTTP/3   | Uses QUIC (UDP-based), faster connection setup     |

---

## 11. TLS/SSL — Securing the Connection

**TLS (Transport Layer Security)** is the cryptographic protocol that makes HTTPS secure. SSL is its older, deprecated predecessor — the terms are often used interchangeably.

### What TLS Provides

- **Encryption** — Data is encrypted; eavesdroppers can't read it.
- **Authentication** — Server proves its identity via a certificate.
- **Integrity** — Data cannot be tampered with in transit (via message authentication codes).

### TLS Handshake (Simplified)

```
Client                              Server
  │                                   │
  │──── ClientHello (TLS version, ──→ │
  │     supported ciphers)            │
  │                                   │
  │ ←── ServerHello + Certificate ─── │
  │     (public key inside)           │
  │                                   │
  │  Client verifies certificate      │
  │  against trusted CA               │
  │                                   │
  │──── Key exchange ───────────────→ │
  │                                   │
  │ ←──── Encrypted data ───────────→ │
```

### Certificates and CA

- A **certificate** contains the server's public key and is signed by a **Certificate Authority (CA)** (e.g., Let's Encrypt, DigiCert).
- Your OS/browser has a list of trusted CAs. If the server's cert is signed by one of them, the connection is trusted.
- In DevOps: use **Let's Encrypt** (free) with **Certbot** to auto-provision and renew TLS certificates.

---

## 12. SSH — Secure Shell

**SSH** is the protocol DevOps engineers use to securely connect to remote servers. It runs over TCP on port **22**.

### How SSH Authentication Works

**Password authentication:** Simple but less secure. Brute-force attacks are a risk.

**Key-based authentication (recommended):**

```
Your machine                        Remote Server
 ┌─────────────────┐                ┌───────────────────────┐
 │ Private Key     │                │ ~/.ssh/authorized_keys │
 │ (kept secret)   │                │ (your public key)      │
 └─────────────────┘                └───────────────────────┘
         │                                      │
         └──── SSH handshake proves you ────────┘
               hold the private key
               (without sending it)
```

### Common SSH Commands

```bash
# Connect to a server
ssh user@server-ip

# Connect with a specific private key
ssh -i ~/.ssh/my-key.pem ubuntu@server-ip

# Copy files to/from server (SCP)
scp file.txt user@server:/home/user/
scp user@server:/path/to/file.txt ./local/

# Generate an SSH key pair
ssh-keygen -t ed25519 -C "your-email@example.com"

# SSH tunneling (port forwarding)
# Forward local port 8080 to remote port 80
ssh -L 8080:localhost:80 user@server-ip
```

### SSH Config File (`~/.ssh/config`)

Avoid typing long commands by saving settings:

```
Host my-server
    HostName 34.100.200.50
    User ubuntu
    IdentityFile ~/.ssh/my-key.pem
```

Now just type: `ssh my-server`

---

## 13. OSI Model

The **OSI (Open Systems Interconnection)** model is a conceptual framework that standardizes network communication into **7 layers**. Each layer serves the layer above it and is served by the layer below it.

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 7 - Application    │ HTTP, FTP, DNS, SMTP, gRPC          │
├─────────────────────────────────────────────────────────────────┤
│  Layer 6 - Presentation   │ Encoding, Serialization, Encryption  │
├─────────────────────────────────────────────────────────────────┤
│  Layer 5 - Session        │ TLS handshake, Connection mgmt       │
├─────────────────────────────────────────────────────────────────┤
│  Layer 4 - Transport      │ TCP, UDP (ports, segments)           │
├─────────────────────────────────────────────────────────────────┤
│  Layer 3 - Network        │ IP, Routing, ICMP                    │
├─────────────────────────────────────────────────────────────────┤
│  Layer 2 - Data Link      │ Ethernet, MAC address, ARP, Frames   │
├─────────────────────────────────────────────────────────────────┤
│  Layer 1 - Physical       │ Cables, fiber optics, radio waves    │
└─────────────────────────────────────────────────────────────────┘
```

### How Data Flows (Encapsulation)

When you send an HTTP request, it travels **down** the stack on the sender and **up** the stack on the receiver, with each layer adding/removing its own header:

```
Sender side:
Application  →  HTTP data
Transport    →  TCP segment (adds port numbers)
Network      →  IP packet (adds IP addresses)
Data Link    →  Ethernet frame (adds MAC addresses)
Physical     →  Bits over the wire

Receiver side (reverse):
Physical     →  Receive bits
Data Link    →  Strip Ethernet header
Network      →  Strip IP header
Transport    →  Strip TCP header, reorder packets
Application  →  Read HTTP data
```

---

## 14. TCP/IP Model

The **TCP/IP model** is the practical model that the internet actually uses. It collapses OSI's 7 layers into 4:

| TCP/IP Layer     | Equivalent OSI Layers              | Protocols                  |
| ---------------- | ---------------------------------- | -------------------------- |
| ④ Application    | Application, Presentation, Session | HTTP, HTTPS, DNS, SSH, FTP |
| ③ Transport      | Transport                          | TCP, UDP                   |
| ② Internet       | Network                            | IP, ICMP, ARP              |
| ① Network Access | Data Link + Physical               | Ethernet, Wi-Fi, MAC       |

**Modern world's most used architecture:** Star topology using the TCP/IP model.

---

## 15. NAT, DHCP & Private Networks

### DHCP — Dynamic Host Configuration Protocol

When a device joins a network, it doesn't have an IP address yet. DHCP automatically assigns one.

**DHCP flow:**

```
Device           Router/DHCP Server
  │──── DISCOVER ───────────────→ │  "Anyone out there?"
  │ ←────── OFFER ─────────────── │  "Here's an IP: 192.168.1.10"
  │──── REQUEST ────────────────→ │  "I'll take it!"
  │ ←────── ACK ───────────────── │  "It's yours for 24 hours"
```

The lease has an expiry. Devices renew it periodically.

### NAT — Network Address Translation

A home or office has one **public IP** (from the ISP) but many devices with **private IPs**. NAT allows all devices to share the one public IP.

```
                    Public Internet
                         │
                    ┌────┴────┐
                    │  ISP    │  gives public IP: 203.0.113.5
                    └────┬────┘
                         │
                  ┌──────┴──────┐
                  │  Router/NAT │  manages private IPs via DHCP
                  └──┬──┬──┬───┘
                     │  │  │
            192.168.1.2  192.168.1.3  192.168.1.4
               Laptop     Phone       Desktop
```

When any device sends a packet to the internet, the router **replaces the private source IP** with its public IP (and tracks the mapping). When a response comes back, NAT translates it back to the correct private device.

**Port** is used to identify which private device made the request (since many share the same public IP). The router maintains a NAT table.

---

## 16. Firewalls & Security Groups

A **firewall** is a network security system that monitors and controls incoming and outgoing traffic based on predefined rules.

### Types of Firewalls

**Stateless Firewall:** Evaluates each packet independently against rules (source IP, destination IP, port, protocol). Fast but basic.

**Stateful Firewall:** Tracks the state of active connections. If you initiated a connection outbound, the response is automatically allowed. This is how most modern firewalls work.

**WAF (Web Application Firewall):** Operates at Layer 7. Understands HTTP and can block SQL injection, XSS, etc.

### Security Groups (Cloud — AWS Example)

In cloud environments, **Security Groups** are virtual firewalls attached to instances. They are **stateful**.

**Inbound rules example:**

| Type  | Protocol | Port Range | Source          | Purpose      |
| ----- | -------- | ---------- | --------------- | ------------ |
| SSH   | TCP      | 22         | Your IP/32      | Admin access |
| HTTP  | TCP      | 80         | 0.0.0.0/0       | Public web   |
| HTTPS | TCP      | 443        | 0.0.0.0/0       | Public web   |
| MySQL | TCP      | 3306       | App subnet only | DB access    |

**Best practices:**

- Never open port 22 to `0.0.0.0/0` in production.
- Use **least privilege** — only open what's needed.
- Place databases in **private subnets** with no public IP.

---

## 17. Load Balancing

A **load balancer** distributes incoming network traffic across multiple servers to ensure no single server is overwhelmed.

```
                  Internet
                     │
              ┌──────┴──────┐
              │ Load Balancer│
              └──┬───┬───┬──┘
                 │   │   │
              Server Server Server
                1     2     3
```

### Load Balancing Algorithms

| Algorithm            | How it works                                        |
| -------------------- | --------------------------------------------------- |
| Round Robin          | Requests go to each server in rotation              |
| Least Connections    | New request goes to server with fewest active conns |
| IP Hash              | Client IP always maps to same server (sticky)       |
| Weighted Round Robin | Servers with more capacity get more traffic         |

### Layer 4 vs Layer 7 Load Balancing

**L4 Load Balancer (Transport layer):** Routes based on IP and TCP/UDP port. Fast, doesn't look at application content.

**L7 Load Balancer (Application layer):** Routes based on HTTP content — URL paths, headers, cookies. More intelligent.

```
Example — L7 routing:
/api/users    →  User Service servers
/api/products →  Product Service servers
/static/*     →  CDN / Storage servers
```

### Health Checks

Load balancers continuously ping servers. If a server doesn't respond, it's removed from the pool. When it recovers, it's added back. This enables **zero-downtime deployments**.

---

## 18. Reverse Proxy

A **reverse proxy** sits in front of backend servers and forwards client requests to them. From the client's perspective, it's talking directly to the server.

```
Client → Reverse Proxy (Nginx) → Backend Server(s)
```

**Uses:**

- SSL termination (HTTPS handled at proxy, HTTP to backends)
- Load balancing
- Caching static content
- Rate limiting
- Hiding backend server details

**Common reverse proxies:** Nginx, HAProxy, Traefik, Caddy, AWS ALB/NLB.

**Nginx reverse proxy config example:**

```nginx
server {
    listen 443 ssl;
    server_name example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 19. VPN & Tunneling

A **VPN (Virtual Private Network)** creates an encrypted tunnel over the public internet, making remote devices appear as if they're on the same local network.

```
Your Laptop ──[Encrypted Tunnel]──→ VPN Server ──→ Private Network
```

**DevOps uses:**

- Access private cloud resources (databases, internal services) securely.
- Connect office networks (site-to-site VPN).
- Access staging environments without exposing them to the internet.

### SSH Tunneling (Port Forwarding)

A quick alternative to VPN for accessing a specific remote service:

```bash
# Access a remote database (port 5432) as if it's local (localhost:5433)
ssh -L 5433:localhost:5432 user@bastion-server

# Now connect your DB client to localhost:5433
```

---

## 20. Docker Networking

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

## 21. Kubernetes Networking

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

## 22. Cloud Networking (VPC)

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

---

## 23. Network Troubleshooting Tools

Every DevOps engineer must be comfortable debugging network issues from the command line.

### `ping` — Test Reachability

```bash
ping google.com
# Sends ICMP echo requests; measures round-trip time
# If it fails: DNS problem or server unreachable
```

### `traceroute` / `tracepath` — Trace the Route

```bash
traceroute google.com
# Shows every hop (router) the packet takes
# Identifies where packets are being dropped or slowed
```

### `nslookup` / `dig` — DNS Lookup

```bash
# Basic DNS lookup
nslookup google.com

# Detailed DNS lookup with dig
dig google.com A
dig google.com MX
dig @8.8.8.8 google.com    # Use specific DNS server

# Reverse lookup
dig -x 142.250.191.46
```

### `curl` — Test HTTP/HTTPS

```bash
# GET request
curl https://api.example.com/health

# POST request with JSON
curl -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Shanto"}'

# Show response headers
curl -I https://example.com

# Follow redirects, verbose output
curl -Lv https://example.com
```

### `netstat` / `ss` — Network Connections & Listening Ports

```bash
# Show all listening ports
ss -tlnp

# Show established connections
ss -tnp state established

# Legacy alternative
netstat -tulnp
```

### `telnet` / `nc` — Test Port Connectivity

```bash
# Test if port 443 is open on a server
telnet example.com 443

# Using netcat
nc -zv example.com 443
nc -zv example.com 22
```

### `tcpdump` — Capture Network Traffic

```bash
# Capture all traffic on interface eth0
tcpdump -i eth0

# Capture traffic on port 80
tcpdump -i eth0 port 80

# Save capture to file for analysis in Wireshark
tcpdump -i eth0 -w capture.pcap
```

### `iptables` — Linux Firewall Rules

```bash
# List current rules
iptables -L -n -v

# Allow incoming SSH
iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# Block a specific IP
iptables -A INPUT -s 192.168.1.100 -j DROP
```

### `ip` — Network Interface Management

```bash
# Show all interfaces and IPs
ip addr show

# Show routing table
ip route show

# Show ARP table (MAC address mappings)
ip neigh show
```

---

## Quick Reference Summary

| Concept        | Key Point                                                    |
| -------------- | ------------------------------------------------------------ |
| IP Address     | Unique identifier for a device on a network                  |
| MAC Address    | Hardware address, used within LAN only                       |
| Subnet/CIDR    | Divides IP space; /24 = 254 hosts                            |
| Packet         | Unit of data with header (IP) + payload                      |
| UDP            | Fast, no reliability guarantee; use for streaming/gaming/DNS |
| TCP            | Reliable, ordered, with ACK; use for HTTP/SSH/databases      |
| Port           | Identifies the application within a host                     |
| DNS            | Translates domain names to IP addresses                      |
| HTTP/HTTPS     | Application protocol for web; HTTPS = HTTP + TLS             |
| TLS            | Encryption + authentication for network connections          |
| SSH            | Secure remote access to servers                              |
| OSI Model      | 7-layer conceptual model of networking                       |
| TCP/IP Model   | 4-layer practical model the internet uses                    |
| NAT            | Allows private IPs to share one public IP                    |
| DHCP           | Automatically assigns IP addresses on a network              |
| Firewall       | Controls traffic based on rules                              |
| Load Balancer  | Distributes traffic across multiple servers                  |
| Reverse Proxy  | Sits in front of servers; handles SSL, caching, routing      |
| VPN            | Encrypted tunnel over public internet                        |
| Docker Network | Bridge, host, overlay; containers communicate by name        |
| K8s Networking | Every pod gets an IP; Services provide stable endpoints      |
| VPC            | Your isolated cloud network; use public/private subnets      |

---

_This guide covers the networking fundamentals every DevOps engineer needs — from how data travels across the internet to designing production-grade cloud networks._
