import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import SignInModal from '../../../components/feature/SignInModal';
import { authService } from '../../../services/auth';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPlatformDropdownOpen, setIsPlatformDropdownOpen] = useState(false);
  const [isAIFeaturesDropdownOpen, setIsAIFeaturesDropdownOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const isLoggedIn = authService.isAuthenticated();
  const currentUser = authService.getCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAIFeatureClick = (sectionId: string) => {
    setIsAIFeaturesDropdownOpen(false);
    if (location.pathname !== '/') {
      // Navigate to homepage with hash, then scroll after page loads
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handlePlatformClick = (path: string) => {
    setIsPlatformDropdownOpen(false);
    navigate(path);
  };

  const handleGetStarted = () => {
    setShowSignUp(true);
    setIsSignInModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  const handleSignIn = () => {
    setShowSignUp(false);
    setIsSignInModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  const handleCloseModal = () => {
    setIsSignInModalOpen(false);
    setShowSignUp(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
        ? 'bg-white/95 backdrop-blur-lg shadow-lg'
        : 'bg-white/85 backdrop-blur-md'
        }`}
    >
      <nav className="max-w-[1440px] mx-auto px-6 lg:px-12 h-18 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center">
            <i className="ri-brain-line text-white text-xl"></i>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
            MediMindPlus
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-10">
          {/* Platform Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setIsPlatformDropdownOpen(true)}
            onMouseLeave={() => setIsPlatformDropdownOpen(false)}
          >
            <button className="text-slate-800 font-medium text-[15px] hover:text-blue-600 transition-colors flex items-center gap-1 whitespace-nowrap cursor-pointer">
              Platform
              <i className={`ri-arrow-down-s-line text-sm transition-transform ${isPlatformDropdownOpen ? 'rotate-180' : ''}`}></i>
            </button>

            {isPlatformDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 animate-fadeIn">
                <div
                  onClick={() => handlePlatformClick('/virtual-health-twin')}
                  className="flex items-start gap-4 px-5 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <i className="ri-user-heart-line text-white text-lg"></i>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 text-sm">Virtual Health Twin</div>
                    <div className="text-xs text-slate-600 mt-0.5">Digital biological simulation</div>
                  </div>
                </div>

                <div
                  onClick={() => handlePlatformClick('/biological-age')}
                  className="flex items-start gap-4 px-5 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                    <i className="ri-time-line text-white text-lg"></i>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 text-sm">Biological Age</div>
                    <div className="text-xs text-slate-600 mt-0.5">Longevity optimization</div>
                  </div>
                </div>

                <div
                  onClick={() => handlePlatformClick('/drug-interaction')}
                  className="flex items-start gap-4 px-5 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                    <i className="ri-capsule-line text-white text-lg"></i>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 text-sm">Drug Interaction</div>
                    <div className="text-xs text-slate-600 mt-0.5">Medication safety checker</div>
                  </div>
                </div>

                <div
                  onClick={() => handlePlatformClick('/cbt-chatbot')}
                  className="flex items-start gap-4 px-5 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <i className="ri-chat-heart-line text-white text-lg"></i>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 text-sm">CBT Therapy</div>
                    <div className="text-xs text-slate-600 mt-0.5">24/7 mental health support</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AI Features Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setIsAIFeaturesDropdownOpen(true)}
            onMouseLeave={() => setIsAIFeaturesDropdownOpen(false)}
          >
            <button className="text-slate-800 font-medium text-[15px] hover:text-blue-600 transition-colors flex items-center gap-1 whitespace-nowrap cursor-pointer">
              AI Features
              <i className={`ri-arrow-down-s-line text-sm transition-transform ${isAIFeaturesDropdownOpen ? 'rotate-180' : ''}`}></i>
            </button>

            {isAIFeaturesDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 animate-fadeIn">
                <div className="px-5 py-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI & Prediction</div>
                </div>

                <div
                  onClick={() => handleAIFeatureClick('ai-models')}
                  className="flex items-start gap-4 px-5 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <i className="ri-brain-line text-white text-lg"></i>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 text-sm">AI Prediction Models</div>
                    <div className="text-xs text-slate-600 mt-0.5">10+ disease risk models</div>
                  </div>
                </div>

                <div
                  onClick={() => handleAIFeatureClick('voice-analysis')}
                  className="flex items-start gap-4 px-5 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                    <i className="ri-mic-line text-white text-lg"></i>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 text-sm">Voice Analysis</div>
                    <div className="text-xs text-slate-600 mt-0.5">Voice biomarker detection</div>
                  </div>
                </div>

                <div
                  onClick={() => handleAIFeatureClick('anomaly-detection')}
                  className="flex items-start gap-4 px-5 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                    <i className="ri-alert-line text-white text-lg"></i>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 text-sm">Anomaly Detection</div>
                    <div className="text-xs text-slate-600 mt-0.5">Real-time health alerts</div>
                  </div>
                </div>

                <div className="px-5 py-2 mt-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Medical Imaging</div>
                </div>

                <div
                  onClick={() => handleAIFeatureClick('medical-imaging')}
                  className="flex items-start gap-4 px-5 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <i className="ri-image-line text-white text-lg"></i>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 text-sm">AI Imaging Analysis</div>
                    <div className="text-xs text-slate-600 mt-0.5">X-ray, MRI, CT scan analysis</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="relative group">
            <button className="text-gray-700 hover:text-teal-600 font-medium flex items-center gap-1 whitespace-nowrap cursor-pointer">
              Features
              <i className="ri-arrow-down-s-line"></i>
            </button>
            <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 animate-slide-down">
              <Link to="/virtual-health-twin" className="block px-4 py-3 text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <i className="ri-user-heart-line text-xl"></i>
                  <div>
                    <div className="font-medium">Virtual Health Twin</div>
                    <div className="text-xs text-gray-500">Digital health replica</div>
                  </div>
                </div>
              </Link>
              <Link to="/biological-age" className="block px-4 py-3 text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <i className="ri-time-line text-xl"></i>
                  <div>
                    <div className="font-medium">Biological Age</div>
                    <div className="text-xs text-gray-500">Calculate your real age</div>
                  </div>
                </div>
              </Link>
              <Link to="/drug-interaction" className="block px-4 py-3 text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <i className="ri-medicine-bottle-line text-xl"></i>
                  <div>
                    <div className="font-medium">Drug Interaction</div>
                    <div className="text-xs text-gray-500">Check medication safety</div>
                  </div>
                </div>
              </Link>
              <Link to="/cbt-chatbot" className="block px-4 py-3 text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <i className="ri-chat-3-line text-xl"></i>
                  <div>
                    <div className="font-medium">CBT Chatbot</div>
                    <div className="text-xs text-gray-500">Mental health support</div>
                  </div>
                </div>
              </Link>
              <Link to="/device-integration" className="block px-4 py-3 text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <i className="ri-device-line text-xl"></i>
                  <div>
                    <div className="font-medium">Device Integration</div>
                    <div className="text-xs text-gray-500">Connect wearables</div>
                  </div>
                </div>
              </Link>
              <Link to="/health-analytics" className="block px-4 py-3 text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <i className="ri-line-chart-line text-xl"></i>
                  <div>
                    <div className="font-medium">Health Analytics</div>
                    <div className="text-xs text-gray-500">Track your health data</div>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          <Link
            to="/providers"
            className="text-slate-800 font-medium text-[15px] hover:text-blue-600 transition-colors whitespace-nowrap"
          >
            For Providers
          </Link>
          <Link
            to="/enterprise"
            className="text-slate-800 font-medium text-[15px] hover:text-blue-600 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            Enterprise
            <span className="px-2 py-0.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-semibold rounded-full">
              NEW
            </span>
          </Link>
          <Link
            to="/pricing"
            className="text-slate-800 font-medium text-[15px] hover:text-blue-600 transition-colors whitespace-nowrap"
          >
            Pricing
          </Link>
          <Link
            to="/resources"
            className="text-slate-800 font-medium text-[15px] hover:text-blue-600 transition-colors whitespace-nowrap"
          >
            Resources
          </Link>
        </div>

        {/* CTA Buttons / User Menu */}
        <div className="hidden lg:flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <Link
                to="/dashboard"
                className="text-slate-700 font-medium text-[15px] hover:text-blue-600 transition-colors whitespace-nowrap"
              >
                Dashboard
              </Link>
              <div
                className="relative"
                onMouseEnter={() => setIsUserDropdownOpen(true)}
                onMouseLeave={() => setIsUserDropdownOpen(false)}
              >
                <button className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition-all cursor-pointer">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {currentUser?.firstName?.[0]?.toUpperCase() || currentUser?.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="text-slate-700 font-medium text-sm max-w-[120px] truncate">
                    {currentUser?.firstName || currentUser?.email?.split('@')[0] || 'User'}
                  </span>
                  <i className={`ri-arrow-down-s-line text-sm text-slate-500 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`}></i>
                </button>

                {isUserDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 animate-fadeIn z-50">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="font-semibold text-slate-800 text-sm truncate">
                        {currentUser?.firstName} {currentUser?.lastName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{currentUser?.email}</p>
                    </div>
                    <Link to="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <i className="ri-dashboard-line text-lg text-slate-400"></i>
                      Dashboard
                    </Link>
                    <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <i className="ri-user-line text-lg text-slate-400"></i>
                      Profile
                    </Link>
                    <Link to="/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <i className="ri-settings-3-line text-lg text-slate-400"></i>
                      Settings
                    </Link>
                    <Link to="/help-center" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <i className="ri-question-line text-lg text-slate-400"></i>
                      Help Center
                    </Link>
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          authService.logout();
                          navigate('/');
                          window.location.reload();
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full cursor-pointer"
                      >
                        <i className="ri-logout-box-r-line text-lg"></i>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                onClick={handleSignIn}
                className="px-6 py-2.5 text-slate-700 font-medium text-[15px] border border-slate-300 rounded-xl hover:border-blue-600 hover:text-blue-600 transition-all whitespace-nowrap cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={handleGetStarted}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-medium text-[15px] rounded-xl hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer"
              >
                Get Started Free
                <i className="ri-arrow-right-line"></i>
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden w-10 h-10 flex items-center justify-center text-slate-800 cursor-pointer"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <i className={`${isMobileMenuOpen ? 'ri-close-line' : 'ri-menu-line'} text-2xl`}></i>
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-slate-200 shadow-xl">
          <div className="px-6 py-6 flex flex-col gap-4">
            <div className="border-b border-slate-200 pb-3">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Platform</div>
              <Link
                to="/virtual-health-twin"
                className="flex items-center gap-3 py-2 text-slate-800 hover:text-blue-600 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <i className="ri-user-heart-line text-lg"></i>
                <span className="font-medium">Virtual Health Twin</span>
              </Link>
              <Link
                to="/biological-age"
                className="flex items-center gap-3 py-2 text-slate-800 hover:text-blue-600 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <i className="ri-time-line text-lg"></i>
                <span className="font-medium">Biological Age</span>
              </Link>
              <Link
                to="/drug-interaction"
                className="flex items-center gap-3 py-2 text-slate-800 hover:text-blue-600 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <i className="ri-capsule-line text-lg"></i>
                <span className="font-medium">Drug Interaction</span>
              </Link>
              <Link
                to="/cbt-chatbot"
                className="flex items-center gap-3 py-2 text-slate-800 hover:text-blue-600 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <i className="ri-chat-heart-line text-lg"></i>
                <span className="font-medium">CBT Therapy</span>
              </Link>
            </div>

            <Link
              to="/providers"
              className="text-slate-800 font-medium py-2 hover:text-blue-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              For Providers
            </Link>
            <Link
              to="/enterprise"
              className="text-slate-800 font-medium py-2 hover:text-blue-600 transition-colors flex items-center gap-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Enterprise
              <span className="px-2 py-0.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-semibold rounded-full">
                NEW
              </span>
            </Link>
            <Link
              to="/pricing"
              className="text-slate-800 font-medium py-2 hover:text-blue-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              to="/resources"
              className="text-slate-800 font-medium py-2 hover:text-blue-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Resources
            </Link>
            <div className="pt-4 border-t border-slate-200 flex flex-col gap-3">
              {isLoggedIn ? (
                <>
                  <Link
                    to="/dashboard"
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-medium rounded-xl text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    className="w-full px-6 py-3 text-slate-700 font-medium border border-slate-300 rounded-xl text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      authService.logout();
                      setIsMobileMenuOpen(false);
                      navigate('/');
                      window.location.reload();
                    }}
                    className="w-full px-6 py-3 text-red-600 font-medium border border-red-200 rounded-xl hover:bg-red-50 transition-all cursor-pointer"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSignIn}
                    className="w-full px-6 py-3 text-slate-700 font-medium border border-slate-300 rounded-xl hover:border-blue-600 hover:text-blue-600 transition-all whitespace-nowrap cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={handleGetStarted}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-medium rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                  >
                    Get Started Free
                    <i className="ri-arrow-right-line"></i>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sign In Modal */}
      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={handleCloseModal}
        defaultMode={showSignUp ? 'signup' : 'signin'}
      />
    </header>
  );
}
