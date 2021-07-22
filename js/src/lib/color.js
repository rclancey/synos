const namedCache = {
  'transparent': { r: 0, g: 0, b: 0, a: 0 },
  'black': { r: 0, g: 0, b: 0, a: 1 },
  'white': { r: 255, g: 255, b: 255, a: 1 },
};

export class Color {
  constructor(name) {
    if (typeof name !== 'string') {
      Object.entries(name).forEach(([k, v]) => { this[k] = v; });
      return;
    }
    this.name = name;
    const cached = namedCache[name];
    if (cached) {
      this.type = 'named';
      Object.entries(cached).forEach(([k, v]) => { this[k] = v; });
      return;
    }
    let m = name.match(/^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/);
    if (m) {
      this.type = 'hex8';
      this.r = parseInt(m[1], 16);
      this.g = parseInt(m[2], 16);
      this.b = parseInt(m[3], 16);
      this.a = parseInt(m[3], 16) / 256;
      return;
    }
    m = name.match(/^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/);
    if (m) {
      this.type = 'hex6';
      this.r = parseInt(m[1], 16);
      this.g = parseInt(m[2], 16);
      this.b = parseInt(m[3], 16);
      this.a = 1;
      return;
    }
    m = name.match(/^#([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])$/);
    if (m) {
      this.type = 'hex4';
      this.r = parseInt(m[1] + m[1], 16);
      this.g = parseInt(m[2] + m[2], 16);
      this.b = parseInt(m[3] + m[3], 16);
      this.a = parseInt(m[4] + m[4], 16) / 256;
      return;
    }
    m = name.match(/^#([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])$/);
    if (m) {
      this.type = 'hex3';
      this.r = parseInt(m[1] + m[1], 16);
      this.g = parseInt(m[2] + m[2], 16);
      this.b = parseInt(m[3] + m[3], 16);
      this.a = 1;
      return;
    }
    // eslint-disable-next-line no-useless-escape
    m = name.replace(/\s+/g, '').match(/^rgba?\(([0-9\.]+),([0-9\.]+),([0-9\.]+),([0-9\.]+)\)/);
    if (m) {
      this.type = 'rgba';
      this.r = parseInt(m[1], 10);
      this.g = parseInt(m[2], 10);
      this.b = parseInt(m[3], 10);
      this.a = parseFloat(m[4]);
      return;
    }
    m = name.replace(/\s+/g, '').match(/^rgb\(([0-9\.]+),([0-9\.]+),([0-9\.]+)\)/);
    if (m) {
      this.type = 'rgb';
      this.r = parseInt(m[1], 10);
      this.g = parseInt(m[2], 10);
      this.b = parseInt(m[3], 10);
      this.a = 1;
      return;
    }
    m = name.replace(/\s+/g, '').match(/^hsla?\(([0-9\.]+),([0-9\.]+)%,([0-9\.]+)%,([0-9\.])\)/);
    if (m) {
      this.type = 'hsla';
      this.h = parseInt(m[1], 10);
      this.s = parseFloat(m[2]);
      this.l = parseFloat(m[3]);
      this.a = parseFloat(m[4]);
      return;
    }
    m = name.replace(/\s+/g, '').match(/^hsl\(([0-9\.]+),([0-9\.]+)%,([0-9\.]+)%\)/);
    if (m) {
      this.type = 'hsl';
      this.h = parseInt(m[1], 10);
      this.s = parseFloat(m[2]);
      this.l = parseFloat(m[3]);
      this.a = 1;
      return;
    }
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.setAttribute('width', 100);
      canvas.setAttribute('height', 100);
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.rect(0, 0, 100, 100);
      ctx.fillStyle = name;
      ctx.fill();
      const imgData = ctx.getImageData(0, 0, 10, 10);
      const px = imgData.data.slice(50 * 4, (50 * 4) + 4);
      this.type = 'named';
      this.r = px[0];
      this.g = px[1];
      this.b = px[2];
      this.a = px[3] / 255.0;
      namedCache[name] = {
        r: px[0],
        g: px[1],
        b: px[2],
        a: px[3] / 255.0,
      };
      return;
    }
    this.type = null;
    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.a = 0;
  }

  rgb() {
    switch (this.type) {
      case 'hsl':
      case 'hsla':
        let h = this.h;
        while (h < 0) {
          h += 360;
        }
        h = h % 360;
        const l = this.l / 100;
        const s = this.s / 100;
        const c = (1 - Math.abs((2 * l) - 1)) * s;
        const hp = h / 60;
        const x = c * (1 - Math.abs((hp % 2) - 1));
        let r, g, b;
        if (hp < 1) {
          r = c;
          g = x;
          b = 0;
        } else if (hp < 2) {
          r = x;
          g = c;
          b = 0;
        } else if (hp < 3) {
          r = 0;
          g = c;
          b = x;
        } else if (hp < 4) {
          r = 0;
          g = x;
          b = c;
        } else if (hp < 5) {
          r = x;
          g = 0;
          b = c;
        } else {
          r = c;
          g = 0;
          b = x;
        }
        const m = l - (c / 2);
        r += m;
        g += m;
        b += m;
        return {
          r: Math.round(r * 255),
          g: Math.round(g * 255),
          b: Math.round(b * 255),
        };
      default:
        return {
          r: this.r,
          g: this.g,
          b: this.b,
        }
    }
  }

  rgba() {
    const rgb = this.rgb();
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${this.a})`;
  }

  hsl() {
    switch (this.type) {
      case 'hsl':
      case 'hsla':
        return {
          h: this.h,
          s: this.s,
          l: this.l,
        };
      default:
        const r = this.r / 255;
        const g = this.g / 255;
        const b = this.b / 255;
        const xmax = Math.max(r, g, b);
        const xmin = Math.min(r, g, b);
        const v = xmax;
        const c = xmax - xmin;
        const l = v - (c / 2);
        let h = 0;
        if (c === 0) {
          h = 0;
        } else if (v === r) {
          h = 60 * ((g - b) / c);
        } else if (v == g) {
          h = 60 * (2 + ((b - r) / c));
        } else if (v === b) {
          h = 60 * (4 + ((r - g) / c));
        }
        let s = 0;
        if (l === 0 || l === 1) {
          s = 0;
        } else {
          s = c / (1 - Math.abs((2 * xmax) - c - 1));
        }
        return {
          h: (h + 360) % 360,
          s: s * 100,
          l: l * 100,
        };
    }
  }

  hsla() {
    const hsl = this.hsl();
    return `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${this.a})`;
  }

  hexDigit(v) {
    if (Math.round(v) < 16) {
      return `0${Math.round(v).toString(16)}`;
    }
    return Math.round(v).toString(16);
  }

  hex() {
    const rgb = this.rgb();
    if (this.a === 1) {
      return `#{this.hexDigit(rgb.r)}${this.hexDigit(rgb.g)}${this.hexDigit(rgb.b)}`;
    }
    return `#{this.hexDigit(rgb.r)}${this.hexDigit(rgb.g)}${this.hexDigit(rgb.b)}${this.hexDigit(this.a * 255)}`;
  }

  css() {
    switch (this.type) {
      case 'hsl':
      case 'hsla':
        return this.hsla();
      case 'rgb':
      case 'rgba':
        return this.rgba();
      case 'hex3':
      case 'hex4':
      case 'hex6':
      case 'hex8':
        return this.hex();
      default:
        return this.name;
    }
  }

  interpolate(target, pct) {
    const start = this.rgb();
    const end = target.rgb();
    return new Color({
      type: 'rgba',
      r: Math.round(start.r + (end.r - start.r) * pct),
      g: Math.round(start.g + (end.g - start.g) * pct),
      b: Math.round(start.b + (end.b - start.b) * pct),
      a: this.a + (target.a - this.a) * pct,
    });
  }

  interpolateHsl(target, pct) {
    const start = this.hsl();
    const end = this.hsl();
    if (target.h - start.h > 180) {
      target.h -= 360;
    } else if (start.h - target.h > 180) {
      target.h += 360;
    }
    return new Color({
      type: 'hsla',
      h: (start.h + (end.h - start.h) * pct) % 360,
      s: start.s + (end.s - start.s) * pct,
      l: start.l + (end.l - start.l) * pct,
      a: this.a + (target.a - this.a) * pct,
    });
  }
};

export default Color;
