import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../home/components/Header';
import Footer from '../home/components/Footer';
import { settingsService } from '../../services/api';

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  bloodType: '',
  height: '',
  weight: '',
};

export default function EditProfile() {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    settingsService.getProfile()
      .then(res => {
        const p = res.data?.user || res.data || {};
        setFormData({
          firstName: p.first_name || '',
          lastName: p.last_name || '',
          email: p.email || '',
          phone: p.phone || '',
          dateOfBirth: p.date_of_birth ? p.date_of_birth.slice(0, 10) : '',
          bloodType: p.blood_type || '',
          height: p.height ? String(p.height) : '',
          weight: p.weight ? String(p.weight) : '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await settingsService.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        bloodType: formData.bloodType,
        height: formData.height ? Number(formData.height) : undefined,
        weight: formData.weight ? Number(formData.weight) : undefined,
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen mesh-gradient">
      <Header />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link to="/profile" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 cursor-pointer">
              <i className="ri-arrow-left-line mr-2"></i>
              Back to Profile
            </Link>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Edit Profile</h1>
            <p className="text-slate-600">Update your personal information and health details</p>
          </div>

          {showSuccess && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg flex items-center gap-3">
              <i className="ri-checkbox-circle-fill text-2xl text-green-500"></i>
              <div>
                <p className="font-semibold text-green-900">Profile Updated Successfully!</p>
                <p className="text-sm text-green-700">Your changes have been saved.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-center gap-3">
              <i className="ri-error-warning-line text-2xl text-red-500"></i>
              <p className="text-red-700 text-sm">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>
          )}

          {loading ? (
            <div className="card-gradient-border p-12 text-center">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-500">Loading your profile...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information */}
              <div className="card-gradient-border p-8">
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
                    <i className="ri-user-line text-white text-xl"></i>
                  </div>
                  Personal Information
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    { label: 'First Name', name: 'firstName', type: 'text', required: true },
                    { label: 'Last Name', name: 'lastName', type: 'text', required: true },
                    { label: 'Email Address', name: 'email', type: 'email', required: true, readOnly: true },
                    { label: 'Phone Number', name: 'phone', type: 'tel', required: false },
                    { label: 'Date of Birth', name: 'dateOfBirth', type: 'date', required: false },
                  ].map(field => (
                    <div key={field.name}>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type={field.type}
                        name={field.name}
                        value={formData[field.name as keyof typeof formData]}
                        onChange={handleChange}
                        required={field.required}
                        readOnly={field.readOnly}
                        className={`w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-slate-900 ${field.readOnly ? 'bg-slate-100 cursor-not-allowed text-slate-500' : ''}`}
                      />
                      {field.readOnly && <p className="text-xs text-slate-400 mt-1">Email cannot be changed here.</p>}
                    </div>
                  ))}

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Blood Type</label>
                    <select
                      name="bloodType"
                      value={formData.bloodType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-slate-900 cursor-pointer"
                    >
                      <option value="">Select blood type</option>
                      {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Health Metrics */}
              <div className="card-gradient-border p-8">
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-green-500 rounded-lg flex items-center justify-center">
                    <i className="ri-heart-pulse-line text-white text-xl"></i>
                  </div>
                  Health Metrics
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Height (inches)</label>
                    <input
                      type="number"
                      name="height"
                      value={formData.height}
                      onChange={handleChange}
                      placeholder="e.g. 67"
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Weight (lbs)</label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      placeholder="e.g. 145"
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-end">
                <Link
                  to="/profile"
                  className="px-8 py-4 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all text-center whitespace-nowrap cursor-pointer"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <i className="ri-loader-4-line animate-spin"></i>
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <i className="ri-save-line"></i>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
