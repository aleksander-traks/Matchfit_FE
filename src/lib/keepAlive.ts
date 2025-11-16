const PYTHON_API_URL = import.meta.env.VITE_PYTHON_API_URL || 'https://matchfit-be.onrender.com';
const KEEP_ALIVE_INTERVAL = 4 * 60 * 1000;

let keepAliveInterval: number | null = null;

async function pingPythonApi() {
  try {
    const response = await fetch(`${PYTHON_API_URL}/`, {
      method: 'GET',
      mode: 'cors',
    });

    if (response.ok) {
      console.log('[KeepAlive] Python API is warm and responsive');
    } else {
      console.warn('[KeepAlive] Python API returned non-OK status:', response.status);
    }
  } catch (error) {
    console.error('[KeepAlive] Failed to ping Python API:', error);
  }
}

export function startKeepAlive() {
  if (keepAliveInterval !== null) {
    return;
  }

  pingPythonApi();

  keepAliveInterval = window.setInterval(() => {
    pingPythonApi();
  }, KEEP_ALIVE_INTERVAL);

  console.log('[KeepAlive] Started keep-alive pings every 4 minutes');
}

export function stopKeepAlive() {
  if (keepAliveInterval !== null) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
    console.log('[KeepAlive] Stopped keep-alive pings');
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', stopKeepAlive);
}
