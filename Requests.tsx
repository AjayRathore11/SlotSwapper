import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { swapsAPI, SwapRequest } from '../lib/api';

export default function Requests() {
  const [incoming, setIncoming] = useState<SwapRequest[]>([]);
  const [outgoing, setOutgoing] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    try {
      const data = await swapsAPI.getSwapRequests();
      setIncoming(data.incoming);
      setOutgoing(data.outgoing);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    // Refresh every 5 seconds
    const interval = setInterval(loadRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRespond = async (requestId: string, accepted: boolean) => {
    try {
      await swapsAPI.respondToSwapRequest(requestId, accepted);
      loadRequests();
      // Also reload events if we want to update the calendar
      window.location.href = '/dashboard';
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to respond to swap request');
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

  const getStatusBadge = (status: string) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${
          colors[status as keyof typeof colors] || colors.PENDING
        }`}
      >
        {status}
      </span>
    );
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
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Swap Requests</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Incoming Requests */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Incoming Requests</h3>
            {incoming.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow">
                No incoming requests
              </div>
            ) : (
              <div className="space-y-4">
                {incoming.map((request) => (
                  <div key={request.id} className="bg-white shadow rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          From: {request.requester?.name || 'Unknown'}
                        </p>
                        {getStatusBadge(request.status)}
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-sm font-medium text-gray-700">They want:</p>
                        <p className="text-sm text-gray-600">{request.theirSlot.title}</p>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(request.theirSlot.startTime)} -{' '}
                          {formatDateTime(request.theirSlot.endTime)}
                        </p>
                      </div>
                      <div className="bg-indigo-50 p-2 rounded">
                        <p className="text-sm font-medium text-gray-700">They offer:</p>
                        <p className="text-sm text-gray-600">{request.mySlot.title}</p>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(request.mySlot.startTime)} -{' '}
                          {formatDateTime(request.mySlot.endTime)}
                        </p>
                      </div>
                    </div>
                    {request.status === 'PENDING' && (
                      <div className="mt-4 flex space-x-2">
                        <button
                          onClick={() => handleRespond(request.id, true)}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRespond(request.id, false)}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing Requests */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Outgoing Requests</h3>
            {outgoing.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow">
                No outgoing requests
              </div>
            ) : (
              <div className="space-y-4">
                {outgoing.map((request) => (
                  <div key={request.id} className="bg-white shadow rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          To: {request.responder?.name || 'Unknown'}
                        </p>
                        {getStatusBadge(request.status)}
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-sm font-medium text-gray-700">You want:</p>
                        <p className="text-sm text-gray-600">{request.theirSlot.title}</p>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(request.theirSlot.startTime)} -{' '}
                          {formatDateTime(request.theirSlot.endTime)}
                        </p>
                      </div>
                      <div className="bg-indigo-50 p-2 rounded">
                        <p className="text-sm font-medium text-gray-700">You offer:</p>
                        <p className="text-sm text-gray-600">{request.mySlot.title}</p>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(request.mySlot.startTime)} -{' '}
                          {formatDateTime(request.mySlot.endTime)}
                        </p>
                      </div>
                    </div>
                    {request.status === 'PENDING' && (
                      <div className="mt-4 text-center text-sm text-gray-500">
                        Waiting for response...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

