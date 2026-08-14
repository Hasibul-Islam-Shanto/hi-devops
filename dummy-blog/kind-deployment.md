Deploying a Full-Stack Application on Kubernetes with kind

In this project, we deployed a full-stack application consisting of:

Frontend → React/Vite served by Nginx
Backend  → Node.js application
Database → PostgreSQL

The Docker images are pulled from Docker Hub, while PostgreSQL runs directly inside the Kubernetes cluster.

Our final architecture looks like:

                         Internet
                            │
                            │ EC2_PUBLIC_IP:8080
                            ▼
                      AWS EC2 Host
                            │
                     Docker / kind
                            │
                    Host 8080 → 30080
                            │
                            ▼
                 ┌─────────────────────┐
                 │  frontend-service   │
                 │  NodePort :30080    │
                 └──────────┬──────────┘
                            │
                    selector: app=
                    incident-frontend
                            │
                  ┌─────────┴─────────┐
                  ▼                   ▼
           Frontend Pod 1      Frontend Pod 2
              Nginx :80           Nginx :80
                  │
                  │ /api/*
                  │
                  ▼
                 CoreDNS
                  │
                  │ backend-service:5000
                  ▼
                 ┌─────────────────────┐
                 │   backend-service   │
                 │    Service :5000    │
                 └──────────┬──────────┘
                            │
                  ┌─────────┴─────────┐
                  ▼                   ▼
            Backend Pod 1       Backend Pod 2
               :5000               :5000
                  │                   │
                  └─────────┬─────────┘
                            │
                            │ postgres-service:5432
                            ▼
                    ┌────────────────┐
                    │postgres-service│
                    │ ClusterIP:5432 │
                    └───────┬────────┘
                            │
                            ▼
                      PostgreSQL Pod
                           :5432
                            │
                            ▼
                      postgres-pvc
                            │
                            ▼
                     PersistentVolume
1. Project Structure

Our Kubernetes files can be organized like this:

incident-k8s/
│
├── kind-config.yml
├── namespace.yml
│
├── postgres-secret.yml
├── postgres-pvc.yml
├── postgres-deployment.yml
├── postgres-service.yml
│
├── backend-deployment.yml
├── backend-service.yml
│
├── frontend-deployment.yml
└── frontend-service.yml

Each file has one specific responsibility.

2. kind-config.yml

This file creates our Kubernetes cluster using kind (Kubernetes IN Docker).

kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4

nodes:
  - role: control-plane
    extraPortMappings:
      - containerPort: 30080
        hostPort: 8080
        listenAddress: "0.0.0.0"
        protocol: TCP

      - containerPort: 30081
        hostPort: 8081
        listenAddress: "0.0.0.0"
        protocol: TCP

  - role: worker

  - role: worker
What it does

It creates:

AWS EC2
   │
   └── Docker
        │
        ├── incident-control-plane
        ├── incident-worker
        └── incident-worker2

Even though these are Docker containers from the EC2/Docker perspective, Kubernetes sees them as Nodes.

kubectl get nodes
Port mappings

We configured:

EC2 :8080 → kind :30080
EC2 :8081 → kind :30081

30080 is used by our frontend NodePort.

30081 is used by our backend NodePort.

The cluster is created with:

kind create cluster --name incident --config kind-config.yml

Unlike the other YAML files, kind-config.yml is not a Kubernetes manifest. It is configuration consumed by kind.

3. namespace.yml
apiVersion: v1
kind: Namespace

metadata:
  name: incident

The namespace creates a logical boundary for all resources belonging to this application.

Our resources therefore live under:

incident
│
├── PostgreSQL
├── Backend
└── Frontend

Create it:

kubectl apply -f namespace.yml

After this, our manifests use:

metadata:
  namespace: incident
4. postgres-secret.yml

PostgreSQL requires database credentials.

Instead of putting them directly inside the Deployment, we created a Kubernetes Secret.

apiVersion: v1
kind: Secret

metadata:
  name: postgres-secret
  namespace: incident

type: Opaque

stringData:
  POSTGRES_USER: incident_user
  POSTGRES_PASSWORD: incident_password
  POSTGRES_DB: incident_db

This provides:

POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_DB

The PostgreSQL container reads these values when it starts.

Our backend also reuses these values for its database configuration.

postgres-secret
       │
       ├───────────────┐
       ▼               ▼
PostgreSQL Pod     Backend Pods

For a learning environment this is fine. For a real production setup, we would handle secrets more carefully and avoid committing real credentials to Git.

5. postgres-pvc.yml

Containers are temporary.

If PostgreSQL stored everything only inside its container filesystem:

Postgres Pod deleted
        ↓
Container deleted
        ↓
Database data potentially lost

So we created persistent storage.

apiVersion: v1
kind: PersistentVolumeClaim

metadata:
  name: postgres-pvc
  namespace: incident

spec:
  accessModes:
    - ReadWriteOnce

  resources:
    requests:
      storage: 1Gi

The PVC requests:

1 GiB persistent storage

The relationship becomes:

PostgreSQL Pod
      │
      │ mount
      ▼
postgres-pvc
      │
      ▼
PersistentVolume

We initially saw:

Pending

because the kind StorageClass used:

WaitForFirstConsumer

Once the PostgreSQL Pod requested the PVC, Kubernetes could provision/bind the storage.

PVC created
   ↓
Pending
   ↓
Postgres Pod scheduled
   ↓
Volume provisioned
   ↓
PVC Bound
6. postgres-deployment.yml

Now we create PostgreSQL itself.

apiVersion: apps/v1
kind: Deployment

metadata:
  name: postgres
  namespace: incident

spec:
  replicas: 1

  selector:
    matchLabels:
      app: postgres

  template:
    metadata:
      labels:
        app: postgres

    spec:
      containers:
        - name: postgres
          image: postgres:16

          ports:
            - containerPort: 5432

          env:
            - name: POSTGRES_USER
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: POSTGRES_USER

            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: POSTGRES_PASSWORD

            - name: POSTGRES_DB
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: POSTGRES_DB

          volumeMounts:
            - name: postgres-storage
              mountPath: /var/lib/postgresql/data

      volumes:
        - name: postgres-storage
          persistentVolumeClaim:
            claimName: postgres-pvc

This connects three things:

postgres-secret
       │
       │ credentials
       ▼
PostgreSQL Pod
       │
       │ database files
       ▼
postgres-pvc

The container listens on:

5432

and PostgreSQL stores its database files under:

/var/lib/postgresql/data

which we mounted to our PVC.

7. postgres-service.yml

The PostgreSQL Pod has its own Pod IP.

But our backend should never depend directly on that IP because Pods can be recreated.

So we created:

apiVersion: v1
kind: Service

metadata:
  name: postgres-service
  namespace: incident

spec:
  type: ClusterIP

  selector:
    app: postgres

  ports:
    - protocol: TCP
      port: 5432
      targetPort: 5432

The Service finds the PostgreSQL Pod using:

selector:
  app: postgres

because the Pod has:

labels:
  app: postgres

Therefore:

postgres-service
       │
       │ selector: app=postgres
       ▼
PostgreSQL Pod

We use ClusterIP because PostgreSQL only needs to be accessible inside the Kubernetes cluster.

There is no reason to expose our database directly to the internet.

Our backend can now use:

postgres-service:5432

instead of knowing the PostgreSQL Pod IP.

8. backend-deployment.yml

Our backend Docker image is:

shanto78/incident-backend:latest

The Deployment creates two replicas.

apiVersion: apps/v1
kind: Deployment

metadata:
  name: incident-backend
  namespace: incident

spec:
  replicas: 2

  selector:
    matchLabels:
      app: incident-backend

  template:
    metadata:
      labels:
        app: incident-backend

    spec:
      containers:
        - name: incident-backend
          image: shanto78/incident-backend:latest

          ports:
            - containerPort: 5000

          env:
            - name: PORT
              value: "5000"

            - name: NODE_ENV
              value: "production"

            - name: DB_HOST
              value: "postgres-service"

            - name: DB_PORT
              value: "5432"

            - name: DB_NAME
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: POSTGRES_DB

            - name: DB_USER
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: POSTGRES_USER

            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: POSTGRES_PASSWORD

The important configuration is:

DB_HOST=postgres-service
DB_PORT=5432

Previously, Docker Compose used:

DB_HOST=database

because database was the Docker Compose service name.

In Kubernetes:

Docker Compose       Kubernetes

database       →     postgres-service

CoreDNS allows the backend to resolve that Service name.

The Deployment then creates:

incident-backend Deployment
           │
           ▼
       ReplicaSet
           │
      replicas: 2
           │
     ┌─────┴─────┐
     ▼           ▼
Backend Pod   Backend Pod
   :5000         :5000
9. backend-service.yml

The two backend Pods need one stable endpoint.

apiVersion: v1
kind: Service

metadata:
  name: backend-service
  namespace: incident

spec:
  type: NodePort

  selector:
    app: incident-backend

  ports:
    - protocol: TCP
      port: 5000
      targetPort: 5000
      nodePort: 30081

The Service finds:

app=incident-backend

so both backend Pods become Service endpoints.

              backend-service
                   :5000
                     │
             selector:
          app=incident-backend
                     │
              ┌──────┴──────┐
              ▼             ▼
         Backend Pod    Backend Pod
            :5000          :5000

Because we configured:

nodePort: 30081

and kind has:

EC2 8081 → kind 30081

we can also reach the backend externally during testing:

EC2_PUBLIC_IP:8081
       ↓
NodePort :30081
       ↓
backend-service :5000
       ↓
Backend Pod :5000

This external backend exposure is useful for learning/testing; our frontend's reverse proxy doesn't actually require browser traffic to use it directly.

10. Frontend Nginx Configuration

Our frontend is a static application served through Nginx.

Its Docker image contains:

server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location /api/ {
        proxy_pass http://backend-service:5000/api/;

        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}

This is an important part of our architecture.

Requests for:

/

serve the frontend.

Requests for:

/api/*

are proxied to:

backend-service:5000

Therefore:

Browser
   │
   │ /api/incidents
   ▼
Frontend Nginx
   │
   │ backend-service:5000/api/incidents
   ▼
Backend Service
   ↓
Backend Pod

The browser never needs to understand Kubernetes DNS.

Nginx is running inside the cluster, so it can resolve backend-service through CoreDNS.

11. frontend-deployment.yml

The frontend Docker image is:

shanto78/incident-frontend:latest

Our Deployment:

apiVersion: apps/v1
kind: Deployment

metadata:
  name: incident-frontend
  namespace: incident

spec:
  replicas: 2

  selector:
    matchLabels:
      app: incident-frontend

  template:
    metadata:
      labels:
        app: incident-frontend

    spec:
      containers:
        - name: incident-frontend
          image: shanto78/incident-frontend:latest

          ports:
            - containerPort: 80

Again:

Deployment
    ↓
ReplicaSet
    ↓
┌──────────────┐
│              │
▼              ▼
Frontend     Frontend
Pod 1        Pod 2
:80          :80

Nginx runs inside each Pod and serves our built frontend.

12. frontend-service.yml

Finally, we expose our frontend.

apiVersion: v1
kind: Service

metadata:
  name: frontend-service
  namespace: incident

spec:
  type: NodePort

  selector:
    app: incident-frontend

  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
      nodePort: 30080

The Service finds:

app=incident-frontend

Pods.

frontend-service
       │
       │ selector
       │ app=incident-frontend
       ▼
 ┌───────────────┐
 │               │
 ▼               ▼
Frontend       Frontend
Pod 1          Pod 2

Our kind configuration maps:

EC2 :8080
   ↓
kind :30080

while the Service maps:

NodePort :30080
   ↓
Service :80
   ↓
Pod :80

Therefore the complete external path is:

Browser
   ↓
EC2_PUBLIC_IP:8080
   ↓
kind mapping
8080 → 30080
   ↓
frontend-service
   ↓
Frontend Pod
13. Complete Request Flow

Now consider a user opening:

http://EC2_PUBLIC_IP:8080

The frontend request follows:

Browser
   ↓
EC2 :8080
   ↓
kind port mapping
   ↓
NodePort :30080
   ↓
frontend-service
   ↓
Frontend Nginx Pod
   ↓
index.html / JS / CSS
   ↓
Browser

Now suppose the frontend requests:

/api/incidents

The request becomes:

Browser
   │
   │ /api/incidents
   ▼
EC2 :8080
   ▼
frontend-service
   ▼
Frontend Nginx Pod
   │
   │ proxy_pass
   ▼
backend-service:5000
   │
   │ CoreDNS resolves Service
   ▼
Backend Pod
   │
   │ SQL query
   ▼
postgres-service:5432
   │
   │ CoreDNS resolves Service
   ▼
PostgreSQL Pod
   ▼
Database

The response travels back:

PostgreSQL
   ↓
Backend
   ↓
Frontend Nginx
   ↓
Browser

That is the full request lifecycle of our deployed application.

14. Deployment Order

For a completely fresh environment, we used:

# 1. Cluster
kind create cluster --name incident --config kind-config.yml

# 2. Namespace
kubectl apply -f namespace.yml

# 3. PostgreSQL configuration/storage
kubectl apply -f postgres-secret.yml
kubectl apply -f postgres-pvc.yml

# 4. PostgreSQL
kubectl apply -f postgres-deployment.yml
kubectl apply -f postgres-service.yml

# 5. Backend
kubectl apply -f backend-deployment.yml
kubectl apply -f backend-service.yml

# 6. Frontend
kubectl apply -f frontend-deployment.yml
kubectl apply -f frontend-service.yml

Conceptually:

Cluster
   ↓
Namespace
   ↓
Secrets + Storage
   ↓
Database
   ↓
Database Service
   ↓
Backend
   ↓
Backend Service
   ↓
Frontend
   ↓
Frontend Service
   ↓
Application accessible
15. Useful Verification Commands

During deployment, these are the commands worth remembering:

# Everything in the namespace
kubectl get all -n incident

# Pods
kubectl get pods -n incident -o wide

# Deployments
kubectl get deployments -n incident

# Services
kubectl get svc -n incident

# Persistent storage
kubectl get pvc -n incident

# Service endpoints
kubectl get endpointslices -n incident

# Pod details/errors
kubectl describe pod <pod-name> -n incident

# Service details
kubectl describe svc <service-name> -n incident

# Application logs
kubectl logs <pod-name> -n incident

# Follow logs
kubectl logs -f <pod-name> -n incident

One debugging lesson from this deployment was particularly useful:

Pod Running but application failing
        ↓
kubectl logs


CreateContainerConfigError
        ↓
kubectl describe pod
        ↓
Check Events


ErrImagePull
        ↓
kubectl describe pod
        ↓
Check image/tag/platform

We encountered both configuration and image-platform issues during this deployment, so these weren't just theoretical troubleshooting steps.