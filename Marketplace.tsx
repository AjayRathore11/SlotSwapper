import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { swapsAPI, eventsAPI, SwappableSlot, Event } from '../lib/api';

export default function Marketplace() {
  const [slots, setSlots] = useState<SwappableSlot[]>([]);
  const [mySwappableSlots, setMySwappableSlots] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SwappableSlot | null>(null);
  const [selectedMySlotId, setSelectedMySlotId] = useState('');

  const loadSlots = async () => {
    try {
      const [swappableSlots, myEvents] = await Promise.all([
        swapsAPI.getSwappableSlots(),
        eventsAPI.getAll(),
      ]);
      setSlots(swappableSlots);
      setMySwappableSlots(myEvents.filter((e) => e.status === 'SWAPPABLE'));
    } catch (error) {
      console.error('Failed to load slots:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlots();
  }, []);

  const handleRequestSwap = (slot: SwappableSlot) => {
    if (mySwappableSlots.length === 0) {
      alert('You need to have at least one swappable slot to request a swap');
      return;
    }
    setSelectedSlot(slot);
    setShowSwapModal(true);
  };

  const handleConfirmSwap = async () => {
    if (!selectedSlot || !selectedMySlotId) {
      alert('Please select a slot to offer');
      return;
    }

    try {
      await swapsAPI.createSwapRequest(selectedMySlotId, selectedSlot.id);
      setShowSwapModal(false);
      setSelectedSlot(null);
      setSelectedMySlotId('');
      loadSlots();
      alert('Swap request sent successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create swap request');
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Marketplace</h2>
        <p className="text-gray-600 mb-6">
          Browse available slots from other users and request swaps.
        </p>

        {slots.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No swappable slots available at the moment.
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {slots.map((slot) => (
                <li key={slot.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{slot.title}</h3>
                      <p className="text-sm text-gray-500">
                        {formatDateTime(slot.startTime)} - {formatDateTime(slot.endTime)}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">From: {slot.user.name}</p>
                    </div>
                    <button
                      onClick={() => handleRequestSwap(slot)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      Request Swap
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {showSwapModal && selectedSlot && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Request Swap</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                You are requesting to swap for:
              </p>
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-medium">{selectedSlot.title}</p>
                <p className="text-sm text-gray-600">
                  {formatDateTime(selectedSlot.startTime)} - {formatDateTime(selectedSlot.endTime)}
                </p>
                <p className="text-sm text-gray-500">From: {selectedSlot.user.name}</p>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select your slot to offer:
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={selectedMySlotId}
                onChange={(e) => setSelectedMySlotId(e.target.value)}
                required
              >
                <option value="">Select a slot...</option>
                {mySwappableSlots.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {slot.title} ({formatDateTime(slot.startTime)})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowSwapModal(false);
                  setSelectedSlot(null);
                  setSelectedMySlotId('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSwap}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

