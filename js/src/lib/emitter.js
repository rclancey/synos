export class Emitter {
  constructor() {
    this.listeners = {};
  }

  addEventListener(name, handler) {
    if (!this.listeners[name]) {
      this.listeners[name] = [handler];
    } else {
      this.listeners[name].push(handler);
    }
  }

  removeEventListener(name, handler) {
    if (this.listeners[name]) {
      this.listeners[name] = this.listeners[name].filter((h) => h !== handler);
    }
  }

  on(name, handler) {
    this.addEventListener(name, handler);
  }

  off(name, handler) {
    this.removeEventListener(name, handler);
  }

  emit(name, ...args) {
    const listeners = this.listeners[name];
    if (!listeners) {
      return;
    }
    listeners.forEach((handler) => {
      const evt = {
        type: name,
        data: args.slice(),
      };
      try {
        handler(evt);
      } catch (err) {
        console.error('error in %o handler: %o', name, err);
      }
    });
  }
};

export default Emitter;
