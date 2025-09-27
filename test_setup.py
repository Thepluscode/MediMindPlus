#!/usr/bin/env python3
"""
Simple test script to verify MediMind setup
"""

import sys
import subprocess
import os

def test_python_version():
    """Test Python version"""
    print("🐍 Testing Python version...")
    version = sys.version_info
    print(f"   Python {version.major}.{version.minor}.{version.micro}")
    if version.major >= 3 and version.minor >= 8:
        print("   ✅ Python version is compatible")
        return True
    else:
        print("   ❌ Python version too old (need 3.8+)")
        return False

def test_imports():
    """Test if core packages can be imported"""
    print("\n📦 Testing core package imports...")
    
    packages = [
        ('fastapi', 'FastAPI'),
        ('uvicorn', 'Uvicorn'),
        ('numpy', 'NumPy'),
        ('pandas', 'Pandas'),
        ('sklearn', 'Scikit-learn'),
        ('torch', 'PyTorch'),
    ]
    
    success_count = 0
    for package, name in packages:
        try:
            __import__(package)
            print(f"   ✅ {name} imported successfully")
            success_count += 1
        except ImportError:
            print(f"   ❌ {name} not available")
    
    print(f"\n   📊 {success_count}/{len(packages)} packages available")
    return success_count == len(packages)

def test_directories():
    """Test if required directories exist"""
    print("\n📁 Testing directory structure...")
    
    required_dirs = [
        'ml-pipeline',
        'backend',
        'frontend'
    ]
    
    success_count = 0
    for dir_name in required_dirs:
        if os.path.exists(dir_name):
            print(f"   ✅ {dir_name}/ directory exists")
            success_count += 1
        else:
            print(f"   ❌ {dir_name}/ directory missing")
    
    return success_count == len(required_dirs)

def test_files():
    """Test if key files exist"""
    print("\n📄 Testing key files...")
    
    key_files = [
        'docker-compose.yml',
        'ml-pipeline/requirements.txt',
        'ml-pipeline/main.py',
        'backend/package.json',
        'backend/Dockerfile'
    ]
    
    success_count = 0
    for file_path in key_files:
        if os.path.exists(file_path):
            print(f"   ✅ {file_path} exists")
            success_count += 1
        else:
            print(f"   ❌ {file_path} missing")
    
    return success_count == len(key_files)

def main():
    """Run all tests"""
    print("🏥 MediMind Setup Test")
    print("=" * 50)
    
    tests = [
        ("Python Version", test_python_version),
        ("Directory Structure", test_directories),
        ("Key Files", test_files),
        ("Package Imports", test_imports),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
        except Exception as e:
            print(f"   ❌ {test_name} failed with error: {e}")
    
    print("\n" + "=" * 50)
    print(f"🎯 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! MediMind setup looks good!")
        return 0
    else:
        print("⚠️  Some tests failed. Check the output above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
