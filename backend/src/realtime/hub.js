const MAX_CLIENTS = 200;
const HEARTBEAT_MS = 25000;

/** @type {Set<import("express").Response>} */
const clients = new Set();
let heartbeatTimer = null;

function ensureHeartbeat() {
  if (heartbeatTimer) return;
  heartbeatTimer = setInterval(() => {
    for (const res of clients) {
      try {
        res.write(": heartbeat\n\n");
      } catch {
        clients.delete(res);
      }
    }
    if (!clients.size && heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }, HEARTBEAT_MS);
  if (typeof heartbeatTimer.unref === "function") heartbeatTimer.unref();
}

function subscribe(res) {
  if (clients.size >= MAX_CLIENTS) {
    return false;
  }
  clients.add(res);
  ensureHeartbeat();
  try {
    res.write(`event: connected\ndata: ${JSON.stringify({ at: new Date().toISOString() })}\n\n`);
  } catch {
    clients.delete(res);
    return false;
  }
  return true;
}

function unsubscribe(res) {
  clients.delete(res);
  if (!clients.size && heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

/**
 * @param {string} eventType
 * @param {Record<string, unknown>} [payload]
 */
function publish(eventType, payload = {}) {
  if (!clients.size) return;
  const body = JSON.stringify({
    type: eventType,
    at: new Date().toISOString(),
    ...payload,
  });
  const chunk = `event: ${eventType}\ndata: ${body}\n\n`;
  for (const res of [...clients]) {
    try {
      res.write(chunk);
    } catch {
      clients.delete(res);
    }
  }
}

function clientCount() {
  return clients.size;
}

module.exports = {
  MAX_CLIENTS,
  clientCount,
  publish,
  subscribe,
  unsubscribe,
};
