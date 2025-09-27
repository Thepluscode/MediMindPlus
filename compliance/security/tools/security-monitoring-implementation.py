"""
Security Monitoring Implementation for MediMind
Comprehensive security monitoring and alerting system
"""

import logging
import json
import hashlib
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from enum import Enum
import asyncio
import aioredis
import psycopg2
from psycopg2.extras import RealDictCursor
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
import jwt
from cryptography.fernet import Fernet
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class AlertSeverity(str, Enum):
    """Alert severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class EventType(str, Enum):
    """Security event types"""
    LOGIN_ATTEMPT = "login_attempt"
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILURE = "login_failure"
    DATA_ACCESS = "data_access"
    DATA_MODIFICATION = "data_modification"
    PRIVILEGE_ESCALATION = "privilege_escalation"
    SYSTEM_ACCESS = "system_access"
    CONFIGURATION_CHANGE = "configuration_change"
    SECURITY_VIOLATION = "security_violation"
    ANOMALY_DETECTED = "anomaly_detected"

@dataclass
class SecurityEvent:
    """Security event data structure"""
    event_id: str
    event_type: EventType
    timestamp: datetime
    user_id: Optional[str]
    source_ip: str
    user_agent: Optional[str]
    resource: str
    action: str
    result: str
    severity: AlertSeverity
    details: Dict[str, Any] = field(default_factory=dict)
    risk_score: float = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            'event_id': self.event_id,
            'event_type': self.event_type.value,
            'timestamp': self.timestamp.isoformat(),
            'user_id': self.user_id,
            'source_ip': self.source_ip,
            'user_agent': self.user_agent,
            'resource': self.resource,
            'action': self.action,
            'result': self.result,
            'severity': self.severity.value,
            'details': self.details,
            'risk_score': self.risk_score
        }

@dataclass
class SecurityAlert:
    """Security alert data structure"""
    alert_id: str
    title: str
    description: str
    severity: AlertSeverity
    event_ids: List[str]
    created_at: datetime
    acknowledged: bool = False
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    resolved: bool = False
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None

class SecurityMonitor:
    """
    Comprehensive security monitoring system
    """
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize security monitor"""
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # Initialize connections
        self.redis_client = None
        self.db_connection = None
        
        # Risk scoring thresholds
        self.risk_thresholds = {
            'low': 0.3,
            'medium': 0.6,
            'high': 0.8,
            'critical': 0.95
        }
        
        # Anomaly detection parameters
        self.anomaly_window = timedelta(hours=24)
        self.baseline_period = timedelta(days=30)
        
        # Alert suppression to prevent spam
        self.alert_suppression = {}
        self.suppression_window = timedelta(minutes=15)
        
    async def initialize(self):
        """Initialize monitoring system"""
        try:
            # Initialize Redis connection
            self.redis_client = await aioredis.from_url(
                self.config['redis_url'],
                encoding='utf-8',
                decode_responses=True
            )
            
            # Initialize database connection
            self.db_connection = psycopg2.connect(
                host=self.config['db_host'],
                database=self.config['db_name'],
                user=self.config['db_user'],
                password=self.config['db_password']
            )
            
            self.logger.info("Security monitoring system initialized")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize security monitor: {e}")
            raise
    
    async def log_security_event(self, event: SecurityEvent):
        """Log security event and perform analysis"""
        try:
            # Store event in database
            await self._store_event(event)
            
            # Cache recent events in Redis
            await self._cache_event(event)
            
            # Perform real-time analysis
            await self._analyze_event(event)
            
            # Check for anomalies
            await self._detect_anomalies(event)
            
            self.logger.info(f"Security event logged: {event.event_id}")
            
        except Exception as e:
            self.logger.error(f"Failed to log security event: {e}")
            raise
    
    async def _store_event(self, event: SecurityEvent):
        """Store security event in database"""
        query = """
        INSERT INTO security_events (
            event_id, event_type, timestamp, user_id, source_ip,
            user_agent, resource, action, result, severity,
            details, risk_score
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        with self.db_connection.cursor() as cursor:
            cursor.execute(query, (
                event.event_id,
                event.event_type.value,
                event.timestamp,
                event.user_id,
                event.source_ip,
                event.user_agent,
                event.resource,
                event.action,
                event.result,
                event.severity.value,
                json.dumps(event.details),
                event.risk_score
            ))
            self.db_connection.commit()
    
    async def _cache_event(self, event: SecurityEvent):
        """Cache recent events in Redis for fast analysis"""
        # Store event data
        await self.redis_client.setex(
            f"event:{event.event_id}",
            3600,  # 1 hour TTL
            json.dumps(event.to_dict())
        )
        
        # Add to user activity timeline
        if event.user_id:
            await self.redis_client.lpush(
                f"user_activity:{event.user_id}",
                event.event_id
            )
            await self.redis_client.expire(
                f"user_activity:{event.user_id}",
                86400  # 24 hours
            )
        
        # Add to IP activity timeline
        await self.redis_client.lpush(
            f"ip_activity:{event.source_ip}",
            event.event_id
        )
        await self.redis_client.expire(
            f"ip_activity:{event.source_ip}",
            86400  # 24 hours
        )
    
    async def _analyze_event(self, event: SecurityEvent):
        """Perform real-time event analysis"""
        # Calculate risk score
        risk_score = await self._calculate_risk_score(event)
        event.risk_score = risk_score
        
        # Check for immediate threats
        if risk_score >= self.risk_thresholds['critical']:
            await self._create_alert(
                title="Critical Security Event Detected",
                description=f"High-risk security event: {event.event_type.value}",
                severity=AlertSeverity.CRITICAL,
                event_ids=[event.event_id]
            )
        
        # Check for suspicious patterns
        await self._check_suspicious_patterns(event)
    
    async def _calculate_risk_score(self, event: SecurityEvent) -> float:
        """Calculate risk score for security event"""
        base_score = 0.1
        
        # Event type risk factors
        event_risk_factors = {
            EventType.LOGIN_FAILURE: 0.3,
            EventType.LOGIN_SUCCESS: 0.1,
            EventType.DATA_ACCESS: 0.2,
            EventType.DATA_MODIFICATION: 0.4,
            EventType.PRIVILEGE_ESCALATION: 0.8,
            EventType.CONFIGURATION_CHANGE: 0.6,
            EventType.SECURITY_VIOLATION: 0.9,
            EventType.ANOMALY_DETECTED: 0.7
        }
        
        base_score += event_risk_factors.get(event.event_type, 0.1)
        
        # Time-based risk factors
        current_hour = event.timestamp.hour
        if current_hour < 6 or current_hour > 22:  # Outside business hours
            base_score += 0.2
        
        # IP-based risk factors
        if await self._is_suspicious_ip(event.source_ip):
            base_score += 0.3
        
        # User-based risk factors
        if event.user_id:
            user_risk = await self._get_user_risk_score(event.user_id)
            base_score += user_risk
        
        # Frequency-based risk factors
        frequency_risk = await self._calculate_frequency_risk(event)
        base_score += frequency_risk
        
        return min(base_score, 1.0)
    
    async def _check_suspicious_patterns(self, event: SecurityEvent):
        """Check for suspicious activity patterns"""
        # Multiple failed logins
        if event.event_type == EventType.LOGIN_FAILURE:
            await self._check_brute_force_attack(event)
        
        # Unusual data access patterns
        if event.event_type == EventType.DATA_ACCESS:
            await self._check_unusual_data_access(event)
        
        # Privilege escalation attempts
        if event.event_type == EventType.PRIVILEGE_ESCALATION:
            await self._check_privilege_escalation(event)
    
    async def _check_brute_force_attack(self, event: SecurityEvent):
        """Check for brute force login attacks"""
        # Count failed logins from same IP in last 15 minutes
        recent_failures = await self._count_recent_events(
            event.source_ip,
            EventType.LOGIN_FAILURE,
            timedelta(minutes=15)
        )
        
        if recent_failures >= 5:
            await self._create_alert(
                title="Potential Brute Force Attack",
                description=f"Multiple failed login attempts from IP {event.source_ip}",
                severity=AlertSeverity.HIGH,
                event_ids=[event.event_id]
            )
    
    async def _check_unusual_data_access(self, event: SecurityEvent):
        """Check for unusual data access patterns"""
        if not event.user_id:
            return
        
        # Check if user is accessing data outside normal patterns
        normal_resources = await self._get_user_normal_resources(event.user_id)
        
        if event.resource not in normal_resources:
            # Check if this is a new resource for the user
            recent_access = await self._check_recent_resource_access(
                event.user_id,
                event.resource,
                timedelta(days=30)
            )
            
            if not recent_access:
                await self._create_alert(
                    title="Unusual Data Access Pattern",
                    description=f"User {event.user_id} accessing unusual resource {event.resource}",
                    severity=AlertSeverity.MEDIUM,
                    event_ids=[event.event_id]
                )
    
    async def _detect_anomalies(self, event: SecurityEvent):
        """Detect anomalies using statistical analysis"""
        # Time-based anomaly detection
        await self._detect_time_anomalies(event)
        
        # Volume-based anomaly detection
        await self._detect_volume_anomalies(event)
        
        # Behavioral anomaly detection
        await self._detect_behavioral_anomalies(event)
    
    async def _detect_time_anomalies(self, event: SecurityEvent):
        """Detect time-based anomalies"""
        if not event.user_id:
            return
        
        # Get user's normal activity hours
        normal_hours = await self._get_user_normal_hours(event.user_id)
        current_hour = event.timestamp.hour
        
        if current_hour not in normal_hours:
            await self._create_alert(
                title="Unusual Activity Time",
                description=f"User {event.user_id} active outside normal hours",
                severity=AlertSeverity.MEDIUM,
                event_ids=[event.event_id]
            )
    
    async def _create_alert(self, title: str, description: str, 
                          severity: AlertSeverity, event_ids: List[str]):
        """Create security alert"""
        # Check for alert suppression
        alert_key = hashlib.md5(f"{title}:{description}".encode()).hexdigest()
        
        if alert_key in self.alert_suppression:
            last_alert_time = self.alert_suppression[alert_key]
            if datetime.utcnow() - last_alert_time < self.suppression_window:
                return  # Suppress duplicate alert
        
        # Create new alert
        alert = SecurityAlert(
            alert_id=self._generate_alert_id(),
            title=title,
            description=description,
            severity=severity,
            event_ids=event_ids,
            created_at=datetime.utcnow()
        )
        
        # Store alert
        await self._store_alert(alert)
        
        # Send notifications
        await self._send_alert_notifications(alert)
        
        # Update suppression tracking
        self.alert_suppression[alert_key] = datetime.utcnow()
        
        self.logger.warning(f"Security alert created: {alert.title}")
    
    async def _send_alert_notifications(self, alert: SecurityAlert):
        """Send alert notifications"""
        # Email notifications
        await self._send_email_alert(alert)
        
        # Slack notifications for high/critical alerts
        if alert.severity in [AlertSeverity.HIGH, AlertSeverity.CRITICAL]:
            await self._send_slack_alert(alert)
        
        # SMS notifications for critical alerts
        if alert.severity == AlertSeverity.CRITICAL:
            await self._send_sms_alert(alert)
    
    async def _send_email_alert(self, alert: SecurityAlert):
        """Send email alert notification"""
        try:
            msg = MIMEMultipart()
            msg['From'] = self.config['smtp_from']
            msg['To'] = self.config['security_email']
            msg['Subject'] = f"[{alert.severity.upper()}] {alert.title}"
            
            body = f"""
            Security Alert: {alert.title}
            
            Severity: {alert.severity.upper()}
            Description: {alert.description}
            Created: {alert.created_at.isoformat()}
            Alert ID: {alert.alert_id}
            
            Event IDs: {', '.join(alert.event_ids)}
            
            Please investigate immediately.
            """
            
            msg.attach(MIMEText(body, 'plain'))
            
            server = smtplib.SMTP(self.config['smtp_host'], self.config['smtp_port'])
            server.starttls()
            server.login(self.config['smtp_user'], self.config['smtp_password'])
            server.send_message(msg)
            server.quit()
            
        except Exception as e:
            self.logger.error(f"Failed to send email alert: {e}")
    
    def _generate_event_id(self) -> str:
        """Generate unique event ID"""
        timestamp = str(int(time.time() * 1000))
        random_part = os.urandom(8).hex()
        return f"evt_{timestamp}_{random_part}"
    
    def _generate_alert_id(self) -> str:
        """Generate unique alert ID"""
        timestamp = str(int(time.time() * 1000))
        random_part = os.urandom(8).hex()
        return f"alt_{timestamp}_{random_part}"
    
    async def get_security_metrics(self) -> Dict[str, Any]:
        """Get security monitoring metrics"""
        try:
            # Get event counts by type
            event_counts = await self._get_event_counts_by_type()
            
            # Get alert counts by severity
            alert_counts = await self._get_alert_counts_by_severity()
            
            # Get top risk users
            top_risk_users = await self._get_top_risk_users()
            
            # Get top risk IPs
            top_risk_ips = await self._get_top_risk_ips()
            
            return {
                'event_counts': event_counts,
                'alert_counts': alert_counts,
                'top_risk_users': top_risk_users,
                'top_risk_ips': top_risk_ips,
                'generated_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Failed to get security metrics: {e}")
            return {}
    
    async def close(self):
        """Close monitoring system connections"""
        if self.redis_client:
            await self.redis_client.close()
        
        if self.db_connection:
            self.db_connection.close()
        
        self.logger.info("Security monitoring system closed")

# Example usage and configuration
if __name__ == "__main__":
    config = {
        'redis_url': 'redis://localhost:6379',
        'db_host': 'localhost',
        'db_name': 'medimind_security',
        'db_user': 'security_monitor',
        'db_password': 'secure_password',
        'smtp_host': 'smtp.medimind.ai',
        'smtp_port': 587,
        'smtp_user': 'alerts@medimind.ai',
        'smtp_password': 'smtp_password',
        'smtp_from': 'security@medimind.ai',
        'security_email': 'security-team@medimind.ai'
    }
    
    async def main():
        monitor = SecurityMonitor(config)
        await monitor.initialize()
        
        # Example security event
        event = SecurityEvent(
            event_id=monitor._generate_event_id(),
            event_type=EventType.LOGIN_FAILURE,
            timestamp=datetime.utcnow(),
            user_id="user123",
            source_ip="192.168.1.100",
            user_agent="Mozilla/5.0...",
            resource="/api/auth/login",
            action="login",
            result="failure",
            severity=AlertSeverity.MEDIUM,
            details={"reason": "invalid_password"}
        )
        
        await monitor.log_security_event(event)
        
        # Get metrics
        metrics = await monitor.get_security_metrics()
        print(json.dumps(metrics, indent=2))
        
        await monitor.close()
    
    asyncio.run(main())
