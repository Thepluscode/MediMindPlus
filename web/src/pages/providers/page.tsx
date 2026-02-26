import { Link } from 'react-router-dom';
import Header from '../home/components/Header';
import Footer from '../home/components/Footer';

export default function Providers() {
  const features = [
    {
      icon: 'ri-stethoscope-line',
      title: 'Clinical Decision Support',
      description: 'AI-powered recommendations based on patient history, lab results, and latest clinical guidelines.',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: 'ri-time-line',
      title: 'Save 2+ Hours Daily',
      description: 'Automated documentation, smart charting, and voice-to-text clinical notes reduce administrative burden.',
      color: 'from-teal-500 to-teal-600'
    },
    {
      icon: 'ri-heart-pulse-line',
      title: 'Remote Patient Monitoring',
      description: 'Real-time vitals from wearables, automated alerts for anomalies, and continuous care between visits.',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: 'ri-brain-line',
      title: 'AI Diagnostic Assistant',
      description: 'Analyze medical imaging, predict disease risk, and identify patterns across 10+ conditions.',
      color: 'from-orange-500 to-orange-600'
    },
    {
      icon: 'ri-shield-check-line',
      title: 'HIPAA-Compliant Platform',
      description: 'End-to-end encryption, SOC 2 Type II certified, blockchain-verified records, and audit trails.',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: 'ri-calendar-check-line',
      title: 'Integrated Scheduling',
      description: 'Seamless appointment booking, telemedicine integration, and automated patient reminders.',
      color: 'from-pink-500 to-pink-600'
    }
  ];

  const benefits = [
    {
      stat: '47%',
      label: 'Reduction in Diagnostic Errors',
      description: 'AI-assisted diagnosis catches what humans might miss'
    },
    {
      stat: '2.3hrs',
      label: 'Time Saved Per Day',
      description: 'Automated documentation and smart workflows'
    },
    {
      stat: '89%',
      label: 'Patient Satisfaction',
      description: 'Better outcomes through continuous monitoring'
    },
    {
      stat: '34%',
      label: 'Increase in Revenue',
      description: 'See more patients with streamlined operations'
    }
  ];

  const tools = [
    {
      title: 'Virtual Health Twin',
      description: 'Create digital simulations of patient biology to predict treatment outcomes and optimize care plans.',
      icon: 'ri-user-heart-line',
      image: 'https://readdy.ai/api/search-image?query=medical%20professional%20using%20advanced%20holographic%20patient%20health%20twin%20visualization%20on%20tablet%20in%20modern%20clinic%20with%20blue%20and%20teal%20lighting%20and%20clean%20environment&width=700&height=450&seq=prov1&orientation=landscape'
    },
    {
      title: 'AI Medical Imaging',
      description: 'Instant analysis of X-rays, MRIs, and CT scans with 95%+ accuracy for faster, more confident diagnoses.',
      icon: 'ri-image-line',
      image: 'https://readdy.ai/api/search-image?query=radiologist%20examining%20AI-analyzed%20medical%20scans%20on%20multiple%20monitors%20showing%20detailed%20imaging%20results%20in%20professional%20radiology%20room%20with%20soft%20blue%20lighting&width=700&height=450&seq=prov2&orientation=landscape'
    },
    {
      title: 'Clinical Scribe AI',
      description: 'Voice-to-text documentation that writes clinical notes in real-time during patient consultations.',
      icon: 'ri-mic-line',
      image: 'https://readdy.ai/api/search-image?query=doctor%20consulting%20with%20patient%20while%20AI%20system%20transcribes%20notes%20on%20screen%20in%20bright%20modern%20examination%20room%20with%20natural%20lighting%20and%20professional%20atmosphere&width=700&height=450&seq=prov3&orientation=landscape'
    },
    {
      title: 'Drug Interaction Checker',
      description: 'Instantly verify medication safety, check for interactions, and get dosing recommendations.',
      icon: 'ri-capsule-line',
      image: 'https://readdy.ai/api/search-image?query=pharmacist%20using%20digital%20drug%20interaction%20analysis%20system%20with%20medication%20database%20on%20screen%20in%20clean%20modern%20pharmacy%20with%20bright%20lighting&width=700&height=450&seq=prov4&orientation=landscape'
    }
  ];

  const testimonials = [
    {
      name: 'Dr. Sarah Chen',
      role: 'Cardiologist, Stanford Medical Center',
      image: 'https://readdy.ai/api/search-image?query=professional%20female%20Asian%20cardiologist%20in%20white%20coat%20smiling%20confidently%20in%20modern%20hospital%20setting%20with%20medical%20equipment%20and%20bright%20clean%20lighting&width=200&height=200&seq=doc1&orientation=squarish',
      quote: 'MediMindPlus has transformed my practice. The AI predictions caught 3 high-risk patients last month that I might have missed. It\'s like having a second opinion on every case.'
    },
    {
      name: 'Dr. Michael Rodriguez',
      role: 'Family Medicine, Mayo Clinic',
      image: 'https://readdy.ai/api/search-image?query=professional%20male%20Hispanic%20family%20doctor%20in%20white%20coat%20with%20stethoscope%20smiling%20warmly%20in%20bright%20modern%20clinic%20examination%20room%20with%20natural%20lighting&width=200&height=200&seq=doc2&orientation=squarish',
      quote: 'The time savings are incredible. I used to spend 2 hours on documentation after clinic. Now it\'s done automatically during visits. I can see 30% more patients without burnout.'
    },
    {
      name: 'Dr. Emily Thompson',
      role: 'Radiologist, Johns Hopkins',
      image: 'https://readdy.ai/api/search-image?query=professional%20female%20radiologist%20in%20medical%20scrubs%20reviewing%20imaging%20results%20with%20confident%20expression%20in%20modern%20radiology%20department%20with%20soft%20blue%20lighting&width=200&height=200&seq=doc3&orientation=squarish',
      quote: 'The AI imaging analysis is remarkably accurate. It highlights areas of concern I need to review and provides differential diagnoses. It\'s made me a better, faster radiologist.'
    }
  ];

  const pricing = [
    {
      name: 'Solo Practice',
      price: '$199',
      period: '/month',
      description: 'Perfect for individual practitioners',
      features: [
        'Up to 100 patients',
        'AI clinical decision support',
        'Basic remote monitoring',
        'Voice-to-text notes',
        'Email support',
        'HIPAA-compliant storage'
      ]
    },
    {
      name: 'Group Practice',
      price: '$499',
      period: '/month',
      description: 'For small to medium practices',
      features: [
        'Up to 500 patients',
        'Everything in Solo, plus:',
        'Multi-provider dashboard',
        'Advanced analytics',
        'Priority support',
        'Custom integrations',
        'Team collaboration tools'
      ],
      popular: true
    },
    {
      name: 'Hospital System',
      price: 'Custom',
      period: '',
      description: 'Enterprise-grade for large organizations',
      features: [
        'Unlimited patients',
        'Everything in Group, plus:',
        'White-labeled platform',
        'Dedicated account manager',
        '24/7 phone support',
        'Custom AI model training',
        'On-premise deployment option'
      ]
    }
  ];

  return (
    <div className="min-h-screen mesh-gradient">
      <Header />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-blue-600 via-blue-500 to-teal-500 text-white py-24 px-4 mb-16">
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/20"></div>
          <div className="relative max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
                  <i className="ri-award-line text-yellow-300"></i>
                  <span className="text-sm font-semibold">Trusted by 15,000+ Healthcare Providers</span>
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold mb-6">
                  AI-Powered Tools for Modern Healthcare Providers
                </h1>
                <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                  Enhance patient care, reduce administrative burden, and make faster, more accurate diagnoses with our clinical AI platform.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href="#demo"
                    className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 text-center whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-play-circle-line mr-2"></i>
                    Watch Demo
                  </a>
                  <a
                    href="#pricing"
                    className="px-8 py-4 bg-white/10 border-2 border-white text-white rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 text-center whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-price-tag-3-line mr-2"></i>
                    View Pricing
                  </a>
                </div>
              </div>
              <div className="relative">
                <div className="relative w-full h-96 rounded-3xl overflow-hidden shadow-2xl">
                  <img
                    src="https://readdy.ai/api/search-image?query=confident%20medical%20team%20of%20diverse%20doctors%20and%20nurses%20with%20tablets%20and%20stethoscopes%20in%20modern%20bright%20hospital%20corridor%20with%20natural%20lighting%20and%20professional%20atmosphere&width=800&height=600&seq=provhero&orientation=landscape"
                    alt="Healthcare Providers"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4">
          {/* Benefits Stats */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-all duration-300"
              >
                <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent mb-3">
                  {benefit.stat}
                </div>
                <div className="text-lg font-bold text-slate-900 mb-2">{benefit.label}</div>
                <div className="text-sm text-slate-600">{benefit.description}</div>
              </div>
            ))}
          </div>

          {/* Features Grid */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Clinical Features Built for Providers</h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Everything you need to deliver exceptional patient care with AI assistance
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

          {/* Tools Showcase */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Powerful Clinical Tools</h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Advanced AI capabilities that enhance your clinical decision-making
              </p>
            </div>
            <div className="space-y-12">
              {tools.map((tool, index) => (
                <div
                  key={index}
                  className={`card-gradient-border overflow-hidden grid lg:grid-cols-2 gap-8 items-center ${
                    index % 2 === 1 ? 'lg:grid-flow-dense' : ''
                  }`}
                >
                  <div className={`p-8 lg:p-12 ${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center mb-6">
                      <i className={`${tool.icon} text-3xl text-white`}></i>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 mb-4">{tool.title}</h3>
                    <p className="text-lg text-slate-600 leading-relaxed mb-6">{tool.description}</p>
                    <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 whitespace-nowrap cursor-pointer">
                      Learn More
                      <i className="ri-arrow-right-line ml-2"></i>
                    </button>
                  </div>
                  <div className={`relative w-full h-96 ${index % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}`}>
                    <img
                      src={tool.image}
                      alt={tool.title}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonials */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Trusted by Leading Physicians</h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Hear from healthcare providers transforming their practice with AI
              </p>
            </div>
            <div className="grid lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                      <img
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{testimonial.name}</div>
                      <div className="text-sm text-slate-600">{testimonial.role}</div>
                    </div>
                  </div>
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <i key={i} className="ri-star-fill text-yellow-400 text-lg"></i>
                    ))}
                  </div>
                  <p className="text-slate-700 leading-relaxed italic">"{testimonial.quote}"</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div id="pricing" className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Provider Pricing</h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Flexible plans for practices of all sizes
              </p>
            </div>
            <div className="grid lg:grid-cols-3 gap-8">
              {pricing.map((plan, index) => (
                <div
                  key={index}
                  className={`card-gradient-border p-8 hover:shadow-2xl transition-all duration-300 ${
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
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                    <p className="text-slate-600 text-sm mb-4">{plan.description}</p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-5xl font-bold text-blue-600">{plan.price}</span>
                      <span className="text-slate-600">{plan.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <i className="ri-checkbox-circle-fill text-green-500 text-xl flex-shrink-0 mt-0.5"></i>
                        <span className="text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap cursor-pointer ${
                      plan.popular
                        ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white hover:shadow-lg'
                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {plan.price === 'Custom' ? 'Contact Sales' : 'Start Free Trial'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div id="demo" className="bg-gradient-to-br from-blue-600 to-teal-500 rounded-3xl shadow-xl p-12 text-center text-white">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-stethoscope-line text-4xl"></i>
            </div>
            <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Practice?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join 15,000+ providers using AI to deliver better patient outcomes
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/pricing"
                className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 whitespace-nowrap cursor-pointer"
              >
                <i className="ri-rocket-line mr-2"></i>
                Start Free Trial
              </Link>
              <a
                href="tel:+15551234567"
                className="px-8 py-4 bg-white/10 border-2 border-white text-white rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 whitespace-nowrap cursor-pointer"
              >
                <i className="ri-phone-line mr-2"></i>
                Call Sales: (555) 123-4567
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
