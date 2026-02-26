import { useState } from 'react';
import { Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import Header from '../home/components/Header';
import Footer from '../home/components/Footer';
import logger from '../../utils/logger';

// Initialize Stripe (replace with your publishable key)
const stripePromise = loadStripe('pk_test_YOUR_PUBLISHABLE_KEY');

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  const plans = [
    {
      name: 'Basic',
      description: 'Essential health monitoring for individuals',
      monthlyPrice: 29,
      annualPrice: 290,
      priceId: {
        monthly: 'price_basic_monthly',
        annual: 'price_basic_annual'
      },
      color: 'from-slate-500 to-slate-600',
      features: [
        'Basic Health Dashboard',
        'Vital Signs Tracking',
        'Health Data Logging',
        'Monthly Health Reports',
        'Email Support',
        '5 GB Storage',
        'Mobile App Access'
      ],
      limitations: [
        'No AI Predictions',
        'No Virtual Health Twin',
        'No Drug Interaction Checker'
      ]
    },
    {
      name: 'Professional',
      description: 'Advanced AI features for health optimization',
      monthlyPrice: 79,
      annualPrice: 790,
      priceId: {
        monthly: 'price_professional_monthly',
        annual: 'price_professional_annual'
      },
      color: 'from-blue-500 to-teal-500',
      popular: true,
      features: [
        'Everything in Basic',
        'AI Prediction Models (10+ diseases)',
        'Biological Age Calculator',
        'Drug Interaction Checker',
        'Voice Analysis &amp; Biomarkers',
        'Anomaly Detection Alerts',
        'Medical Imaging Analysis',
        'CBT Therapy Chatbot (24/7)',
        'Wearable Device Integration',
        'Priority Email Support',
        '50 GB Storage',
        'Advanced Analytics Dashboard'
      ],
      limitations: []
    },
    {
      name: 'Enterprise',
      description: 'Complete healthcare platform with Virtual Health Twin',
      monthlyPrice: 149,
      annualPrice: 1490,
      priceId: {
        monthly: 'price_enterprise_monthly',
        annual: 'price_enterprise_annual'
      },
      color: 'from-purple-500 to-pink-500',
      features: [
        'Everything in Professional',
        'Virtual Health Twin ($150M Feature)',
        'Treatment Outcome Predictions',
        'What-If Simulations',
        'Personalized Longevity Plans',
        'Telemedicine Consultations',
        'Provider Dashboard Access',
        'Secure Messaging with Doctors',
        'Prescription Management',
        'Lab Results Integration',
        'EHR Connections (Epic, Cerner)',
        '24/7 Phone Support',
        'Unlimited Storage',
        'White-Label Options',
        'API Access'
      ],
      limitations: []
    }
  ];

  const addons = [
    {
      name: 'Genetic Testing',
      price: 199,
      priceId: 'price_addon_genetic',
      icon: 'ri-dna-line',
      description: 'Comprehensive DNA analysis for personalized health insights'
    },
    {
      name: 'Continuous Glucose Monitor',
      price: 89,
      priceId: 'price_addon_cgm',
      icon: 'ri-pulse-line',
      description: 'Real-time glucose tracking with Dexcom G7 integration'
    },
    {
      name: 'Mental Health Package',
      price: 49,
      priceId: 'price_addon_mental',
      icon: 'ri-mental-health-line',
      description: 'Enhanced CBT therapy + crisis intervention support'
    },
    {
      name: 'Family Plan (4 members)',
      price: 99,
      priceId: 'price_addon_family',
      icon: 'ri-group-line',
      description: 'Add up to 4 family members to your plan'
    }
  ];

  const faqs = [
    {
      question: 'Can I switch plans anytime?',
      answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any charges.'
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes, we offer a 14-day free trial for Professional and Enterprise plans. No credit card required to start.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, debit cards, HSA/FSA cards, and digital wallets through our secure Stripe integration.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Absolutely. We use end-to-end encryption, HIPAA-compliant storage, and blockchain technology. Your data is never sold to third parties.'
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes, you can cancel your subscription at any time. You\'ll continue to have access until the end of your billing period.'
    },
    {
      question: 'Do you offer discounts for healthcare providers?',
      answer: 'Yes! We offer special pricing for healthcare providers, clinics, and hospitals. Contact our sales team for custom quotes.'
    }
  ];

  const handleCheckout = async (priceId: string, planName: string) => {
    setLoading(priceId);
    
    try {
      // In a real implementation, you would call your backend to create a checkout session
      // For now, we'll show a demo message
      alert(`Redirecting to checkout for ${planName}...\n\nIn production, this would:\n1. Create a Stripe checkout session\n2. Redirect to Stripe payment page\n3. Handle successful payment\n4. Activate subscription`);
      
      // Example of real implementation:
      // const response = await fetch('/api/create-checkout-session', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ priceId, billingCycle })
      // });
      // const { sessionId } = await response.json();
      // const stripe = await stripePromise;
      // await stripe?.redirectToCheckout({ sessionId });
      
    } catch (error) {
      logger.error('Checkout error', {
        service: 'pricing',
        priceId,
        planName,
        billingCycle,
        error: error instanceof Error ? error.message : String(error)
      });
      alert('Payment processing error. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const getPrice = (plan: typeof plans[0]) => {
    return billingCycle === 'monthly' ? plan.monthlyPrice : Math.floor(plan.annualPrice / 12);
  };

  const getSavings = (plan: typeof plans[0]) => {
    const monthlyCost = plan.monthlyPrice * 12;
    const savings = monthlyCost - plan.annualPrice;
    return Math.round((savings / monthlyCost) * 100);
  };

  return (
    <div className="min-h-screen mesh-gradient">
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
              Advanced AI-powered healthcare platform with features worth over $400M in development
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-4 bg-white rounded-full p-2 shadow-lg">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 cursor-pointer whitespace-nowrap ${
                  billingCycle === 'monthly'
                    ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 cursor-pointer whitespace-nowrap ${
                  billingCycle === 'annual'
                    ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Annual
                <span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`card-gradient-border overflow-hidden transition-all duration-300 hover:scale-105 ${
                  plan.popular ? 'ring-4 ring-blue-500 relative' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-teal-500 text-white px-6 py-2 rounded-bl-2xl font-semibold text-sm">
                    <i className="ri-star-fill mr-1"></i>
                    Most Popular
                  </div>
                )}

                <div className="p-8">
                  {/* Plan Header */}
                  <div className={`w-16 h-16 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center mb-4`}>
                    <i className="ri-vip-crown-line text-3xl text-white"></i>
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                  <p className="text-slate-600 mb-6">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-slate-900">${getPrice(plan)}</span>
                      <span className="text-slate-600">/month</span>
                    </div>
                    {billingCycle === 'annual' && (
                      <p className="text-sm text-green-600 font-semibold mt-2">
                        Save {getSavings(plan)}% with annual billing
                      </p>
                    )}
                    {billingCycle === 'monthly' && (
                      <p className="text-sm text-slate-500 mt-2">
                        or ${plan.annualPrice}/year (save {getSavings(plan)}%)
                      </p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleCheckout(plan.priceId[billingCycle], plan.name)}
                    disabled={loading === plan.priceId[billingCycle]}
                    className={`block w-full px-6 py-4 rounded-xl font-bold text-center transition-all duration-300 mb-6 cursor-pointer whitespace-nowrap ${
                      plan.popular
                        ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white hover:shadow-xl'
                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                    } ${loading === plan.priceId[billingCycle] ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loading === plan.priceId[billingCycle] ? (
                      <span className="flex items-center justify-center gap-2">
                        <i className="ri-loader-4-line animate-spin"></i>
                        Processing...
                      </span>
                    ) : (
                      plan.popular ? 'Start Free Trial' : 'Get Started'
                    )}
                  </button>

                  {/* Features */}
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      What's Included:
                    </p>
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start gap-3">
                        <i className="ri-checkbox-circle-fill text-green-500 text-lg mt-0.5 flex-shrink-0"></i>
                        <span className="text-slate-700 text-sm" dangerouslySetInnerHTML={{ __html: feature }}></span>
                      </div>
                    ))}
                    {plan.limitations.map((limitation, limitIndex) => (
                      <div key={limitIndex} className="flex items-start gap-3 opacity-50">
                        <i className="ri-close-circle-line text-slate-400 text-lg mt-0.5 flex-shrink-0"></i>
                        <span className="text-slate-500 text-sm line-through">{limitation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add-ons */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Premium Add-ons</h2>
              <p className="text-xl text-slate-600">Enhance your plan with specialized features</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {addons.map((addon, index) => (
                <div
                  key={index}
                  className="card-premium p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <i className={`${addon.icon} text-2xl text-white`}></i>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{addon.name}</h3>
                  <p className="text-sm text-slate-600 mb-4">{addon.description}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-slate-900">${addon.price}</span>
                    <span className="text-slate-600">/month</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comparison Table */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Feature Comparison</h2>
              <p className="text-xl text-slate-600">See what's included in each plan</p>
            </div>

            <div className="card-gradient-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-500 to-teal-500 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left font-bold">Features</th>
                      <th className="px-6 py-4 text-center font-bold">Basic</th>
                      <th className="px-6 py-4 text-center font-bold">Professional</th>
                      <th className="px-6 py-4 text-center font-bold">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {[
                      { feature: 'Health Dashboard', basic: true, pro: true, enterprise: true },
                      { feature: 'Vital Signs Tracking', basic: true, pro: true, enterprise: true },
                      { feature: 'AI Prediction Models', basic: false, pro: true, enterprise: true },
                      { feature: 'Biological Age Calculator', basic: false, pro: true, enterprise: true },
                      { feature: 'Drug Interaction Checker', basic: false, pro: true, enterprise: true },
                      { feature: 'Virtual Health Twin', basic: false, pro: false, enterprise: true },
                      { feature: 'Telemedicine Consultations', basic: false, pro: false, enterprise: true },
                      { feature: 'Storage', basic: '5 GB', pro: '50 GB', enterprise: 'Unlimited' },
                      { feature: 'Support', basic: 'Email', pro: 'Priority Email', enterprise: '24/7 Phone' }
                    ].map((row, index) => (
                      <tr key={index} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-semibold text-slate-900">{row.feature}</td>
                        <td className="px-6 py-4 text-center">
                          {typeof row.basic === 'boolean' ? (
                            row.basic ? (
                              <i className="ri-checkbox-circle-fill text-2xl text-green-500"></i>
                            ) : (
                              <i className="ri-close-circle-line text-2xl text-slate-300"></i>
                            )
                          ) : (
                            <span className="text-slate-700">{row.basic}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {typeof row.pro === 'boolean' ? (
                            row.pro ? (
                              <i className="ri-checkbox-circle-fill text-2xl text-green-500"></i>
                            ) : (
                              <i className="ri-close-circle-line text-2xl text-slate-300"></i>
                            )
                          ) : (
                            <span className="text-slate-700">{row.pro}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {typeof row.enterprise === 'boolean' ? (
                            row.enterprise ? (
                              <i className="ri-checkbox-circle-fill text-2xl text-green-500"></i>
                            ) : (
                              <i className="ri-close-circle-line text-2xl text-slate-300"></i>
                            )
                          ) : (
                            <span className="text-slate-700">{row.enterprise}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* FAQs */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Frequently Asked Questions</h2>
              <p className="text-xl text-slate-600">Everything you need to know about our pricing</p>
            </div>

            <div className="max-w-4xl mx-auto space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="card-premium p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-3">
                    <i className="ri-question-line text-blue-500 text-xl"></i>
                    {faq.question}
                  </h3>
                  <p className="text-slate-600 pl-9">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-br from-blue-500 to-teal-500 rounded-3xl shadow-xl p-12 text-center text-white">
            <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Health?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of users already optimizing their health with AI-powered insights
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold hover:shadow-lg transition-all duration-300 whitespace-nowrap cursor-pointer"
              >
                Start 14-Day Free Trial
              </Link>
              <Link
                to="/contact-us"
                className="px-8 py-4 bg-white/10 border-2 border-white text-white rounded-xl font-bold hover:bg-white/20 transition-all duration-300 whitespace-nowrap cursor-pointer"
              >
                Contact Sales
              </Link>
            </div>
            <p className="text-sm text-blue-100 mt-6">
              No credit card required • Cancel anytime • HIPAA Compliant
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
