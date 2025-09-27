#!/bin/bash

# MediMind EKS Node User Data Script
# Configures EKS worker nodes with optimizations for health AI workloads

set -o xtrace

# Variables
CLUSTER_NAME="${cluster_name}"
NODE_GROUP="${node_group}"

# Update system
yum update -y

# Install additional packages
yum install -y \
    htop \
    iotop \
    sysstat \
    tcpdump \
    telnet \
    wget \
    curl \
    jq \
    awscli \
    amazon-cloudwatch-agent

# Configure EKS bootstrap
/etc/eks/bootstrap.sh $CLUSTER_NAME \
    --b64-cluster-ca $(aws eks describe-cluster --name $CLUSTER_NAME --query 'cluster.certificateAuthority.data' --output text --region $(curl -s http://169.254.169.254/latest/meta-data/placement/region)) \
    --apiserver-endpoint $(aws eks describe-cluster --name $CLUSTER_NAME --query 'cluster.endpoint' --output text --region $(curl -s http://169.254.169.254/latest/meta-data/placement/region)) \
    --container-runtime containerd \
    --kubelet-extra-args '--node-labels=workload='$NODE_GROUP',node.kubernetes.io/instance-type='$(curl -s http://169.254.169.254/latest/meta-data/instance-type)

# Optimize system for ML workloads
echo 'vm.swappiness=1' >> /etc/sysctl.conf
echo 'net.core.somaxconn=65535' >> /etc/sysctl.conf
echo 'net.ipv4.tcp_max_syn_backlog=65535' >> /etc/sysctl.conf
echo 'net.core.netdev_max_backlog=5000' >> /etc/sysctl.conf
echo 'net.ipv4.tcp_fin_timeout=30' >> /etc/sysctl.conf
echo 'net.ipv4.tcp_keepalive_time=1200' >> /etc/sysctl.conf
echo 'net.ipv4.tcp_max_tw_buckets=400000' >> /etc/sysctl.conf
echo 'net.ipv4.tcp_tw_reuse=1' >> /etc/sysctl.conf
echo 'net.ipv4.tcp_window_scaling=1' >> /etc/sysctl.conf
echo 'net.ipv4.tcp_congestion_control=bbr' >> /etc/sysctl.conf
sysctl -p

# Configure ulimits for high-performance applications
echo '* soft nofile 1048576' >> /etc/security/limits.conf
echo '* hard nofile 1048576' >> /etc/security/limits.conf
echo '* soft nproc 1048576' >> /etc/security/limits.conf
echo '* hard nproc 1048576' >> /etc/security/limits.conf

# Install and configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
    "agent": {
        "metrics_collection_interval": 60,
        "run_as_user": "cwagent"
    },
    "metrics": {
        "namespace": "MediMind/EKS",
        "metrics_collected": {
            "cpu": {
                "measurement": [
                    "cpu_usage_idle",
                    "cpu_usage_iowait",
                    "cpu_usage_user",
                    "cpu_usage_system"
                ],
                "metrics_collection_interval": 60,
                "totalcpu": false
            },
            "disk": {
                "measurement": [
                    "used_percent"
                ],
                "metrics_collection_interval": 60,
                "resources": [
                    "*"
                ]
            },
            "diskio": {
                "measurement": [
                    "io_time"
                ],
                "metrics_collection_interval": 60,
                "resources": [
                    "*"
                ]
            },
            "mem": {
                "measurement": [
                    "mem_used_percent"
                ],
                "metrics_collection_interval": 60
            },
            "netstat": {
                "measurement": [
                    "tcp_established",
                    "tcp_time_wait"
                ],
                "metrics_collection_interval": 60
            },
            "swap": {
                "measurement": [
                    "swap_used_percent"
                ],
                "metrics_collection_interval": 60
            }
        }
    },
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/messages",
                        "log_group_name": "/aws/eks/medimind-cluster/system",
                        "log_stream_name": "{instance_id}/messages"
                    },
                    {
                        "file_path": "/var/log/secure",
                        "log_group_name": "/aws/eks/medimind-cluster/system",
                        "log_stream_name": "{instance_id}/secure"
                    }
                ]
            }
        }
    }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
    -s

# Configure log rotation
cat > /etc/logrotate.d/kubernetes << 'EOF'
/var/log/pods/*/*.log {
    daily
    missingok
    rotate 7
    compress
    notifempty
    create 0644 root root
}
EOF

# Install Node Exporter for Prometheus monitoring
cd /tmp
wget https://github.com/prometheus/node_exporter/releases/download/v1.6.1/node_exporter-1.6.1.linux-amd64.tar.gz
tar xvfz node_exporter-1.6.1.linux-amd64.tar.gz
cp node_exporter-1.6.1.linux-amd64/node_exporter /usr/local/bin/
rm -rf node_exporter-1.6.1.linux-amd64*

# Create node_exporter service
cat > /etc/systemd/system/node_exporter.service << 'EOF'
[Unit]
Description=Node Exporter
After=network.target

[Service]
User=nobody
Group=nobody
Type=simple
ExecStart=/usr/local/bin/node_exporter --web.listen-address=:9100
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable node_exporter
systemctl start node_exporter

# Configure containerd for optimal performance
mkdir -p /etc/containerd
cat > /etc/containerd/config.toml << 'EOF'
version = 2

[plugins]
  [plugins."io.containerd.grpc.v1.cri"]
    [plugins."io.containerd.grpc.v1.cri".containerd]
      [plugins."io.containerd.grpc.v1.cri".containerd.runtimes]
        [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc]
          runtime_type = "io.containerd.runc.v2"
          [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.options]
            SystemdCgroup = true
    [plugins."io.containerd.grpc.v1.cri".registry]
      [plugins."io.containerd.grpc.v1.cri".registry.mirrors]
        [plugins."io.containerd.grpc.v1.cri".registry.mirrors."docker.io"]
          endpoint = ["https://registry-1.docker.io"]
EOF

systemctl restart containerd

# Install kubectl for debugging
curl -o kubectl https://amazon-eks.s3.us-west-2.amazonaws.com/1.28.3/2023-11-14/bin/linux/amd64/kubectl
chmod +x ./kubectl
mv ./kubectl /usr/local/bin

# Create health check script
cat > /usr/local/bin/node-health-check.sh << 'EOF'
#!/bin/bash
# Node health check script for MediMind EKS nodes

# Check if kubelet is running
if ! systemctl is-active --quiet kubelet; then
    echo "ERROR: kubelet is not running"
    exit 1
fi

# Check if containerd is running
if ! systemctl is-active --quiet containerd; then
    echo "ERROR: containerd is not running"
    exit 1
fi

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 85 ]; then
    echo "WARNING: Disk usage is ${DISK_USAGE}%"
fi

# Check memory usage
MEM_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ $MEM_USAGE -gt 90 ]; then
    echo "WARNING: Memory usage is ${MEM_USAGE}%"
fi

echo "Node health check passed"
EOF

chmod +x /usr/local/bin/node-health-check.sh

# Add health check to cron
echo "*/5 * * * * root /usr/local/bin/node-health-check.sh >> /var/log/node-health.log 2>&1" >> /etc/crontab

# Signal completion
/opt/aws/bin/cfn-signal -e $? --stack ${AWS::StackName} --resource AutoScalingGroup --region ${AWS::Region} || true

echo "Node initialization completed successfully"
