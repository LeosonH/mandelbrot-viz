var MAX_ITERATIONS = 256;
var BAILOUT = 256.0;
var LOG2 = Math.log(2);

function escapeAlgorithm(pointX, pointY) {
  var current = 0, x = 0, y = 0;
  while (current < MAX_ITERATIONS && x * x + y * y < BAILOUT) {
    var xNext = x * x - y * y + pointX;
    y = 2 * x * y + pointY;
    x = xNext;
    current++;
  }
  if (current === MAX_ITERATIONS) return null;
  var modulus = Math.sqrt(x * x + y * y);
  return current - Math.log(Math.log(modulus) / LOG2) / LOG2;
}

function hslToRgb(h, s, l) {
  var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  var p = 2 * l - q;
  function hue2rgb(t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  }
  return {
    r: Math.round(hue2rgb(h + 1/3) * 255),
    g: Math.round(hue2rgb(h) * 255),
    b: Math.round(hue2rgb(h - 1/3) * 255)
  };
}

function smoothToRGB(smooth) {
  var hue = ((smooth * 0.025 + 0.62) % 1 + 1) % 1;
  var lightness = 0.08 + 0.45 * (1 - Math.exp(-smooth * 0.15));
  return hslToRgb(hue, 0.9, lightness);
}

self.onmessage = function(e) {
  var d = e.data;
  var width = d.width, height = d.height;
  var startY = d.startY, endY = d.endY;
  var scaleN = d.scaleN, centerX = d.centerX, centerY = d.centerY;
  var size = d.size;

  var rowCount = endY - startY;
  var buffer = new Uint8ClampedArray(width * rowCount * 4);

  for (var y = startY; y < endY; y++) {
    var complexY = (scaleN * y / size) - (scaleN * height) / (2 * size) + centerY;
    for (var x = 0; x < width; x++) {
      var complexX = (scaleN * x / size) - (scaleN * width) / (2 * size) + centerX;
      var smooth = escapeAlgorithm(complexX, complexY);
      var color = smooth === null ? {r: 0, g: 0, b: 0} : smoothToRGB(smooth);
      var idx = ((y - startY) * width + x) * 4;
      buffer[idx]     = color.r;
      buffer[idx + 1] = color.g;
      buffer[idx + 2] = color.b;
      buffer[idx + 3] = 255;
    }
  }

  // Transfer the buffer (zero-copy) back to the main thread
  self.postMessage({startY: startY, buffer: buffer, renderId: d.renderId}, [buffer.buffer]);
};
