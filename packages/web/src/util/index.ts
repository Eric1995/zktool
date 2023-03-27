export function copyToClip(content: string) {
  const aux = window.document.createElement('input');
  aux.setAttribute('value', content);
  window.document.body.appendChild(aux);
  aux.select();
  window.document.execCommand('copy');
  window.document.body.removeChild(aux);
}

export const JavaTypes: string[] = [
  'java.lang.Boolean',
  // 'boolean',
  'java.lang.Integer',
  // 'int',
  'java.lang.Short',
  // 'short',
  // 'java.lang.Byte',
  // 'byte',
  'java.lang.Long',
  // 'long',
  'java.lang.Double',
  // 'double',
  'java.lang.Float',
  // 'float',
  'java.lang.String',
  // 'char',
  // 'chars',
  // 'java.lang.Character',
  // 'java.util.List',
  // 'java.util.Set',
  // 'java.util.Iterator',
  // 'java.util.Enumeration',
  // 'java.util.HashMap',
  // 'java.util.Map',
  // 'java.util.Dictionary',
  // //--------------------------------------
  // 'null',
  // 'java.util.Collection',
  // 'java.lang.Class',
  // 'java.math.BigDecimal',
  // 'java.exception',
  // // 'java.abstract',
  // 'java.Locale',
  // 'java.enum',
];

// JavaTypes.slice(0, 25).forEach((type) => {
//   let name = type;
//   if (type.includes('.')) name = type.split('.')[2];
//   JavaTypes.push(`java.array.${name}`);
// });

export function toBinary(string: string) {
  const codeUnits = Uint16Array.from({ length: string.length }, (element, index) => string.charCodeAt(index));
  const charCodes = new Uint8Array(codeUnits.buffer);

  let result = '';
  charCodes.forEach((char) => {
    result += String.fromCharCode(char);
  });
  return result;
}

export function fromBinary(binary: string) {
  const bytes = Uint8Array.from({ length: binary.length }, (_element, index) => binary.charCodeAt(index));
  const charCodes = new Uint16Array(bytes.buffer);

  let result = '';
  charCodes.forEach((char) => {
    result += String.fromCharCode(char);
  });
  return result;
}

export function decodeUtf8(bytes: number[] | Uint8Array) {
  let encoded = '';
  for (let i = 0; i < bytes.length; i += 1) {
    encoded += `%${bytes[i].toString(16)}`;
  }
  return decodeURIComponent(encoded);
}
