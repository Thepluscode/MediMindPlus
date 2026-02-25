import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../home/components/Header';
import Footer from '../home/components/Footer';

export default function Enterprise() {
  const [activePlan, setActivePlan] = useState('standard');

  const features = [
    {
      icon: 'ri-shield-check-line',
      title: 'Enterprise-Grade Security',
      description: 'HIPAA-compliant infrastructure with SOC 2 Type II certification, end-to-end encryption, and blockchain-verified health records.',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: 'ri-team-line',
      title: 'Unlimited Users',
      description: 'Scale from hundreds to hundreds of thousands of employees with no per-user fees. Volume discounts available.',
      color: 'from-teal-500 to-teal-600'
    },
    {
      icon: 'ri-dashboard-line',
      title: 'Custom Admin Dashboard',
      description: 'White-labeled portal with real-time analytics, population health insights, and ROI tracking for HR teams.',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: 'ri-plug-line',
      title: 'API & Integrations',
      description: 'Connect with existing HR systems, EHRs, benefits platforms, and wellness programs via REST APIs and webhooks.',
      color: 'from-orange-500 to-orange-600'
    },
    {
      icon: 'ri-customer-service-2-line',
      title: 'Dedicated Support',
      description: '24/7 priority support with dedicated account manager, onboarding specialists, and 99.99% uptime SLA.',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: 'ri-bar-chart-box-line',
      title: 'Advanced Analytics',
      description: 'Population health trends, engagement metrics, cost savings analysis, and predictive risk modeling for your workforce.',
      color: 'from-pink-500 to-pink-600'
    }
  ];

  const plans = [
    {
      id: 'standard',
      name: 'Enterprise Standard',
      price: 'Custom',
      description: 'For mid-sized organizations (500-5,000 employees)',
      features: [
        'Unlimited employee accounts',
        'Virtual Health Twin for all users',
        'AI prediction models (10+ diseases)',
        'Wearable device integrations',
        'Basic admin dashboard',
        'Email support (24-hour response)',
        'Standard API access',
        'Quarterly business reviews',
        'HIPAA compliance included',
        'Single sign-on (SSO)'
      ]
    },
    {
      id: 'premium',
      name: 'Enterprise Premium',
      price: 'Custom',
      description: 'For large organizations (5,000-50,000 employees)',
      features: [
        'Everything in Standard, plus:',
        'White-labeled platform',
        'Custom branding & domain',
        'Advanced analytics dashboard',
        'Dedicated account manager',
        'Priority support (4-hour response)',
        'Custom integrations',
        'Monthly business reviews',
        'On-site training sessions',
        'Multi-region deployment',
        'Advanced security features',
        'Custom SLA agreements'
      ],
      popular: true
    },
    {
      id: 'global',
      name: 'Enterprise Global',
      price: 'Custom',
      description: 'For global enterprises (50,000+ employees)',
      features: [
        'Everything in Premium, plus:',
        'Multi-tenant architecture',
        'Global data residency options',
        'Dedicated infrastructure',
        'Custom AI model training',
        'White-glove onboarding',
        '24/7 phone support',
        'Dedicated success team',
        'Custom feature development',
        'Executive business reviews',
        'Unlimited API calls',
        'Advanced compliance (GDPR, CCPA)',
        'Disaster recovery & backup'
      ]
    }
  ];

  const caseStudies = [
    {
      company: 'Fortune 500 Tech Company',
      employees: '75,000',
      results: [
        '43% reduction in hospital readmissions',
        '$12M annual healthcare cost savings',
        '89% employee engagement rate',
        '2,400 early disease detections'
      ],
      image: 'https://readdy.ai/api/search-image?query=modern%20corporate%20office%20building%20with%20glass%20facade%20and%20tech%20company%20employees%20in%20bright%20professional%20environment%20with%20blue%20sky%20and%20clean%20architecture&width=600&height=400&seq=ent1&orientation=landscape'
    },
    {
      company: 'Global Manufacturing Corporation',
      employees: '120,000',
      results: [
        '67% decrease in workplace injuries',
        '31% improvement in chronic disease management',
        '$18M reduction in insurance premiums',
        '94% user satisfaction score'
      ],
      image: 'https://readdy.ai/api/search-image?query=large%20industrial%20manufacturing%20facility%20with%20modern%20safety%20equipment%20and%20diverse%20workers%20in%20clean%20professional%20setting%20with%20natural%20lighting&width=600&height=400&seq=ent2&orientation=landscape'
    },
    {
      company: 'Healthcare System Network',
      employees: '45,000',
      results: [
        '52% faster diagnosis times',
        '78% reduction in medical errors',
        '$9M operational efficiency gains',
        '99.8% data accuracy rate'
      ],
      image: 'https://readdy.ai/api/search-image?query=modern%20hospital%20network%20building%20with%20medical%20professionals%20and%20advanced%20healthcare%20technology%20in%20bright%20clean%20clinical%20environment%20with%20blue%20accents&width=600&height=400&seq=ent3&orientation=landscape'
    }
  ];

  const integrations = [
    { name: 'Workday', icon: 'ri-briefcase-line' },
    { name: 'SAP SuccessFactors', icon: 'ri-building-line' },
    { name: 'Oracle HCM', icon: 'ri-database-line' },
    { name: 'Epic EHR', icon: 'ri-hospital-line' },
    { name: 'Cerner', icon: 'ri-health-book-line' },
    { name: 'Microsoft Azure AD', icon: 'ri-microsoft-line' },
    { name: 'Okta', icon: 'ri-shield-keyhole-line' },
    { name: 'Salesforce', icon: 'ri-customer-service-line' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50">
      <Header />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-blue-600 via-blue-500 to-teal-500 text-white py-24 px-4 mb-16">
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/20"></div>
          <div className="relative max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="text-sm font-semibold">Trusted by 500+ Global Enterprises</span>
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold mb-6">
                  Transform Your Workforce Health
                </h1>
                <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                  Enterprise-grade AI health platform that reduces costs, improves outcomes, and empowers employees with personalized care.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href="#contact"
                    className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 text-center whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-calendar-line mr-2"></i>
                    Schedule Demo
                  </a>
                  <a
                    href="#pricing"
                    className="px-8 py-4 bg-white/10 border-2 border-white text-white rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 text-center whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-file-text-line mr-2"></i>
                    View Pricing
                  </a>
                </div>
              </div>
              <div className="relative">
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold mb-2">$24M</div>
                      <div className="text-blue-100 text-sm">Avg. Annual Savings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold mb-2">47%</div>
                      <div className="text-blue-100 text-sm">Cost Reduction</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold mb-2">92%</div>
                      <div className="text-blue-100 text-sm">Employee Engagement</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold mb-2">99.99%</div>
                      <div className="text-blue-100 text-sm">Uptime SLA</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4">
          {/* Features Grid */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">Enterprise Features</h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Built for scale, security, and seamless integration with your existing infrastructure
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 group"
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <i className={`${feature.icon} text-3xl text-white`}></i>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Plans */}
          <div id="pricing" className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">Enterprise Pricing</h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Flexible plans designed to scale with your organization
              </p>
            </div>
            <div className="grid lg:grid-cols-3 gap-8">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-white rounded-3xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 ${
                    plan.popular ? 'ring-4 ring-blue-500 relative' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="px-6 py-2 bg-gradient-to-r from-blue-600 to-teal-500 text-white text-sm font-bold rounded-full shadow-lg">
                        MOST POPULAR
                      </span>
                    </div>
                  )}
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                    <p className="text-slate-600 text-sm mb-4">{plan.description}</p>
                    <div className="text-4xl font-bold text-blue-600 mb-2">{plan.price}</div>
                    <p className="text-slate-500 text-sm">Contact sales for quote</p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <i className="ri-checkbox-circle-fill text-green-500 text-xl flex-shrink-0 mt-0.5"></i>
                        <span className="text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#contact"
                    className={`block w-full py-4 rounded-xl font-semibold text-center transition-all duration-300 whitespace-nowrap cursor-pointer ${
                      plan.popular
                        ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white hover:shadow-lg'
                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    Contact Sales
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Case Studies */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">Success Stories</h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Real results from organizations transforming employee health
              </p>
            </div>
            <div className="grid lg:grid-cols-3 gap-8">
              {caseStudies.map((study, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300"
                >
                  <div className="relative w-full h-48 overflow-hidden">
                    <img
                      src={study.image}
                      alt={study.company}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{study.company}</h3>
                    <p className="text-slate-600 mb-4">{study.employees} employees</p>
                    <ul className="space-y-2">
                      {study.results.map((result, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <i className="ri-arrow-right-s-line text-blue-600 text-xl flex-shrink-0"></i>
                          <span className="text-slate-700 text-sm">{result}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Integrations */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">Seamless Integrations</h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Connect with your existing HR, EHR, and enterprise systems
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {integrations.map((integration, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 text-center group cursor-pointer"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <i className={`${integration.icon} text-3xl text-white`}></i>
                  </div>
                  <div className="font-semibold text-slate-900">{integration.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <div id="contact" className="bg-gradient-to-br from-blue-600 to-teal-500 rounded-3xl shadow-xl p-12">
            <div className="max-w-3xl mx-auto">
              <div className="text-center text-white mb-8">
                <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Workforce?</h2>
                <p className="text-xl text-blue-100">
                  Schedule a personalized demo and see how MediMindPlus can benefit your organization
                </p>
              </div>
              <div className="bg-white rounded-2xl p-8">
                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name *</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                        placeholder="John Smith"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Work Email *</label>
                      <input
                        type="email"
                        required
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                        placeholder="john@company.com"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Company Name *</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                        placeholder="Acme Corporation"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Number of Employees *</label>
                      <select
                        required
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                      >
                        <option value="">Select range</option>
                        <option value="500-1000">500-1,000</option>
                        <option value="1000-5000">1,000-5,000</option>
                        <option value="5000-10000">5,000-10,000</option>
                        <option value="10000+">10,000+</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
                    <textarea
                      rows={4}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none"
                      placeholder="Tell us about your needs..."
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-send-plane-fill mr-2"></i>
                    Request Demo
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
