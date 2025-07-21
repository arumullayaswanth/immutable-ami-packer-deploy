# Build Once Deploy Forever Immutable AMI Deployment with Packer Deploy into live Environment without Rollback

## Step 1: Launch EC2 Instance (Ubuntu)

1. Go to the AWS EC2 Console.
2. Click **"Launch Instance"**.
3. Name : Packer
4. Choose **Ubuntu Server 22.04 LTS (HVM), SSD Volume Type**.
5. Select instance type : **t2.medium**
6. Click **Next** until **Configure Security Group**:

   * Allow:

     * **SSH (22)** – Your IP
     * **HTTP (80)** – Anywhere (for Load Balancer or direct access)
     * **Custom TCP (8080)** – Anywhere (Jenkins default port)
7. Attach IAM
8. Launch instance with a new or existing key pair.
9. After launching, **copy the public IP** of your instance.

---

## Step 2: Connect to EC2

```bash
ssh -i "your-key.pem" ubuntu@<your-ec2-public-ip>
```

## Step 3: Install packer

```bash
# Add HashiCorp GPG key
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -

# Add official HashiCorp Linux repository
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"

# Update and install packer
sudo apt update && sudo apt install packer
```

```bash
packer
```

## Step 4: Install AWS CLI

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
sudo apt-get install unzip -y
unzip awscliv2.zip
sudo ./aws/install
```

## Step 5: Install Java and Jenkins

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y
```
```bash
# Add the new public key
curl -fsSL https://apt.corretto.aws/corretto.key | gpg --dearmor | sudo tee /usr/share/keyrings/corretto.gpg > /dev/null
```
```bash
# Add the repository using the new signed key
echo "deb [signed-by=/usr/share/keyrings/corretto.gpg] https://apt.corretto.aws stable main" | sudo tee /etc/apt/sources.list.d/corretto.list
```
```bash
# Update package index
sudo apt update
```
```bash
# Install Amazon Corretto 17
sudo apt install -y java-17-amazon-corretto-jdk
```
```bash
# Verify Java version
java -version
```
```bash
# Download Jenkins .deb package
wget https://pkg.jenkins.io/debian-stable/binary/jenkins_2.414.1_all.deb
```
```bash
# Install Jenkins
sudo dpkg -i jenkins_2.414.1_all.deb
```
```bash
# Fix missing dependencies (if any)
sudo apt -f install -y
```
```bash
# Start Jenkins service
sudo systemctl start jenkins
sudo systemctl enable jenkins
```
```bash
# Check Jenkins status
sudo systemctl status jenkins --no-pager
```
```bash
# Display the initial admin password
echo -e "\nJenkins initial admin password:"
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```


## 🏠 Step 6: Create Target Group for Load Balancer

1. Go to AWS Console → EC2 → **Target Groups**
2. Click **Create Target Group**

### Configuration:

* **Target type**: `Instance`
* **Protocol**: `HTTP`
* **Port**: `8080`
* **VPC**: Select the same VPC as your EC2 instance
* **Target group name**: `jenkins-tg`

### Health checks:

* **Protocol**: `HTTP`
* **Path**: `/`
* Leave other settings as default or adjust based on requirements

3. Click **Next**, then register your Jenkins EC2 instance
4. Click **Create target group**

This target group can now be attached to an **Application Load Balancer** for routing traffic to Jenkins.

---

## 🚀 Step 7: Create a Launch Template

1. Go to AWS Console → EC2 → **Launch Templates**
2. Click **Create launch template**

### Configuration:

* **Launch template name**: `jenkins-template`
* **Template version description**: `Initial version`
* **AMI ID**: \`any AMI\`
* **Instance type**: `t2.medium`
* **Key pair**: Select your existing key pair
* **Network settings**:

  * Choose VPC and Subnet
  * Assign public IP if needed
* **Security group**:

  * Attach one that allows ports `22`, `80`, and `8080`

3. Click **Create launch template**

Now you can use this template in an **Auto Scaling Group** or to quickly launch new EC2 instances from your pre-built AMI.

---

## 🌐 Step 8: Create Application Load Balancer Across All Availability Zones

1. Go to AWS Console → EC2 → **Load Balancers**
2. Click **Create Load Balancer**
3. Select **Application Load Balancer**

### Configuration:

* **Name**: `jenkins-alb`
* **Scheme**: Internet-facing
* **IP address type**: IPv4

### Network mapping:

* **VPC**: Choose the same VPC as your EC2 instance
* **Availability Zones**:

  * Select **all available zones**
  * For each zone, select at least one public subnet

### Listeners:

* **Protocol**: HTTP
* **Port**: 80
* Click **Add listener** if needed (default is fine for now)

---

## 🎯 Step 9: Attach Target Group to Load Balancer

1. Under **Default action**, choose:

   * **Forward to** → `jenkins-tg` (your target group)
2. Click **Next** through the remaining steps
3. Review and click **Create Load Balancer**

Once active, your Jenkins instance will be reachable at:

```
http://<load-balancer-dns-name>:80
```

> ✅ Make sure your EC2 security group allows inbound traffic from the Load Balancer (on port 8080).

---

## 📈 Step 10: Create Auto Scaling Group (ASG)

1. Go to **EC2 Console** → **Auto Scaling Groups**
2. Click **Create Auto Scaling group**

### Auto Scaling Group Configuration:

* **Auto Scaling group name**: `jenkins-asg`
* **Launch Template**:

  * Select: `jenkins-template` (created in Step 10)
  * Use: **Latest version**

### Network:

* **VPC**: Select the same VPC as your EC2 and Load Balancer
* **Availability Zones and Subnets**:

  * Select **2 or more public subnets** from **different availability zones** for high availability

---

### Attach to Load Balancer:

1. Choose: **Attach to an existing load balancer**
2. Select **Application Load Balancer**
3. Choose:

   * **Load Balancer**: `jenkins-alb`
   * **Target Group**: `jenkins-tg`

---

### Group Size:

* **Desired Capacity**: `2`
* **Minimum capacity**: `1`
* **Maximum capacity**: `3`

---

### Health Check Settings:

* **Health check type**: EC2 and ELB
* **Health check grace period**: `300` seconds

---

### Notifications (Optional):

* You may skip or configure notifications using **SNS topics**

---

### Final Step:

* Click **Create Auto Scaling group**

✅ You now have a scalable and resilient Jenkins deployment that can auto-recover and distribute traffic through the ALB using the Packer-built AMI.
---

## Step 11: Access Jenkins in Browser

1. Visit: http\ec2_ip://:8080
2. Get the initial admin password:

```bash
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

3. Paste the password into the browser and complete setup.
4. Click Install suggested plugins
5. Create first user:

   * Username = yaswanth
   * Password = yaswanth
   * Full Name = yaswanth
   * Email = [yash@example.com](mailto:yash@example.com)
6. Click through: Save and Continue → Save and Finish → Start using Jenkins

# 🔌 Step 12: Install Jenkins Plugin

1. Jenkins Dashboard → Manage Jenkins
2. Go to: Plugins
3. Click Available plugins
4. Search for:

* pipeline: stage view

5. Install it

# 🛠️ Step 8: Create a Jenkins Pipeline Job

1. Go to Jenkins Dashboard
2. Click New Item
3. Name it: `packer`
4. Select: Pipeline
5. Click OK

**Pipeline Configuration:**

* Definition : Pipeline script from SCM
* SCM : Git
* Repository : `https://github.com/arumullayaswanth/immutable-ami-packer-deploy.git`
* Branches to build : `*/master`
* Script Path : `Jenkinsfile`
* Click Apply
* Click Save

6. Click **Build** to run the pipeline.

---

##  Step 13: update Auto Scaling Group (ASG) and launch template in jenkins file
```bash
pipeline {
    agent any

    environment {
        AWS_REGION = 'us-east-1'
        LAUNCH_TEMPLATE_ID = 'lt-0ae02ab8f8356c3a7'  // update latest launch template
        ASG_NAME = "asgnew"                          // update latest Auto Scaling Group
    }
```
## 🛠️ Step 14: Build Pipeline agian

