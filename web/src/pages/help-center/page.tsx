import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../home/components/Header';
import Footer from '../home/components/Footer';

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const categories = [
    {
      title: 'Getting Started',
      icon: 'ri-rocket-line',
      color: 'from-blue-500 to-blue-600',
      articles: 12
    },
    {
      title: 'AI Features',
      icon: 'ri-brain-line',
      color: 'from-teal-500 to-teal-600',
      articles: 18
    },
    {
      title: 'Health Monitoring',
      icon: 'ri-heart-pulse-line',
      color: 'from-purple-500 to-purple-600',
      articles: 15
    },
    {
      title: 'Privacy & Security',
      icon: 'ri-shield-check-line',
      color: 'from-green-500 to-green-600',
      articles: 10
    },
    {
      title: 'Billing & Plans',
      icon: 'ri-bank-card-line',
      color: 'from-orange-500 to-orange-600',
      articles: 8
    },
    {
      title: 'Troubleshooting',
      icon: 'ri-tools-line',
      color: 'from-red-500 to-red-600',
      articles: 14
    }
  ];

  const faqs = [
    {
      question: 'How accurate are the AI health predictions?',
      answer: 'Our AI models achieve 85-95% accuracy across different health predictions. The Virtual Health Twin uses advanced machine learning trained on millions of health records. However, AI predictions should complement, not replace, professional medical advice.'
    },
    {
      question: 'Is my health data secure and private?',
      answer: 'Yes, absolutely. We use end-to-end encryption, HIPAA-compliant storage, and blockchain technology for health records. Your data is never sold to third parties. You have complete control over data sharing through our Consent Management system.'
    },
    {
      question: 'How does the Biological Age Calculator work?',
      answer: 'The calculator uses 4 advanced algorithms (Horvath Clock, Hannum Clock, PhenoAge, GrimAge) that analyze biomarkers, lifestyle factors, and health metrics to estimate your biological age versus chronological age. It provides personalized recommendations to optimize longevity.'
    },
    {
      question: 'Can I connect my wearable devices?',
      answer: 'Yes! We support Apple Watch, Fitbit, Garmin, Oura Ring, Whoop, and Dexcom G7. Real-time data syncs automatically, including heart rate, steps, sleep, HRV, and more. Go to Settings → Wearable Devices to connect.'
    },
    {
      question: 'What is the Virtual Health Twin?',
      answer: 'The Virtual Health Twin is a $150M feature that creates a digital simulation of your biological systems. It predicts treatment outcomes, allows "what-if" simulations for lifestyle changes, and provides personalized health optimization strategies.'
    },
    {
      question: 'How does the Drug Interaction Checker work?',
      answer: 'Enter your medications, allergies, and medical conditions. Our AI analyzes drug-drug interactions, disease interactions, pregnancy safety, and provides clinical recommendations with severity levels (critical, high, moderate, low).'
    },
    {
      question: 'Is the CBT Chatbot a replacement for therapy?',
      answer: 'No, the CBT Chatbot is a supplemental tool using evidence-based Cognitive Behavioral Therapy techniques. It\'s available 24/7 for support but should not replace professional mental health treatment. For crisis situations, call 988.'
    },
    {
      question: 'How do I schedule a telemedicine appointment?',
      answer: 'Go to Dashboard → Appointments → Book Consultation. Choose your provider, select a time slot, and complete payment. You\'ll receive a video link before your appointment. Real-time vitals can be shared during the call.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, debit cards, HSA/FSA cards, and digital wallets through our secure Stripe integration. All transactions are PCI-compliant and encrypted.'
    },
    {
      question: 'Can I export my health data?',
      answer: 'Yes! Go to Settings → Privacy Settings → Export Data. You can download your complete health records in PDF or JSON format. This includes all vitals, lab results, medical history, and AI predictions.'
    }
  ];

  const popularArticles = [
    {
      title: 'Complete Guide to Virtual Health Twin',
      category: 'AI Features',
      readTime: '8 min',
      icon: 'ri-user-heart-line'
    },
    {
      title: 'Understanding Your Biological Age',
      category: 'Health Monitoring',
      readTime: '6 min',
      icon: 'ri-time-line'
    },
    {
      title: 'Connecting Wearable Devices',
      category: 'Getting Started',
      readTime: '4 min',
      icon: 'ri-watch-line'
    },
    {
      title: 'HIPAA Compliance & Data Security',
      category: 'Privacy & Security',
      readTime: '5 min',
      icon: 'ri-shield-check-line'
    }
  ];

  return (
    <div className="min-h-screen mesh-gradient">
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-slate-900 mb-4">How can we help you?</h1>
            <p className="text-xl text-slate-600 mb-8">Search our knowledge base or browse categories below</p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for help articles, FAQs, guides..."
                className="w-full px-6 py-5 pl-14 pr-14 border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:outline-none transition-colors text-slate-900 text-lg shadow-lg"
              />
              <i className="ri-search-line absolute left-5 top-1/2 -translate-y-1/2 text-2xl text-slate-400"></i>
              <button className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 whitespace-nowrap cursor-pointer">
                Search
              </button>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-8">Browse by Category</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category, index) => (
                <div
                  key={index}
                  className="card-premium p-6 hover:shadow-xl transition-all duration-300 group cursor-pointer"
                >
                  <div className={`w-14 h-14 bg-gradient-to-br ${category.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <i className={`${category.icon} text-2xl text-white`}></i>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{category.title}</h3>
                  <p className="text-slate-600 mb-4">{category.articles} articles</p>
                  <div className="flex items-center text-blue-600 font-semibold group-hover:gap-2 transition-all duration-300">
                    <span>View articles</span>
                    <i className="ri-arrow-right-line ml-1"></i>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Articles */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-8">Popular Articles</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {popularArticles.map((article, index) => (
                <div
                  key={index}
                  className="card-premium p-6 hover:shadow-xl transition-all duration-300 group cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <i className={`${article.icon} text-xl text-white`}></i>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <i className="ri-folder-line"></i>
                          {article.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <i className="ri-time-line"></i>
                          {article.readTime}
                        </span>
                      </div>
                    </div>
                    <i className="ri-arrow-right-line text-xl text-slate-400 group-hover:text-blue-600 transition-colors"></i>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQs */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-8">Frequently Asked Questions</h2>
            <div className="card-gradient-border p-8">
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="border-b border-slate-200 last:border-0 pb-4 last:pb-0"
                  >
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                      className="w-full flex items-center justify-between text-left py-4 cursor-pointer group"
                    >
                      <span className="text-lg font-semibold text-slate-900 pr-4 group-hover:text-blue-600 transition-colors">
                        {faq.question}
                      </span>
                      <i className={`ri-arrow-${expandedFaq === index ? 'up' : 'down'}-s-line text-2xl text-slate-400 flex-shrink-0 transition-transform duration-300`}></i>
                    </button>
                    {expandedFaq === index && (
                      <div className="pb-4 text-slate-600 leading-relaxed animate-fadeIn">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div className="bg-gradient-to-br from-blue-500 to-teal-500 rounded-3xl shadow-xl p-12 text-center text-white">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-customer-service-2-line text-4xl"></i>
            </div>
            <h2 className="text-3xl font-bold mb-4">Still need help?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Our support team is available 24/7 to assist you with any questions or concerns
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact-us"
                className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 whitespace-nowrap cursor-pointer"
              >
                <i className="ri-mail-send-line mr-2"></i>
                Contact Support
              </Link>
              <a
                href="tel:+15551234567"
                className="px-8 py-4 bg-white/10 border-2 border-white text-white rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 whitespace-nowrap cursor-pointer"
              >
                <i className="ri-phone-line mr-2"></i>
                Call Us: (555) 123-4567
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}