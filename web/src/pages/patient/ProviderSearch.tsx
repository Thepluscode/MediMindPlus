import { useState, useEffect } from 'react';
import Header from '../home/components/Header';
import Footer from '../home/components/Footer';
import { consultationService } from '../../services/consultation';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Star, Calendar } from 'lucide-react';
import logger from '../../utils/logger';

export default function ProviderSearchPage() {
    const navigate = useNavigate();
    const [providers, setProviders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ specialty: '', location: '' });

    useEffect(() => {
        loadProviders();
    }, []);

    const loadProviders = async () => {
        setLoading(true);
        try {
            const data = await consultationService.searchProviders(filters);
            setProviders(data.providers || []);
        } catch (error) {
            logger.error('Failed to load providers', {
                service: 'provider-search',
                filters,
                error: error instanceof Error ? error.message : String(error)
            });
            // Fallback for demo if backend is empty/error
            setProviders([
                { id: '1', first_name: 'Sarah', last_name: 'Chen', specialty: 'Cardiology', rating: 4.9, location: 'San Francisco, CA', image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300&h=300' },
                { id: '2', first_name: 'Michael', last_name: 'Rodriguez', specialty: 'General Practice', rating: 4.8, location: 'New York, NY', image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300&h=300' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadProviders();
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Find a Specialist</h1>
                    <form onSubmit={handleSearch} className="flex gap-4 p-4 bg-white rounded-xl shadow-sm">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Specialty, doctor name..."
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                                value={filters.specialty}
                                onChange={e => setFilters({ ...filters, specialty: e.target.value })}
                            />
                        </div>
                        <div className="flex-1 relative">
                            <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="City, state, or zip"
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                                value={filters.location}
                                onChange={e => setFilters({ ...filters, location: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="bg-teal-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-teal-700">
                            Search
                        </button>
                    </form>
                </div>

                {loading ? (
                    <div className="text-center py-20">Loading...</div> // Replace with Skeleton
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {providers.map(provider => (
                            <div key={provider.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                <div className="flex p-6 gap-4">
                                    <img src={provider.image || `https://ui-avatars.com/api/?name=${provider.first_name}+${provider.last_name}`} alt="" className="w-20 h-20 rounded-full object-cover bg-gray-100" />
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900">Dr. {provider.first_name} {provider.last_name}</h3>
                                        <p className="text-teal-600 font-medium">{provider.specialty}</p>
                                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                            <Star size={16} className="text-yellow-400 fill-current" />
                                            <span>{provider.rating}</span>
                                            <span>•</span>
                                            <span>{provider.location || 'Remote'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-6 pb-6 pt-0">
                                    <button
                                        onClick={() => navigate(`/book-appointment?providerId=${provider.id}`)}
                                        className="w-full flex items-center justify-center gap-2 bg-gray-50 text-gray-900 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 font-medium"
                                    >
                                        <Calendar size={18} />
                                        Book Appointment
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
