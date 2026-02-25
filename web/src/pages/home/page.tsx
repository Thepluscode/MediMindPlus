import Header from './components/Header';
import HeroSection from './components/HeroSection';
import FeaturesGrid from './components/FeaturesGrid';
import DashboardPreview from './components/DashboardPreview';
import CTASection from './components/CTASection';
import Footer from './components/Footer';
import AIPredictionModels from './components/AIPredictionModels';
import VoiceAnalysis from './components/VoiceAnalysis';
import AnomalyDetection from './components/AnomalyDetection';
import MedicalImaging from './components/MedicalImaging';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroSection />
        <FeaturesGrid />
        <DashboardPreview />
        <AIPredictionModels />
        <VoiceAnalysis />
        <AnomalyDetection />
        <MedicalImaging />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
