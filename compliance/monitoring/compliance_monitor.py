"""
Comprehensive Compliance Monitoring System for MediMind
Automated compliance checking, audit logging, and regulatory reporting
"""

import logging
import json
import asyncio
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any, Union
from dataclasses import dataclass, field
from enum import Enum
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
from pathlib import Path
import hashlib
import pandas as pd
from collections import defaultdict, deque
import schedule
import threading

logger = logging.getLogger(__name__)

class ComplianceFramework(str, Enum):
    """Supported compliance frameworks"""
    HIPAA = "hipaa"
    SOX = "sox"
    GDPR = "gdpr"
    ISO27001 = "iso27001"
    NIST = "nist"

class ViolationSeverity(str, Enum):
    """Compliance violation severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ComplianceStatus(str, Enum):
    """Compliance status"""
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    PARTIALLY_COMPLIANT = "partially_compliant"
    UNKNOWN = "unknown"

@dataclass
class ComplianceRule:
    """Individual compliance rule definition"""
    rule_id: str
    framework: ComplianceFramework
    category: str
    title: str
    description: str
    severity: ViolationSeverity
    check_function: str
    parameters: Dict[str, Any] = field(default_factory=dict)
    enabled: bool = True
    frequency: str = "daily"  # daily, weekly, monthly, continuous
    
@dataclass
class ComplianceViolation:
    """Compliance violation record"""
    violation_id: str
    rule_id: str
    framework: ComplianceFramework
    severity: ViolationSeverity
    title: str
    description: str
    details: Dict[str, Any]
    detected_at: datetime
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    status: str = "open"
    
@dataclass
class AuditEvent:
    """Audit event for compliance tracking"""
    event_id: str
    event_type: str
    user_id: Optional[str]
    resource: str
    action: str
    timestamp: datetime
    source_ip: str
    user_agent: Optional[str]
    result: str
    details: Dict[str, Any] = field(default_factory=dict)

class ComplianceMonitor:
    """
    Comprehensive compliance monitoring system
    """
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize compliance monitor"""
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # Database connections
        self.db_connection = None
        self.redis_client = None
        
        # Compliance rules registry
        self.rules = {}
        self.rule_schedules = {}
        
        # Violation tracking
        self.violations = deque(maxlen=10000)
        self.violation_counts = defaultdict(int)
        
        # Audit logging
        self.audit_buffer = deque(maxlen=1000)
        self.audit_flush_interval = 60  # seconds
        
        # Monitoring state
        self.monitoring_active = False
        self.last_check_times = {}
        
        # Notification settings
        self.notification_settings = config.get('notifications', {})
        
    async def initialize(self):
        """Initialize compliance monitoring system"""
        try:
            # Initialize database connection
            self.db_connection = psycopg2.connect(
                host=self.config['db_host'],
                database=self.config['db_name'],
                user=self.config['db_user'],
                password=self.config['db_password']
            )
            
            # Initialize Redis connection
            redis_config = self.config.get('redis', {})
            self.redis_client = redis.Redis(
                host=redis_config.get('host', 'localhost'),
                port=redis_config.get('port', 6379),
                db=redis_config.get('db', 0)
            )
            
            # Load compliance rules
            await self._load_compliance_rules()
            
            # Initialize database schema
            await self._initialize_schema()
            
            # Start background tasks
            asyncio.create_task(self._audit_log_flusher())
            asyncio.create_task(self._continuous_monitoring())
            asyncio.create_task(self._scheduled_checks())
            
            self.monitoring_active = True
            self.logger.info("Compliance monitoring system initialized")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize compliance monitor: {e}")
            raise
    
    async def log_audit_event(self, event: AuditEvent):
        """Log audit event for compliance tracking"""
        try:
            # Add to buffer
            self.audit_buffer.append(event)
            
            # Immediate compliance checks for critical events
            if event.event_type in ['data_access', 'data_modification', 'privilege_escalation']:
                await self._check_event_compliance(event)
            
            # Cache recent events for real-time analysis
            await self._cache_audit_event(event)
            
        except Exception as e:
            self.logger.error(f"Failed to log audit event: {e}")
    
    async def check_compliance(self, framework: Optional[ComplianceFramework] = None) -> Dict[str, Any]:
        """
        Perform comprehensive compliance check
        
        Args:
            framework: Specific framework to check (optional)
            
        Returns:
            Compliance assessment results
        """
        try:
            results = {
                'timestamp': datetime.utcnow().isoformat(),
                'frameworks': {},
                'overall_status': ComplianceStatus.COMPLIANT,
                'violations': [],
                'recommendations': []
            }
            
            # Determine frameworks to check
            frameworks_to_check = [framework] if framework else list(ComplianceFramework)
            
            for fw in frameworks_to_check:
                framework_results = await self._check_framework_compliance(fw)
                results['frameworks'][fw.value] = framework_results
                
                # Update overall status
                if framework_results['status'] == ComplianceStatus.NON_COMPLIANT:
                    results['overall_status'] = ComplianceStatus.NON_COMPLIANT
                elif (framework_results['status'] == ComplianceStatus.PARTIALLY_COMPLIANT and 
                      results['overall_status'] == ComplianceStatus.COMPLIANT):
                    results['overall_status'] = ComplianceStatus.PARTIALLY_COMPLIANT
                
                # Collect violations
                results['violations'].extend(framework_results.get('violations', []))
            
            # Generate recommendations
            results['recommendations'] = await self._generate_recommendations(results)
            
            # Store results
            await self._store_compliance_results(results)
            
            return results
            
        except Exception as e:
            self.logger.error(f"Compliance check failed: {e}")
            raise
    
    async def _check_framework_compliance(self, framework: ComplianceFramework) -> Dict[str, Any]:
        """Check compliance for specific framework"""
        framework_rules = [rule for rule in self.rules.values() 
                          if rule.framework == framework and rule.enabled]
        
        results = {
            'framework': framework.value,
            'total_rules': len(framework_rules),
            'compliant_rules': 0,
            'violations': [],
            'status': ComplianceStatus.COMPLIANT
        }
        
        for rule in framework_rules:
            try:
                # Execute compliance check
                is_compliant, violation_details = await self._execute_rule_check(rule)
                
                if is_compliant:
                    results['compliant_rules'] += 1
                else:
                    # Create violation record
                    violation = ComplianceViolation(
                        violation_id=self._generate_violation_id(),
                        rule_id=rule.rule_id,
                        framework=framework,
                        severity=rule.severity,
                        title=rule.title,
                        description=rule.description,
                        details=violation_details,
                        detected_at=datetime.utcnow()
                    )
                    
                    results['violations'].append(violation)
                    await self._handle_violation(violation)
                    
            except Exception as e:
                self.logger.error(f"Failed to check rule {rule.rule_id}: {e}")
        
        # Determine framework compliance status
        compliance_percentage = results['compliant_rules'] / results['total_rules']
        if compliance_percentage == 1.0:
            results['status'] = ComplianceStatus.COMPLIANT
        elif compliance_percentage >= 0.8:
            results['status'] = ComplianceStatus.PARTIALLY_COMPLIANT
        else:
            results['status'] = ComplianceStatus.NON_COMPLIANT
        
        return results
    
    async def _execute_rule_check(self, rule: ComplianceRule) -> Tuple[bool, Dict[str, Any]]:
        """Execute individual compliance rule check"""
        check_function = getattr(self, rule.check_function, None)
        if not check_function:
            raise ValueError(f"Check function {rule.check_function} not found")
        
        return await check_function(rule.parameters)
    
    # HIPAA Compliance Checks
    async def check_encryption_at_rest(self, params: Dict[str, Any]) -> Tuple[bool, Dict[str, Any]]:
        """Check if data is encrypted at rest"""
        try:
            # Query database encryption status
            with self.db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    SELECT schemaname, tablename, 
                           pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
                    FROM pg_tables 
                    WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
                """)
                tables = cursor.fetchall()
            
            # Check encryption configuration
            unencrypted_tables = []
            for table in tables:
                # This is a simplified check - in practice, you'd check actual encryption status
                if 'encrypted' not in table['tablename'].lower():
                    unencrypted_tables.append(table['tablename'])
            
            is_compliant = len(unencrypted_tables) == 0
            details = {
                'total_tables': len(tables),
                'unencrypted_tables': unencrypted_tables,
                'check_timestamp': datetime.utcnow().isoformat()
            }
            
            return is_compliant, details
            
        except Exception as e:
            return False, {'error': str(e)}
    
    async def check_access_logging(self, params: Dict[str, Any]) -> Tuple[bool, Dict[str, Any]]:
        """Check if all access is properly logged"""
        try:
            # Check audit log completeness
            with self.db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
                # Check for recent audit entries
                cursor.execute("""
                    SELECT COUNT(*) as log_count
                    FROM audit_logs 
                    WHERE timestamp >= NOW() - INTERVAL '24 hours'
                """)
                result = cursor.fetchone()
                log_count = result['log_count'] if result else 0
            
            # Check for gaps in logging
            expected_minimum = params.get('minimum_daily_logs', 100)
            is_compliant = log_count >= expected_minimum
            
            details = {
                'daily_log_count': log_count,
                'expected_minimum': expected_minimum,
                'check_timestamp': datetime.utcnow().isoformat()
            }
            
            return is_compliant, details
            
        except Exception as e:
            return False, {'error': str(e)}
    
    async def check_user_access_reviews(self, params: Dict[str, Any]) -> Tuple[bool, Dict[str, Any]]:
        """Check if user access reviews are conducted regularly"""
        try:
            # Check last access review date
            with self.db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    SELECT MAX(review_date) as last_review
                    FROM access_reviews
                """)
                result = cursor.fetchone()
                last_review = result['last_review'] if result else None
            
            if not last_review:
                return False, {'error': 'No access reviews found'}
            
            # Check if review is within required timeframe
            review_frequency_days = params.get('review_frequency_days', 90)
            days_since_review = (datetime.utcnow().date() - last_review).days
            is_compliant = days_since_review <= review_frequency_days
            
            details = {
                'last_review_date': last_review.isoformat(),
                'days_since_review': days_since_review,
                'required_frequency_days': review_frequency_days,
                'check_timestamp': datetime.utcnow().isoformat()
            }
            
            return is_compliant, details
            
        except Exception as e:
            return False, {'error': str(e)}
    
    async def check_data_backup_encryption(self, params: Dict[str, Any]) -> Tuple[bool, Dict[str, Any]]:
        """Check if data backups are encrypted"""
        try:
            # Check backup encryption status
            backup_locations = params.get('backup_locations', [])
            unencrypted_backups = []
            
            for location in backup_locations:
                # This would typically check actual backup encryption status
                # For demo purposes, we'll simulate the check
                if 'encrypted' not in location.lower():
                    unencrypted_backups.append(location)
            
            is_compliant = len(unencrypted_backups) == 0
            details = {
                'total_backup_locations': len(backup_locations),
                'unencrypted_backups': unencrypted_backups,
                'check_timestamp': datetime.utcnow().isoformat()
            }
            
            return is_compliant, details
            
        except Exception as e:
            return False, {'error': str(e)}
    
    # GDPR Compliance Checks
    async def check_data_retention_policy(self, params: Dict[str, Any]) -> Tuple[bool, Dict[str, Any]]:
        """Check data retention policy compliance"""
        try:
            # Check for data older than retention period
            retention_days = params.get('retention_days', 2555)  # 7 years default
            
            with self.db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    SELECT COUNT(*) as old_records
                    FROM patient_data 
                    WHERE created_at < NOW() - INTERVAL '%s days'
                """, (retention_days,))
                result = cursor.fetchone()
                old_records = result['old_records'] if result else 0
            
            is_compliant = old_records == 0
            details = {
                'retention_period_days': retention_days,
                'records_exceeding_retention': old_records,
                'check_timestamp': datetime.utcnow().isoformat()
            }
            
            return is_compliant, details
            
        except Exception as e:
            return False, {'error': str(e)}
    
    async def check_consent_management(self, params: Dict[str, Any]) -> Tuple[bool, Dict[str, Any]]:
        """Check consent management compliance"""
        try:
            # Check for users without valid consent
            with self.db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    SELECT COUNT(*) as users_without_consent
                    FROM users u
                    LEFT JOIN user_consents uc ON u.id = uc.user_id
                    WHERE uc.consent_date IS NULL OR uc.consent_withdrawn = true
                """)
                result = cursor.fetchone()
                users_without_consent = result['users_without_consent'] if result else 0
            
            is_compliant = users_without_consent == 0
            details = {
                'users_without_valid_consent': users_without_consent,
                'check_timestamp': datetime.utcnow().isoformat()
            }
            
            return is_compliant, details
            
        except Exception as e:
            return False, {'error': str(e)}
    
    async def _handle_violation(self, violation: ComplianceViolation):
        """Handle compliance violation"""
        # Store violation
        await self._store_violation(violation)
        
        # Send notifications based on severity
        if violation.severity in [ViolationSeverity.HIGH, ViolationSeverity.CRITICAL]:
            await self._send_violation_notification(violation)
        
        # Update violation counts
        self.violation_counts[violation.framework] += 1
        
        # Log violation
        self.logger.warning(
            f"Compliance violation detected: {violation.title} "
            f"({violation.framework.value}, {violation.severity.value})"
        )
    
    async def _send_violation_notification(self, violation: ComplianceViolation):
        """Send notification for compliance violation"""
        try:
            # Email notification
            if self.notification_settings.get('email_enabled', False):
                await self._send_email_notification(violation)
            
            # Slack notification
            if self.notification_settings.get('slack_enabled', False):
                await self._send_slack_notification(violation)
            
        except Exception as e:
            self.logger.error(f"Failed to send violation notification: {e}")
    
    async def _send_email_notification(self, violation: ComplianceViolation):
        """Send email notification for violation"""
        try:
            msg = MIMEMultipart()
            msg['From'] = self.notification_settings['email_from']
            msg['To'] = self.notification_settings['compliance_email']
            msg['Subject'] = f"[{violation.severity.upper()}] Compliance Violation: {violation.title}"
            
            body = f"""
            Compliance Violation Detected
            
            Framework: {violation.framework.value.upper()}
            Severity: {violation.severity.upper()}
            Rule: {violation.title}
            Description: {violation.description}
            Detected: {violation.detected_at.isoformat()}
            
            Details: {json.dumps(violation.details, indent=2)}
            
            Please investigate and remediate immediately.
            """
            
            msg.attach(MIMEText(body, 'plain'))
            
            server = smtplib.SMTP(
                self.notification_settings['smtp_host'],
                self.notification_settings['smtp_port']
            )
            server.starttls()
            server.login(
                self.notification_settings['smtp_user'],
                self.notification_settings['smtp_password']
            )
            server.send_message(msg)
            server.quit()
            
        except Exception as e:
            self.logger.error(f"Failed to send email notification: {e}")
    
    def _generate_violation_id(self) -> str:
        """Generate unique violation ID"""
        timestamp = str(int(time.time() * 1000))
        random_part = hashlib.md5(f"{timestamp}{time.time()}".encode()).hexdigest()[:8]
        return f"viol_{timestamp}_{random_part}"
    
    async def get_compliance_dashboard(self) -> Dict[str, Any]:
        """Get compliance dashboard data"""
        try:
            dashboard = {
                'timestamp': datetime.utcnow().isoformat(),
                'frameworks': {},
                'recent_violations': [],
                'metrics': {}
            }
            
            # Get framework status
            for framework in ComplianceFramework:
                framework_status = await self._get_framework_status(framework)
                dashboard['frameworks'][framework.value] = framework_status
            
            # Get recent violations
            dashboard['recent_violations'] = await self._get_recent_violations(limit=10)
            
            # Get metrics
            dashboard['metrics'] = await self._get_compliance_metrics()
            
            return dashboard
            
        except Exception as e:
            self.logger.error(f"Failed to get compliance dashboard: {e}")
            return {}
    
    async def _load_compliance_rules(self):
        """Load compliance rules from configuration"""
        rules_config = self.config.get('compliance_rules', {})
        
        # HIPAA Rules
        hipaa_rules = [
            ComplianceRule(
                rule_id="hipaa_001",
                framework=ComplianceFramework.HIPAA,
                category="Technical Safeguards",
                title="Data Encryption at Rest",
                description="All ePHI must be encrypted at rest",
                severity=ViolationSeverity.HIGH,
                check_function="check_encryption_at_rest"
            ),
            ComplianceRule(
                rule_id="hipaa_002",
                framework=ComplianceFramework.HIPAA,
                category="Administrative Safeguards",
                title="Access Logging",
                description="All access to ePHI must be logged",
                severity=ViolationSeverity.HIGH,
                check_function="check_access_logging"
            ),
            ComplianceRule(
                rule_id="hipaa_003",
                framework=ComplianceFramework.HIPAA,
                category="Administrative Safeguards",
                title="User Access Reviews",
                description="Regular review of user access rights",
                severity=ViolationSeverity.MEDIUM,
                check_function="check_user_access_reviews"
            )
        ]
        
        # GDPR Rules
        gdpr_rules = [
            ComplianceRule(
                rule_id="gdpr_001",
                framework=ComplianceFramework.GDPR,
                category="Data Protection",
                title="Data Retention Policy",
                description="Personal data must not be kept longer than necessary",
                severity=ViolationSeverity.HIGH,
                check_function="check_data_retention_policy"
            ),
            ComplianceRule(
                rule_id="gdpr_002",
                framework=ComplianceFramework.GDPR,
                category="Consent Management",
                title="Valid Consent",
                description="All data processing must have valid consent",
                severity=ViolationSeverity.HIGH,
                check_function="check_consent_management"
            )
        ]
        
        # Register all rules
        all_rules = hipaa_rules + gdpr_rules
        for rule in all_rules:
            self.rules[rule.rule_id] = rule
    
    async def shutdown(self):
        """Shutdown compliance monitoring system"""
        self.monitoring_active = False
        
        if self.db_connection:
            self.db_connection.close()
        
        if self.redis_client:
            self.redis_client.close()
        
        self.logger.info("Compliance monitoring system shutdown complete")

    async def _audit_log_flusher(self):
        """Background task to flush audit logs to database"""
        while self.monitoring_active:
            try:
                if self.audit_buffer:
                    # Get batch of events to flush
                    events_to_flush = []
                    while self.audit_buffer and len(events_to_flush) < 100:
                        events_to_flush.append(self.audit_buffer.popleft())

                    # Flush to database
                    await self._flush_audit_events(events_to_flush)

                await asyncio.sleep(self.audit_flush_interval)

            except Exception as e:
                self.logger.error(f"Error flushing audit logs: {e}")

    async def _flush_audit_events(self, events: List[AuditEvent]):
        """Flush audit events to database"""
        try:
            with self.db_connection.cursor() as cursor:
                for event in events:
                    cursor.execute("""
                        INSERT INTO audit_logs (
                            event_id, event_type, user_id, resource, action,
                            timestamp, source_ip, user_agent, result, details
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        event.event_id,
                        event.event_type,
                        event.user_id,
                        event.resource,
                        event.action,
                        event.timestamp,
                        event.source_ip,
                        event.user_agent,
                        event.result,
                        json.dumps(event.details)
                    ))

                self.db_connection.commit()
                self.logger.debug(f"Flushed {len(events)} audit events to database")

        except Exception as e:
            self.logger.error(f"Failed to flush audit events: {e}")
            # Re-add events to buffer for retry
            self.audit_buffer.extendleft(reversed(events))

    async def _cache_audit_event(self, event: AuditEvent):
        """Cache audit event in Redis for real-time analysis"""
        try:
            # Store event data
            event_data = {
                'event_id': event.event_id,
                'event_type': event.event_type,
                'user_id': event.user_id,
                'resource': event.resource,
                'action': event.action,
                'timestamp': event.timestamp.isoformat(),
                'source_ip': event.source_ip,
                'result': event.result
            }

            # Cache with TTL
            self.redis_client.setex(
                f"audit_event:{event.event_id}",
                3600,  # 1 hour TTL
                json.dumps(event_data)
            )

            # Add to user activity timeline
            if event.user_id:
                self.redis_client.lpush(
                    f"user_audit:{event.user_id}",
                    event.event_id
                )
                self.redis_client.expire(f"user_audit:{event.user_id}", 86400)

        except Exception as e:
            self.logger.error(f"Failed to cache audit event: {e}")

    async def _check_event_compliance(self, event: AuditEvent):
        """Check compliance for specific audit event"""
        try:
            # Check for suspicious patterns
            if event.event_type == 'data_access':
                await self._check_data_access_compliance(event)
            elif event.event_type == 'privilege_escalation':
                await self._check_privilege_escalation_compliance(event)

        except Exception as e:
            self.logger.error(f"Failed to check event compliance: {e}")

    async def _check_data_access_compliance(self, event: AuditEvent):
        """Check data access compliance"""
        # Check if access is during business hours
        if event.timestamp.hour < 6 or event.timestamp.hour > 22:
            violation = ComplianceViolation(
                violation_id=self._generate_violation_id(),
                rule_id="custom_001",
                framework=ComplianceFramework.HIPAA,
                severity=ViolationSeverity.MEDIUM,
                title="After-hours Data Access",
                description="Data access outside business hours detected",
                details={
                    'event_id': event.event_id,
                    'user_id': event.user_id,
                    'access_time': event.timestamp.isoformat(),
                    'resource': event.resource
                },
                detected_at=datetime.utcnow()
            )
            await self._handle_violation(violation)

    async def _continuous_monitoring(self):
        """Continuous compliance monitoring"""
        while self.monitoring_active:
            try:
                # Check for real-time violations
                await self._check_real_time_violations()

                # Update metrics
                await self._update_monitoring_metrics()

                await asyncio.sleep(30)  # Check every 30 seconds

            except Exception as e:
                self.logger.error(f"Error in continuous monitoring: {e}")

    async def _scheduled_checks(self):
        """Run scheduled compliance checks"""
        while self.monitoring_active:
            try:
                current_time = datetime.utcnow()

                for rule in self.rules.values():
                    if not rule.enabled:
                        continue

                    last_check = self.last_check_times.get(rule.rule_id)

                    # Determine if check is due
                    check_due = False
                    if not last_check:
                        check_due = True
                    elif rule.frequency == 'daily':
                        check_due = (current_time - last_check).days >= 1
                    elif rule.frequency == 'weekly':
                        check_due = (current_time - last_check).days >= 7
                    elif rule.frequency == 'monthly':
                        check_due = (current_time - last_check).days >= 30

                    if check_due:
                        try:
                            is_compliant, details = await self._execute_rule_check(rule)
                            self.last_check_times[rule.rule_id] = current_time

                            if not is_compliant:
                                violation = ComplianceViolation(
                                    violation_id=self._generate_violation_id(),
                                    rule_id=rule.rule_id,
                                    framework=rule.framework,
                                    severity=rule.severity,
                                    title=rule.title,
                                    description=rule.description,
                                    details=details,
                                    detected_at=current_time
                                )
                                await self._handle_violation(violation)

                        except Exception as e:
                            self.logger.error(f"Failed to execute scheduled check for {rule.rule_id}: {e}")

                await asyncio.sleep(300)  # Check every 5 minutes

            except Exception as e:
                self.logger.error(f"Error in scheduled checks: {e}")

    async def _initialize_schema(self):
        """Initialize database schema for compliance monitoring"""
        try:
            with self.db_connection.cursor() as cursor:
                # Create audit_logs table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS audit_logs (
                        id SERIAL PRIMARY KEY,
                        event_id VARCHAR(255) UNIQUE NOT NULL,
                        event_type VARCHAR(100) NOT NULL,
                        user_id VARCHAR(255),
                        resource VARCHAR(500) NOT NULL,
                        action VARCHAR(100) NOT NULL,
                        timestamp TIMESTAMP NOT NULL,
                        source_ip INET,
                        user_agent TEXT,
                        result VARCHAR(50) NOT NULL,
                        details JSONB,
                        created_at TIMESTAMP DEFAULT NOW()
                    )
                """)

                # Create compliance_violations table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS compliance_violations (
                        id SERIAL PRIMARY KEY,
                        violation_id VARCHAR(255) UNIQUE NOT NULL,
                        rule_id VARCHAR(100) NOT NULL,
                        framework VARCHAR(50) NOT NULL,
                        severity VARCHAR(20) NOT NULL,
                        title VARCHAR(500) NOT NULL,
                        description TEXT,
                        details JSONB,
                        detected_at TIMESTAMP NOT NULL,
                        resolved_at TIMESTAMP,
                        resolved_by VARCHAR(255),
                        status VARCHAR(20) DEFAULT 'open',
                        created_at TIMESTAMP DEFAULT NOW()
                    )
                """)

                # Create access_reviews table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS access_reviews (
                        id SERIAL PRIMARY KEY,
                        review_id VARCHAR(255) UNIQUE NOT NULL,
                        review_date DATE NOT NULL,
                        reviewer_id VARCHAR(255) NOT NULL,
                        scope VARCHAR(500),
                        findings JSONB,
                        created_at TIMESTAMP DEFAULT NOW()
                    )
                """)

                # Create user_consents table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS user_consents (
                        id SERIAL PRIMARY KEY,
                        user_id VARCHAR(255) NOT NULL,
                        consent_type VARCHAR(100) NOT NULL,
                        consent_date TIMESTAMP NOT NULL,
                        consent_withdrawn BOOLEAN DEFAULT FALSE,
                        withdrawal_date TIMESTAMP,
                        created_at TIMESTAMP DEFAULT NOW()
                    )
                """)

                # Create indexes
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp)")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type)")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_violations_detected_at ON compliance_violations(detected_at)")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_violations_framework ON compliance_violations(framework)")

                self.db_connection.commit()
                self.logger.info("Database schema initialized for compliance monitoring")

        except Exception as e:
            self.logger.error(f"Failed to initialize database schema: {e}")
            raise
