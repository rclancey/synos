const ws = [null];

class WebSocketSingleton {
  constructor() {
    const loc = document.location;
    const proto = loc.protocol === 'https:' ? 'wss://' : 'ws://';
    this.uri = `${proto}${loc.host}/api/ws`;
    this.listeners = {};
    this.reconnect();
  }

  addEventListener(name, handler) {
    if (!this.listeners[name]) {
      this.listeners[name] = [];
    }
    this.listeners[name] = this.listeners[name].concat([handler]);
  }

  removeEventListener(name, handler) {
    if (!this.listeners) {
      return;
    }
    this.listeners[name] = this.listeners[name].filter(h => h !== handler);
  }

  on(name, handler) {
    return this.addEventListener(name, handler);
  }

  off(name, handler) {
    return this.removeEventListener(name, handler);
  }

  emit(name, evt) {
    const listeners = this.listeners[name];
    if (!listeners) {
      return;
    }
    listeners.forEach(listener => {
      try {
        listener(evt);
      } catch (err) {
        console.error(`error in websocket ${name} %o listener: %o`, evt, err);
      }
    });
  }

  isOpen() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  isOpening() {
    if (this.isOpen()) {
      return true;
    }
    return this.ws && this.ws.readyState === WebSocket.CONNECTING;
  }

  isClosed() {
    return !this.ws || this.ws.readyState === WebSocket.CLOSED;
  }

  isClosing() {
    if (this.isClosed()) {
      return true;
    }
    return !this.ws || this.ws.readyState === WebSocket.CLOSING;
  }

  close() {
    if (this.isOpening()) {
      this.ws.close();
    }
  }

  reconnect() {
    this.close();
    this.ws = new WebSocket(this.uri);
    this.ws.onopen = evt => {
      this.emit('open', evt);
    };
    this.ws.onmessage = evt => {
      evt.data.split(/\n/)
        .map(line => {
          try {
            return JSON.parse(line);
          } catch (err) {
            return line;
          }
        })
        .forEach(msg => {
          this.emit('message', msg);
        });
    };
    this.ws.onerror = evt => {
      this.emit('error', evt);
      setTimeout(() => this.reconnect(), 1000);
    };
    this.ws.onclose = evt => {
      this.emit('close', evt);
    };
  }
}

export const WS = new WebSocketSingleton();
