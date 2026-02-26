import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../home/components/Header';
import Footer from '../home/components/Footer';

export default function Resources() {
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All Resources', icon: 'ri-grid-line' },
    { id: 'guides', label: 'Guides', icon: 'ri-book-open-line' },
    { id: 'research', label: 'Research', icon: 'ri-flask-line' },
    { id: 'webinars', label: 'Webinars', icon: 'ri-video-line' },
    { id: 'case-studies', label: 'Case Studies', icon: 'ri-file-text-line' },
    { id: 'whitepapers', label: 'Whitepapers', icon: 'ri-article-line' }
  ];

  const resources = [
    {
      category: 'guides',
      title: 'Complete Guide to AI-Powered Health Monitoring',
      description: 'Learn how artificial intelligence is revolutionizing personal health tracking and disease prevention.',
      image: 'https://readdy.ai/api/search-image?query=modern%20healthcare%20professional%20using%20advanced%20AI%20technology%20on%20tablet%20with%20holographic%20medical%20data%20displays%20in%20bright%20clinical%20environment%20with%20blue%20and%20teal%20lighting&width=800&height=500&seq=res1&orientation=landscape',
      readTime: '12 min',
      date: 'March 15, 2024',
      type: 'Guide'
    },
    {
      category: 'research',
      title: 'Clinical Validation of Virtual Health Twin Technology',
      description: 'Peer-reviewed study showing 94% accuracy in predicting cardiovascular events using digital twin simulations.',
      image: 'https://readdy.ai/api/search-image?query=scientific%20research%20laboratory%20with%20medical%20equipment%20DNA%20analysis%20screens%20and%20health%20data%20visualization%20in%20clean%20modern%20setting%20with%20soft%20blue%20lighting&width=800&height=500&seq=res2&orientation=landscape',
      readTime: '25 min',
      date: 'March 10, 2024',
      type: 'Research Paper'
    },
    {
      category: 'webinars',
      title: 'The Future of Predictive Healthcare',
      description: 'Join our Chief Medical Officer for an in-depth discussion on AI predictions and personalized medicine.',
      image: 'https://readdy.ai/api/search-image?query=professional%20medical%20webinar%20presentation%20with%20speaker%20on%20screen%20showing%20healthcare%20analytics%20and%20audience%20in%20modern%20conference%20room%20with%20teal%20accent%20lighting&width=800&height=500&seq=res3&orientation=landscape',
      readTime: '45 min',
      date: 'March 8, 2024',
      type: 'Webinar'
    },
    {
      category: 'case-studies',
      title: 'How Stanford Health Reduced Hospital Readmissions by 43%',
      description: 'Real-world implementation of MediMindPlus in a major healthcare system with measurable outcomes.',
      image: 'https://readdy.ai/api/search-image?query=modern%20hospital%20building%20exterior%20with%20glass%20facade%20and%20medical%20staff%20walking%20in%20bright%20daylight%20with%20clean%20architectural%20design%20and%20blue%20sky&width=800&height=500&seq=res4&orientation=landscape',
      readTime: '8 min',
      date: 'March 5, 2024',
      type: 'Case Study'
    },
    {
      category: 'whitepapers',
      title: 'HIPAA Compliance in AI-Driven Healthcare Platforms',
      description: 'Technical whitepaper on security architecture, encryption standards, and regulatory compliance.',
      image: 'https://readdy.ai/api/search-image?query=cybersecurity%20concept%20with%20digital%20lock%20shield%20and%20encrypted%20medical%20data%20flowing%20through%20secure%20network%20in%20blue%20and%20teal%20color%20scheme%20on%20clean%20background&width=800&height=500&seq=res5&orientation=landscape',
      readTime: '18 min',
      date: 'March 1, 2024',
      type: 'Whitepaper'
    },
    {
      category: 'guides',
      title: 'Biological Age Optimization: A Practical Guide',
      description: 'Evidence-based strategies to reduce your biological age and extend healthspan through lifestyle interventions.',
      image: 'https://readdy.ai/api/search-image?query=healthy%20active%20senior%20person%20exercising%20outdoors%20with%20fitness%20tracker%20showing%20health%20metrics%20in%20bright%20natural%20sunlight%20with%20vibrant%20green%20environment&width=800&height=500&seq=res6&orientation=landscape',
      readTime: '15 min',
      date: 'February 28, 2024',
      type: 'Guide'
    },
    {
      category: 'research',
      title: 'Voice Biomarkers for Early Disease Detection',
      description: 'Groundbreaking research on using voice analysis to detect Parkinson\'s, depression, and respiratory conditions.',
      image: 'https://readdy.ai/api/search-image?query=audio%20waveform%20visualization%20with%20medical%20analysis%20overlay%20showing%20voice%20biomarker%20patterns%20in%20modern%20digital%20interface%20with%20blue%20and%20teal%20gradient%20background&width=800&height=500&seq=res7&orientation=landscape',
      readTime: '20 min',
      date: 'February 25, 2024',
      type: 'Research Paper'
    },
    {
      category: 'webinars',
      title: 'Integrating Wearables into Clinical Practice',
      description: 'Best practices for healthcare providers to leverage continuous monitoring data in patient care.',
      image: 'https://readdy.ai/api/search-image?query=medical%20professional%20demonstrating%20smartwatch%20and%20wearable%20health%20devices%20with%20real-time%20data%20on%20screens%20in%20modern%20clinic%20with%20bright%20clean%20lighting&width=800&height=500&seq=res8&orientation=landscape',
      readTime: '40 min',
      date: 'February 20, 2024',
      type: 'Webinar'
    },
    {
      category: 'case-studies',
      title: 'Enterprise Deployment: 50,000 Employees in 90 Days',
      description: 'How a Fortune 500 company rolled out MediMindPlus across their global workforce.',
      image: 'https://readdy.ai/api/search-image?query=large%20corporate%20office%20building%20with%20diverse%20employees%20using%20health%20technology%20in%20modern%20workspace%20with%20natural%20light%20and%20professional%20atmosphere&width=800&height=500&seq=res9&orientation=landscape',
      readTime: '10 min',
      date: 'February 15, 2024',
      type: 'Case Study'
    }
  ];

  const filteredResources = activeCategory === 'all' 
    ? resources 
    : resources.filter(r => r.category === activeCategory);

  const stats = [
    { value: '150+', label: 'Research Papers', icon: 'ri-file-text-line' },
    { value: '50+', label: 'Clinical Studies', icon: 'ri-flask-line' },
    { value: '200+', label: 'Guides & Articles', icon: 'ri-book-open-line' },
    { value: '75+', label: 'Video Tutorials', icon: 'ri-video-line' }
  ];

  return (
    <div className="min-h-screen mesh-gradient">
      <Header />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-blue-600 via-blue-500 to-teal-500 text-white py-20 px-4 mb-16">
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/20"></div>
          <div className="relative max-w-7xl mx-auto text-center">
            <h1 className="text-5xl lg:text-6xl font-bold mb-6">Knowledge Center</h1>
            <p className="text-xl lg:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Explore research, guides, and insights on AI-powered healthcare innovation
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/help-center"
                className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 whitespace-nowrap cursor-pointer"
              >
                <i className="ri-question-line mr-2"></i>
                Help Center
              </Link>
              <a
                href="#newsletter"
                className="px-8 py-4 bg-white/10 border-2 border-white text-white rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 whitespace-nowrap cursor-pointer"
              >
                <i className="ri-mail-line mr-2"></i>
                Subscribe to Updates
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {stats.map((stat, index) => (
              <div key={index} className="card-premium p-6 text-center hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <i className={`${stat.icon} text-2xl text-white`}></i>
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-2">{stat.value}</div>
                <div className="text-slate-600 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Category Filter */}
          <div className="mb-12">
            <div className="flex flex-wrap gap-3 justify-center">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    activeCategory === cat.id
                      ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-lg'
                      : 'bg-white text-slate-700 hover:shadow-lg'
                  }`}
                >
                  <i className={`${cat.icon} text-lg`}></i>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Resources Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {filteredResources.map((resource, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 group cursor-pointer"
              >
                <div className="relative w-full h-48 overflow-hidden">
                  <img
                    src={resource.image}
                    alt={resource.title}
                    className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-blue-600 text-xs font-semibold rounded-full">
                      {resource.type}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {resource.title}
                  </h3>
                  <p className="text-slate-600 mb-4 leading-relaxed">
                    {resource.description}
                  </p>
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <i className="ri-time-line"></i>
                      {resource.readTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <i className="ri-calendar-line"></i>
                      {resource.date}
                    </span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center text-blue-600 font-semibold group-hover:gap-2 transition-all duration-300">
                      <span>Read More</span>
                      <i className="ri-arrow-right-line ml-1"></i>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Newsletter CTA */}
          <div id="newsletter" className="bg-gradient-to-br from-blue-600 to-teal-500 rounded-3xl shadow-xl p-12 text-center text-white">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-mail-send-line text-4xl"></i>
            </div>
            <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Get the latest research, guides, and healthcare insights delivered to your inbox
            </p>
            <div className="max-w-md mx-auto flex gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 whitespace-nowrap cursor-pointer">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
