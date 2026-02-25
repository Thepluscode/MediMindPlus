import { useState } from 'react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const formBody = new URLSearchParams();
      formBody.append('email', email);

      const response = await fetch('https://readdy.ai/api/form/d5cl385crgmf5papdnb0', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody.toString()
      });

      if (response.ok) {
        setSubmitStatus('success');
        setEmail('');
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <div>
            <h3 className="text-2xl font-bold mb-4">MediMindPlus</h3>
            <p className="text-teal-100 mb-6 text-sm leading-relaxed">
              Revolutionizing healthcare with AI-powered insights and personalized health management solutions.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-colors cursor-pointer">
                <i className="ri-facebook-fill text-xl"></i>
              </a>
              <a href="#" className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-colors cursor-pointer">
                <i className="ri-twitter-x-fill text-xl"></i>
              </a>
              <a href="#" className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-colors cursor-pointer">
                <i className="ri-linkedin-fill text-xl"></i>
              </a>
              <a href="#" className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-colors cursor-pointer">
                <i className="ri-instagram-fill text-xl"></i>
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold mb-4 text-lg">Product</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="/virtual-health-twin" className="text-teal-100 hover:text-white transition-colors cursor-pointer">Virtual Health Twin</a></li>
              <li><a href="/biological-age" className="text-teal-100 hover:text-white transition-colors cursor-pointer">Biological Age</a></li>
              <li><a href="/drug-interaction" className="text-teal-100 hover:text-white transition-colors cursor-pointer">Drug Interaction</a></li>
              <li><a href="/cbt-chatbot" className="text-teal-100 hover:text-white transition-colors cursor-pointer">CBT Chatbot</a></li>
              <li><a href="/pricing" className="text-teal-100 hover:text-white transition-colors cursor-pointer">Pricing</a></li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold mb-4 text-lg">Company</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="/enterprise" className="text-teal-100 hover:text-white transition-colors cursor-pointer">Enterprise</a></li>
              <li><a href="/providers" className="text-teal-100 hover:text-white transition-colors cursor-pointer">For Providers</a></li>
              <li><a href="/resources" className="text-teal-100 hover:text-white transition-colors cursor-pointer">Resources</a></li>
              <li><a href="/help-center" className="text-teal-100 hover:text-white transition-colors cursor-pointer">Help Center</a></li>
              <li><a href="/contact" className="text-teal-100 hover:text-white transition-colors cursor-pointer">Contact Us</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold mb-4 text-lg">Stay Updated</h4>
            <p className="text-teal-100 mb-4 text-sm">Subscribe to our newsletter for health tips and updates.</p>
            <form id="newsletter-form" data-readdy-form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-teal-200 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
              />
              {submitStatus === 'success' && (
                <p className="text-xs text-green-200">✓ Subscribed successfully!</p>
              )}
              {submitStatus === 'error' && (
                <p className="text-xs text-red-200">✗ Something went wrong. Try again.</p>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-white text-teal-700 py-2 px-4 rounded-lg font-medium hover:bg-teal-50 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isSubmitting ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-teal-100">
            <p>&copy; 2024 MediMindPlus. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors cursor-pointer">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors cursor-pointer">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors cursor-pointer">Cookie Policy</a>
              <a href="https://readdy.ai/?ref=logo" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors cursor-pointer">Powered by Readdy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
