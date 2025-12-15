# Complete Implementation Manual - Kubernetes Deployment on AWS EC2 with Minikube

## 📚 Table of Contents
1. [Assignment Overview](#assignment-overview)
2. [Prerequisites & Requirements](#prerequisites--requirements)
3. [Part I: Setting Up AWS EC2 Instance](#part-i-setting-up-aws-ec2-instance)
4. [Part II: Installing Required Software on EC2](#part-ii-installing-required-software-on-ec2)
5. [Part III: Understanding Kubernetes Concepts](#part-iii-understanding-kubernetes-concepts)
6. [Part IV: Preparing Docker Image for Web Server](#part-iv-preparing-docker-image-for-web-server)
7. [Part V: Creating Kubernetes YAML Files](#part-v-creating-kubernetes-yaml-files)
8. [Part VI: Deploying to Kubernetes Cluster](#part-vi-deploying-to-kubernetes-cluster)
9. [Part VII: Setting Up HorizontalPodAutoscaler](#part-vii-setting-up-horizontalpodautoscaler)
10. [Part VIII: Setting Up Ngrok Tunnels](#part-viii-setting-up-ngrok-tunnels)
11. [Part IX: Verification & Testing](#part-ix-verification--testing)
12. [Troubleshooting Guide](#troubleshooting-guide)

---

## Assignment Overview

### What We're Building
- Deploy a Next.js Todo Application on AWS EC2 instance using Minikube
- Use MongoDB as the database server with persistent storage
- Configure NodePort services for both web and database servers
- Set up auto-scaling based on incoming traffic
- Expose services externally using ngrok tunnels

### Architecture Diagram
```
┌──────────────────────────────────────────────────────────────────────────┐
│                          AWS EC2 Instance (Ubuntu)                        │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Minikube Kubernetes Cluster                    │   │
│  │                                                                    │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │          NodePort Service (Web) - Port 30000             │   │   │
│  │  └─────────────────────────┬────────────────────────────────┘   │   │
│  │                            │                                     │   │
│  │         ┌──────────────────┼──────────────────┐                 │   │
│  │         ▼                  ▼                  ▼                 │   │
│  │  ┌──────────┐       ┌──────────┐       ┌──────────┐            │   │
│  │  │ Web Pod  │       │ Web Pod  │  ...  │ Web Pod  │            │   │
│  │  │ Replica 1│       │ Replica N│       │          │            │   │
│  │  └────┬─────┘       └────┬─────┘       └────┬─────┘            │   │
│  │       │                  │                  │                   │   │
│  │       └──────────────────┼──────────────────┘                   │   │
│  │                          ▼                                      │   │
│  │  ┌──────────────────────────────────────────────────────────┐  │   │
│  │  │       NodePort Service (Database) - Port 30017           │  │   │
│  │  └─────────────────────────┬────────────────────────────────┘  │   │
│  │                            ▼                                    │   │
│  │                     ┌──────────┐                                │   │
│  │                     │ MongoDB  │                                │   │
│  │                     │   Pod    │                                │   │
│  │                     └────┬─────┘                                │   │
│  │                          │                                      │   │
│  │                          ▼                                      │   │
│  │  ┌──────────────────────────────────────────────────────────┐  │   │
│  │  │          Persistent Volume Claim (PVC)                   │  │   │
│  │  │               Database Storage                           │  │   │
│  │  └──────────────────────────────────────────────────────────┘  │   │
│  │                                                                 │   │
│  │  ┌──────────────────────────────────────────────────────────┐  │   │
│  │  │         HorizontalPodAutoscaler (HPA)                    │  │   │
│  │  │           Auto-scales Web Pods                           │  │   │
│  │  └──────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                         Ngrok Tunnels                             │  │
│  │  ┌──────────────────────────┐  ┌───────────────────────────┐    │  │
│  │  │ Tunnel 1: Web App        │  │ Tunnel 2: K8s Dashboard   │    │  │
│  │  │ localhost:30000          │  │ localhost:xxxxx           │    │  │
│  │  │ → https://xxx.ngrok.io   │  │ → https://yyy.ngrok.io    │    │  │
│  │  └──────────────────────────┘  └───────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Internet Access
                                    ▼
                           External Users/Evaluators
```

### Key Requirements
- ✅ Deploy on AWS EC2 instance
- ✅ Use Minikube for Kubernetes cluster
- ✅ Both services (Web & Database) must be **NodePort**
- ✅ Database must have persistent storage (PVC)
- ✅ Implement HorizontalPodAutoscaler for web server
- ✅ Expose via ngrok tunnels (Web App + Kubernetes Dashboard)
- ✅ Tunnels must remain active during evaluation

---

## Prerequisites & Requirements

### AWS Account Requirements
- Active AWS account with EC2 access
- IAM user with permissions to create and manage EC2 instances
- Understanding of AWS security groups and SSH key pairs

### EC2 Instance Requirements
- **Instance Type:** t2.medium or larger (2 vCPU, 4GB RAM minimum)
- **Operating System:** Ubuntu 22.04 LTS or 20.04 LTS
- **Storage:** At least 20GB root volume
- **Security Group:** Ports 22 (SSH), 80, 443, and custom ports for NodePort services

### Software to be Installed on EC2
1. Docker
2. Minikube
3. kubectl (Kubernetes CLI)
4. Ngrok
5. Git

---

## Part I: Setting Up AWS EC2 Instance

### Step 1: Launch EC2 Instance

1. **Log in to AWS Console:**
   - Go to https://console.aws.amazon.com/
   - Navigate to EC2 Dashboard

2. **Click "Launch Instance"**

3. **Configure Instance:**
   - **Name:** `minikube-k8s-server`
   - **Application and OS Images:** 
     - Select **Ubuntu Server 22.04 LTS (HVM), SSD Volume Type**
     - Architecture: **64-bit (x86)**
   
   - **Instance Type:**
     - Select **t2.medium** (2 vCPU, 4 GiB Memory)
     - Minimum recommended for running Minikube
   
   - **Key Pair:**
     - Create new key pair or select existing
     - **Name:** `minikube-key`
     - **Type:** RSA
     - **Format:** .pem (for Linux/Mac) or .ppk (for Windows PuTTY)
     - Download and save securely
   
   - **Network Settings:**
     - Create security group: `minikube-sg`
     - **Allow SSH:** Port 22 from your IP
     - **Allow HTTP:** Port 80 from anywhere (0.0.0.0/0)
     - **Allow HTTPS:** Port 443 from anywhere (0.0.0.0/0)
     - **Allow Custom TCP:** Port range 30000-32767 from anywhere (for NodePort)
   
   - **Storage:**
     - **Size:** 20 GiB
     - **Volume Type:** gp3 (General Purpose SSD)

4. **Review and Launch:**
   - Click "Launch Instance"
   - Wait for instance state to become "Running"

5. **Note the Public IP:**
   - Copy your instance's **Public IPv4 address**
   - Example: `54.123.45.67`

### Step 2: Connect to EC2 Instance

**From Linux/Mac Terminal:**
```bash
# Set proper permissions on key file
chmod 400 minikube-key.pem

# Connect via SSH
ssh -i minikube-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

**From Windows (using PowerShell with OpenSSH):**
```powershell
# Connect via SSH
ssh -i minikube-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

**From Windows (using PuTTY):**
1. Open PuTTY
2. Enter Host Name: `ubuntu@YOUR_EC2_PUBLIC_IP`
3. Navigate to Connection → SSH → Auth → Credentials
4. Browse and select your `.ppk` key file
5. Click "Open"

### Step 3: Update System

Once connected to EC2, run:
```bash
# Update package list
sudo apt update

# Upgrade installed packages
sudo apt upgrade -y

# Install basic utilities
sudo apt install -y curl wget apt-transport-https ca-certificates software-properties-common
```

---

## Part II: Installing Required Software on EC2

### Step 1: Install Docker

1. **Install Docker prerequisites:**
   ```bash
   sudo apt install -y ca-certificates curl gnupg lsb-release
   ```

2. **Add Docker's official GPG key:**
   ```bash
   sudo mkdir -p /etc/apt/keyrings
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
   ```

3. **Set up Docker repository:**
   ```bash
   echo \
     "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
     $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
   ```

4. **Install Docker Engine:**
   ```bash
   sudo apt update
   sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
   ```

5. **Add user to docker group (avoid using sudo):**
   ```bash
   sudo usermod -aG docker $USER
   ```

6. **Apply group changes (logout and login, or use):**
   ```bash
   newgrp docker
   ```

7. **Verify Docker installation:**
   ```bash
   docker --version
   docker run hello-world
   ```

### Step 2: Install kubectl

1. **Download kubectl:**
   ```bash
   curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
   ```

2. **Make it executable:**
   ```bash
   chmod +x kubectl
   ```

3. **Move to system path:**
   ```bash
   sudo mv kubectl /usr/local/bin/
   ```

4. **Verify installation:**
   ```bash
   kubectl version --client
   ```

### Step 3: Install Minikube

1. **Download Minikube:**
   ```bash
   curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
   ```

2. **Install Minikube:**
   ```bash
   sudo install minikube-linux-amd64 /usr/local/bin/minikube
   ```

3. **Verify installation:**
   ```bash
   minikube version
   ```

### Step 4: Start Minikube Cluster

1. **Start Minikube with Docker driver:**
   ```bash
   minikube start --driver=docker --memory=3500 --cpus=2
   ```

2. **Wait for cluster to start (5-10 minutes first time)**

3. **Expected output:**
   ```
   😄  minikube v1.x.x on Ubuntu 22.04
   ✨  Using the docker driver based on user configuration
   👍  Starting control plane node minikube in cluster minikube
   🚜  Pulling base image ...
   🔥  Creating docker container (CPUs=2, Memory=3500MB) ...
   🐳  Preparing Kubernetes v1.x.x on Docker 24.x.x ...
   🔎  Verifying Kubernetes components...
   🌟  Enabled addons: storage-provisioner, default-storageclass
   🏄  Done! kubectl is now configured to use "minikube" cluster
   ```

4. **Verify cluster is running:**
   ```bash
   minikube status
   ```

5. **Check kubectl connectivity:**
   ```bash
   kubectl cluster-info
   kubectl get nodes
   ```

### Step 5: Enable Required Minikube Addons

1. **Enable metrics-server (required for HPA):**
   ```bash
   minikube addons enable metrics-server
   ```

2. **Enable dashboard:**
   ```bash
   minikube addons enable dashboard
   ```

3. **Enable storage provisioner (should be enabled by default):**
   ```bash
   minikube addons enable storage-provisioner
   ```

4. **Verify enabled addons:**
   ```bash
   minikube addons list | grep enabled
   ```

### Step 6: Install Ngrok

1. **Download and install ngrok:**
   ```bash
   curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
   echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
   sudo apt update
   sudo apt install ngrok
   ```

2. **Sign up for ngrok account (if you don't have one):**
   - Go to: https://dashboard.ngrok.com/signup
   - Sign up with email or GitHub

3. **Get your authtoken:**
   - Go to: https://dashboard.ngrok.com/get-started/your-authtoken
   - Copy your authtoken

4. **Add authtoken to ngrok:**
   ```bash
   ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
   ```

5. **Verify ngrok installation:**
   ```bash
   ngrok version
   ```

---

## Part III: Understanding Kubernetes Concepts

### Key Kubernetes Objects

#### 1. Pod
- Smallest deployable unit in Kubernetes
- Contains one or more containers
- Shares network and storage

#### 2. Deployment
- Manages Pods and ReplicaSets
- Ensures desired number of replicas are running
- Handles updates and rollbacks

#### 3. Service
- Exposes Pods to network traffic
- Types:
  - **ClusterIP:** Internal only (default)
  - **NodePort:** Exposes on each node's IP at a static port (30000-32767)
  - **LoadBalancer:** Exposes externally using a cloud load balancer
- **For this assignment:** Both web and database services use **NodePort**

#### 4. Persistent Volume (PV) & Persistent Volume Claim (PVC)
- PV: A piece of storage in the cluster
- PVC: A request for storage by a user

#### 5. HorizontalPodAutoscaler (HPA)
- Automatically scales Pods based on metrics (CPU, memory, etc.)

### YAML File Structure
```yaml
apiVersion: <api-version>        # Which Kubernetes API to use
kind: <resource-type>            # What type of resource (Deployment, Service, etc.)
metadata:                        # Information about the resource
  name: <resource-name>
  labels:
    app: <label-value>
spec:                            # Specification/configuration of the resource
  # Resource-specific configuration
```

---

## Part IV: Preparing Docker Image for Web Server

### Step 1: Transfer Project Files to EC2

You need to get your project files onto the EC2 instance. Choose one method:

**Method 1: Using Git (Recommended)**
```bash
# Clone your repository on EC2
git clone https://github.com/your-username/todo-app-a4.git
cd todo-app-a4
```

**Method 2: Using SCP from your local machine**
```bash
# From your local machine (Linux/Mac)
scp -i minikube-key.pem -r /path/to/todo-app-a4 ubuntu@YOUR_EC2_PUBLIC_IP:~/

# Then on EC2
cd ~/todo-app-a4
```

**Method 3: Using FileZilla or WinSCP (Windows GUI)**
- Use FileZilla/WinSCP to transfer files
- Connect using your EC2 IP and key pair
- Upload the entire project directory

### Step 2: Verify Project Structure on EC2

```bash
cd ~/todo-app-a4
ls -la
```

You should see: `Dockerfile.k8s`, `package.json`, `components/`, `pages/`, `k8s/`, etc.

### Step 3: Configure Minikube Docker Environment

**IMPORTANT:** This makes Docker build images directly into Minikube's registry.

1. **Set Minikube Docker environment:**
   ```bash
   eval $(minikube docker-env)
   ```

   **Note:** Run this command in every new terminal session where you build images.

2. **Verify you're using Minikube's Docker:**
   ```bash
   docker images
   ```
   You should see Kubernetes internal images (like k8s.gcr.io/...)

### Step 4: Build Docker Image for Web Server

1. **Ensure you're in project root:**
   ```bash
   cd ~/todo-app-a4
   ```

2. **Build the Docker image:**
   ```bash
   docker build -t todo-app-web:v1 -f Dockerfile.k8s .
   ```

3. **Wait for build to complete (5-10 minutes first time)**

4. **Verify the image was created:**
   ```bash
   docker images | grep todo-app-web
   ```
   You should see: `todo-app-web   v1   ...`

### Step 5: Test Image (Optional but Recommended)

1. **Run a test container:**
   ```bash
   docker run -d -p 3000:3000 --name test-todo \
     -e MONGODB_URI="mongodb://admin:password@localhost:27017/tododb?authSource=admin" \
     todo-app-web:v1
   ```

2. **Check if it's running:**
   ```bash
   docker ps
   ```

3. **Stop and remove test container:**
   ```bash
   docker stop test-todo
   docker rm test-todo
   ```

---

## Part V: Creating Kubernetes YAML Files

### Step 1: Navigate to Kubernetes Directory

```bash
cd ~/todo-app-a4/k8s
ls -la
```

You should see the YAML files already created. If not, create them as shown below.

### Step 2: Verify/Update MongoDB Persistent Volume Claim (PVC)

**File: `mongodb-pvc.yaml`**

The file should already exist. Verify its content:

```bash
cat mongodb-pvc.yaml
```

**Expected content:**
```yaml
# MongoDB Persistent Volume Claim
# This ensures database data persists even if the pod restarts

apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mongodb-pvc
  labels:
    app: mongodb
spec:
  accessModes:
    - ReadWriteOnce          # Can be mounted as read-write by a single node
  resources:
    requests:
      storage: 1Gi           # Request 1GB of storage
  storageClassName: standard  # Minikube's default storage class
```

### Step 3: Verify/Update MongoDB Deployment

**File: `mongodb-deployment.yaml`**

Verify the file exists and check its content:

```bash
cat mongodb-deployment.yaml
```

**Expected content:**
```yaml
# MongoDB Deployment
# Deploys a single MongoDB instance with persistent storage

apiVersion: apps/v1
kind: Deployment
metadata:
  name: mongodb-deployment
  labels:
    app: mongodb
spec:
  replicas: 1                 # Only ONE replica for database server (as per requirements)
  selector:
    matchLabels:
      app: mongodb
  template:
    metadata:
      labels:
        app: mongodb
    spec:
      containers:
        - name: mongodb
          image: mongo:7.0
          ports:
            - containerPort: 27017
          env:
            - name: MONGO_INITDB_ROOT_USERNAME
              value: "admin"
            - name: MONGO_INITDB_ROOT_PASSWORD
              value: "todoapp123"
            - name: MONGO_INITDB_DATABASE
              value: "tododb"
          volumeMounts:
            - name: mongodb-data
              mountPath: /data/db        # MongoDB's data directory
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
      volumes:
        - name: mongodb-data
          persistentVolumeClaim:
            claimName: mongodb-pvc       # Reference to PVC created above
```

### Step 4: Verify/Update MongoDB Service (NodePort)

**File: `mongodb-service.yaml`**

```bash
cat mongodb-service.yaml
```

**Expected content:**
```yaml
# MongoDB Service (NodePort)
# Exposes MongoDB to other pods and externally through NodePort

apiVersion: v1
kind: Service
metadata:
  name: mongodb-service
  labels:
    app: mongodb
spec:
  type: NodePort              # NodePort type as per requirements
  selector:
    app: mongodb
  ports:
    - protocol: TCP
      port: 27017             # Service port (internal)
      targetPort: 27017       # Container port
      nodePort: 30017         # External port (30000-32767 range)
```

### Step 5: Update Web Server Deployment with Your Roll Number

**File: `webapp-deployment.yaml`**

**IMPORTANT:** You MUST update the replicas count based on your roll number.

**Formula:** `(your_roll_no mod 10) + 2`

1. **Open the file for editing:**
   ```bash
   nano webapp-deployment.yaml
   # or use vi: vi webapp-deployment.yaml
   ```

2. **Find the line with `replicas:`** and update it with your calculated value.

3. **Example calculations:**
   - Roll No 60: `(60 mod 10) + 2 = 0 + 2 = 2 replicas`
   - Roll No 157: `(157 mod 10) + 2 = 7 + 2 = 9 replicas`
   - Roll No 42: `(42 mod 10) + 2 = 2 + 2 = 4 replicas`

**Expected content (with YOUR replica count):**
```yaml
# Web Application Deployment
# Deploys multiple replicas of the Next.js Todo application
#
# IMPORTANT: Replace 'replicas' value with your calculated number!
# Formula: (your_roll_no mod 10) + 2

apiVersion: apps/v1
kind: Deployment
metadata:
  name: webapp-deployment
  labels:
    app: webapp
spec:
  # TODO: Replace with your calculated replica count
  replicas: 2  # UPDATE THIS NUMBER BASED ON YOUR ROLL NUMBER
  selector:
    matchLabels:
      app: webapp
  template:
    metadata:
      labels:
        app: webapp
    spec:
      containers:
        - name: webapp
          image: todo-app-web:v1
          imagePullPolicy: Never       # Use local image from Minikube's Docker
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: "production"
            - name: MONGODB_URI
              # Connect to MongoDB service by its Kubernetes service name
              value: "mongodb://admin:todoapp123@mongodb-service:27017/tododb?authSource=admin"
            - name: NEXTAUTH_URL
              value: "http://localhost:3000"
            - name: NEXTAUTH_SECRET
              value: "your-secret-key-here-change-in-production"
          resources:
            requests:
              memory: "256Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          readinessProbe:
            httpGet:
              path: /
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /
              port: 3000
            initialDelaySeconds: 60
            periodSeconds: 20
```

### Step 6: UPDATE Web Server Service to NodePort

**File: `webapp-service.yaml`**

**IMPORTANT:** The web service MUST be NodePort (not LoadBalancer) as per assignment requirements.

1. **Open the file for editing:**
   ```bash
   nano webapp-service.yaml
   ```

2. **Update the content to use NodePort:**

```bash
cat > webapp-service.yaml << 'EOF'
# Web Application Service (NodePort)
# Exposes web application with load balancing across replicas

apiVersion: v1
kind: Service
metadata:
  name: webapp-service
  labels:
    app: webapp
spec:
  type: NodePort              # NodePort type as per requirements
  selector:
    app: webapp
  ports:
    - protocol: TCP
      port: 3000              # Service port
      targetPort: 3000        # Container port
      nodePort: 30000         # External port (30000-32767 range)
EOF
```

3. **Verify the file:**
   ```bash
   cat webapp-service.yaml
   ```

### Step 7: Verify/Update HorizontalPodAutoscaler (HPA)

**File: `webapp-hpa.yaml`**

```bash
cat webapp-hpa.yaml
```

**Expected content:**
```yaml
# HorizontalPodAutoscaler for Web Application
# Automatically scales pods based on CPU and memory utilization

apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: webapp-hpa
  labels:
    app: webapp
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: webapp-deployment
  minReplicas: 2              # Minimum number of replicas
  maxReplicas: 10             # Maximum number of replicas
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 50    # Scale up if CPU usage exceeds 50%
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 70    # Scale up if memory usage exceeds 70%
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60   # Wait 60 seconds before scaling up
      policies:
        - type: Pods
          value: 2
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300  # Wait 5 minutes before scaling down
      policies:
        - type: Pods
          value: 1
          periodSeconds: 120
```

### Step 8: Verify All YAML Files

1. **List all files in k8s directory:**
   ```bash
   ls -la
   ```

   You should see:
   ```
   mongodb-pvc.yaml
   mongodb-deployment.yaml
   mongodb-service.yaml
   webapp-deployment.yaml
   webapp-service.yaml
   webapp-hpa.yaml
   ```

2. **Verify YAML syntax for each file (dry-run):**
   ```bash
   kubectl apply --dry-run=client -f mongodb-pvc.yaml
   kubectl apply --dry-run=client -f mongodb-deployment.yaml
   kubectl apply --dry-run=client -f mongodb-service.yaml
   kubectl apply --dry-run=client -f webapp-deployment.yaml
   kubectl apply --dry-run=client -f webapp-service.yaml
   kubectl apply --dry-run=client -f webapp-hpa.yaml
   ```

   Each command should output "created (dry run)" - if any errors appear, fix them before proceeding.

---

## Part VI: Deploying to Kubernetes Cluster

### Step 1: Ensure Minikube is Running

1. **Check Minikube status:**
   ```bash
   minikube status
   ```

2. **If not running, start it:**
   ```bash
   minikube start --driver=docker --memory=3500 --cpus=2
   ```

### Step 2: Ensure You're in the k8s Directory

```bash
cd ~/todo-app-a4/k8s
pwd  # Should show: /home/ubuntu/todo-app-a4/k8s
```

### Step 3: Apply Kubernetes Resources (In Correct Order)

**IMPORTANT:** Apply resources in the following order due to dependencies.

1. **Apply MongoDB PVC first:**
   ```bash
   kubectl apply -f mongodb-pvc.yaml
   ```
   Output: `persistentvolumeclaim/mongodb-pvc created`

2. **Apply MongoDB Deployment:**
   ```bash
   kubectl apply -f mongodb-deployment.yaml
   ```
   Output: `deployment.apps/mongodb-deployment created`

3. **Apply MongoDB Service:**
   ```bash
   kubectl apply -f mongodb-service.yaml
   ```
   Output: `service/mongodb-service created`

4. **Wait for MongoDB to be ready (CRITICAL):**
   ```bash
   kubectl wait --for=condition=ready pod -l app=mongodb --timeout=180s
   ```
   Wait until you see: `pod/mongodb-deployment-xxx condition met`

   **Alternative - Watch pod status:**
   ```bash
   kubectl get pods -w
   ```
   Press `Ctrl+C` when MongoDB pod shows `Running` status.

5. **Apply Web Application Deployment:**
   ```bash
   kubectl apply -f webapp-deployment.yaml
   ```
   Output: `deployment.apps/webapp-deployment created`

6. **Apply Web Application Service:**
   ```bash
   kubectl apply -f webapp-service.yaml
   ```
   Output: `service/webapp-service created`

7. **Apply HorizontalPodAutoscaler:**
   ```bash
   kubectl apply -f webapp-hpa.yaml
   ```
   Output: `horizontalpodautoscaler.autoscaling/webapp-hpa created`

### Step 4: Alternative - Apply All Resources at Once

If you prefer (after verifying individual files work):
```bash
kubectl apply -f .
```

This applies all YAML files in the current directory.

### Step 5: Verify All Resources are Created

1. **Check PVC:**
   ```bash
   kubectl get pvc
   ```
   Expected output:
   ```
   NAME          STATUS   VOLUME                                     CAPACITY   ACCESS MODES   AGE
   mongodb-pvc   Bound    pvc-xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx    1Gi        RWO            1m
   ```

2. **Check Deployments:**
   ```bash
   kubectl get deployments
   ```
   Expected output:
   ```
   NAME                  READY   UP-TO-DATE   AVAILABLE   AGE
   mongodb-deployment    1/1     1            1           2m
   webapp-deployment     2/2     2            2           1m
   ```
   (Numbers will match your replica count)

3. **Check Pods:**
   ```bash
   kubectl get pods
   ```
   Expected output (example with 2 replicas):
   ```
   NAME                                  READY   STATUS    RESTARTS   AGE
   mongodb-deployment-xxxxxxxxxx-xxxxx   1/1     Running   0          2m
   webapp-deployment-xxxxxxxxxx-xxxxx    1/1     Running   0          1m
   webapp-deployment-xxxxxxxxxx-xxxxx    1/1     Running   0          1m
   ```

4. **Check Services:**
   ```bash
   kubectl get services
   ```
   Expected output:
   ```
   NAME              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)           AGE
   kubernetes        ClusterIP   10.96.0.1        <none>        443/TCP           10m
   mongodb-service   NodePort    10.x.x.x         <none>        27017:30017/TCP   2m
   webapp-service    NodePort    10.x.x.x         <none>        3000:30000/TCP    1m
   ```
   **Note:** Both services are NodePort as required.

5. **Check HPA:**
   ```bash
   kubectl get hpa
   ```
   Expected output:
   ```
   NAME         REFERENCE                      TARGETS         MINPODS   MAXPODS   REPLICAS   AGE
   webapp-hpa   Deployment/webapp-deployment   <unknown>/50%   2         10        2          30s
   ```
   **Note:** Metrics may show `<unknown>` initially. Wait 2-3 minutes for metrics-server to collect data.

### Step 6: Wait for All Pods to be Ready

1. **Watch pods until all are running:**
   ```bash
   kubectl get pods -w
   ```
   Press `Ctrl+C` to stop watching once all pods show `Running` status.

2. **If a pod is not starting, troubleshoot:**
   ```bash
   # Describe the problematic pod
   kubectl describe pod <pod-name>
   
   # Check pod logs
   kubectl logs <pod-name>
   
   # If container crashed, check previous logs
   kubectl logs <pod-name> --previous
   ```

### Step 7: Get NodePort Service URLs

1. **Get Minikube IP:**
   ```bash
   minikube ip
   ```
   Output example: `192.168.49.2`

2. **Access web application:**
   ```bash
   # Get the NodePort
   kubectl get service webapp-service
   ```
   Note the PORT(S) column: `3000:30000/TCP`
   
   Web app URL: `http://<minikube-ip>:30000`
   Example: `http://192.168.49.2:30000`

3. **Test locally on EC2:**
   ```bash
   curl http://$(minikube ip):30000
   ```

---

## Part VII: Setting Up HorizontalPodAutoscaler

### Step 1: Verify Metrics Server is Running

1. **Check metrics-server pods:**
   ```bash
   kubectl get pods -n kube-system | grep metrics
   ```
   Should show a running metrics-server pod.

2. **If not enabled, enable it:**
   ```bash
   minikube addons enable metrics-server
   ```

3. **Wait for metrics to be available (2-3 minutes):**
   ```bash
   kubectl top nodes
   ```
   If you see node metrics (CPU/Memory), the server is working.

4. **Check pod metrics:**
   ```bash
   kubectl top pods
   ```

### Step 2: Verify HPA is Working

1. **Check HPA status:**
   ```bash
   kubectl get hpa
   ```

2. **Describe HPA for detailed information:**
   ```bash
   kubectl describe hpa webapp-hpa
   ```

   Look for:
   - Current metrics (CPU/Memory %)
   - Target metrics
   - Current replicas
   - Desired replicas
   - Recent events

3. **Watch HPA in real-time:**
   ```bash
   kubectl get hpa -w
   ```
   Press `Ctrl+C` to stop watching.

### Step 3: Test Auto-Scaling (Optional but Recommended)

**Generate load to verify auto-scaling works:**

1. **Open a new SSH session to EC2** (keep current terminal for monitoring)

2. **Install stress tool for load generation:**
   ```bash
   sudo apt install -y stress
   ```

3. **Generate load on webapp pods:**
   ```bash
   # Get webapp pod names
   kubectl get pods -l app=webapp
   
   # Generate CPU load on one pod
   kubectl exec -it <webapp-pod-name> -- sh -c "while true; do :; done"
   ```

4. **In the original terminal, watch HPA:**
   ```bash
   kubectl get hpa webapp-hpa -w
   ```
   You should see CPU% increase and replicas scale up.

5. **Stop load (Ctrl+C in the second terminal)** and watch replicas scale down after 5 minutes.

---

## Part VIII: Setting Up Ngrok Tunnels

**CRITICAL:** Both tunnels must remain active during evaluation.

### Step 1: Set Up Tunnel for Web Application

1. **Get the Minikube IP and webapp NodePort:**
   ```bash
   MINIKUBE_IP=$(minikube ip)
   echo "Minikube IP: $MINIKUBE_IP"
   kubectl get service webapp-service
   ```
   Note the NodePort (should be 30000).

2. **Open a new terminal/SSH session for the first tunnel:**
   ```bash
   # Test local access first
   curl http://$(minikube ip):30000
   
   # Start ngrok tunnel for webapp
   ngrok http $(minikube ip):30000
   ```

3. **Copy the ngrok URL:**
   You'll see output like:
   ```
   Forwarding    https://xxxx-xx-xx-xxx-xxx.ngrok-free.app -> http://192.168.49.2:30000
   ```
   **SAVE THIS URL** - This is your **Web Application Tunnel URL**.

4. **Keep this terminal running!** Do not close it.

### Step 2: Set Up Tunnel for Kubernetes Dashboard

1. **Open another new terminal/SSH session for the dashboard:**
   ```bash
   # Connect to EC2 in new terminal
   ssh -i minikube-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
   ```

2. **Start Kubernetes dashboard (if not already running):**
   ```bash
   minikube dashboard --url
   ```
   This will output a URL like: `http://127.0.0.1:xxxxx/api/v1/namespaces/kubernetes-dashboard/services/http:kubernetes-dashboard:/proxy/`
   
   Note the port number (e.g., 45691).

3. **Open another terminal for the second ngrok tunnel:**
   ```bash
   # Connect to EC2 in another new terminal
   ssh -i minikube-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
   
   # Start ngrok tunnel for dashboard
   ngrok http 127.0.0.1:PORT_FROM_DASHBOARD_URL
   ```
   Replace `PORT_FROM_DASHBOARD_URL` with the actual port.

4. **Copy the ngrok URL:**
   ```
   Forwarding    https://yyyy-yy-yy-yyy-yyy.ngrok-free.app -> http://127.0.0.1:45691
   ```
   **SAVE THIS URL** - This is your **Kubernetes Dashboard Tunnel URL**.

5. **Keep this terminal running!** Do not close it.

### Step 3: Verify Both Tunnels

1. **Test Web Application Tunnel:**
   - Open the webapp ngrok URL in your browser
   - You should see the Todo Application login page
   - Try signing up and logging in

2. **Test Kubernetes Dashboard Tunnel:**
   - Open the dashboard ngrok URL in your browser
   - You should see the Kubernetes Dashboard
   - Navigate to:
     - Workloads → Deployments
     - Workloads → Pods
     - Services → Services
     - Config → Persistent Volume Claims

3. **Document both URLs:**
   Create a file with both URLs:
   ```bash
   cat > ~/ngrok-urls.txt << EOF
   ========================================
   NGROK TUNNEL URLs FOR EVALUATION
   ========================================
   
   Web Application URL:
   https://xxxx-xx-xx-xxx-xxx.ngrok-free.app
   
   Kubernetes Dashboard URL:
   https://yyyy-yy-yy-yyy-yyy.ngrok-free.app
   
   These tunnels are active and accessible.
   Date: $(date)
   ========================================
   EOF
   
   cat ~/ngrok-urls.txt
   ```

### Step 4: Keep Tunnels Running

**IMPORTANT:** For evaluation, you need to:

1. **Keep EC2 instance running**
2. **Keep both ngrok tunnels active** (don't close those terminal sessions)
3. **Ensure Minikube cluster is running**
4. **Include both URLs in your submission**

**To keep tunnels running even after SSH disconnect, use `screen` or `tmux`:**

```bash
# Install screen
sudo apt install -y screen

# Start first tunnel in screen
screen -S webapp-tunnel
ngrok http $(minikube ip):30000
# Press Ctrl+A then D to detach

# Start second tunnel in screen
screen -S dashboard-tunnel
minikube dashboard --url  # Note the port
# Open another screen
screen -S dashboard-ngrok
ngrok http 127.0.0.1:PORT_HERE
# Press Ctrl+A then D to detach

# List running screens
screen -ls

# Reattach to a screen if needed
screen -r webapp-tunnel
```

---

## Part IX: Verification & Testing

### Step 1: Access the Application via Ngrok

1. **Open your Web Application ngrok URL in a browser:**
   ```
   https://xxxx-xx-xx-xxx-xxx.ngrok-free.app
   ```
   (Use the URL from Part VIII, Step 1)

2. **You should see the Todo Application login page**

3. **Alternative - Test from command line:**
   ```bash
   curl -I https://your-webapp-ngrok-url.ngrok-free.app
   ```

### Step 2: Test Application Functionality

1. Open the URL in your browser
2. You should see the Todo App login page
3. Try to:
   - Sign up with a new account
   - Log in with the account
   - Create a new todo item
   - Mark todo as complete
   - Delete a todo item

### Step 3: Verify Database Persistence (Critical Test)

**This test proves the Persistent Volume Claim is working:**

1. **Create some todo items in the app** via the ngrok webapp URL

2. **Delete the MongoDB pod** (Kubernetes will recreate it automatically):
   ```bash
   kubectl delete pod -l app=mongodb
   ```

3. **Wait for the new pod to be ready:**
   ```bash
   kubectl wait --for=condition=ready pod -l app=mongodb --timeout=180s
   ```

4. **Refresh the application in your browser** - your data should still be there!

5. **If data persists,** the PVC is working correctly ✅

### Step 4: Verify Load Balancing Across Replicas

1. **Check which pods are handling requests:**
   ```bash
   kubectl logs -l app=webapp --tail=20
   ```

2. **Make multiple requests and verify different pods respond:**
   ```bash
   # Get webapp pod names
   kubectl get pods -l app=webapp
   
   # Check logs from specific pods
   kubectl logs <pod-name-1> --tail=10
   kubectl logs <pod-name-2> --tail=10
   ```

3. **Generate traffic and watch load distribution:**
   ```bash
   # Make multiple requests
   for i in {1..10}; do
     curl -s https://your-webapp-ngrok-url.ngrok-free.app > /dev/null
     echo "Request $i sent"
   done
   ```

### Step 5: Verify Kubernetes Dashboard Access

1. **Open your Kubernetes Dashboard ngrok URL in browser:**
   ```
   https://yyyy-yy-yy-yyy-yyy.ngrok-free.app
   ```

2. **Navigate through the dashboard to verify:**
   - **Workloads → Deployments:**
     - ✅ mongodb-deployment (1/1 ready)
     - ✅ webapp-deployment (X/X ready, where X = your replicas)
   
   - **Workloads → Pods:**
     - ✅ All pods showing "Running" status
   
   - **Service → Services:**
     - ✅ mongodb-service (NodePort 30017)
     - ✅ webapp-service (NodePort 30000)
   
   - **Config and Storage → Persistent Volume Claims:**
     - ✅ mongodb-pvc (Bound, 1Gi)
   
   - **Workloads → Horizontal Pod Autoscalers:**
     - ✅ webapp-hpa (showing metrics)

### Step 6: Generate Deployment Summary for Submission

1. **Get all resources summary:**
   ```bash
   kubectl get all -o wide
   ```

2. **Create a comprehensive deployment report:**
   ```bash
   cat > ~/deployment-summary.txt << 'EOF'
   ========================================
   KUBERNETES DEPLOYMENT SUMMARY
   ========================================
   
   EOF
   
   echo "=== DEPLOYMENTS ===" >> ~/deployment-summary.txt
   kubectl get deployments >> ~/deployment-summary.txt
   
   echo -e "\n=== PODS ===" >> ~/deployment-summary.txt
   kubectl get pods -o wide >> ~/deployment-summary.txt
   
   echo -e "\n=== SERVICES ===" >> ~/deployment-summary.txt
   kubectl get services >> ~/deployment-summary.txt
   
   echo -e "\n=== PERSISTENT VOLUME CLAIMS ===" >> ~/deployment-summary.txt
   kubectl get pvc >> ~/deployment-summary.txt
   
   echo -e "\n=== HORIZONTAL POD AUTOSCALER ===" >> ~/deployment-summary.txt
   kubectl get hpa >> ~/deployment-summary.txt
   kubectl describe hpa webapp-hpa >> ~/deployment-summary.txt
   
   echo -e "\n=== NODES ===" >> ~/deployment-summary.txt
   kubectl get nodes -o wide >> ~/deployment-summary.txt
   
   cat ~/deployment-summary.txt
   ```

3. **Capture YAML configurations:**
   ```bash
   mkdir -p ~/deployment-backup
   kubectl get deployment webapp-deployment -o yaml > ~/deployment-backup/webapp-deployment.yaml
   kubectl get service webapp-service -o yaml > ~/deployment-backup/webapp-service.yaml
   kubectl get hpa webapp-hpa -o yaml > ~/deployment-backup/webapp-hpa.yaml
   ```

---

## Complete Command Reference

### Minikube Commands
```bash
# Start cluster
minikube start --driver=docker --memory=3500 --cpus=2

# Stop cluster
minikube stop

# Delete cluster
minikube delete

# Check status
minikube status

# Get IP address
minikube ip

# Access service
minikube service <service-name> --url

# Open dashboard
minikube dashboard --url

# Use Minikube's Docker
eval $(minikube docker-env)

# Enable addon
minikube addons enable <addon-name>

# List addons
minikube addons list

# SSH into minikube node
minikube ssh
```

### kubectl Commands
```bash
# Apply configuration
kubectl apply -f <file.yaml>
kubectl apply -f .  # Apply all files in directory

# Delete resources
kubectl delete -f <file.yaml>
kubectl delete pod <pod-name>

# Get resources
kubectl get pods
kubectl get pods -o wide
kubectl get deployments
kubectl get services
kubectl get pvc
kubectl get hpa
kubectl get all

# Describe resource (detailed info)
kubectl describe pod <pod-name>
kubectl describe deployment <deployment-name>
kubectl describe service <service-name>
kubectl describe hpa <hpa-name>

# View logs
kubectl logs <pod-name>
kubectl logs <pod-name> -f  # Follow logs
kubectl logs -l app=<label> --tail=50

# Execute command in pod
kubectl exec -it <pod-name> -- /bin/sh
kubectl exec -it <pod-name> -- bash

# Scale deployment manually
kubectl scale deployment <deployment-name> --replicas=<number>

# Watch resources (real-time updates)
kubectl get pods -w
kubectl get hpa -w

# Port forward
kubectl port-forward <pod-name> <local-port>:<pod-port>

# Get metrics
kubectl top nodes
kubectl top pods

# Get YAML output
kubectl get deployment <name> -o yaml
```

### Ngrok Commands
```bash
# Start tunnel to a local port
ngrok http <port>
ngrok http 127.0.0.1:<port>

# Start tunnel to Minikube service
ngrok http $(minikube ip):<nodeport>

# Check ngrok status
ngrok version

# View active tunnels (in ngrok web UI)
# Open http://127.0.0.1:4040 in browser
```

### Screen Commands (Keep processes running)
```bash
# Create new screen session
screen -S <session-name>

# Detach from screen (Ctrl+A, then D)
# Or type: Ctrl+A then D

# List screen sessions
screen -ls

# Reattach to screen
screen -r <session-name>

# Kill a screen session
screen -X -S <session-name> quit
```

---

## Troubleshooting Guide

### Problem 1: Cannot Connect to EC2 Instance

**Symptoms:**
- SSH connection timeout
- Connection refused

**Solution:**
1. **Check EC2 instance is running:**
   - Go to AWS Console → EC2 → Instances
   - Verify instance state is "Running"

2. **Check Security Group:**
   - Ensure port 22 is open from your IP
   - Edit inbound rules if needed

3. **Verify key permissions:**
   ```bash
   chmod 400 minikube-key.pem
   ```

4. **Use correct username:**
   ```bash
   ssh -i minikube-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
   ```

### Problem 2: Minikube Won't Start on EC2

**Symptoms:**
- Error about Docker
- Error about resources

**Solution:**
1. **Ensure Docker is running:**
   ```bash
   sudo systemctl status docker
   sudo systemctl start docker
   ```

2. **Add user to docker group:**
   ```bash
   sudo usermod -aG docker $USER
   newgrp docker
   ```

3. **Delete and recreate cluster:**
   ```bash
   minikube delete
   minikube start --driver=docker --memory=3500 --cpus=2
   ```

4. **Check system resources:**
   ```bash
   free -h  # Check available memory
   df -h    # Check disk space
   ```

### Problem 3: Image Pull Error - ErrImageNeverPull

**Symptoms:**
- Pod status shows `ErrImageNeverPull` or `ImagePullBackOff`
- Pod fails to start

**Solution:**
1. **Set Minikube Docker environment:**
   ```bash
   eval $(minikube docker-env)
   ```

2. **Rebuild image in Minikube's Docker:**
   ```bash
   cd ~/todo-app-a4
   docker build -t todo-app-web:v1 -f Dockerfile.k8s .
   ```

3. **Verify image exists in Minikube:**
   ```bash
   docker images | grep todo-app-web
   ```

4. **Ensure `imagePullPolicy: Never` in deployment:**
   ```bash
   grep imagePullPolicy k8s/webapp-deployment.yaml
   ```
   Should show: `imagePullPolicy: Never`

5. **Restart deployment:**
   ```bash
   kubectl rollout restart deployment webapp-deployment
   ```

### Problem 4: Pods CrashLoopBackOff

**Symptoms:**
- Pod restarts repeatedly
- Status shows `CrashLoopBackOff`

**Solution:**
1. **Check pod logs:**
   ```bash
   kubectl logs <pod-name>
   kubectl logs <pod-name> --previous  # Previous crashed container
   ```

2. **Describe pod for events:**
   ```bash
   kubectl describe pod <pod-name>
   ```

3. **Common causes:**
   - **Database connection failing:** Ensure MongoDB is running
     ```bash
     kubectl get pods -l app=mongodb
     ```
   - **Missing environment variables:** Check deployment YAML
   - **Application error:** Review logs for stack traces
   - **Resource limits:** Pod may be OOMKilled

4. **Fix and restart:**
   ```bash
   kubectl delete pod <pod-name>  # Will be recreated automatically
   ```

### Problem 5: PVC Not Binding

**Symptoms:**
- PVC status shows `Pending`

**Solution:**
1. **Check storage class exists:**
   ```bash
   kubectl get storageclass
   ```

2. **Describe PVC for events:**
   ```bash
   kubectl describe pvc mongodb-pvc
   ```

3. **Ensure storage-provisioner addon is enabled:**
   ```bash
   minikube addons list | grep storage
   minikube addons enable storage-provisioner
   ```

4. **Check available storage:**
   ```bash
   df -h
   minikube ssh "df -h"
   ```

### Problem 6: HPA Shows Unknown Metrics

**Symptoms:**
- HPA TARGETS column shows `<unknown>/50%`

**Solution:**
1. **Ensure metrics-server is running:**
   ```bash
   kubectl get pods -n kube-system | grep metrics
   minikube addons enable metrics-server
   ```

2. **Wait 2-3 minutes for metrics to populate**

3. **Check metrics are available:**
   ```bash
   kubectl top nodes
   kubectl top pods
   ```

4. **Ensure pods have resource requests:**
   ```bash
   kubectl get deployment webapp-deployment -o yaml | grep -A 5 resources
   ```

5. **Restart metrics-server if needed:**
   ```bash
   kubectl delete pod -n kube-system -l k8s-app=metrics-server
   ```

### Problem 7: Cannot Connect to MongoDB from Webapp

**Symptoms:**
- App shows database connection error
- Logs show "MongoDB connection refused"

**Solution:**
1. **Check MongoDB pod is running:**
   ```bash
   kubectl get pods -l app=mongodb
   kubectl logs -l app=mongodb
   ```

2. **Check MongoDB service exists:**
   ```bash
   kubectl get service mongodb-service
   kubectl describe service mongodb-service
   ```

3. **Test connection from webapp pod:**
   ```bash
   kubectl exec -it <webapp-pod-name> -- sh
   # Inside pod:
   nc -zv mongodb-service 27017
   # or
   telnet mongodb-service 27017
   ```

4. **Verify MONGODB_URI environment variable:**
   ```bash
   kubectl exec <webapp-pod-name> -- printenv | grep MONGODB
   ```

5. **Check MongoDB is listening:**
   ```bash
   kubectl exec -it <mongodb-pod-name> -- mongosh --eval "db.adminCommand('ping')"
   ```

### Problem 8: Ngrok Tunnel Not Working

**Symptoms:**
- Ngrok URL not accessible
- 502 Bad Gateway error

**Solution:**
1. **Verify ngrok is authenticated:**
   ```bash
   ngrok config check
   ```

2. **Check local service is accessible:**
   ```bash
   curl http://$(minikube ip):30000
   ```

3. **Restart ngrok tunnel:**
   ```bash
   # Kill existing ngrok
   pkill ngrok
   
   # Start fresh tunnel
   ngrok http $(minikube ip):30000
   ```

4. **Check ngrok web interface:**
   - Open http://127.0.0.1:4040 in browser (on EC2, use SSH tunnel)
   - View request/response logs

5. **Use SSH tunnel to access ngrok locally:**
   ```bash
   # From your local machine
   ssh -L 4040:localhost:4040 -i minikube-key.pem ubuntu@YOUR_EC2_IP
   # Then open http://localhost:4040
   ```

### Problem 9: EC2 Instance Out of Resources

**Symptoms:**
- Pods in Pending state
- Minikube fails to start
- Docker commands slow

**Solution:**
1. **Check system resources:**
   ```bash
   free -m  # Check memory
   df -h    # Check disk
   top      # Check CPU
   ```

2. **Clean up Docker:**
   ```bash
   docker system prune -a
   docker volume prune
   ```

3. **Restart Minikube with lower resources:**
   ```bash
   minikube stop
   minikube start --driver=docker --memory=2048 --cpus=2
   ```

4. **Consider upgrading EC2 instance type** to t2.large if needed

### Problem 10: NodePort Not Accessible

**Symptoms:**
- Cannot curl NodePort service
- Connection timeout

**Solution:**
1. **Check service is NodePort type:**
   ```bash
   kubectl get service webapp-service -o yaml | grep type
   ```

2. **Get Minikube IP:**
   ```bash
   minikube ip
   ```

3. **Test from within EC2:**
   ```bash
   curl -v http://$(minikube ip):30000
   ```

4. **Check if pods are ready:**
   ```bash
   kubectl get pods
   kubectl describe pod <pod-name>
   ```

5. **Check service endpoints:**
   ```bash
   kubectl get endpoints webapp-service
   ```

---

## File Structure Summary

After completing all steps, your project should have:

```
todo-app-a4/
├── components/              # React components (Layout, Todo items, etc.)
├── lib/                     # Database connection utilities
├── models/                  # Mongoose models (User, Todo)
├── pages/                   # Next.js pages and API routes
├── public/                  # Static assets
├── styles/                  # CSS modules and global styles
├── k8s/                     # Kubernetes YAML files
│   ├── mongodb-pvc.yaml          # Persistent Volume Claim for MongoDB
│   ├── mongodb-deployment.yaml   # MongoDB Deployment (1 replica)
│   ├── mongodb-service.yaml      # MongoDB NodePort Service (Port 30017)
│   ├── webapp-deployment.yaml    # Web App Deployment (N replicas)
│   ├── webapp-service.yaml       # Web App NodePort Service (Port 30000)
│   └── webapp-hpa.yaml           # HorizontalPodAutoscaler
├── docker-compose.yml       # Docker Compose configuration
├── Dockerfile               # Standard Docker build file
├── Dockerfile.k8s           # Kubernetes-specific Dockerfile
├── next.config.js           # Next.js configuration
├── package.json             # Node.js dependencies
├── README.md                # Project overview
└── KUBERNETES_IMPLEMENTATION_MANUAL.md   # THIS FILE
```

---

## Quick Deployment Commands (Complete Workflow)

### Complete Deployment from Scratch
```bash
# === ON LOCAL MACHINE ===
# 1. Launch EC2 instance (t2.medium, Ubuntu 22.04)
# 2. Configure security group (SSH, HTTP, HTTPS, 30000-32767)
# 3. Connect to EC2
ssh -i minikube-key.pem ubuntu@YOUR_EC2_PUBLIC_IP

# === ON EC2 INSTANCE ===
# 4. Update system
sudo apt update && sudo apt upgrade -y

# 5. Install Docker
sudo apt install -y ca-certificates curl gnupg lsb-release
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io
sudo usermod -aG docker $USER
newgrp docker

# 6. Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# 7. Install Minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# 8. Start Minikube
minikube start --driver=docker --memory=3500 --cpus=2

# 9. Enable required addons
minikube addons enable metrics-server
minikube addons enable dashboard
minikube addons enable storage-provisioner

# 10. Clone/Upload project files
git clone https://github.com/your-username/todo-app-a4.git
cd todo-app-a4

# 11. Build Docker image in Minikube
eval $(minikube docker-env)
docker build -t todo-app-web:v1 -f Dockerfile.k8s .

# 12. Deploy to Kubernetes
cd k8s
kubectl apply -f mongodb-pvc.yaml
kubectl apply -f mongodb-deployment.yaml
kubectl apply -f mongodb-service.yaml
kubectl wait --for=condition=ready pod -l app=mongodb --timeout=180s
kubectl apply -f webapp-deployment.yaml
kubectl apply -f webapp-service.yaml
kubectl apply -f webapp-hpa.yaml

# 13. Verify deployment
kubectl get all
kubectl get pvc
kubectl get hpa

# 14. Install and configure ngrok
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update
sudo apt install ngrok
ngrok config add-authtoken YOUR_NGROK_TOKEN

# 15. Start ngrok tunnel for webapp (in screen session)
screen -S webapp-tunnel
ngrok http $(minikube ip):30000
# Press Ctrl+A then D to detach

# 16. Start dashboard and tunnel (in another screen)
screen -S dashboard
minikube dashboard --url
# Note the port, then Ctrl+A then D

screen -S dashboard-tunnel
ngrok http 127.0.0.1:DASHBOARD_PORT
# Press Ctrl+A then D to detach

# 17. Save tunnel URLs
screen -r webapp-tunnel  # Copy URL
screen -r dashboard-tunnel  # Copy URL
```

### Cleanup Everything
```bash
# Delete all Kubernetes resources
cd ~/todo-app-a4/k8s
kubectl delete -f .

# Stop Minikube
minikube stop

# Delete Minikube cluster (if needed)
minikube delete

# Kill ngrok tunnels
pkill ngrok

# On AWS Console: Stop or terminate EC2 instance
```

---

## Success Checklist

### AWS Setup ✅
- [ ] EC2 instance launched (t2.medium, Ubuntu 22.04)
- [ ] Security group configured (SSH, HTTP, HTTPS, NodePort range)
- [ ] SSH access working
- [ ] Instance has sufficient resources (4GB RAM, 20GB disk)

### Software Installation ✅
- [ ] Docker installed and running
- [ ] kubectl installed and working
- [ ] Minikube installed and accessible
- [ ] Ngrok installed and authenticated

### Minikube Setup ✅
- [ ] Cluster started successfully
- [ ] Metrics-server addon enabled
- [ ] Dashboard addon enabled
- [ ] Storage-provisioner addon enabled
- [ ] Using Minikube's Docker daemon

### Docker Image ✅
- [ ] Project files transferred to EC2
- [ ] Dockerfile.k8s exists
- [ ] Image built in Minikube's Docker
- [ ] Image named `todo-app-web:v1`
- [ ] Image visible in `docker images`

### Kubernetes YAML Files ✅
- [ ] mongodb-pvc.yaml created and valid
- [ ] mongodb-deployment.yaml created (1 replica)
- [ ] mongodb-service.yaml created (NodePort 30017)
- [ ] webapp-deployment.yaml created with YOUR calculated replicas
- [ ] webapp-service.yaml created (NodePort 30000)
- [ ] webapp-hpa.yaml created

### Deployment Verification ✅
- [ ] All pods showing "Running" status
- [ ] PVC bound successfully (1Gi storage)
- [ ] Both services created (NodePort type)
- [ ] HPA configured and showing metrics
- [ ] Web app accessible via Minikube IP:30000
- [ ] Database persistence tested and working

### Ngrok Tunnels ✅
- [ ] Webapp tunnel created and accessible
- [ ] Dashboard tunnel created and accessible
- [ ] Both tunnel URLs saved and documented
- [ ] Tunnels running in screen sessions
- [ ] Tunnels remain active (not closed)

### Final Verification ✅
- [ ] Web application accessible via ngrok URL
- [ ] Can signup/login/create todos
- [ ] Database persistence verified (pod deletion test)
- [ ] Kubernetes Dashboard accessible via ngrok URL
- [ ] Dashboard shows all resources correctly
- [ ] HPA showing metrics and ready to scale
- [ ] Load balancing across replicas verified
- [ ] Both tunnel URLs included in submission

---

## Final Notes

**Congratulations!** If you've completed all steps, you now have:

1. ✅ **AWS EC2 instance** with Minikube cluster
2. ✅ **MongoDB deployment** with persistent storage (1 replica)
3. ✅ **Web application deployment** with multiple replicas (calculated from roll number)
4. ✅ **NodePort services** for both web and database
5. ✅ **HorizontalPodAutoscaler** for automatic pod scaling
6. ✅ **Ngrok tunnels** exposing webapp and dashboard externally
7. ✅ **Complete Kubernetes deployment** ready for evaluation

**Key Learning Outcomes:**
- Deploying Kubernetes on AWS EC2 using Minikube
- Understanding Kubernetes core concepts (Pods, Deployments, Services, PVC)
- Creating and managing Persistent Volume Claims for data persistence
- Configuring NodePort services for external access
- Setting up auto-scaling with HorizontalPodAutoscaler
- Using ngrok for secure external tunneling
- Managing long-running processes with screen sessions

**Critical Reminders for Submission:**
1. **Keep EC2 instance running** during evaluation
2. **Keep both ngrok tunnels active** (don't close screen sessions)
3. **Include both tunnel URLs** in your submission:
   - Web Application: `https://xxxx.ngrok-free.app`
   - Kubernetes Dashboard: `https://yyyy.ngrok-free.app`
4. **Verify your replica count** matches formula: `(roll_no mod 10) + 2`
5. **Test both URLs** before submission to ensure they work

**Submission Checklist:**
- [ ] Both ngrok tunnel URLs documented
- [ ] Screenshots of Kubernetes Dashboard
- [ ] Screenshots of running application
- [ ] YAML files included
- [ ] Replica count matches your roll number
- [ ] EC2 instance and tunnels will remain active during evaluation

---

**Document Version:** 2.0 (AWS EC2 Edition)  
**Last Updated:** December 16, 2025  
**Author:** Kubernetes Assignment Guide  
**Course:** Cloud Computing - Kubernetes Deployment  
**Platform:** AWS EC2 (Ubuntu) with Minikube and Ngrok  
**Assignment:** Deploy Todo App on Minikube with Persistent Storage and Auto-scaling  
