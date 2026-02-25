import { useState } from 'react';
import SignInModal from '../../../components/feature/SignInModal';

export default function CTASection() {
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

  const handleGetStarted = () => {
    setIsSignInModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsSignInModalOpen(false);
  };

  return (
    <>
      <section className="relative py-32 bg-gradient-to-br from-teal-600 via-blue-600 to-purple-600 overflow-hidden">
        {/* Modern Geometric Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        {/* Floating Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float-slow"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-float-medium"></div>
        </div>

        <div className="relative max-w-5xl mx-auto px-6 text-center space-y-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-white tracking-wide">Limited Time Offer</span>
          </div>

          {/* Main Headline */}
          <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
            Start Your AI Health<br />Journey Today
          </h2>

          {/* Subheadline */}
          <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
            Join <span className="font-bold text-white">50,000+ users</span> using AI to predict and prevent health issues before they happen
          </p>

          {/* CTA Button with modern design */}
          <div className="pt-6">
            <button 
              onClick={handleGetStarted}
              className="group relative inline-flex items-center gap-4 px-10 py-5 bg-white text-slate-900 text-lg font-bold rounded-2xl hover:scale-105 hover:shadow-[0_20px_60px_rgba(255,255,255,0.3)] transition-all duration-300 whitespace-nowrap cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-teal-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                <i className="ri-rocket-line text-white text-xl"></i>
              </div>
              
              <span className="relative">GET STARTED FREE</span>
              
              <div className="relative w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-500 rounded-xl flex items-center justify-center group-hover:translate-x-1 transition-transform duration-300">
                <i className="ri-arrow-right-line text-white text-lg"></i>
              </div>
            </button>
          </div>

          {/* Trust Indicators with modern cards */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-8">
            <div className="flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl">
              <div className="w-10 h-10 flex items-center justify-center bg-white/20 rounded-xl">
                <i className="ri-shield-check-line text-white text-lg"></i>
              </div>
              <span className="text-sm font-semibold text-white">HIPAA Compliant</span>
            </div>
            
            <div className="flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl">
              <div className="w-10 h-10 flex items-center justify-center bg-white/20 rounded-xl">
                <i className="ri-flashlight-line text-white text-lg"></i>
              </div>
              <span className="text-sm font-semibold text-white">Instant Setup</span>
            </div>
            
            <div className="flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl">
              <div className="w-10 h-10 flex items-center justify-center bg-white/20 rounded-xl">
                <i className="ri-bank-card-line text-white text-lg"></i>
              </div>
              <span className="text-sm font-semibold text-white">No Credit Card</span>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto pt-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">50K+</div>
              <div className="text-sm text-white/80 font-medium">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">92%</div>
              <div className="text-sm text-white/80 font-medium">Accuracy Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">48+</div>
              <div className="text-sm text-white/80 font-medium">Health Metrics</div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes float-slow {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(30px, -30px); }
          }
          @keyframes float-medium {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(-30px, 30px); }
          }
          .animate-float-slow {
            animation: float-slow 8s ease-in-out infinite;
          }
          .animate-float-medium {
            animation: float-medium 10s ease-in-out infinite;
          }
        `}</style>
      </section>

      {/* Sign In Modal */}
      {isSignInModalOpen && (
        <SignInModal 
          isOpen={isSignInModalOpen} 
          onClose={handleCloseModal}
          defaultMode="signup"
        />
      )}
    </>
  );
}
