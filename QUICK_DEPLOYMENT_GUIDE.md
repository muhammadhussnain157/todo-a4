# Quick Deployment Guide - Kubernetes on AWS EC2

## Prerequisites
- AWS account with EC2 access
- Roll number for replica calculation: `(roll_no mod 10) + 2`

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

## Part 2: Install Software (15 minutes)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install -y ca-certificates curl gnupg lsb-release
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io
sudo usermod -aG docker $USER
newgrp docker

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Install Minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Start Minikube
minikube start --driver=docker --memory=3500 --cpus=2

# Enable addons
minikube addons enable metrics-server
minikube addons enable dashboard
minikube addons enable storage-provisioner

# Install ngrok
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update
sudo apt install ngrok
ngrok config add-authtoken YOUR_NGROK_TOKEN  # Get from https://dashboard.ngrok.com
```

---

## Part 3: Deploy Application (10 minutes)

```bash
# Clone/upload your project
git clone https://github.com/your-username/todo-app-a4.git
cd todo-app-a4

# Update replica count in webapp-deployment.yaml
# Formula: (your_roll_no mod 10) + 2
# For roll no 60: (60 mod 10) + 2 = 2 replicas
nano k8s/webapp-deployment.yaml  # Change replicas value

# Build Docker image
eval $(minikube docker-env)
docker build -t todo-app-web:v1 -f Dockerfile.k8s .

# Deploy to Kubernetes
cd k8s
kubectl apply -f mongodb-pvc.yaml
kubectl apply -f mongodb-deployment.yaml
kubectl apply -f mongodb-service.yaml
kubectl wait --for=condition=ready pod -l app=mongodb --timeout=180s
kubectl apply -f webapp-deployment.yaml
kubectl apply -f webapp-service.yaml
kubectl apply -f webapp-hpa.yaml

# Verify deployment
kubectl get all
kubectl get pvc
kubectl get hpa
```

---

## Part 4: Setup Ngrok Tunnels (5 minutes)

```bash
# Install screen for persistent sessions
sudo apt install -y screen

# Start webapp tunnel
screen -S webapp-tunnel
ngrok http $(minikube ip):30000
# Copy the https://xxxx.ngrok-free.app URL
# Press Ctrl+A then D to detach

# Start dashboard
screen -S dashboard
minikube dashboard --url
# Note the port number (e.g., 45691)
# Press Ctrl+A then D to detach

# Start dashboard tunnel
screen -S dashboard-tunnel
ngrok http 127.0.0.1:PORT_FROM_ABOVE
# Copy the https://yyyy.ngrok-free.app URL
# Press Ctrl+A then D to detach

# View running screens
screen -ls

# To reattach to a screen
screen -r webapp-tunnel
```

---

## Verification Steps

```bash
# Check all pods are running
kubectl get pods

# Check services
kubectl get services

# Check HPA
kubectl get hpa

# Test webapp locally
curl http://$(minikube ip):30000

# Test via ngrok (from your browser)
# Open: https://your-webapp-url.ngrok-free.app
# Open: https://your-dashboard-url.ngrok-free.app
```

---

## Important URLs to Save

1. **Web Application URL:** `https://xxxx.ngrok-free.app`
2. **Kubernetes Dashboard URL:** `https://yyyy.ngrok-free.app`

**Include both URLs in your submission and keep them active during evaluation!**

---

## Troubleshooting Commands

```bash
# Check pod logs
kubectl logs <pod-name>

# Describe pod for details
kubectl describe pod <pod-name>

# Check Minikube status
minikube status

# Check Minikube IP
minikube ip

# Restart deployment
kubectl rollout restart deployment webapp-deployment

# Delete and recreate pod
kubectl delete pod <pod-name>

# View all resources
kubectl get all -o wide
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
- Software Installation: **15 minutes**
- Application Deployment: **10 minutes**
- Ngrok Tunnel Setup: **5 minutes**
- Verification & Testing: **10 minutes**

**Total: ~50 minutes**

---

**Good Luck!** 🚀
