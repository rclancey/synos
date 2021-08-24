export class Dimension {
  constructor(value) {
    this.raw = value;
    if (typeof value !== 'string') {
      Object.entries(value).forEach(([k, v]) => { this[k] = v; });
      return;
    }
    let m = value.match(/^(-?[0-9\.]+)(cm|mm|Q|in|pc|pt|px|em|ex|ch|rem|lh|vw|vh|vmin|vmax)$/);
    if (m !== null) {
      this.type = 'length';
      this.value = parseFloat(m[1]);
      this.unit = m[2];
      return;
    }
    m = value.match(/^(-?[0-9\.]+)(deg|rad|grad|turn)$/);
    if (m !== null) {
      this.type = 'angle';
      this.value = parseFloat(m[1]);
      this.unit = m[2];
      return;
    } 
    m = value.match(/^(-?[0-9\.]+)(s|ms)$/);
    if (m !== null) {
      this.type = 'angle';
      this.value = parseFloat(m[1]);
      this.unit = m[2];
      return;
    } 
    m = value.match(/^(-?[0-9\.]+)(dpi|dpcm|dppx|x)$/);
    if (m !== null) {
      this.type = 'angle';
      this.value = parseFloat(m[1]);
      this.unit = m[2];
      return;
    }
    m = value.match(/^(-?[0-9\.]+)%$/);
    if (m !== null) {
      this.type = 'percentage';
      this.value = parseFloat(m[1]);
      this.unit = '%';
      return;
    }
    m = value.match(/^(-?[0-9\.]+)$/);
    if (m !== null) {
      this.type = 'number';
      this.value = parseFloat(m[1]);
      this.unit = '';
      return;
    } 
    this.type = null;
    this.value = null;
    this.unit = null;
  }

  mult(n) {
    this.value *= n;
  }

  css() {
    return `${this.value}${this.unit}`;
  }

  interpolate(target, pct) {
    if (this.unit !== target.unit) {
      throw new Error("mismatched units");
    }
    return new Dimension({
      type: this.type,
      unit: this.unit,
      value: this.value + (target.value - this.value) * pct,
    });
  }
};

export default Dimension;
