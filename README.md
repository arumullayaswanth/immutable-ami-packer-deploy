# 🚀 Jenkins Setup on AWS EC2 (Ubuntu) - Step-by-Step Guide

## Step 1: Launch EC2 Instance (Ubuntu)

1. Go to the AWS EC2 Console.
2. Click **"Launch Instance"**.
3. Choose **Ubuntu Server 22.04 LTS (HVM), SSD Volume Type**.
4. Select instance type (e.g., `t2.micro` for free tier).
5. Click **Next** until **Configure Security Group**:
   - Allow:
     - **SSH (22)** – Your IP
     - **HTTP (80)** – Anywhere (for Load Balancer or direct access)
     - **Custom TCP (8080)** – Anywhere (Jenkins default port)
6. Launch instance with a new or existing key pair.
7. After launching, **copy the public IP** of your instance.

---

## Step 2: Connect to EC2

```bash
ssh -i "your-key.pem" ubuntu@<your-ec2-public-ip>
```
