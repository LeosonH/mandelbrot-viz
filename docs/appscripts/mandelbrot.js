/*
--------------------------------------------------------------
(Updated July 2025)
2019 Leoson Hoay
leoson@uchicago.edu
 
Permission is granted by the author listed above, to any person
obtaining a copy of this script and associated files to use,
copy, modify, merge, publish, and distribute copies of files 
for non-commercial purposes, subject to the following
conditions:
 
- The above permission notice shall be included in all copies or
substantial portions of the original code. 

For commercial and other collaborative inquiries, please contact
the original author.

The images originally referenced to in this script are copyright
free:
- question_mark_2.png
- question_mark.png
- mandelbrot_latex.png
--------------------------------------------------------------
*/

(function(host) {
  var ALPHA = 255;

  function Display(canvas, width, height) {
    this.context = null;
    this.imageData = null;
    this.canvas = canvas;
    this.width = width;
    this.height = height;
  }

  Display.prototype.init = function() {
    if (this.canvas.width !== this.width || this.canvas.height !== this.height) {
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    }
    this.context = this.canvas.getContext('2d');
    this.imageData = this.context.getImageData(0, 0, this.width, this.height);
  }

  Display.prototype.draw = function(x, y, color) {
    var index = (x + y * this.width) * 4;
    this.imageData.data[index + 0] = color.r;
    this.imageData.data[index + 1] = color.g;
    this.imageData.data[index + 2] = color.b;
    this.imageData.data[index + 3] = ALPHA;
  }

  Display.prototype._drawAxes = function(offsetX, offsetY) {
    var size = Math.min(this.width, this.height);
    var realAxisY = (this.height / 2) - (centerY * size / window.SCALE_N) + (offsetY || 0);
    var imagAxisX = (this.width / 2) - (centerX * size / window.SCALE_N) + (offsetX || 0);
    this.context.strokeStyle = 'rgba(255,255,255,0.18)';
    this.context.lineWidth = 1;
    if (realAxisY >= 0 && realAxisY <= this.height) {
      this.context.beginPath();
      this.context.moveTo(0, realAxisY);
      this.context.lineTo(this.width, realAxisY);
      this.context.stroke();
    }
    if (imagAxisX >= 0 && imagAxisX <= this.width) {
      this.context.beginPath();
      this.context.moveTo(imagAxisX, 0);
      this.context.lineTo(imagAxisX, this.height);
      this.context.stroke();
    }
  }

  Display.prototype.repaint = function(cursorX, cursorY) {
    this.context.putImageData(this.imageData, 0, 0);
    this._drawAxes();
    if (cursorX !== undefined && cursorY !== undefined) {
      this.context.beginPath();
      this.context.moveTo(cursorX - 10, cursorY);
      this.context.lineTo(cursorX + 10, cursorY);
      this.context.moveTo(cursorX, cursorY - 10);
      this.context.lineTo(cursorX, cursorY + 10);
      this.context.strokeStyle = 'rgba(255,255,255,0.55)';
      this.context.lineWidth = 1;
      this.context.stroke();
    }
  }

  Display.prototype.startRendering = function() {
    var el = document.getElementById('renderingStatus');
    if (el) el.style.display = 'inline';
  }

  Display.prototype.finishRendering = function() {
    var el = document.getElementById('renderingStatus');
    if (el) el.style.display = 'none';
  }

  Display.prototype.panView = function(deltaX, deltaY) {
    this.context.fillStyle = 'rgb(0,0,0)';
    this.context.fillRect(0, 0, this.width, this.height);
    this.context.putImageData(this.imageData, deltaX, deltaY);
    this._drawAxes(deltaX, deltaY);
  }

  host.Display = Display;
})(this);

(function(host) {
  var MAX_ITERATIONS = 256;
  var BAILOUT = 256.0; // larger bailout makes log-log smooth coloring well-behaved
  var LOG2 = Math.log(2);

  function EscapeAlgorithm(pointX, pointY) {
    var current = 0;
    var x = 0;
    var y = 0;
    while (current < MAX_ITERATIONS && x * x + y * y < BAILOUT) {
      var xNext = x * x - y * y + pointX;
      y = 2 * x * y + pointY;
      x = xNext;
      current++;
    }
    if (current === MAX_ITERATIONS) return null; // inside the set
    // Continuous (smooth) iteration count — eliminates banding
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

  host.getColors = {
    getColor: function(x, y) {
      var smooth = EscapeAlgorithm(x, y);
      if (smooth === null) return {r: 0, g: 0, b: 0}; // inside = black
      return smoothToRGB(smooth);
    }
  }
})(this);

(function(host) {
  if (typeof window.SCALE_N === 'undefined') {
    window.SCALE_N = 4;
  }

  // Worker pool shared across renders — created once, reused every paint()
  var workerPool = null;
  var currentRenderId = 0;

  // Inlined so the page works from file:// as well as a server
  var WORKER_SRC = `
    var BAILOUT = 256.0, LOG2 = Math.log(2);
    function escapeAlgorithm(px, py, maxIter) {
      var c = 0, x = 0, y = 0;
      while (c < maxIter && x * x + y * y < BAILOUT) {
        var xn = x * x - y * y + px; y = 2 * x * y + py; x = xn; c++;
      }
      if (c === maxIter) return null;
      var m = Math.sqrt(x * x + y * y);
      return c - Math.log(Math.log(m) / LOG2) / LOG2;
    }
    function hslToRgb(h, s, l) {
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
      function hue2rgb(t) {
        if (t < 0) t += 1; if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      }
      return { r: Math.round(hue2rgb(h+1/3)*255), g: Math.round(hue2rgb(h)*255), b: Math.round(hue2rgb(h-1/3)*255) };
    }
    function smoothToRGB(s) {
      var hue = ((s * 0.025 + 0.62) % 1 + 1) % 1;
      var l = 0.08 + 0.45 * (1 - Math.exp(-s * 0.15));
      return hslToRgb(hue, 0.9, l);
    }
    self.onmessage = function(e) {
      var d = e.data;
      var w = d.width, h = d.height, startY = d.startY, endY = d.endY;
      var scaleN = d.scaleN, centerX = d.centerX, centerY = d.centerY, size = d.size;
      var maxIter = d.maxIterations;
      var buf = new Uint8ClampedArray(w * (endY - startY) * 4);
      for (var y = startY; y < endY; y++) {
        var cy = (scaleN * y / size) - (scaleN * h) / (2 * size) + centerY;
        for (var x = 0; x < w; x++) {
          var cx = (scaleN * x / size) - (scaleN * w) / (2 * size) + centerX;
          var sm = escapeAlgorithm(cx, cy, maxIter);
          var col = sm === null ? {r:0,g:0,b:0} : smoothToRGB(sm);
          var i = ((y - startY) * w + x) * 4;
          buf[i] = col.r; buf[i+1] = col.g; buf[i+2] = col.b; buf[i+3] = 255;
        }
      }
      self.postMessage({startY: startY, buffer: buf, renderId: d.renderId}, [buf.buffer]);
    };
  `;

  function getWorkerPool() {
    if (!workerPool) {
      var url = URL.createObjectURL(new Blob([WORKER_SRC], {type: 'application/javascript'}));
      var n = navigator.hardwareConcurrency || 4;
      workerPool = [];
      for (var i = 0; i < n; i++) workerPool.push(new Worker(url));
    }
    return workerPool;
  }

  function Visualization(display, width, height) {
    this.display = display;
    this.width = width;
    this.height = height;
    this.size = Math.min(width, height);
  }

  Visualization.prototype.paint = function(maxIterations) {
    var self = this;
    var width = this.width;
    var height = this.height;
    var workers = getWorkerPool();
    var n = workers.length;
    var renderId = ++currentRenderId;
    var completed = 0;

    self.display.startRendering();

    var stripHeight = Math.ceil(height / n);

    workers.forEach(function(worker, i) {
      var startY = i * stripHeight;
      var endY = Math.min(startY + stripHeight, height);

      worker.onmessage = function(e) {
        if (e.data.renderId !== renderId) return; // stale — a newer render fired

        var buf = new Uint8ClampedArray(e.data.buffer);
        var sy = e.data.startY;
        var rowCount = buf.length / (width * 4);
        for (var row = 0; row < rowCount; row++) {
          var srcOff = row * width * 4;
          var dstOff = (sy + row) * width * 4;
          self.display.imageData.data.set(buf.subarray(srcOff, srcOff + width * 4), dstOff);
        }

        completed++;
        if (completed === n) {
          self.display.finishRendering();
          self.display.repaint();
        }
      };

      worker.postMessage({
        width: width, height: height,
        startY: startY, endY: endY,
        scaleN: window.SCALE_N,
        centerX: centerX, centerY: centerY,
        size: self.size,
        renderId: renderId,
        maxIterations: maxIterations
      });
    });
  };

  host.Visualization = Visualization;
})(this);

// Global variables for event handling
var currentDisplay, currentVisualization;
var eventListenersSetup = false;
var centerX = 0, centerY = 0; // Center point of the visualization
var isDragging = false;
var dragStartX = 0, dragStartY = 0;
var dragStartCenterX = 0, dragStartCenterY = 0;

var renderPending = false;
var fullQualityTimer = null;
var ITER_FAST = 64, ITER_FULL = 256;

// During active zoom: render at low iterations, throttled to one per frame.
// When zooming stops (200ms idle): fire a full-quality re-render.
function scheduleRender(fast) {
  if (fast) {
    clearTimeout(fullQualityTimer);
    fullQualityTimer = setTimeout(function() { render(ITER_FULL); }, 200);
  }
  if (!renderPending) {
    renderPending = true;
    requestAnimationFrame(function() {
      renderPending = false;
      render(fast ? ITER_FAST : ITER_FULL);
    });
  }
}

function render(maxIterations) {
  if (maxIterations === undefined) maxIterations = ITER_FULL;
  var width = window.innerWidth;
  var height = window.innerHeight;
  var canvas = document.getElementById('myCanvas');
  var display = new Display(canvas, width, height);
  var mandelbrot = new Visualization(display, width, height);

  display.init();
  mandelbrot.paint(maxIterations);
  
  // Store references globally
  currentDisplay = display;
  currentVisualization = mandelbrot;
  
  // Set up event listeners only once
  if (!eventListenersSetup) {
    setupEventListeners();
    eventListenersSetup = true;
  }
}

function setupEventListeners() {
  document.addEventListener("mousemove", function(ev){
    if (currentDisplay) {
      if (isDragging) {
        var deltaX = ev.clientX - dragStartX;
        var deltaY = ev.clientY - dragStartY;
        currentDisplay.panView(deltaX, deltaY);
      } else {
        currentDisplay.repaint(ev.clientX, ev.clientY);
        var width = window.innerWidth;
        var height = window.innerHeight;
        var size = Math.min(width, height);
        var complexX = (window.SCALE_N * ev.clientX / size) - (window.SCALE_N * width) / (2 * size) + centerX;
        var complexY = (window.SCALE_N * ev.clientY / size) - (window.SCALE_N * height) / (2 * size) + centerY;
        var re = complexX.toFixed(4);
        var im = (-complexY).toFixed(4);
        var coordEl = document.getElementById('coordValue');
        if (coordEl) coordEl.textContent = 'C = ' + re + (im >= 0 ? ' + ' : ' \u2212 ') + Math.abs(im) + 'i';
      }
    }
  });

  document.addEventListener("mousedown", function(ev){
    if (currentDisplay && ev.button === 0) {
      isDragging = true;
      dragStartX = ev.clientX;
      dragStartY = ev.clientY;
      dragStartCenterX = centerX;
      dragStartCenterY = centerY;
      
      // Change cursor to indicate dragging
      document.body.style.cursor = 'grabbing';
    }
  });

  document.addEventListener("mouseup", function(ev){
    if (isDragging) {
      isDragging = false;
      document.body.style.cursor = 'default';
      
      // Update the actual center coordinates and re-render properly
      var deltaX = ev.clientX - dragStartX;
      var deltaY = ev.clientY - dragStartY;
      
      var width = window.innerWidth;
      var height = window.innerHeight;
      var size = Math.min(width, height);
      
      centerX = dragStartCenterX - (deltaX * window.SCALE_N / size);
      centerY = dragStartCenterY - (deltaY * window.SCALE_N / size);
      scheduleRender(false);
    }
  });

  document.addEventListener("touchstart", function(ev){
    if (currentDisplay) {
      var tx = ev.touches[0].pageX, ty = ev.touches[0].pageY;
      currentDisplay.repaint(tx, ty);
      var width = window.innerWidth, height = window.innerHeight;
      var size = Math.min(width, height);
      var complexX = (window.SCALE_N * tx / size) - (window.SCALE_N * width) / (2 * size) + centerX;
      var complexY = (window.SCALE_N * ty / size) - (window.SCALE_N * height) / (2 * size) + centerY;
      var re = complexX.toFixed(4), im = (-complexY).toFixed(4);
      var coordEl = document.getElementById('coordValue');
      if (coordEl) coordEl.textContent = 'C = ' + re + (im >= 0 ? ' + ' : ' \u2212 ') + Math.abs(im) + 'i';
    }
  });

  document.addEventListener("wheel", function(ev){
    ev.preventDefault();
    
    // Get cursor position in complex plane coordinates before zoom
    var width = window.innerWidth;
    var height = window.innerHeight;
    var size = Math.min(width, height);
    
    // Convert mouse position to complex plane coordinates
    var mouseComplexX = (window.SCALE_N * ev.clientX / size) - (window.SCALE_N * width) / (2 * size) + centerX;
    var mouseComplexY = (window.SCALE_N * ev.clientY / size) - (window.SCALE_N * height) / (2 * size) + centerY;
    
    // Store old scale for calculating offset
    var oldScale = window.SCALE_N;
    
    // Adjust zoom based on scroll direction
    if (ev.deltaY < 0) {
      // Zoom in
      window.SCALE_N *= 0.9;
    } else {
      // Zoom out
      window.SCALE_N *= 1.1;
    }
    
    // Calculate new mouse position with new scale (if we didn't adjust center)
    var newMouseComplexX = (window.SCALE_N * ev.clientX / size) - (window.SCALE_N * width) / (2 * size) + centerX;
    var newMouseComplexY = (window.SCALE_N * ev.clientY / size) - (window.SCALE_N * height) / (2 * size) + centerY;
    
    // Adjust center so mouse position stays at same complex coordinate
    centerX += mouseComplexX - newMouseComplexX;
    centerY += mouseComplexY - newMouseComplexY;
    
    scheduleRender(true);
  }, { passive: false });
}

render();
