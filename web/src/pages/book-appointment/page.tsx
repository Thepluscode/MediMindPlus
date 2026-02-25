import { useState, useEffect } from 'react';
import Header from '../home/components/Header';
import Footer from '../home/components/Footer';
import { paymentService } from '../../services/payment';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import logger from '../../utils/logger';

// Initialize Stripe outside component
const stripePromise = loadStripe(paymentService.getPublishableKey());

const PaymentForm = ({ clientSecret, onSuccess, onCancel }: any) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement)!,
      },
    });

    if (result.error) {
      setError(result.error.message || 'Payment failed');
      setProcessing(false);
    } else {
      if (result.paymentIntent?.status === 'succeeded') {
        onSuccess(result.paymentIntent.id);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 border rounded-lg bg-white">
      <h3 className="text-lg font-bold mb-4">Complete Payment</h3>
      <div className="mb-4">
        <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
      </div>
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 bg-teal-600 text-white py-2 rounded-lg"
        >
          {processing ? 'Processing...' : 'Pay Now'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-gray-300 py-2 rounded-lg"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};


export default function BookAppointmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const providerIdFromUrl = searchParams.get('providerId');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    appointmentType: '',
    preferredDate: '',
    preferredTime: '',
    reason: '',
    additionalNotes: ''
  });
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      // 1. Book Consultation
      const bookResponse = await axios.post(`${API_URL}/api/consultations/book`, {
        ...formData,
        // Map form fields to backend expectation (simplified for MVP)
        providerId: providerIdFromUrl || 'demo-provider-id', // In real app, select from list
        startTime: `${formData.preferredDate}T${convertTo24Hour(formData.preferredTime)}`
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      const newConsultationId = bookResponse.data.data.id;
      setConsultationId(newConsultationId);

      // 2. Create Payment Intent
      const paymentResponse = await paymentService.createPaymentIntent(newConsultationId, 5000); // $50.00
      setClientSecret(paymentResponse.clientSecret);

      setStep('payment');

    } catch (error) {
      logger.error('Booking failed', {
        service: 'appointment-booking',
        providerId: providerIdFromUrl,
        formData: { ...formData, email: '[REDACTED]', phone: '[REDACTED]' },
        error: error instanceof Error ? error.message : String(error)
      });
      alert('Booking failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    if (!consultationId) return;
    await paymentService.confirmPayment(consultationId, paymentIntentId);
    setStep('success');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Helper
  const convertTo24Hour = (timeStr: string) => {
    // Very basic conversion, assume valid input like "9:00 AM"
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = String(parseInt(hours, 10) + 12);
    return `${hours}:${minutes}:00`;
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="pt-24 pb-20 max-w-4xl mx-auto text-center">
          <div className="bg-green-50 p-8 rounded-xl">
            <h2 className="text-3xl font-bold text-green-800 mb-4">Booking Confirmed!</h2>
            <p className="mb-6">Your appointment has been scheduled and paid for.</p>
            <button onClick={() => navigate('/dashboard')} className="bg-teal-600 text-white px-6 py-2 rounded-lg">Go to Dashboard</button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">Book an Appointment</h1>
          </div>

          {step === 'form' && (
            <div className="bg-gray-50 rounded-2xl p-8 lg:p-10">
              <form onSubmit={handleBookingSubmit} className="space-y-6">
                {/* Simplified Form Content - Keeping original fields */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className="w-full px-4 py-3 rounded-lg border border-gray-300" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className="w-full px-4 py-3 rounded-lg border border-gray-300" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-3 rounded-lg border border-gray-300" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="w-full px-4 py-3 rounded-lg border border-gray-300" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input type="date" name="preferredDate" value={formData.preferredDate} onChange={handleChange} required min={new Date().toISOString().split('T')[0]} className="w-full px-4 py-3 rounded-lg border border-gray-300" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                    <select name="preferredTime" value={formData.preferredTime} onChange={handleChange} required className="w-full px-4 py-3 rounded-lg border border-gray-300">
                      <option value="">Select time</option>
                      <option value="9:00 AM">9:00 AM</option>
                      <option value="12:00 PM">12:00 PM</option>
                      <option value="3:00 PM">3:00 PM</option>
                      {/* ... other options ... */}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                  <textarea name="reason" value={formData.reason} onChange={handleChange} required rows={3} className="w-full px-4 py-3 rounded-lg border border-gray-300" />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-teal-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : 'Continue to Payment ($50.00)'}
                </button>
              </form>
            </div>
          )}

          {step === 'payment' && clientSecret && (
            <div className="bg-gray-50 rounded-2xl p-8 lg:p-10">
              <h2 className="text-xl font-bold mb-4">Payment Information</h2>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm
                  clientSecret={clientSecret}
                  onSuccess={handlePaymentSuccess}
                  onCancel={() => setStep('form')}
                />
              </Elements>
            </div>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
}
