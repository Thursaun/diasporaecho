import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '../../utils/constants';

function AdminModerationPage() {
  const navigate = useNavigate();
  const [pendingFigures, setPendingFigures] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Check if user is logged in (server validates admin role)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
    }
  }, [navigate]);

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
  });

  // Fetch pending figures
  const fetchPending = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/figures/admin/pending`, {
        headers: getHeaders(),
      });
      
      if (response.status === 403) {
        setError('Access denied. Admin privileges required.');
        return;
      }
      
      if (!response.ok) throw new Error('Failed to fetch pending figures');
      
      const data = await response.json();
      setPendingFigures(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  // Toggle select
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select all
  const selectAll = () => {
    setSelectedIds(new Set(pendingFigures.map(f => f._id)));
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  // Approve single
  const approveFigure = async (id) => {
    setActionLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/figures/admin/${id}/approve`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to approve');
      await fetchPending();
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Reject single
  const rejectFigure = async (id, reason = '') => {
    setActionLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/figures/admin/${id}/reject`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error('Failed to reject');
      await fetchPending();
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk approve
  const bulkApprove = async () => {
    if (selectedIds.size === 0) return;
    setActionLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/figures/admin/bulk-approve`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (!response.ok) throw new Error('Failed to bulk approve');
      const result = await response.json();
      alert(result.message);
      await fetchPending();
      setSelectedIds(new Set());
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk reject
  const bulkReject = async () => {
    if (selectedIds.size === 0) return;
    const reason = prompt('Enter rejection reason (optional):');
    setActionLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/figures/admin/bulk-reject`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ ids: Array.from(selectedIds), reason }),
      });
      if (!response.ok) throw new Error('Failed to bulk reject');
      const result = await response.json();
      alert(result.message);
      await fetchPending();
      setSelectedIds(new Set());
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (error === 'Access denied. Admin privileges required.') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-opacity-90"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-secondary to-primary text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">🛡️ Content Moderation</h1>
              <p className="text-white/80 mt-1">Review and approve new figure submissions</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
            >
              ← Back to Site
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Action Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-gray-600 font-medium">
                {pendingFigures.length} pending • {selectedIds.size} selected
              </span>
              <button
                onClick={selectAll}
                className="text-sm text-secondary hover:underline"
                disabled={pendingFigures.length === 0}
              >
                Select All
              </button>
              <button
                onClick={deselectAll}
                className="text-sm text-gray-500 hover:underline"
                disabled={selectedIds.size === 0}
              >
                Deselect All
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={bulkApprove}
                disabled={selectedIds.size === 0 || actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
              >
                ✅ Approve Selected ({selectedIds.size})
              </button>
              <button
                onClick={bulkReject}
                disabled={selectedIds.size === 0 || actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
              >
                ❌ Reject Selected ({selectedIds.size})
              </button>
              <button
                onClick={fetchPending}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && pendingFigures.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">All caught up!</h2>
            <p className="text-gray-600">No figures pending review.</p>
          </div>
        )}

        {/* Figure Grid */}
        {!isLoading && pendingFigures.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingFigures.map((figure) => (
              <div
                key={figure._id}
                className={`bg-white rounded-lg shadow-md overflow-hidden border-2 transition ${
                  selectedIds.has(figure._id) ? 'border-secondary' : 'border-transparent'
                }`}
              >
                {/* Checkbox Header */}
                <div className="bg-gray-50 px-4 py-2 flex items-center gap-3 border-b">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(figure._id)}
                    onChange={() => toggleSelect(figure._id)}
                    className="w-5 h-5 text-secondary rounded"
                  />
                  <span className="text-sm text-gray-500">
                    {new Date(figure.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Image */}
                <div className="aspect-video bg-gray-100 relative">
                  {figure.imageUrl ? (
                    <img
                      src={figure.imageUrl}
                      alt={figure.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No Image
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{figure.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">{figure.years || 'Unknown dates'}</p>
                  <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                    {figure.description || 'No description available'}
                  </p>

                  {/* Source Badge */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {figure.source || 'Wikipedia'}
                    </span>
                    {figure.categories?.[0] && (
                      <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded">
                        {figure.categories[0]}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveFigure(figure._id)}
                      disabled={actionLoading}
                      className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition font-medium"
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Rejection reason (optional):');
                        rejectFigure(figure._id, reason || '');
                      }}
                      disabled={actionLoading}
                      className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 transition font-medium"
                    >
                      ❌ Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminModerationPage;
