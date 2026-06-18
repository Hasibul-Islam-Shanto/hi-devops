---
title: "NAT, DHCP & Firewalls"
description: "Network Address Translation, dynamic IP assignment with DHCP, and firewalls including cloud security groups."
order: 7
topic: "networking"
---

## DHCP — Dynamic Host Configuration Protocol

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

---

## NAT — Network Address Translation

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

## Firewalls & Security Groups

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
