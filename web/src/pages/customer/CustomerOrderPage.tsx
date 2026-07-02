import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface LaundryItem {
  id: string;
  name: string;
  unit: string;
}

interface Address {
  id: string;
  label: string;
  fullAddress: string;
  isPrimary?: boolean;
}

interface Service {
  id: string;
  type: 'regular' | 'express' | 'premium';
  name: string;
  description: string;
  pricePerKg: number;
  estimatedDays: number;
  icon: string;
}

const SERVICES: Service[] = [
  {
    id: 'regular',
    type: 'regular',
    name: 'Regular',
    description: 'Standard cleaning with washing & drying',
    pricePerKg: 5000,
    estimatedDays: 3,
    icon: '👔',
  },
  {
    id: 'express',
    type: 'express',
    name: 'Express',
    description: 'Fast turnaround with priority processing',
    pricePerKg: 7500,
    estimatedDays: 1,
    icon: '⚡',
  },
  {
    id: 'premium',
    type: 'premium',
    name: 'Premium',
    description: 'Premium care with ironing & folding included',
    pricePerKg: 10000,
    estimatedDays: 2,
    icon: '✨',
  },
];

type Step = 1 | 2 | 3;

export default function CustomerOrderPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [items, setItems] = useState<LaundryItem[]>([]);
  
  // Form state
  const [selectedAddress, setSelectedAddress] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [note, setNote] = useState('');
  const [selectedService, setSelectedService] = useState<'regular' | 'express' | 'premium'>('regular');
  const [totalKg, setTotalKg] = useState('');
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [itemsError, setItemsError] = useState('');
  const [itemsLoading, setItemsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setItemsLoading(false);
        return;
      }

      setItemsError('');
      setItemsLoading(true);

      try {
        const [addressRes, itemRes] = await Promise.all([
          fetch(`${API}/api/addresses`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/api/customers/items`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (!addressRes.ok) {
          const error = await addressRes.json();
          throw new Error(error.message || 'Failed to load addresses');
        }
        if (!itemRes.ok) {
          const error = await itemRes.json();
          throw new Error(error.message || 'Failed to load laundry items');
        }

        const addressesData = await addressRes.json();
        const itemsData = await itemRes.json();
        const addressList = addressesData.data || [];
        setAddresses(addressList);
        setSelectedAddress((current) =>
          current || addressList.find((address: Address) => address.isPrimary)?.id || addressList[0]?.id || '',
        );
        setItems(itemsData.data || []);
      } catch (error) {
        setItemsError(error instanceof Error ? error.message : 'Gagal memuat item laundry');
      } finally {
        setItemsLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const handleItemChange = (itemId: string, quantity: string) => {
    const parsed = Number(quantity);
    setSelectedItems((current) => ({
      ...current,
      [itemId]: Number.isNaN(parsed) ? 0 : parsed,
    }));
  };

  const getSelectedService = () => SERVICES.find((s) => s.type === selectedService)!;
  const totalPrice = Number(totalKg) * getSelectedService().pricePerKg || 0;
  const selectedItemEntries = Object.entries(selectedItems).filter(([, quantity]) => Number(quantity) > 0);
  const selectedItemCount = selectedItemEntries.reduce((sum, [, quantity]) => sum + Number(quantity), 0);

  const canProceedStep1 = selectedAddress && pickupDate;
  const canProceedStep2 = Number(totalKg) > 0 && selectedItemEntries.length > 0;

  const handleSubmit = async () => {
    if (!token) {
      setMessage('Please log in first');
      return;
    }

    const payloadItems = selectedItemEntries.map(([laundryItemId, quantity]) => ({ laundryItemId, quantity: Number(quantity) }));

    if (!selectedAddress || !pickupDate || !payloadItems.length || !Number(totalKg)) {
      setMessage('Please complete the form');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API}/api/customers/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          addressId: selectedAddress,
          scheduledAt: pickupDate,
          items: payloadItems,
          totalKg: Number(totalKg),
          totalPrice,
          serviceType: selectedService,
          note,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to create order');
      setMessage('Order created successfully');
      setTimeout(() => navigate('/customer'), 1500);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 sm:p-6">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/customer')}
            className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Create New Order</h1>
          <p className="text-gray-600 mt-2">Quick and easy laundry order in 3 simple steps</p>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {([1, 2, 3] as const).map((step) => (
              <div key={step} className="flex flex-1 items-center">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full font-bold text-lg transition ${
                    currentStep >= step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {currentStep > step ? '✓' : step}
                </div>
                {step < 3 && (
                  <div
                    className={`flex-1 mx-2 h-1 rounded transition ${
                      currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 text-sm font-medium">
            <span className={currentStep >= 1 ? 'text-blue-600' : 'text-gray-600'}>Address & Schedule</span>
            <span className={currentStep >= 2 ? 'text-blue-600' : 'text-gray-600'}>Service & Items</span>
            <span className={currentStep >= 3 ? 'text-blue-600' : 'text-gray-600'}>Review</span>
          </div>
        </div>

        {/* Error/Success Message */}
        {message && (
          <div className={`mb-6 rounded-lg p-4 ${message.includes('successfully') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message}
          </div>
        )}

        {/* Content Container */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          {/* Step 1: Address & Schedule */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  📍 Select Pickup Address
                </label>
                <div className="space-y-3">
                  {addresses.length > 0 ? (
                    addresses.map((address) => (
                      <label
                        key={address.id}
                        className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition ${
                          selectedAddress === address.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          value={address.id}
                          checked={selectedAddress === address.id}
                          onChange={(e) => setSelectedAddress(e.target.value)}
                          className="mt-1"
                        />
                        <div className="ml-3">
                          <p className="font-semibold text-gray-900">{address.label}</p>
                          <p className="text-sm text-gray-600">{address.fullAddress}</p>
                        </div>
                      </label>
                    ))
                  ) : (
                    <p className="text-gray-600">No addresses found. <a href="/addresses" className="text-blue-600 hover:underline">Add address</a></p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  📅 Pickup Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  📝 Special Instructions (Optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Any special requests or notes..."
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                />
              </div>

              <button
                onClick={() => setCurrentStep(2)}
                disabled={!canProceedStep1}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Continue to Service Selection →
              </button>
            </div>
          )}

          {/* Step 2: Service & Items */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-4">
                  ⚡ Choose Service
                </label>
                <div className="grid gap-4 md:grid-cols-3">
                  {SERVICES.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => setSelectedService(service.type)}
                      className={`p-6 rounded-lg border-2 cursor-pointer transition transform hover:scale-105 ${
                        selectedService === service.type
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-4xl mb-3">{service.icon}</div>
                      <h3 className="font-bold text-lg text-gray-900">{service.name}</h3>
                      <p className="text-sm text-gray-600 my-2">{service.description}</p>
                      <p className="font-bold text-blue-600">Rp {service.pricePerKg.toLocaleString('id-ID')}/kg</p>
                      <p className="text-xs text-gray-500 mt-2">Ready in {service.estimatedDays} day{service.estimatedDays > 1 ? 's' : ''}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
                  <label className="block text-sm font-semibold text-gray-900">
                    👕 Items & Weight
                  </label>
                  <div className="flex flex-wrap gap-2 text-sm font-semibold">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                      Total Weight: {totalKg || 0} kg
                    </span>
                    <span className="rounded-full bg-purple-50 px-3 py-1 text-purple-700">
                      Selected Items: {selectedItemCount}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Weight (kg)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    value={totalKg}
                    onChange={(e) => setTotalKg(e.target.value)}
                    placeholder="e.g., 5"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-3">
                  {itemsLoading ? (
                    <div className="rounded-lg border border-dashed border-blue-300 bg-blue-50 p-6 text-center text-blue-700">
                      Loading item laundry...
                    </div>
                  ) : itemsError ? (
                    <div className="rounded-lg border border-red-300 bg-red-50 p-6 text-center text-red-700">
                      <p className="font-semibold text-gray-900 mb-2">Gagal memuat item laundry</p>
                      <p className="text-sm mb-4">{itemsError}</p>
                      <button
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        Muat ulang
                      </button>
                    </div>
                  ) : items.length > 0 ? (
                    items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-600">{item.unit}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                            Qty: {Number(selectedItems[item.id] || 0)}
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={selectedItems[item.id] || ''}
                            onChange={(e) => handleItemChange(item.id, e.target.value)}
                            placeholder="Qty"
                            className="w-20 px-3 py-2 rounded-lg border border-gray-300 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-gray-600">
                      <p className="font-semibold text-gray-900 mb-2">Tidak ada tipe item laundry aktif</p>
                      <p className="text-sm">Silakan hubungi admin untuk menambahkan pilihan item atau coba lagi nanti.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 py-3 border-2 border-blue-600 text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={!canProceedStep2}
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Review Order →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Confirm */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                {/* Address Summary */}
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">Pickup Address</p>
                  <p className="font-semibold text-gray-900">
                    {addresses.find((a) => a.id === selectedAddress)?.label}
                  </p>
                  <p className="text-sm text-gray-700">
                    {addresses.find((a) => a.id === selectedAddress)?.fullAddress}
                  </p>
                </div>

                {/* Schedule Summary */}
                <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                  <p className="text-sm text-gray-600 mb-1">Scheduled Pickup</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(pickupDate).toLocaleString('id-ID')}
                  </p>
                </div>

                {/* Service & Items Summary */}
                <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                  <p className="text-sm text-gray-600 mb-2">Service & Items</p>
                  <div className="space-y-1 mb-3">
                    <p className="font-semibold text-gray-900">
                      {getSelectedService().icon} {getSelectedService().name} Service
                    </p>
                    <p className="text-sm text-gray-700">
                      {selectedItemEntries.length > 0
                        ? selectedItemEntries
                            .map(([itemId, q]) => `${items.find((i) => i.id === itemId)?.name} x${q}`)
                            .join(', ')
                        : 'No items selected yet'}
                    </p>
                  </div>
                </div>

                {/* Note Summary */}
                {note && (
                  <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Special Instructions</p>
                    <p className="text-gray-900">{note}</p>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Weight: {totalKg} kg</span>
                    <span className="font-semibold">Rp {totalPrice.toLocaleString('id-ID')}</span>
                  </div>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-bold text-lg text-gray-900">Total</span>
                  <span className="font-bold text-xl text-blue-600">Rp {totalPrice.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 py-3 border-2 border-blue-600 text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition"
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {loading ? 'Creating Order...' : '✓ Confirm & Create Order'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
