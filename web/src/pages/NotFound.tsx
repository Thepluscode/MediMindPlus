import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen mesh-gradient flex flex-col items-center justify-center text-center px-4">
      <div className="animate-fade-in">
        <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-glow-indigo">
          <i className="ri-compass-discover-line text-5xl text-white"></i>
        </div>
        <h1 className="text-8xl font-extrabold text-gradient tracking-tight mb-4">404</h1>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">Page Not Found</h2>
        <p className="text-slate-500 max-w-md mx-auto mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-xl hover:shadow-glow-indigo transition-all"
        >
          <i className="ri-home-line"></i>
          Back to Home
        </Link>
      </div>
    </div>
  );
}