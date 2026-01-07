import { useState, useEffect } from 'react';
import { getCacheStats, checkApiHealth } from '../../utils/api';

// =============================================================================
// PERFORMANCE MONITORING COMPONENT
// =============================================================================

function PerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState({
    cacheStats: null,
    apiHealth: null,
    pageLoadTime: null,
    figureLoadTime: null
  });

  useEffect(() => {
    // Only show in development mode
    if (process.env.NODE_ENV !== 'development') return;

    // Get performance metrics
    const updateMetrics = async () => {
      try {
        const cacheStats = getCacheStats();
        const apiHealth = await checkApiHealth();
        
        // Get page load performance
        const navigation = performance.getEntriesByType('navigation')[0];
        const pageLoadTime = navigation ? 
          (navigation.loadEventEnd - navigation.navigationStart).toFixed(2) : 'N/A';

        setMetrics({
          cacheStats,
          apiHealth,
          pageLoadTime,
          figureLoadTime: 'Measuring...'
        });
      } catch (error) {
        console.error('Performance monitoring error:', error);
      }
    };

    updateMetrics();
    
    // Update every 10 seconds
    const interval = setInterval(updateMetrics, 10000);
    
    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="Performance Monitor"
      >
        📊
      </button>

      {isVisible && (
        <div className="absolute bottom-12 right-0 bg-white border shadow-lg rounded-lg p-4 w-80 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-900">Performance Monitor</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3 text-sm">
            {/* Page Load Performance */}
            <div>
              <h4 className="font-medium text-gray-700">Page Load</h4>
              <p className="text-gray-600">
                Load Time: {metrics.pageLoadTime}ms
              </p>
            </div>

            {/* API Health */}
            <div>
              <h4 className="font-medium text-gray-700">API Health</h4>
              <p className={`${metrics.apiHealth ? 'text-green-600' : 'text-red-600'}`}>
                Status: {metrics.apiHealth ? '✅ Healthy' : '❌ Unhealthy'}
              </p>
            </div>

            {/* Cache Stats */}
            <div>
              <h4 className="font-medium text-gray-700">Cache Status</h4>
              <p className="text-gray-600">
                Entries: {metrics.cacheStats?.size || 0}
              </p>
              {metrics.cacheStats?.entries && (
                <div className="mt-1 max-h-24 overflow-y-auto">
                  {metrics.cacheStats.entries.slice(0, 3).map((entry, index) => (
                    <p key={index} className="text-xs text-gray-500 truncate">
                      {entry.key.split('_')[0].split('/').pop()}: {(entry.age / 1000).toFixed(1)}s
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Memory Usage (if available) */}
            {performance.memory && (
              <div>
                <h4 className="font-medium text-gray-700">Memory</h4>
                <p className="text-gray-600 text-xs">
                  Used: {(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PerformanceMonitor;