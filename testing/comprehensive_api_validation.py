# Comprehensive API Testing & Validation Suite
# Production readiness verification for foundation model APIs

import asyncio
import aiohttp
import json
import time
import base64
import numpy as np
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import logging
from datetime import datetime
import pytest

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class APITestResult:
    endpoint: str
    test_name: str
    status: str  # "PASS", "FAIL", "WARNING"
    response_time: float
    status_code: int
    error_message: Optional[str] = None
    performance_metrics: Optional[Dict[str, Any]] = None

@dataclass
class LoadTestResult:
    endpoint: str
    concurrent_users: int
    total_requests: int
    avg_response_time: float
    p95_response_time: float
    p99_response_time: float
    success_rate: float
    throughput: float  # requests per second

class MediMindAPIValidator:
    """
    Comprehensive API validation for production readiness
    Tests all foundation model endpoints for performance, reliability, and accuracy
    """
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.test_results: List[APITestResult] = []
        self.load_test_results: List[LoadTestResult] = []
        
    async def run_comprehensive_validation(self) -> Dict[str, Any]:
        """Run complete API validation suite"""
        logger.info("🚀 Starting comprehensive API validation...")
        
        # Functional tests
        await self.test_health_endpoints()
        await self.test_multimodal_analysis()
        await self.test_clinical_voice_analysis()
        await self.test_multiomics_analysis()
        
        # Performance tests
        await self.test_latency_requirements()
        await self.test_concurrent_load()
        await self.test_stress_limits()
        
        # Security tests
        await self.test_authentication()
        await self.test_input_validation()
        await self.test_rate_limiting()
        
        # Generate validation report
        return self.generate_validation_report()
    
    async def test_health_endpoints(self):
        """Test basic health and status endpoints"""
        logger.info("Testing health endpoints...")
        
        endpoints = [
            "/health",
            "/api/v1/health",
            "/api/v1/status",
            "/metrics"
        ]
        
        async with aiohttp.ClientSession() as session:
            for endpoint in endpoints:
                start_time = time.time()
                try:
                    async with session.get(f"{self.base_url}{endpoint}") as response:
                        response_time = time.time() - start_time
                        
                        if response.status == 200:
                            self.test_results.append(APITestResult(
                                endpoint=endpoint,
                                test_name="Health Check",
                                status="PASS",
                                response_time=response_time,
                                status_code=response.status
                            ))
                        else:
                            self.test_results.append(APITestResult(
                                endpoint=endpoint,
                                test_name="Health Check",
                                status="FAIL",
                                response_time=response_time,
                                status_code=response.status,
                                error_message=f"Unexpected status code: {response.status}"
                            ))
                            
                except Exception as e:
                    self.test_results.append(APITestResult(
                        endpoint=endpoint,
                        test_name="Health Check",
                        status="FAIL",
                        response_time=0,
                        status_code=0,
                        error_message=str(e)
                    ))
    
    async def test_multimodal_analysis(self):
        """Test Med-PaLM M multimodal analysis endpoint"""
        logger.info("Testing multimodal analysis endpoint...")
        
        # Generate test audio data (simulated)
        test_audio = self.generate_test_audio()
        test_image = self.generate_test_image()
        
        test_request = {
            "patient_id": "test-patient-001",
            "text_data": "Patient reports chest pain and shortness of breath during exercise",
            "voice_data": test_audio,
            "medical_images": [test_image],
            "ehr_data": {
                "age": 45,
                "gender": "male",
                "medical_history": ["hypertension", "diabetes"],
                "medications": ["metformin", "lisinopril"]
            },
            "wearable_data": {
                "heart_rate": 85,
                "blood_pressure": "140/90",
                "activity_level": "moderate"
            },
            "analysis_type": "comprehensive_health_assessment"
        }
        
        await self.test_endpoint_with_payload(
            "/api/v1/multimodal-analysis",
            test_request,
            "Multimodal Analysis",
            expected_fields=["predictions", "clinical_insights", "clinical_reasoning", "modalities_used"],
            max_response_time=5.0  # 5 second max for comprehensive analysis
        )
    
    async def test_clinical_voice_analysis(self):
        """Test clinical voice biomarker analysis endpoint"""
        logger.info("Testing clinical voice analysis endpoint...")
        
        test_audio = self.generate_test_audio()
        
        test_request = {
            "patient_id": "test-patient-002",
            "audio_data": test_audio,
            "sample_rate": 16000,
            "analysis_type": "comprehensive"
        }
        
        await self.test_endpoint_with_payload(
            "/api/v1/clinical-voice-analysis",
            test_request,
            "Clinical Voice Analysis",
            expected_fields=["overall_health_score", "condition_probabilities", "clinical_recommendations"],
            max_response_time=2.0  # 2 second max for voice analysis
        )
    
    async def test_multiomics_analysis(self):
        """Test multi-omics analysis endpoint"""
        logger.info("Testing multi-omics analysis endpoint...")
        
        test_request = {
            "sample_id": "test-sample-001",
            "genomics_data": {
                "variants": ["rs123456", "rs789012"],
                "quality_metrics": {"coverage": 30.5, "call_rate": 0.995}
            },
            "proteomics_data": {
                "proteins_detected": 8500,
                "biomarkers": ["CRP", "TNF-alpha", "IL-6"]
            },
            "metabolomics_data": {
                "metabolites_detected": 1200,
                "pathways": ["glycolysis", "lipid_metabolism"]
            },
            "analysis_type": "comprehensive"
        }
        
        await self.test_endpoint_with_payload(
            "/api/v1/multiomics-analysis",
            test_request,
            "Multi-Omics Analysis",
            expected_fields=["polygenic_risk_scores", "pharmacogenomics", "biomarker_discoveries"],
            max_response_time=10.0  # 10 second max for complex omics analysis
        )
    
    async def test_endpoint_with_payload(
        self, 
        endpoint: str, 
        payload: Dict[str, Any], 
        test_name: str,
        expected_fields: List[str],
        max_response_time: float
    ):
        """Test endpoint with specific payload and validation"""
        async with aiohttp.ClientSession() as session:
            start_time = time.time()
            try:
                async with session.post(
                    f"{self.base_url}{endpoint}",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    response_time = time.time() - start_time
                    
                    if response.status == 200:
                        response_data = await response.json()
                        
                        # Validate response structure
                        missing_fields = [field for field in expected_fields if field not in response_data]
                        
                        if missing_fields:
                            status = "FAIL"
                            error_message = f"Missing required fields: {missing_fields}"
                        elif response_time > max_response_time:
                            status = "WARNING"
                            error_message = f"Response time {response_time:.2f}s exceeds target {max_response_time}s"
                        else:
                            status = "PASS"
                            error_message = None
                        
                        self.test_results.append(APITestResult(
                            endpoint=endpoint,
                            test_name=test_name,
                            status=status,
                            response_time=response_time,
                            status_code=response.status,
                            error_message=error_message,
                            performance_metrics={
                                "response_size": len(json.dumps(response_data)),
                                "fields_present": len([f for f in expected_fields if f in response_data])
                            }
                        ))
                    else:
                        response_text = await response.text()
                        self.test_results.append(APITestResult(
                            endpoint=endpoint,
                            test_name=test_name,
                            status="FAIL",
                            response_time=response_time,
                            status_code=response.status,
                            error_message=f"HTTP {response.status}: {response_text}"
                        ))
                        
            except Exception as e:
                self.test_results.append(APITestResult(
                    endpoint=endpoint,
                    test_name=test_name,
                    status="FAIL",
                    response_time=0,
                    status_code=0,
                    error_message=str(e)
                ))
    
    async def test_latency_requirements(self):
        """Test latency requirements for all endpoints"""
        logger.info("Testing latency requirements...")
        
        latency_targets = {
            "/api/v1/multimodal-analysis": 200,  # 200ms target
            "/api/v1/clinical-voice-analysis": 100,  # 100ms target
            "/api/v1/multiomics-analysis": 500,  # 500ms target
        }
        
        for endpoint, target_ms in latency_targets.items():
            # Run 10 requests to get average latency
            response_times = []
            
            for i in range(10):
                start_time = time.time()
                try:
                    async with aiohttp.ClientSession() as session:
                        # Use minimal payload for latency testing
                        minimal_payload = {"patient_id": f"latency-test-{i}"}
                        
                        async with session.post(
                            f"{self.base_url}{endpoint}",
                            json=minimal_payload
                        ) as response:
                            response_time = (time.time() - start_time) * 1000  # Convert to ms
                            response_times.append(response_time)
                            
                except Exception as e:
                    logger.warning(f"Latency test failed for {endpoint}: {e}")
                    continue
            
            if response_times:
                avg_latency = np.mean(response_times)
                p95_latency = np.percentile(response_times, 95)
                
                status = "PASS" if avg_latency <= target_ms else "FAIL"
                
                self.test_results.append(APITestResult(
                    endpoint=endpoint,
                    test_name="Latency Test",
                    status=status,
                    response_time=avg_latency / 1000,  # Convert back to seconds
                    status_code=200,
                    error_message=None if status == "PASS" else f"Average latency {avg_latency:.1f}ms exceeds target {target_ms}ms",
                    performance_metrics={
                        "avg_latency_ms": avg_latency,
                        "p95_latency_ms": p95_latency,
                        "target_latency_ms": target_ms
                    }
                ))
    
    async def test_concurrent_load(self):
        """Test concurrent load handling"""
        logger.info("Testing concurrent load...")
        
        endpoints = [
            "/api/v1/multimodal-analysis",
            "/api/v1/clinical-voice-analysis"
        ]
        
        for endpoint in endpoints:
            for concurrent_users in [10, 50, 100]:
                await self.run_load_test(endpoint, concurrent_users, 100)  # 100 requests per user
    
    async def run_load_test(self, endpoint: str, concurrent_users: int, requests_per_user: int):
        """Run load test for specific endpoint"""
        logger.info(f"Load testing {endpoint} with {concurrent_users} concurrent users...")
        
        async def make_request(session, user_id):
            """Make a single request"""
            start_time = time.time()
            try:
                payload = {"patient_id": f"load-test-user-{user_id}"}
                async with session.post(f"{self.base_url}{endpoint}", json=payload) as response:
                    response_time = time.time() - start_time
                    return {
                        "success": response.status == 200,
                        "response_time": response_time,
                        "status_code": response.status
                    }
            except Exception as e:
                return {
                    "success": False,
                    "response_time": time.time() - start_time,
                    "error": str(e)
                }
        
        async def user_session(user_id):
            """Simulate a user making multiple requests"""
            async with aiohttp.ClientSession() as session:
                tasks = [make_request(session, user_id) for _ in range(requests_per_user)]
                return await asyncio.gather(*tasks)
        
        # Run load test
        start_time = time.time()
        user_tasks = [user_session(user_id) for user_id in range(concurrent_users)]
        all_results = await asyncio.gather(*user_tasks)
        total_time = time.time() - start_time
        
        # Flatten results
        flat_results = [result for user_results in all_results for result in user_results]
        
        # Calculate metrics
        successful_requests = [r for r in flat_results if r["success"]]
        response_times = [r["response_time"] for r in successful_requests]
        
        if response_times:
            load_result = LoadTestResult(
                endpoint=endpoint,
                concurrent_users=concurrent_users,
                total_requests=len(flat_results),
                avg_response_time=np.mean(response_times),
                p95_response_time=np.percentile(response_times, 95),
                p99_response_time=np.percentile(response_times, 99),
                success_rate=len(successful_requests) / len(flat_results),
                throughput=len(successful_requests) / total_time
            )
            
            self.load_test_results.append(load_result)
    
    async def test_stress_limits(self):
        """Test system stress limits"""
        logger.info("Testing stress limits...")
        
        # Gradually increase load until failure
        for concurrent_users in [200, 500, 1000]:
            try:
                await self.run_load_test("/api/v1/multimodal-analysis", concurrent_users, 10)
            except Exception as e:
                logger.warning(f"Stress test failed at {concurrent_users} users: {e}")
                break
    
    async def test_authentication(self):
        """Test authentication and authorization"""
        logger.info("Testing authentication...")
        
        # Test without authentication
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.base_url}/api/v1/multimodal-analysis") as response:
                # Should require authentication (401 or 403)
                if response.status in [401, 403]:
                    status = "PASS"
                    error_message = None
                else:
                    status = "FAIL"
                    error_message = f"Expected 401/403, got {response.status}"
                
                self.test_results.append(APITestResult(
                    endpoint="/api/v1/multimodal-analysis",
                    test_name="Authentication Required",
                    status=status,
                    response_time=0,
                    status_code=response.status,
                    error_message=error_message
                ))
    
    async def test_input_validation(self):
        """Test input validation and sanitization"""
        logger.info("Testing input validation...")
        
        # Test malformed JSON
        malformed_payloads = [
            {"patient_id": ""},  # Empty patient ID
            {"patient_id": None},  # Null patient ID
            {"patient_id": "x" * 1000},  # Oversized patient ID
            {"invalid_field": "test"},  # Invalid field
        ]
        
        for payload in malformed_payloads:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/api/v1/multimodal-analysis",
                    json=payload
                ) as response:
                    # Should return 400 for bad requests
                    if response.status == 400:
                        status = "PASS"
                        error_message = None
                    else:
                        status = "FAIL"
                        error_message = f"Expected 400, got {response.status}"
                    
                    self.test_results.append(APITestResult(
                        endpoint="/api/v1/multimodal-analysis",
                        test_name="Input Validation",
                        status=status,
                        response_time=0,
                        status_code=response.status,
                        error_message=error_message
                    ))
    
    async def test_rate_limiting(self):
        """Test rate limiting"""
        logger.info("Testing rate limiting...")
        
        # Make rapid requests to trigger rate limiting
        async with aiohttp.ClientSession() as session:
            tasks = []
            for i in range(100):  # 100 rapid requests
                task = session.post(
                    f"{self.base_url}/api/v1/multimodal-analysis",
                    json={"patient_id": f"rate-limit-test-{i}"}
                )
                tasks.append(task)
            
            responses = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Check if any requests were rate limited (429)
            rate_limited = any(
                hasattr(r, 'status') and r.status == 429 
                for r in responses 
                if not isinstance(r, Exception)
            )
            
            status = "PASS" if rate_limited else "WARNING"
            error_message = None if rate_limited else "No rate limiting detected"
            
            self.test_results.append(APITestResult(
                endpoint="/api/v1/multimodal-analysis",
                test_name="Rate Limiting",
                status=status,
                response_time=0,
                status_code=429 if rate_limited else 200,
                error_message=error_message
            ))
    
    def generate_test_audio(self) -> str:
        """Generate test audio data (base64 encoded)"""
        # Simulate 1 second of audio at 16kHz
        sample_rate = 16000
        duration = 1.0
        samples = int(sample_rate * duration)
        
        # Generate sine wave
        frequency = 440  # A4 note
        t = np.linspace(0, duration, samples)
        audio_data = np.sin(2 * np.pi * frequency * t)
        
        # Convert to bytes and base64 encode
        audio_bytes = (audio_data * 32767).astype(np.int16).tobytes()
        return base64.b64encode(audio_bytes).decode('utf-8')
    
    def generate_test_image(self) -> str:
        """Generate test medical image (base64 encoded)"""
        # Generate simple test image
        image_data = np.random.randint(0, 256, (100, 100, 3), dtype=np.uint8)
        image_bytes = image_data.tobytes()
        return base64.b64encode(image_bytes).decode('utf-8')
    
    def generate_validation_report(self) -> Dict[str, Any]:
        """Generate comprehensive validation report"""
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r.status == "PASS"])
        failed_tests = len([r for r in self.test_results if r.status == "FAIL"])
        warning_tests = len([r for r in self.test_results if r.status == "WARNING"])
        
        # Calculate average response times by endpoint
        endpoint_performance = {}
        for result in self.test_results:
            if result.endpoint not in endpoint_performance:
                endpoint_performance[result.endpoint] = []
            endpoint_performance[result.endpoint].append(result.response_time)
        
        avg_performance = {
            endpoint: np.mean(times) 
            for endpoint, times in endpoint_performance.items()
        }
        
        return {
            "validation_summary": {
                "total_tests": total_tests,
                "passed": passed_tests,
                "failed": failed_tests,
                "warnings": warning_tests,
                "success_rate": passed_tests / total_tests if total_tests > 0 else 0,
                "timestamp": datetime.utcnow().isoformat()
            },
            "performance_summary": {
                "avg_response_times": avg_performance,
                "load_test_results": [
                    {
                        "endpoint": lr.endpoint,
                        "concurrent_users": lr.concurrent_users,
                        "throughput": lr.throughput,
                        "success_rate": lr.success_rate,
                        "avg_response_time": lr.avg_response_time
                    }
                    for lr in self.load_test_results
                ]
            },
            "detailed_results": [
                {
                    "endpoint": r.endpoint,
                    "test_name": r.test_name,
                    "status": r.status,
                    "response_time": r.response_time,
                    "status_code": r.status_code,
                    "error_message": r.error_message,
                    "performance_metrics": r.performance_metrics
                }
                for r in self.test_results
            ],
            "production_readiness": {
                "ready": failed_tests == 0,
                "critical_issues": [
                    r for r in self.test_results 
                    if r.status == "FAIL" and "latency" not in r.test_name.lower()
                ],
                "performance_issues": [
                    r for r in self.test_results 
                    if r.status in ["FAIL", "WARNING"] and "latency" in r.test_name.lower()
                ]
            }
        }

# Test execution
async def main():
    """Run comprehensive API validation"""
    validator = MediMindAPIValidator()
    report = await validator.run_comprehensive_validation()
    
    # Print summary
    print("\n" + "="*80)
    print("🚀 MEDIMIND API VALIDATION REPORT")
    print("="*80)
    
    summary = report["validation_summary"]
    print(f"Total Tests: {summary['total_tests']}")
    print(f"Passed: {summary['passed']} ✅")
    print(f"Failed: {summary['failed']} ❌")
    print(f"Warnings: {summary['warnings']} ⚠️")
    print(f"Success Rate: {summary['success_rate']:.1%}")
    
    print(f"\nProduction Ready: {'✅ YES' if report['production_readiness']['ready'] else '❌ NO'}")
    
    # Save detailed report
    with open('api_validation_report.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"\nDetailed report saved to: api_validation_report.json")
    
    return report

if __name__ == "__main__":
    asyncio.run(main())
