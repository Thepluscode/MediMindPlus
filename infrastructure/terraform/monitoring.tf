# Monitoring and Alerting Infrastructure for MediMind Production
# Comprehensive monitoring with Prometheus, Grafana, and CloudWatch

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/eks/${var.app_name}/application"
  retention_in_days = 30

  tags = {
    Name        = "${var.app_name}-app-logs"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_group" "ml_pipeline" {
  name              = "/aws/eks/${var.app_name}/ml-pipeline"
  retention_in_days = 30

  tags = {
    Name        = "${var.app_name}-ml-logs"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/aws/eks/${var.app_name}/backend"
  retention_in_days = 30

  tags = {
    Name        = "${var.app_name}-backend-logs"
    Environment = var.environment
  }
}

# SNS Topic for alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.app_name}-alerts"

  tags = {
    Name        = "${var.app_name}-alerts"
    Environment = var.environment
  }
}

resource "aws_sns_topic_subscription" "email_alerts" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# CloudWatch Alarms for EKS Cluster
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${var.app_name}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EKS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors EKS cluster CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = aws_eks_cluster.main.name
  }

  tags = {
    Name        = "${var.app_name}-high-cpu-alarm"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "high_memory" {
  alarm_name          = "${var.app_name}-high-memory"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "ContainerInsights"
  period              = "300"
  statistic           = "Average"
  threshold           = "85"
  alarm_description   = "This metric monitors EKS cluster memory utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = aws_eks_cluster.main.name
  }

  tags = {
    Name        = "${var.app_name}-high-memory-alarm"
    Environment = var.environment
  }
}

# RDS Alarms
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "${var.app_name}-rds-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "75"
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name        = "${var.app_name}-rds-cpu-alarm"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_connections" {
  alarm_name          = "${var.app_name}-rds-high-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "150"
  alarm_description   = "This metric monitors RDS connection count"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name        = "${var.app_name}-rds-connections-alarm"
    Environment = var.environment
  }
}

# Application-specific alarms
resource "aws_cloudwatch_metric_alarm" "ml_prediction_latency" {
  alarm_name          = "${var.app_name}-ml-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "prediction_latency"
  namespace           = "MediMind/ML"
  period              = "60"
  statistic           = "Average"
  threshold           = "200"  # 200ms threshold
  alarm_description   = "This metric monitors ML prediction latency"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = {
    Name        = "${var.app_name}-ml-latency-alarm"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "ml_error_rate" {
  alarm_name          = "${var.app_name}-ml-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "error_rate"
  namespace           = "MediMind/ML"
  period              = "300"
  statistic           = "Average"
  threshold           = "5"  # 5% error rate
  alarm_description   = "This metric monitors ML prediction error rate"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = {
    Name        = "${var.app_name}-ml-error-alarm"
    Environment = var.environment
  }
}

# GPU utilization alarm
resource "aws_cloudwatch_metric_alarm" "gpu_utilization" {
  alarm_name          = "${var.app_name}-low-gpu-utilization"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "gpu_utilization"
  namespace           = "MediMind/GPU"
  period              = "300"
  statistic           = "Average"
  threshold           = "20"  # Alert if GPU utilization is consistently low
  alarm_description   = "This metric monitors GPU utilization efficiency"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = {
    Name        = "${var.app_name}-gpu-utilization-alarm"
    Environment = var.environment
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.app_name}-production-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/EKS", "cluster_failed_request_count", "ClusterName", aws_eks_cluster.main.name],
            [".", "cluster_request_total", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "EKS Cluster Requests"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", aws_db_instance.main.id],
            [".", "DatabaseConnections", ".", "."],
            [".", "ReadLatency", ".", "."],
            [".", "WriteLatency", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "RDS Performance"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["MediMind/ML", "prediction_latency"],
            [".", "prediction_throughput"],
            [".", "error_rate"]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "ML Pipeline Performance"
          period  = 60
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["MediMind/GPU", "gpu_utilization"],
            [".", "gpu_memory_usage"],
            [".", "gpu_temperature"]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "GPU Performance"
          period  = 300
        }
      },
      {
        type   = "log"
        x      = 0
        y      = 12
        width  = 24
        height = 6

        properties = {
          query   = "SOURCE '/aws/eks/${var.app_name}/application' | fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 100"
          region  = var.aws_region
          title   = "Recent Application Errors"
          view    = "table"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.app_name}-dashboard"
    Environment = var.environment
  }
}

# Custom metrics for application monitoring
resource "aws_cloudwatch_log_metric_filter" "error_count" {
  name           = "${var.app_name}-error-count"
  log_group_name = aws_cloudwatch_log_group.application.name
  pattern        = "[timestamp, request_id, ERROR]"

  metric_transformation {
    name      = "ErrorCount"
    namespace = "MediMind/Application"
    value     = "1"
  }
}

resource "aws_cloudwatch_log_metric_filter" "prediction_latency" {
  name           = "${var.app_name}-prediction-latency"
  log_group_name = aws_cloudwatch_log_group.ml_pipeline.name
  pattern        = "[timestamp, request_id, \"PREDICTION_LATENCY\", latency]"

  metric_transformation {
    name      = "prediction_latency"
    namespace = "MediMind/ML"
    value     = "$latency"
  }
}

# Container Insights for EKS
resource "aws_eks_addon" "container_insights" {
  cluster_name = aws_eks_cluster.main.name
  addon_name   = "amazon-cloudwatch-observability"

  tags = {
    Name        = "${var.app_name}-container-insights"
    Environment = var.environment
  }
}

# Variables for monitoring
variable "alert_email" {
  description = "Email address for alerts"
  type        = string
  default     = "alerts@medimind.app"
}

# Outputs
output "cloudwatch_dashboard_url" {
  description = "URL to the CloudWatch dashboard"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = aws_sns_topic.alerts.arn
}
