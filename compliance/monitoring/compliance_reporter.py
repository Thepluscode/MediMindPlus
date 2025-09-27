"""
Compliance Reporting System for MediMind
Generate comprehensive compliance reports for regulatory requirements
"""

import logging
import json
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from pathlib import Path
import matplotlib.pyplot as plt
import seaborn as sns
from jinja2 import Template
import pdfkit
from io import BytesIO
import base64
import psycopg2
from psycopg2.extras import RealDictCursor

logger = logging.getLogger(__name__)

@dataclass
class ComplianceReport:
    """Compliance report structure"""
    report_id: str
    report_type: str
    framework: str
    period_start: datetime
    period_end: datetime
    generated_at: datetime
    generated_by: str
    summary: Dict[str, Any]
    findings: List[Dict[str, Any]]
    recommendations: List[str]
    attachments: List[str]

class ComplianceReporter:
    """
    Comprehensive compliance reporting system
    """
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize compliance reporter"""
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # Database connection
        self.db_connection = psycopg2.connect(
            host=config['db_host'],
            database=config['db_name'],
            user=config['db_user'],
            password=config['db_password']
        )
        
        # Report templates
        self.templates_dir = Path(config.get('templates_dir', 'templates'))
        self.reports_dir = Path(config.get('reports_dir', 'reports'))
        self.reports_dir.mkdir(exist_ok=True)
        
        # Visualization settings
        plt.style.use('seaborn-v0_8')
        sns.set_palette("husl")
    
    def generate_hipaa_compliance_report(self, period_days: int = 30) -> ComplianceReport:
        """Generate HIPAA compliance report"""
        try:
            period_end = datetime.utcnow()
            period_start = period_end - timedelta(days=period_days)
            
            # Collect HIPAA compliance data
            summary = self._get_hipaa_summary(period_start, period_end)
            findings = self._get_hipaa_findings(period_start, period_end)
            recommendations = self._get_hipaa_recommendations(findings)
            
            # Generate visualizations
            charts = self._generate_hipaa_charts(summary, findings)
            
            # Create report
            report = ComplianceReport(
                report_id=self._generate_report_id("HIPAA"),
                report_type="HIPAA Compliance Assessment",
                framework="HIPAA",
                period_start=period_start,
                period_end=period_end,
                generated_at=datetime.utcnow(),
                generated_by="Compliance Monitoring System",
                summary=summary,
                findings=findings,
                recommendations=recommendations,
                attachments=charts
            )
            
            # Generate PDF report
            pdf_path = self._generate_pdf_report(report)
            report.attachments.append(pdf_path)
            
            # Store report
            self._store_report(report)
            
            self.logger.info(f"HIPAA compliance report generated: {report.report_id}")
            return report
            
        except Exception as e:
            self.logger.error(f"Failed to generate HIPAA compliance report: {e}")
            raise
    
    def generate_gdpr_compliance_report(self, period_days: int = 30) -> ComplianceReport:
        """Generate GDPR compliance report"""
        try:
            period_end = datetime.utcnow()
            period_start = period_end - timedelta(days=period_days)
            
            # Collect GDPR compliance data
            summary = self._get_gdpr_summary(period_start, period_end)
            findings = self._get_gdpr_findings(period_start, period_end)
            recommendations = self._get_gdpr_recommendations(findings)
            
            # Generate visualizations
            charts = self._generate_gdpr_charts(summary, findings)
            
            # Create report
            report = ComplianceReport(
                report_id=self._generate_report_id("GDPR"),
                report_type="GDPR Compliance Assessment",
                framework="GDPR",
                period_start=period_start,
                period_end=period_end,
                generated_at=datetime.utcnow(),
                generated_by="Compliance Monitoring System",
                summary=summary,
                findings=findings,
                recommendations=recommendations,
                attachments=charts
            )
            
            # Generate PDF report
            pdf_path = self._generate_pdf_report(report)
            report.attachments.append(pdf_path)
            
            # Store report
            self._store_report(report)
            
            self.logger.info(f"GDPR compliance report generated: {report.report_id}")
            return report
            
        except Exception as e:
            self.logger.error(f"Failed to generate GDPR compliance report: {e}")
            raise
    
    def _get_hipaa_summary(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get HIPAA compliance summary"""
        with self.db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
            # Get violation counts by severity
            cursor.execute("""
                SELECT severity, COUNT(*) as count
                FROM compliance_violations
                WHERE framework = 'hipaa' 
                AND detected_at BETWEEN %s AND %s
                GROUP BY severity
            """, (start_date, end_date))
            violations_by_severity = {row['severity']: row['count'] for row in cursor.fetchall()}
            
            # Get total audit events
            cursor.execute("""
                SELECT COUNT(*) as total_events
                FROM audit_logs
                WHERE timestamp BETWEEN %s AND %s
            """, (start_date, end_date))
            total_events = cursor.fetchone()['total_events']
            
            # Get data access events
            cursor.execute("""
                SELECT COUNT(*) as data_access_events
                FROM audit_logs
                WHERE event_type = 'data_access'
                AND timestamp BETWEEN %s AND %s
            """, (start_date, end_date))
            data_access_events = cursor.fetchone()['data_access_events']
            
            # Calculate compliance score
            total_violations = sum(violations_by_severity.values())
            compliance_score = max(0, 100 - (total_violations * 5))  # Simplified scoring
            
            return {
                'compliance_score': compliance_score,
                'total_violations': total_violations,
                'violations_by_severity': violations_by_severity,
                'total_audit_events': total_events,
                'data_access_events': data_access_events,
                'period_start': start_date.isoformat(),
                'period_end': end_date.isoformat()
            }
    
    def _get_hipaa_findings(self, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Get HIPAA compliance findings"""
        findings = []
        
        with self.db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
            # Get recent violations
            cursor.execute("""
                SELECT violation_id, rule_id, severity, title, description, 
                       details, detected_at, status
                FROM compliance_violations
                WHERE framework = 'hipaa'
                AND detected_at BETWEEN %s AND %s
                ORDER BY detected_at DESC
                LIMIT 50
            """, (start_date, end_date))
            
            for row in cursor.fetchall():
                findings.append({
                    'violation_id': row['violation_id'],
                    'rule_id': row['rule_id'],
                    'severity': row['severity'],
                    'title': row['title'],
                    'description': row['description'],
                    'details': row['details'],
                    'detected_at': row['detected_at'].isoformat(),
                    'status': row['status']
                })
        
        return findings
    
    def _get_hipaa_recommendations(self, findings: List[Dict[str, Any]]) -> List[str]:
        """Generate HIPAA recommendations based on findings"""
        recommendations = []
        
        # Analyze findings and generate recommendations
        high_severity_count = len([f for f in findings if f['severity'] == 'high'])
        critical_severity_count = len([f for f in findings if f['severity'] == 'critical'])
        
        if critical_severity_count > 0:
            recommendations.append(
                "Immediate action required: Address all critical HIPAA violations within 24 hours"
            )
        
        if high_severity_count > 5:
            recommendations.append(
                "Conduct comprehensive security assessment to identify systemic issues"
            )
        
        # Check for specific violation patterns
        encryption_violations = [f for f in findings if 'encryption' in f['title'].lower()]
        if encryption_violations:
            recommendations.append(
                "Review and strengthen data encryption policies and implementation"
            )
        
        access_violations = [f for f in findings if 'access' in f['title'].lower()]
        if access_violations:
            recommendations.append(
                "Enhance access control procedures and conduct user access review"
            )
        
        if not recommendations:
            recommendations.append("Continue current compliance monitoring practices")
        
        return recommendations
    
    def _generate_hipaa_charts(self, summary: Dict[str, Any], 
                              findings: List[Dict[str, Any]]) -> List[str]:
        """Generate HIPAA compliance charts"""
        charts = []
        
        # Violations by severity pie chart
        if summary['violations_by_severity']:
            plt.figure(figsize=(10, 6))
            
            severities = list(summary['violations_by_severity'].keys())
            counts = list(summary['violations_by_severity'].values())
            colors = ['#ff4444', '#ff8800', '#ffcc00', '#44ff44']
            
            plt.pie(counts, labels=severities, colors=colors[:len(severities)], autopct='%1.1f%%')
            plt.title('HIPAA Violations by Severity')
            
            chart_path = self.reports_dir / f"hipaa_violations_severity_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
            plt.savefig(chart_path, dpi=300, bbox_inches='tight')
            plt.close()
            charts.append(str(chart_path))
        
        # Compliance score gauge
        plt.figure(figsize=(8, 6))
        score = summary['compliance_score']
        
        # Create gauge chart
        fig, ax = plt.subplots(figsize=(8, 6))
        
        # Define score ranges and colors
        if score >= 90:
            color = '#44ff44'
            status = 'Excellent'
        elif score >= 80:
            color = '#ffcc00'
            status = 'Good'
        elif score >= 70:
            color = '#ff8800'
            status = 'Fair'
        else:
            color = '#ff4444'
            status = 'Poor'
        
        # Create bar chart as gauge
        ax.barh(0, score, color=color, height=0.3)
        ax.set_xlim(0, 100)
        ax.set_ylim(-0.5, 0.5)
        ax.set_xlabel('Compliance Score')
        ax.set_title(f'HIPAA Compliance Score: {score}% ({status})')
        ax.set_yticks([])
        
        chart_path = self.reports_dir / f"hipaa_compliance_score_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
        plt.savefig(chart_path, dpi=300, bbox_inches='tight')
        plt.close()
        charts.append(str(chart_path))
        
        return charts
    
    def _get_gdpr_summary(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get GDPR compliance summary"""
        with self.db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
            # Get data subject requests
            cursor.execute("""
                SELECT COUNT(*) as total_requests
                FROM data_subject_requests
                WHERE created_at BETWEEN %s AND %s
            """, (start_date, end_date))
            total_requests = cursor.fetchone()['total_requests'] or 0
            
            # Get consent status
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_users,
                    COUNT(CASE WHEN consent_withdrawn = false THEN 1 END) as consented_users
                FROM user_consents
            """)
            consent_data = cursor.fetchone()
            
            return {
                'data_subject_requests': total_requests,
                'total_users': consent_data['total_users'] or 0,
                'consented_users': consent_data['consented_users'] or 0,
                'consent_rate': (consent_data['consented_users'] / max(consent_data['total_users'], 1)) * 100,
                'period_start': start_date.isoformat(),
                'period_end': end_date.isoformat()
            }
    
    def _get_gdpr_findings(self, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Get GDPR compliance findings"""
        findings = []
        
        with self.db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                SELECT violation_id, rule_id, severity, title, description, 
                       details, detected_at, status
                FROM compliance_violations
                WHERE framework = 'gdpr'
                AND detected_at BETWEEN %s AND %s
                ORDER BY detected_at DESC
                LIMIT 50
            """, (start_date, end_date))
            
            for row in cursor.fetchall():
                findings.append({
                    'violation_id': row['violation_id'],
                    'rule_id': row['rule_id'],
                    'severity': row['severity'],
                    'title': row['title'],
                    'description': row['description'],
                    'details': row['details'],
                    'detected_at': row['detected_at'].isoformat(),
                    'status': row['status']
                })
        
        return findings
    
    def _get_gdpr_recommendations(self, findings: List[Dict[str, Any]]) -> List[str]:
        """Generate GDPR recommendations"""
        recommendations = []
        
        retention_violations = [f for f in findings if 'retention' in f['title'].lower()]
        if retention_violations:
            recommendations.append(
                "Review and implement data retention policies to ensure compliance with GDPR Article 5"
            )
        
        consent_violations = [f for f in findings if 'consent' in f['title'].lower()]
        if consent_violations:
            recommendations.append(
                "Enhance consent management system to ensure valid consent for all data processing"
            )
        
        if not recommendations:
            recommendations.append("Continue monitoring GDPR compliance requirements")
        
        return recommendations
    
    def _generate_gdpr_charts(self, summary: Dict[str, Any], 
                             findings: List[Dict[str, Any]]) -> List[str]:
        """Generate GDPR compliance charts"""
        charts = []
        
        # Consent rate chart
        plt.figure(figsize=(8, 6))
        consent_rate = summary['consent_rate']
        
        labels = ['Consented', 'Not Consented']
        sizes = [consent_rate, 100 - consent_rate]
        colors = ['#44ff44', '#ff4444']
        
        plt.pie(sizes, labels=labels, colors=colors, autopct='%1.1f%%')
        plt.title('GDPR Consent Rate')
        
        chart_path = self.reports_dir / f"gdpr_consent_rate_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
        plt.savefig(chart_path, dpi=300, bbox_inches='tight')
        plt.close()
        charts.append(str(chart_path))
        
        return charts
    
    def _generate_pdf_report(self, report: ComplianceReport) -> str:
        """Generate PDF report"""
        try:
            # Load HTML template
            template_path = self.templates_dir / "compliance_report_template.html"
            if not template_path.exists():
                # Create basic template if not exists
                self._create_default_template()
            
            with open(template_path, 'r') as f:
                template_content = f.read()
            
            template = Template(template_content)
            
            # Render HTML
            html_content = template.render(report=report)
            
            # Generate PDF
            pdf_path = self.reports_dir / f"{report.report_id}.pdf"
            pdfkit.from_string(html_content, str(pdf_path))
            
            return str(pdf_path)
            
        except Exception as e:
            self.logger.error(f"Failed to generate PDF report: {e}")
            return ""
    
    def _create_default_template(self):
        """Create default HTML template for reports"""
        template_content = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>{{ report.report_type }}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                .header { text-align: center; margin-bottom: 30px; }
                .summary { background-color: #f5f5f5; padding: 20px; margin: 20px 0; }
                .findings { margin: 20px 0; }
                .violation { border-left: 4px solid #ff4444; padding: 10px; margin: 10px 0; }
                .recommendations { background-color: #e8f5e8; padding: 20px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>{{ report.report_type }}</h1>
                <p>Report ID: {{ report.report_id }}</p>
                <p>Generated: {{ report.generated_at.strftime('%Y-%m-%d %H:%M:%S') }}</p>
                <p>Period: {{ report.period_start.strftime('%Y-%m-%d') }} to {{ report.period_end.strftime('%Y-%m-%d') }}</p>
            </div>
            
            <div class="summary">
                <h2>Summary</h2>
                {% for key, value in report.summary.items() %}
                <p><strong>{{ key.replace('_', ' ').title() }}:</strong> {{ value }}</p>
                {% endfor %}
            </div>
            
            <div class="findings">
                <h2>Findings</h2>
                {% for finding in report.findings %}
                <div class="violation">
                    <h3>{{ finding.title }}</h3>
                    <p><strong>Severity:</strong> {{ finding.severity.upper() }}</p>
                    <p><strong>Description:</strong> {{ finding.description }}</p>
                    <p><strong>Detected:</strong> {{ finding.detected_at }}</p>
                </div>
                {% endfor %}
            </div>
            
            <div class="recommendations">
                <h2>Recommendations</h2>
                <ul>
                {% for recommendation in report.recommendations %}
                <li>{{ recommendation }}</li>
                {% endfor %}
                </ul>
            </div>
        </body>
        </html>
        """
        
        self.templates_dir.mkdir(exist_ok=True)
        template_path = self.templates_dir / "compliance_report_template.html"
        with open(template_path, 'w') as f:
            f.write(template_content)
    
    def _generate_report_id(self, framework: str) -> str:
        """Generate unique report ID"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return f"{framework}_COMPLIANCE_{timestamp}"
    
    def _store_report(self, report: ComplianceReport):
        """Store report metadata in database"""
        try:
            with self.db_connection.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO compliance_reports (
                        report_id, report_type, framework, period_start, period_end,
                        generated_at, generated_by, summary, findings, recommendations
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    report.report_id,
                    report.report_type,
                    report.framework,
                    report.period_start,
                    report.period_end,
                    report.generated_at,
                    report.generated_by,
                    json.dumps(report.summary),
                    json.dumps(report.findings),
                    json.dumps(report.recommendations)
                ))
                
                self.db_connection.commit()
                
        except Exception as e:
            self.logger.error(f"Failed to store report: {e}")
