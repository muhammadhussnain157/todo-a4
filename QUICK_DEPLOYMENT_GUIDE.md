# Quick Deployment Guide - Kubernetes on AWS EC2

## Prerequisites
- AWS account with EC2 access

---

## Part 1: AWS EC2 Setup (10 minutes)

```bash
# 1. Launch EC2 Instance in AWS Console
- Instance Type: t2.medium
- OS: Ubuntu 22.04 LTS
- Storage: 20 GB
- Security Group: Allow SSH(22), HTTP(80), HTTPS(443), Custom TCP(30000-32767)

# 2. Connect to EC2
ssh -i minikube-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

---

## Part 2: Install Software (20 minutes)

```bash
# Purpose: Update package list and upgrade installed packages
sudo apt update && sudo apt upgrade -y

# Purpose: Install basic utilities needed for subsequent installations
sudo apt install -y curl wget apt-transport-https ca-certificates software-properties-common

# ============================================
# Install Docker (Container Runtime)
# ============================================

# Purpose: Install prerequisites for Docker installation
sudo apt install -y ca-certificates curl gnupg lsb-release

# Purpose: Add Docker's official GPG key for package verification
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Purpose: Set up Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Purpose: Update package list with Docker repository
sudo apt update

# Purpose: Install Docker Engine and CLI tools
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Purpose: Add current user to docker group (avoid using sudo for docker commands)
sudo usermod -aG docker $USER

# Purpose: Apply group changes without logout
newgrp docker

# Purpose: Verify Docker installation
docker --version
docker run hello-world

# ============================================
# Install Node.js using NVM (Version 22)
# ============================================

# Purpose: Download and install NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Purpose: Load NVM into current session
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Purpose: Install Node.js version 22
nvm install 22

# Purpose: Set Node.js version 22 as default
nvm use 22
nvm alias default 22

# Purpose: Verify Node.js and npm installation
node --version
npm --version

# ============================================
# Install kubectl (Kubernetes CLI)
# ============================================

# Purpose: Download latest stable kubectl binary
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

# Purpose: Make kubectl executable
chmod +x kubectl

# Purpose: Move kubectl to system PATH
sudo mv kubectl /usr/local/bin/

# Purpose: Verify kubectl installation
kubectl version --client

# ============================================
# Install Minikube (Local Kubernetes Cluster)
# ============================================

# Purpose: Download latest Minikube binary
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64

# Purpose: Install Minikube to system PATH
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Purpose: Verify Minikube installation
minikube version

# Purpose: Start Minikube cluster with Docker driver (3.5GB memory, 2 CPUs)
minikube start --driver=docker --memory=3500 --cpus=2

# Purpose: Verify Minikube cluster is running
minikube status

# Purpose: Verify kubectl can connect to Minikube cluster
kubectl cluster-info
kubectl get nodes

# ============================================
# Enable Minikube Addons
# ============================================

# Purpose: Enable metrics-server (required for HorizontalPodAutoscaler)
minikube addons enable metrics-server

# Purpose: Enable Kubernetes dashboard (for web UI)
minikube addons enable dashboard

# Purpose: Enable storage provisioner (for PersistentVolumeClaims)
minikube addons enable storage-provisioner

# Purpose: Verify enabled addons
minikube addons list

# ============================================
# Install Screen (Keep processes running)
# ============================================

# Purpose: Install screen for persistent terminal sessions
sudo apt install -y screen

# Purpose: Verify screen installation
screen --version

# ============================================
# Install Ngrok (External Tunnel Service)
# ============================================

# Purpose: Add ngrok GPG key for package verification
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null

# Purpose: Add ngrok repository
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list

# Purpose: Update package list with ngrok repository
sudo apt update

# Purpose: Install ngrok
sudo apt install ngrok

# Purpose: Add your ngrok authtoken (get from https://dashboard.ngrok.com/get-started/your-authtoken)
ngrok config add-authtoken YOUR_NGROK_TOKEN

# Purpose: Verify ngrok installation
ngrok version
```

---

## Part 3: Deploy Application (15 minutes)

```bash
# ============================================
# Get Project Files
# ============================================

# Purpose: Clone your project repository (or upload via SCP/FileZilla)
git clone https://github.com/your-username/todo-app-a4.git

# Purpose: Navigate to project directory
cd todo-app-a4

# Purpose: Verify project structure
ls -la

# ============================================
# Verify Replica Count
# ============================================

# Purpose: Verify webapp deployment is set to 3 replicas (already configured)
grep -A2 "replicas:" k8s/webapp-deployment.yaml

# ============================================
# Build Docker Image
# ============================================

# Purpose: Configure shell to use Minikube's Docker daemon (images built directly into Minikube)
eval $(minikube docker-env)

# Purpose: Verify you're using Minikube's Docker
docker images | grep k8s

# Purpose: Build Docker image for web application
docker build -t todo-app-web:v1 -f Dockerfile.k8s .

# Purpose: Verify image was created
docker images | grep todo-app-web

# ============================================
# Deploy to Kubernetes (In Correct Order)
# ============================================

# Purpose: Navigate to Kubernetes manifests directory
cd k8s

# Purpose: Create PersistentVolumeClaim for MongoDB data storage
kubectl apply -f mongodb-pvc.yaml

# Purpose: Deploy MongoDB database (1 replica with persistent storage)
kubectl apply -f mongodb-deployment.yaml

# Purpose: Create NodePort service for MongoDB (exposes on port 30017)
kubectl apply -f mongodb-service.yaml

# Purpose: Wait for MongoDB pod to be ready before proceeding (critical)
kubectl wait --for=condition=ready pod -l app=mongodb --timeout=180s

# Purpose: Deploy web application (multiple replicas based on your roll number)
kubectl apply -f webapp-deployment.yaml

# Purpose: Create NodePort service for web app (exposes on port 30000)
kubectl apply -f webapp-service.yaml

# Purpose: Create HorizontalPodAutoscaler for auto-scaling web pods
kubectl apply -f webapp-hpa.yaml

# ============================================
# Verify Deployment
# ============================================

# Purpose: Check all resources (pods, services, deployments)
kubectl get all

# Purpose: Verify PersistentVolumeClaim is bound
kubectl get pvc

# Purpose: Check HorizontalPodAutoscaler status
kubectl get hpa

# Purpose: Watch pods until all are running (press Ctrl+C to stop)
kubectl get pods -w

# Purpose: Get Minikube IP address
minikube ip

# Purpose: Test web application locally (replace with your Minikube IP)
curl http://$(minikube ip):30000
```

---

## Part 4: Setup Ngrok Tunnels (10 minutes)

### Option 1: Single Tunnel with Config File (Recommended for Free Plan)

```bash
# ============================================
# Create Ngrok Config File (Both Tunnels)
# ============================================

# Purpose: Create ngrok config directory if it doesn't exist
mkdir -p ~/.ngrok2

# Purpose: Create config file with both tunnel definitions
cat > ~/.ngrok2/ngrok.yml << 'EOF'
version: "2"
authtoken: YOUR_NGROK_TOKEN
tunnels:
  webapp:
    proto: http
    addr: MINIKUBE_IP:30000
  dashboard:
    proto: http
    addr: 127.0.0.1:DASHBOARD_PORT
EOF

# Purpose: Replace MINIKUBE_IP with actual IP (e.g., 192.168.49.2)
sed -i "s/MINIKUBE_IP/$(minikube ip)/g" ~/.ngrok2/ngrok.yml

# Purpose: Start Kubernetes dashboard in background and get port
screen -S dashboard-proxy -dm minikube dashboard --url
sleep 5

# Purpose: Get dashboard port number
DASHBOARD_PORT=$(screen -S dashboard-proxy -X hardcopy /tmp/dashboard.txt && grep -oP '127.0.0.1:\K[0-9]+' /tmp/dashboard.txt | head -1)

# Purpose: Update config with dashboard port
sed -i "s/DASHBOARD_PORT/$DASHBOARD_PORT/g" ~/.ngrok2/ngrok.yml

# Purpose: Verify config file
cat ~/.ngrok2/ngrok.yml

# Purpose: Start both tunnels using screen (keeps running after disconnect)
screen -S ngrok-tunnels -dm ngrok start --all

# Purpose: Wait for tunnels to establish
sleep 3

# Purpose: Get tunnel URLs (copy these for submission)
curl -s http://localhost:4040/api/tunnels | grep -oP '"public_url":"\Khttps://[^"]+'

# Purpose: List all screen sessions
screen -ls

# Purpose: Reattach to ngrok screen to see tunnel status
screen -r ngrok-tunnels
# Press Ctrl+A then D to detach
```

### Option 2: Sequential Tunnels (If you have paid plan)

```bash
# ============================================
# Start Web App Tunnel
# ============================================

# Purpose: Create persistent screen session for webapp tunnel
screen -S webapp-tunnel

# Purpose: Start ngrok tunnel for web application (copy the https URL)
ngrok http $(minikube ip):30000
# Copy the https://xxxx.ngrok-free.app URL from output
# Press Ctrl+A then D to detach from screen

# ============================================
# Start Kubernetes Dashboard Tunnel
# ============================================

# Purpose: Create persistent screen session for dashboard
screen -S dashboard-proxy

# Purpose: Start Kubernetes dashboard proxy (note the port number)
minikube dashboard --url
# Note the port number (e.g., http://127.0.0.1:45691/...)
# Press Ctrl+A then D to detach from screen

# Purpose: Create persistent screen session for dashboard tunnel
screen -S dashboard-tunnel

# Purpose: Start ngrok tunnel for dashboard (replace PORT with number from above)
ngrok http 127.0.0.1:PORT_FROM_DASHBOARD_URL
# Copy the https://yyyy.ngrok-free.app URL from output
# Press Ctrl+A then D to detach from screen

# ============================================
# Manage Screen Sessions
# ============================================

# Purpose: List all running screen sessions
screen -ls

# Purpose: Reattach to a specific screen session (to view tunnel status)
screen -r webapp-tunnel
# Press Ctrl+A then D to detach again

# Purpose: Kill a screen session if needed
screen -X -S webapp-tunnel quit
```

---

## Verification Steps

```bash
# ============================================
# Verify Kubernetes Resources
# ============================================

# Purpose: Check all pods are running and ready (should show Running status)
kubectl get pods

# Purpose: Check services are created with correct NodePort assignments
kubectl get services

# Purpose: Check HPA is active and collecting metrics
kubectl get hpa

# Purpose: Get detailed HPA status (CPU%, Memory%, current/desired replicas)
kubectl describe hpa webapp-hpa

# Purpose: View all resources in current namespace
kubectl get all -o wide

# Purpose: Check PersistentVolumeClaim is bound to a volume
kubectl get pvc

# ============================================
# Test Application Locally
# ============================================

# Purpose: Get Minikube IP address
minikube ip

# Purpose: Test web app responds on NodePort (should return HTML)
curl http://$(minikube ip):30000

# Purpose: Check if web app home page is accessible
curl -I http://$(minikube ip):30000

# ============================================
# Test via Ngrok Tunnels (External Access)
# ============================================

# Purpose: Test web application via ngrok URL (open in browser)
# Open: https://your-webapp-url.ngrok-free.app
# Expected: Todo App login page

# Purpose: Test Kubernetes dashboard via ngrok URL (open in browser)
# Open: https://your-dashboard-url.ngrok-free.app
# Expected: Kubernetes Dashboard UI

# ============================================
# Test Database Persistence
# ============================================

# Purpose: Create a todo item in the web app, then delete MongoDB pod
kubectl delete pod -l app=mongodb

# Purpose: Wait for new MongoDB pod to be ready
kubectl wait --for=condition=ready pod -l app=mongodb --timeout=180s

# Purpose: Refresh web app - your data should still exist (proves PVC works)
# Open webapp URL in browser and verify todos are still there

# ============================================
# View Logs for Troubleshooting
# ============================================

# Purpose: View logs from webapp pods
kubectl logs -l app=webapp --tail=50

# Purpose: View logs from MongoDB pod
kubectl logs -l app=mongodb --tail=50

# Purpose: Describe pod for detailed information (if pod is not starting)
kubectl describe pod <pod-name>
```

---

## Important URLs to Save

1. **Web Application URL:** `https://xxxx.ngrok-free.app`
2. **Kubernetes Dashboard URL:** `https://yyyy.ngrok-free.app`

**Include both URLs in your submission and keep them active during evaluation!**

---

## Troubleshooting Commands

```bash
# ============================================
# Pod Issues
# ============================================

# Purpose: View logs from a specific pod
kubectl logs <pod-name>

# Purpose: Follow logs in real-time (useful for debugging)
kubectl logs <pod-name> -f

# Purpose: View logs from all pods with specific label
kubectl logs -l app=webapp --tail=50

# Purpose: Get detailed information about pod (events, conditions, etc.)
kubectl describe pod <pod-name>

# Purpose: Execute commands inside a running pod
kubectl exec -it <pod-name> -- /bin/sh

# Purpose: Delete a specific pod (Kubernetes will recreate it automatically)
kubectl delete pod <pod-name>

# ============================================
# Deployment Issues
# ============================================

# Purpose: Restart deployment (recreates all pods)
kubectl rollout restart deployment webapp-deployment

# Purpose: Check deployment rollout status
kubectl rollout status deployment webapp-deployment

# Purpose: View deployment history and revisions
kubectl rollout history deployment webapp-deployment

# Purpose: Scale deployment manually (temporary)
kubectl scale deployment webapp-deployment --replicas=3

# ============================================
# Minikube Issues
# ============================================

# Purpose: Check Minikube cluster status
minikube status

# Purpose: Get Minikube cluster IP address
minikube ip

# Purpose: SSH into Minikube node
minikube ssh

# Purpose: Stop Minikube cluster
minikube stop

# Purpose: Start Minikube cluster
minikube start

# Purpose: Delete and recreate Minikube cluster (nuclear option)
minikube delete
minikube start --driver=docker --memory=3500 --cpus=2

# ============================================
# Service & Network Issues
# ============================================

# Purpose: View all services and their endpoints
kubectl get services -o wide

# Purpose: View endpoints for a service
kubectl get endpoints

# Purpose: Test service connectivity from within cluster
kubectl run test-pod --rm -it --image=busybox -- wget -O- http://webapp-service:3000

# ============================================
# Resource Monitoring
# ============================================

# Purpose: View all resources in current namespace
kubectl get all -o wide

# Purpose: Check node resource usage
kubectl top nodes

# Purpose: Check pod resource usage
kubectl top pods

# Purpose: View HPA status and metrics
kubectl get hpa
kubectl describe hpa webapp-hpa

# ============================================
# Docker & Image Issues
# ============================================

# Purpose: Ensure using Minikube's Docker daemon
eval $(minikube docker-env)

# Purpose: List images in Minikube's Docker
docker images

# Purpose: Rebuild image if needed
docker build -t todo-app-web:v1 -f Dockerfile.k8s .

# Purpose: Remove old images to free space
docker image prune -a

# ============================================
# Screen Session Issues
# ============================================

# Purpose: List all screen sessions
screen -ls

# Purpose: Reattach to a detached screen
screen -r <session-name>

# Purpose: Kill a specific screen session
screen -X -S <session-name> quit

# Purpose: Kill all screen sessions
pkill screen

# ============================================
# Ngrok Issues
# ============================================

# Purpose: Check ngrok version
ngrok version

# Purpose: View ngrok web interface (shows active tunnels)
# Open in browser: http://127.0.0.1:4040

# Purpose: Kill all ngrok processes
pkill ngrok

# Purpose: Reconfigure ngrok authtoken
ngrok config add-authtoken YOUR_NEW_TOKEN
```

---

## Cleanup (After Evaluation)

```bash
# Delete all resources
cd ~/todo-app-a4/k8s
kubectl delete -f .

# Stop Minikube
minikube stop

# Kill ngrok tunnels
pkill ngrok

# Stop EC2 instance from AWS Console
```

---

## Time Estimate

- AWS EC2 Setup: **10 minutes**
- Software Installation (Docker, Node.js, kubectl, Minikube, Screen, Ngrok): **20 minutes**
- Application Deployment: **15 minutes**
- Ngrok Tunnel Setup: **10 minutes**
- Verification & Testing: **10 minutes**

**Total: ~65 minutes**

---

**Good Luck!** 🚀
