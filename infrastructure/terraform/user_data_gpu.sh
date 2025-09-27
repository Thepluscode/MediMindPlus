#!/bin/bash

# MediMind EKS GPU Node User Data Script
# Configures EKS GPU worker nodes with NVIDIA drivers and TensorRT optimizations

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
    amazon-cloudwatch-agent \
    gcc \
    kernel-devel-$(uname -r) \
    dkms

# Install NVIDIA drivers
yum install -y nvidia-driver-latest-dkms
yum install -y cuda-drivers

# Install NVIDIA Container Toolkit
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.repo | \
    tee /etc/yum.repos.d/nvidia-container-toolkit.repo

yum clean expire-cache
yum install -y nvidia-container-toolkit

# Configure containerd for GPU support
mkdir -p /etc/containerd
cat > /etc/containerd/config.toml << 'EOF'
version = 2

[plugins]
  [plugins."io.containerd.grpc.v1.cri"]
    [plugins."io.containerd.grpc.v1.cri".containerd]
      default_runtime_name = "nvidia"
      [plugins."io.containerd.grpc.v1.cri".containerd.runtimes]
        [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc]
          runtime_type = "io.containerd.runc.v2"
          [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.options]
            SystemdCgroup = true
        [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.nvidia]
          runtime_type = "io.containerd.runc.v2"
          [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.nvidia.options]
            BinaryName = "/usr/bin/nvidia-container-runtime"
            SystemdCgroup = true
    [plugins."io.containerd.grpc.v1.cri".registry]
      [plugins."io.containerd.grpc.v1.cri".registry.mirrors]
        [plugins."io.containerd.grpc.v1.cri".registry.mirrors."docker.io"]
          endpoint = ["https://registry-1.docker.io"]
EOF

# Configure NVIDIA Container Runtime
nvidia-ctk runtime configure --runtime=containerd

# Restart containerd
systemctl restart containerd

# Configure EKS bootstrap with GPU support
/etc/eks/bootstrap.sh $CLUSTER_NAME \
    --b64-cluster-ca $(aws eks describe-cluster --name $CLUSTER_NAME --query 'cluster.certificateAuthority.data' --output text --region $(curl -s http://169.254.169.254/latest/meta-data/placement/region)) \
    --apiserver-endpoint $(aws eks describe-cluster --name $CLUSTER_NAME --query 'cluster.endpoint' --output text --region $(curl -s http://169.254.169.254/latest/meta-data/placement/region)) \
    --container-runtime containerd \
    --kubelet-extra-args '--node-labels=workload='$NODE_GROUP',nvidia.com/gpu=true,node.kubernetes.io/instance-type='$(curl -s http://169.254.169.254/latest/meta-data/instance-type)' --register-with-taints=nvidia.com/gpu=true:NoSchedule'

# Optimize system for GPU ML workloads
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

# GPU-specific optimizations
echo 'nvidia.NVreg_PreserveVideoMemoryAllocations=1' >> /etc/modprobe.d/nvidia.conf
echo 'nvidia.NVreg_TemporaryFilePath=/tmp' >> /etc/modprobe.d/nvidia.conf

sysctl -p

# Configure ulimits for high-performance GPU applications
echo '* soft nofile 1048576' >> /etc/security/limits.conf
echo '* hard nofile 1048576' >> /etc/security/limits.conf
echo '* soft nproc 1048576' >> /etc/security/limits.conf
echo '* hard nproc 1048576' >> /etc/security/limits.conf
echo '* soft memlock unlimited' >> /etc/security/limits.conf
echo '* hard memlock unlimited' >> /etc/security/limits.conf

# Install and configure CloudWatch agent with GPU metrics
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
    "agent": {
        "metrics_collection_interval": 60,
        "run_as_user": "cwagent"
    },
    "metrics": {
        "namespace": "MediMind/EKS/GPU",
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
                        "log_group_name": "/aws/eks/medimind-cluster/gpu",
                        "log_stream_name": "{instance_id}/messages"
                    },
                    {
                        "file_path": "/var/log/nvidia-installer.log",
                        "log_group_name": "/aws/eks/medimind-cluster/gpu",
                        "log_stream_name": "{instance_id}/nvidia-installer"
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

# Install NVIDIA GPU monitoring tools
cd /tmp
wget https://github.com/NVIDIA/gpu-monitoring-tools/archive/refs/heads/master.zip
unzip master.zip
cd gpu-monitoring-tools-master
make binary
cp bin/amd64/dcgm-exporter /usr/local/bin/

# Create DCGM exporter service for GPU metrics
cat > /etc/systemd/system/dcgm-exporter.service << 'EOF'
[Unit]
Description=DCGM Exporter
After=network.target

[Service]
User=nobody
Group=nobody
Type=simple
ExecStart=/usr/local/bin/dcgm-exporter -f /etc/dcgm-exporter/dcp-metrics-included.csv
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Create DCGM configuration
mkdir -p /etc/dcgm-exporter
cat > /etc/dcgm-exporter/dcp-metrics-included.csv << 'EOF'
# Format: metric name, Prometheus metric type, help message

# GPU Utilization
DCGM_FI_DEV_GPU_UTIL, gauge, GPU utilization (in %).
DCGM_FI_DEV_MEM_COPY_UTIL, gauge, Memory utilization (in %).
DCGM_FI_DEV_MEMORY_TEMP, gauge, Memory temperature (in C).
DCGM_FI_DEV_GPU_TEMP, gauge, GPU temperature (in C).
DCGM_FI_DEV_POWER_USAGE, gauge, Power draw (in W).
DCGM_FI_DEV_TOTAL_ENERGY_CONSUMPTION, counter, Total energy consumption since boot (in mJ).

# Memory
DCGM_FI_DEV_FB_FREE, gauge, Framebuffer memory free (in MiB).
DCGM_FI_DEV_FB_USED, gauge, Framebuffer memory used (in MiB).
DCGM_FI_DEV_FB_TOTAL, gauge, Total framebuffer memory (in MiB).

# Performance
DCGM_FI_DEV_SM_CLOCK, gauge, SM clock frequency (in MHz).
DCGM_FI_DEV_MEM_CLOCK, gauge, Memory clock frequency (in MHz).
DCGM_FI_DEV_PCIE_TX_THROUGHPUT, counter, Total number of bytes transmitted through PCIe TX (in KB) via NVML.
DCGM_FI_DEV_PCIE_RX_THROUGHPUT, counter, Total number of bytes received through PCIe RX (in KB) via NVML.
EOF

systemctl daemon-reload
systemctl enable dcgm-exporter
systemctl start dcgm-exporter

# Install Node Exporter for general system monitoring
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

# Install kubectl for debugging
curl -o kubectl https://amazon-eks.s3.us-west-2.amazonaws.com/1.28.3/2023-11-14/bin/linux/amd64/kubectl
chmod +x ./kubectl
mv ./kubectl /usr/local/bin

# Create GPU health check script
cat > /usr/local/bin/gpu-health-check.sh << 'EOF'
#!/bin/bash
# GPU health check script for MediMind EKS GPU nodes

# Check if NVIDIA driver is loaded
if ! lsmod | grep -q nvidia; then
    echo "ERROR: NVIDIA driver not loaded"
    exit 1
fi

# Check GPU status
if ! nvidia-smi > /dev/null 2>&1; then
    echo "ERROR: nvidia-smi failed"
    exit 1
fi

# Check GPU temperature
GPU_TEMP=$(nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader,nounits)
if [ $GPU_TEMP -gt 85 ]; then
    echo "WARNING: GPU temperature is ${GPU_TEMP}°C"
fi

# Check GPU memory usage
GPU_MEM_USED=$(nvidia-smi --query-gpu=memory.used --format=csv,noheader,nounits | sed 's/ MiB//')
GPU_MEM_TOTAL=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits | sed 's/ MiB//')
GPU_MEM_PERCENT=$((GPU_MEM_USED * 100 / GPU_MEM_TOTAL))

if [ $GPU_MEM_PERCENT -gt 95 ]; then
    echo "WARNING: GPU memory usage is ${GPU_MEM_PERCENT}%"
fi

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

echo "GPU node health check passed"
EOF

chmod +x /usr/local/bin/gpu-health-check.sh

# Add GPU health check to cron
echo "*/5 * * * * root /usr/local/bin/gpu-health-check.sh >> /var/log/gpu-health.log 2>&1" >> /etc/crontab

# Configure log rotation for GPU logs
cat > /etc/logrotate.d/gpu-logs << 'EOF'
/var/log/gpu-health.log {
    daily
    missingok
    rotate 7
    compress
    notifempty
    create 0644 root root
}

/var/log/nvidia-installer.log {
    daily
    missingok
    rotate 7
    compress
    notifempty
    create 0644 root root
}
EOF

# Wait for GPU initialization
sleep 30

# Verify GPU setup
nvidia-smi
nvidia-container-cli info

echo "GPU node initialization completed successfully"
