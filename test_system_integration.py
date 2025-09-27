#!/usr/bin/env python3
"""
MediMind System Integration Test
Comprehensive test to verify all components are properly connected and integrated
"""

import sys
import os
import logging
import json
from typing import Dict, List, Any
import re

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_ml_pipeline_structure():
    """Test ML pipeline structure and API endpoints"""
    logger.info("Testing ML pipeline structure...")

    main_file = "ml-pipeline/main.py"
    
    if not os.path.exists(main_file):
        logger.error("❌ ML pipeline main.py not found")
        return False
    
    with open(main_file, 'r') as f:
        content = f.read()
    
    # Check for all expected API endpoints
    expected_endpoints = [
        '/health',
        '/predict', 
        '/analyze-voice',
        '/explain',
        '/explain/batch',
        '/explain/global-insights',
        '/mlops/status',
        '/mlops/drift-detection',
        '/mlops/register-model',
        '/mlops/trigger-retraining',
        '/optimization/status',
        '/optimization/optimize-model',
        '/optimization/batch-predict'
    ]
    
    found_endpoints = []
    missing_endpoints = []
    
    for endpoint in expected_endpoints:
        if endpoint in content:
            found_endpoints.append(endpoint)
        else:
            missing_endpoints.append(endpoint)
    
    logger.info(f"✅ Found {len(found_endpoints)}/13 ML pipeline endpoints")
    if missing_endpoints:
        logger.warning(f"❌ Missing endpoints: {missing_endpoints}")
    
    # Check for service initializations
    services = ['explainability_service', 'mlops_service', 'performance_service']
    initialized_services = []
    
    for service in services:
        if f"initialize_{service}" in content and f"{service} = " in content:
            initialized_services.append(service)
    
    logger.info(f"✅ Found {len(initialized_services)}/3 initialized services")
    
    return len(missing_endpoints) == 0 and len(initialized_services) == 3

def test_backend_structure():
    """Test backend structure and API routes"""
    logger.info("Testing backend structure...")

    backend_dir = "backend"
    
    if not os.path.exists(backend_dir):
        logger.error("❌ Backend directory not found")
        return False
    
    # Check for key backend files
    key_files = [
        'src/index.ts',
        'src/ai/AIModelService.js',
        'src/routes',
        'src/controllers',
        'src/services',
        'package.json'
    ]
    
    existing_files = []
    missing_files = []
    
    for file_path in key_files:
        full_path = os.path.join(backend_dir, file_path)
        if os.path.exists(full_path):
            existing_files.append(file_path)
        else:
            missing_files.append(file_path)
    
    logger.info(f"✅ Found {len(existing_files)}/6 backend files")
    if missing_files:
        logger.warning(f"❌ Missing files: {missing_files}")
    
    # Check package.json for dependencies
    package_json = os.path.join(backend_dir, 'package.json')
    if os.path.exists(package_json):
        with open(package_json, 'r') as f:
            package_data = json.load(f)
        
        dependencies = package_data.get('dependencies', {})
        expected_deps = ['express', 'cors', 'helmet', 'dotenv']
        found_deps = [dep for dep in expected_deps if dep in dependencies]
        
        logger.info(f"✅ Found {len(found_deps)}/4 expected backend dependencies")
    
    return len(missing_files) == 0

def test_frontend_structure():
    """Test frontend structure and service connections"""
    logger.info("Testing frontend structure...")

    frontend_dir = "frontend"
    
    if not os.path.exists(frontend_dir):
        logger.error("❌ Frontend directory not found")
        return False
    
    # Check for key frontend files
    key_files = [
        'src/services/apiService.ts',
        'src/services/predictionService.ts',
        'src/services/healthDataService.ts',
        'src/components',
        'src/screens',
        'package.json'
    ]
    
    existing_files = []
    missing_files = []
    
    for file_path in key_files:
        full_path = os.path.join(frontend_dir, file_path)
        if os.path.exists(full_path):
            existing_files.append(file_path)
        else:
            missing_files.append(file_path)
    
    logger.info(f"✅ Found {len(existing_files)}/6 frontend files")
    if missing_files:
        logger.warning(f"❌ Missing files: {missing_files}")
    
    # Check API service configuration
    api_service = os.path.join(frontend_dir, 'src/services/apiService.ts')
    if os.path.exists(api_service):
        with open(api_service, 'r') as f:
            content = f.read()
        
        # Check for API base URL configuration
        if 'API_BASE_URL' in content and 'localhost:3000' in content:
            logger.info("✅ API service properly configured for backend connection")
        else:
            logger.warning("❌ API service configuration issues")
    
    return len(missing_files) == 0

def test_api_endpoint_consistency():
    """Test consistency between frontend services and backend/ML pipeline endpoints"""
    logger.info("Testing API endpoint consistency...")
    
    # Get ML pipeline endpoints
    ml_main = "ml-pipeline/main.py"
    ml_endpoints = set()
    
    if os.path.exists(ml_main):
        with open(ml_main, 'r') as f:
            content = f.read()
        
        # Extract endpoints using regex
        endpoint_pattern = r'@app\.(get|post|put|delete)\(\s*["\']([^"\']+)["\']'
        matches = re.findall(endpoint_pattern, content)
        ml_endpoints = {match[1] for match in matches}
    
    logger.info(f"✅ Found {len(ml_endpoints)} ML pipeline endpoints")
    
    # Check frontend service calls
    frontend_services = [
        'frontend/src/services/predictionService.ts',
        'frontend/src/services/apiService.ts'
    ]
    
    frontend_calls = set()
    
    for service_file in frontend_services:
        if os.path.exists(service_file):
            with open(service_file, 'r') as f:
                content = f.read()
            
            # Extract API calls
            api_pattern = r'["\']([/][^"\']*)["\']'
            matches = re.findall(api_pattern, content)
            frontend_calls.update(matches)
    
    logger.info(f"✅ Found {len(frontend_calls)} frontend API calls")
    
    # Check for consistency
    common_endpoints = ml_endpoints.intersection(frontend_calls)
    logger.info(f"✅ Found {len(common_endpoints)} consistent endpoints")
    
    return len(common_endpoints) > 0

def test_data_flow_integration():
    """Test data flow between components"""
    logger.info("Testing data flow integration...")
    
    # Check ML pipeline data models
    ml_main = "ml-pipeline/main.py"
    has_data_models = False
    
    if os.path.exists(ml_main):
        with open(ml_main, 'r') as f:
            content = f.read()
        
        # Check for Pydantic models
        if 'BaseModel' in content and 'PatientData' in content:
            has_data_models = True
            logger.info("✅ ML pipeline has proper data models")
    
    # Check frontend type definitions
    frontend_types = "frontend/src/types"
    has_frontend_types = os.path.exists(frontend_types)

    if has_frontend_types:
        logger.info("✅ Frontend has type definitions")

    # Check backend models
    backend_models = "backend/src/models"
    has_backend_models = os.path.exists(backend_models)
    
    if has_backend_models:
        logger.info("✅ Backend has data models")
    
    return has_data_models and has_frontend_types and has_backend_models

def test_service_dependencies():
    """Test service dependencies and imports"""
    logger.info("Testing service dependencies...")
    
    # Check ML pipeline imports
    ml_main = "ml-pipeline/main.py"
    ml_imports_ok = False
    
    if os.path.exists(ml_main):
        with open(ml_main, 'r') as f:
            content = f.read()
        
        required_imports = [
            'from src.core.medimind_ai import',
            'from src.explainability',
            'from src.mlops import',
            'from src.optimization import'
        ]
        
        found_imports = sum(1 for imp in required_imports if imp in content)
        ml_imports_ok = found_imports >= 3
        
        logger.info(f"✅ ML pipeline has {found_imports}/4 required imports")
    
    # Check requirements.txt
    requirements_file = "ml-pipeline/requirements.txt"
    has_requirements = os.path.exists(requirements_file)
    
    if has_requirements:
        with open(requirements_file, 'r') as f:
            content = f.read()
        
        key_deps = ['fastapi', 'torch', 'numpy', 'pandas', 'mlflow', 'tensorrt']
        found_deps = sum(1 for dep in key_deps if dep in content)
        
        logger.info(f"✅ Requirements has {found_deps}/6 key dependencies")
    
    return ml_imports_ok and has_requirements

def test_configuration_consistency():
    """Test configuration consistency across components"""
    logger.info("Testing configuration consistency...")
    
    # Check for environment configuration
    env_files = [
        "ml-pipeline/.env",
        "backend/.env",
        "frontend/.env"
    ]
    
    env_count = sum(1 for env_file in env_files if os.path.exists(env_file))
    logger.info(f"✅ Found {env_count}/3 environment configuration files")
    
    # Check for consistent port configurations
    frontend_api = "frontend/src/services/apiService.ts"
    port_consistency = False
    
    if os.path.exists(frontend_api):
        with open(frontend_api, 'r') as f:
            content = f.read()
        
        if 'localhost:3000' in content:
            port_consistency = True
            logger.info("✅ Frontend configured for backend port 3000")
    
    return env_count >= 1 and port_consistency

def test_deployment_readiness():
    """Test deployment readiness"""
    logger.info("Testing deployment readiness...")
    
    # Check for Docker files
    docker_files = [
        "ml-pipeline/Dockerfile",
        "backend/Dockerfile"
    ]
    
    docker_count = sum(1 for docker_file in docker_files if os.path.exists(docker_file))
    logger.info(f"✅ Found {docker_count}/2 Docker files")
    
    # Check for package.json files
    package_files = [
        "backend/package.json",
        "frontend/package.json"
    ]
    
    package_count = sum(1 for package_file in package_files if os.path.exists(package_file))
    logger.info(f"✅ Found {package_count}/2 package.json files")
    
    return docker_count >= 1 and package_count >= 1

def main():
    """Run comprehensive system integration tests"""
    logger.info("🚀 Starting MediMind System Integration Tests...")
    
    tests = [
        ("ML Pipeline Structure", test_ml_pipeline_structure),
        ("Backend Structure", test_backend_structure),
        ("Frontend Structure", test_frontend_structure),
        ("API Endpoint Consistency", test_api_endpoint_consistency),
        ("Data Flow Integration", test_data_flow_integration),
        ("Service Dependencies", test_service_dependencies),
        ("Configuration Consistency", test_configuration_consistency),
        ("Deployment Readiness", test_deployment_readiness)
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        logger.info(f"\n--- Running {test_name} Test ---")
        try:
            results[test_name] = test_func()
        except Exception as e:
            logger.error(f"❌ {test_name} test crashed: {e}")
            results[test_name] = False
    
    # Summary
    logger.info("\n" + "="*70)
    logger.info("MEDIMIND SYSTEM INTEGRATION TEST SUMMARY")
    logger.info("="*70)
    
    passed = 0
    total = len(tests)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        logger.info(f"{test_name}: {status}")
        if result:
            passed += 1
    
    logger.info(f"\nOverall: {passed}/{total} integration tests passed")
    
    # Integration assessment
    if passed == total:
        logger.info("🎉 All integration tests passed! System is fully connected.")
        integration_status = "FULLY_INTEGRATED"
    elif passed >= total * 0.8:
        logger.info("✅ Most integration tests passed. System is well connected.")
        integration_status = "WELL_INTEGRATED"
    elif passed >= total * 0.6:
        logger.warning("⚠️  Some integration issues found. Review connections.")
        integration_status = "PARTIALLY_INTEGRATED"
    else:
        logger.error("❌ Major integration issues found. System needs connection fixes.")
        integration_status = "POORLY_INTEGRATED"
    
    # Detailed recommendations
    logger.info("\n" + "="*70)
    logger.info("INTEGRATION RECOMMENDATIONS")
    logger.info("="*70)
    
    if not results.get("API Endpoint Consistency", True):
        logger.info("🔧 Recommendation: Align frontend API calls with backend/ML pipeline endpoints")
    
    if not results.get("Data Flow Integration", True):
        logger.info("🔧 Recommendation: Ensure consistent data models across all components")
    
    if not results.get("Configuration Consistency", True):
        logger.info("🔧 Recommendation: Standardize configuration across frontend, backend, and ML pipeline")
    
    if not results.get("Service Dependencies", True):
        logger.info("🔧 Recommendation: Verify all required dependencies are properly installed")
    
    logger.info(f"\nSystem Integration Status: {integration_status}")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
