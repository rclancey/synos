import cmp from './cmp';

export const displayName = (obj) => {
  if (!obj) {
    return null;
  }
  if (!obj.name) {
    if (!obj.names) {
      return null;
    }
    const names = Object.entries(obj.names)
      .sort((a, b) => cmp(b[1], a[1]));
    if (names.length === 0) {
      return null;
    }
    obj.name = names[0][0];
  }
  return obj.name;
};

export default displayName;
