(function() {
  const pagePath = window.location.pathname;
  
  // 1. Track Page View
  fetch('/api/analytics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      event: 'pageview',
      page: pagePath
    })
  }).catch(err => console.warn('Analytics tracking skipped:', err.message));
  
  // 2. Track Time Spent
  const startTime = Date.now();
  let timeSent = false;
  
  function sendTimeSpent() {
    if (timeSent) return; // Prevent double sending
    const durationSec = Math.round((Date.now() - startTime) / 1000);
    
    if (durationSec > 0 && durationSec < 7200) {
      const payload = JSON.stringify({
        event: 'timespent',
        page: pagePath,
        durationSec: durationSec
      });
      
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics', payload);
      } else {
        fetch('/api/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: payload,
          keepalive: true
        });
      }
      timeSent = true;
    }
  }
  
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      sendTimeSpent();
    }
  });
  
  window.addEventListener('pagehide', sendTimeSpent);
})();
