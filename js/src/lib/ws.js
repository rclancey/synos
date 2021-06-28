class WebSocketSingleton {
  constructor() {
    const loc = document.location;
    const proto = loc.protocol === 'https:' ? 'wss://' : 'ws://';
    this.uri = `${proto}${loc.host}/api/ws`;
    this.listeners = {};
    this.backoff = 1;
    this.reconnect();
    document.addEventListener('visibilitychange', () => {
      if (document.visibililtyState === 'visible') {
        this.reconnect();
      }
    });
  }

  send(msg) {
    this.ws.send(JSON.stringify(msg));
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
      this.ws.onClose = null;
      this.ws.close();
    }
  }

  reconnect() {
    this.close();
    this.ws = new WebSocket(this.uri);
    this.ws.onopen = evt => {
      //console.debug('websocket open');
      this.backoff = 1;
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
      console.debug('websocket error: %o', evt);
      this.emit('error', evt);
    };
    this.ws.onclose = evt => {
      console.debug('websocket close: %o', evt);
      this.emit('close', evt);
      setTimeout(() => this.reconnect(), 1000 * Math.min(300, this.backoff));
      this.backoff *= 2;
    };
  }
}

export const WS = new WebSocketSingleton();
