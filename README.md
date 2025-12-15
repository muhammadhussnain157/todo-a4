# TODO App - Kubernetes Deployment on AWS EC2

A Next.js TODO application with MongoDB backend, deployed on AWS EC2 using Minikube Kubernetes cluster with auto-scaling, persistent storage, and external access via ngrok tunnels.

## 🚀 Features

- ✅ Create, read, update, and delete todos
- ✅ Mark todos as important
- ✅ Track task completion
- ✅ Filter by pending and important tasks
- ✅ User authentication with NextAuth
- ✅ Persistent MongoDB database with PVC
- ✅ Kubernetes deployment with multiple replicas
- ✅ Horizontal Pod Autoscaling (HPA)
- ✅ Load balancing across web server replicas
- ✅ External access via ngrok tunnels

## 🛠 Tech Stack

- **Frontend:** Next.js 12, React 17
- **Backend:** Next.js API Routes, NextAuth
- **Database:** MongoDB 7.0 with Persistent Volume
- **Orchestration:** Kubernetes (Minikube)
- **Containerization:** Docker
- **Cloud:** AWS EC2 (Ubuntu 22.04)
- **Tunneling:** Ngrok
- **Icons:** FontAwesome

## 📋 Prerequisites

- AWS account with EC2 access
- Basic knowledge of Kubernetes concepts
- Ngrok account (free tier works)
- SSH client for EC2 access

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your MongoDB connection string

# Run development server
npm run dev
```

Visit `http://localhost:3000` to see the application.


#### Quick Summary

1. **Launch EC2 instance** (t2.medium, Ubuntu 22.04)
2. **Install required software** (Docker, kubectl, Minikube, ngrok)
3. **Deploy to Kubernetes**:
   ```bash
   # Build Docker image
   eval $(minikube docker-env)
   docker build -t todo-app-web:v1 -f Dockerfile.k8s .
   
   # Deploy resources
   kubectl apply -f k8s/
   ```
4. **Set up ngrok tunnels** for external access
5. **Verify deployment** via Kubernetes Dashboard



## 🧪 Testing Database Persistence

```bash
# Create some todos in the app
# Then delete the MongoDB pod
kubectl delete pod -l app=mongodb

# Wait for pod to restart
kubectl wait --for=condition=ready pod -l app=mongodb --timeout=180s

# Refresh the app - your data should still be there!
```

## 📈 Auto-Scaling

The HorizontalPodAutoscaler automatically scales web application pods based on:
- **CPU Usage**: Scales up when > 50%
- **Memory Usage**: Scales up when > 70%
- **Min Replicas**: 2
- **Max Replicas**: 10

Monitor scaling:
```bash
kubectl get hpa -w
kubectl top pods
```

## 🔍 Monitoring

Access Kubernetes Dashboard via ngrok tunnel to monitor:
- Pod status and logs
- Resource utilization
- Deployments and services
- Persistent volume claims
- Auto-scaling events

## 🐛 Troubleshooting

### Check Pod Status
```bash
kubectl get pods
kubectl describe pod <pod-name>
kubectl logs <pod-name>
```

### Check Services
```bash
kubectl get services
kubectl describe service webapp-service
```

### Check HPA
```bash
kubectl get hpa
kubectl describe hpa webapp-hpa
```
