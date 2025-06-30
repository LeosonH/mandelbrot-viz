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
  // set initial color alpha
  var ALPHA = 255;
  var font_size = 20;
  // load image assets
  var q_image = new Image;
  q_image.src = 'images/question_mark_2.png';
  var q_image2 = new Image;
  q_image2.src = 'images/question_mark.png';
  var e_image = new Image;
  e_image.src = 'images/mandelbrot_latex.png';


  function Display(canvas, width, height) {
    this.context = null;
    this.imageData = null;
    this.canvas = canvas;
    this.width = width;
    this.height = height;
    this.isRendering = false;
  }

  Display.prototype.init = function() {
    this.canvas.setAttribute('width', window.innerWidth);
    this.canvas.setAttribute('height', window.innerHeight);
    this.context = this.canvas.getContext('2d');
    this.context.font = font_size + 'px Courier New';
    this.imageData = this.context.getImageData(0, 0, this.width, this.height);
  }

  Display.prototype.draw = function(x, y, color) {
    // update pixel values
    var index = (x + y * this.width) * 4;
    this.imageData.data[index + 0] = color;
    this.imageData.data[index + 1] = color;
    this.imageData.data[index + 2] = 70;
    this.imageData.data[index + 3] = ALPHA;
  }

  Display.prototype.repaint = function(cursorX, cursorY) {
    // update image data
    this.context.putImageData(this.imageData, 0, 0);
    
    // Calculate where the real (x=0) and imaginary (y=0) axes are on screen
    var size = Math.min(this.width, this.height);
    
    // Real axis (imaginary = 0): solve for screen y where complexY = 0
    // 0 = (SCALE_N * screenY / size) - (SCALE_N * height) / (2 * size) + centerY
    // screenY = (height/2) - (centerY * size / SCALE_N)
    var realAxisY = (this.height/2) - (centerY * size / window.SCALE_N);
    
    // Imaginary axis (real = 0): solve for screen x where complexX = 0  
    // 0 = (SCALE_N * screenX / size) - (SCALE_N * width) / (2 * size) + centerX
    // screenX = (width/2) - (centerX * size / SCALE_N)
    var imagAxisX = (this.width/2) - (centerX * size / window.SCALE_N);
    
    // Draw real axis (horizontal line where imaginary = 0)
    if (realAxisY >= 0 && realAxisY <= this.height) {
      this.context.beginPath();
      this.context.moveTo(0, realAxisY);
      this.context.lineTo(this.width, realAxisY);
      this.context.strokeStyle = "grey";
      this.context.stroke();
    }
    
    // Draw imaginary axis (vertical line where real = 0)
    if (imagAxisX >= 0 && imagAxisX <= this.width) {
      this.context.beginPath();
      this.context.moveTo(imagAxisX, 0);
      this.context.lineTo(imagAxisX, this.height);
      this.context.strokeStyle = "grey";
      this.context.stroke();
    }
    
    // draw cursor crosshair
    if (cursorX !== undefined && cursorY !== undefined) {
      this.context.beginPath();
      this.context.moveTo(cursorX - 10, cursorY);
      this.context.lineTo(cursorX + 10, cursorY);
      this.context.moveTo(cursorX, cursorY - 10);
      this.context.lineTo(cursorX, cursorY + 10);
      this.context.strokeStyle = "grey";
      this.context.lineWidth = 2;
      this.context.stroke();
      this.context.lineWidth = 1;
    }
    // text
    this.context.fillStyle = 'yellow';
    this.context.fillText("The Mandelbrot Set", 20, 30);
    this.context.drawImage(q_image, 245, 12, 25, 25);
    this.context.fillText("source code", 20, this.height-32);
    
    // Show rendering status if currently rendering
    if (this.isRendering) {
      this.context.fillStyle = 'gold';
      this.context.fillText("Rendering... ", 20, 60);
    }
  }


  Display.prototype.startRendering = function() {
    this.isRendering = true;
  }

  Display.prototype.finishRendering = function() {
    this.isRendering = false;
  }

  Display.prototype.panView = function(deltaX, deltaY) {
    // Fill with the visualization's background color (dark blue-ish, matching low iteration areas)
    this.context.fillStyle = 'rgb(0, 0, 70)';
    this.context.fillRect(0, 0, this.width, this.height);
    
    // Draw the existing imageData translated by deltaX, deltaY
    this.context.putImageData(this.imageData, deltaX, deltaY);
    
    // Redraw UI elements in their correct positions
    var size = Math.min(this.width, this.height);
    
    // Calculate where the real (x=0) and imaginary (y=0) axes are with translation
    var realAxisY = (this.height/2) - (centerY * size / window.SCALE_N) + deltaY;
    var imagAxisX = (this.width/2) - (centerX * size / window.SCALE_N) + deltaX;
    
    // Draw real axis (horizontal line where imaginary = 0)
    if (realAxisY >= 0 && realAxisY <= this.height) {
      this.context.beginPath();
      this.context.moveTo(0, realAxisY);
      this.context.lineTo(this.width, realAxisY);
      this.context.strokeStyle = "grey";
      this.context.stroke();
    }
    
    // Draw imaginary axis (vertical line where real = 0)
    if (imagAxisX >= 0 && imagAxisX <= this.width) {
      this.context.beginPath();
      this.context.moveTo(imagAxisX, 0);
      this.context.lineTo(imagAxisX, this.height);
      this.context.strokeStyle = "grey";
      this.context.stroke();
    }
    
    // Draw UI text
    this.context.fillStyle = 'yellow';
    this.context.fillText("The Mandelbrot Set", 20, 30);
    this.context.drawImage(q_image, 245, 12, 25, 25);
    this.context.fillText("source code", 20, this.height-32);
  }

  Display.prototype.pointIndicator = function(x, y) {
    // update point coordinate display 
    this.context.fillStyle = 'gold';
    this.context.fillText("x: " + x + "  y: " + y, this.width-236, 30);
    this.context.fillText("C = " + x + " + (" + y + ")i", this.width-256, 60);;
  }

  Display.prototype.explain = function(x, y) {
    // display the explanation blurb
    if (x > 245 && y < 47
          && x < 270 && y > 12) {
        this.context.drawImage(q_image2, 245, 12, 25, 25);
        this.context.globalAlpha = 0.9;   
        this.context.drawImage(e_image, 20, 80, 575, 165);
        this.context.globalAlpha = 1.0;
      } else {
        this.context.drawImage(q_image, 245, 12, 25, 25);
        this.context.globalAlpha = 1.0;
      }
  }

  Display.prototype.sourceHover = function(x, y) {
    if (x > 20 && y < this.height-27
          && x < 250 && y > this.height-52) {
        this.context.fillText("source code (click!)", 20, this.height-32);
      } else {
        this.context.fillText("source code", 20, this.height-32);
      }
  }

  Display.prototype.sourceLink = function(x, y) {
    // link to source code repository
    if (x > 20 && y < this.height-27
          && x < 250 && y > this.height-52) {
        window.location.assign("https://www.github.com/LeosonH/mandelbrot-viz")
      }
  }

  host.Display = Display;
})(this);

(function(host) {
  var INIT_COLOR = 255;
  var MAX_NORM = 4.0;
  var MAX_ITERATIONS = 35;
  var GRADIENT_SCALE = Math.floor(INIT_COLOR / MAX_ITERATIONS);

  function EscapeAlgorithm(pointX, pointY) {
    // Escape Algorithm
    var current = 0;
    var x = 0;
    var y = 0;
    /*
    While current iteration number is less than preset limit and norm is
    less than its preset limit, repeat algorithm as defined by the mandelbrot
    set recurrence relation, and increment iteration number. Return the
    iteration number at the end. 
    */
    while ((current < MAX_ITERATIONS) && (x * x + y * y < MAX_NORM)) {
      const xNext = x * x - y * y;
      const yNext = 2 * x * y;
      x = xNext + pointX;
      y = yNext + pointY;
      current++;
    }

    return current;
  }

  function getSingleColor(iterations) {
    // the iteration number is used to determine the color gradient.
    return Math.min(iterations * GRADIENT_SCALE, INIT_COLOR);
  }

  host.getColors = {
    getColor: function(x, y) {
      return getSingleColor(EscapeAlgorithm(x, y));
    }
  }
})(this);

(function(host) {
  // Move SCALE_N to global scope for zoom functionality
  if (typeof window.SCALE_N === 'undefined') {
    window.SCALE_N = 4;
  }
  const STEP_SIZE = 50;

  function Visualization(display, width, height) {
    this.display = display;
    this.width = width;
    this.height = height;
    this.size = Math.min(width, height);
  }

  Visualization.prototype.scaleX = function(x) {
    // scale the visualization by window size and desired scale, centered on centerX
    return (window.SCALE_N * x / this.size) - (window.SCALE_N * this.width) / (2 * this.size) + centerX;
  }

  Visualization.prototype.scaleY = function(y) {
    // scale the visualization by window size and desired scale, centered on centerY
    return (window.SCALE_N * y / this.size) - (window.SCALE_N * this.height) / (2 * this.size) + centerY;
  }

  Visualization.prototype.paint = function(fastMode) {
    var self = this;
    var width = this.width;
    var height = this.height;
    var currentY = 0;
    var chunkSize = fastMode ? height : 4; // Render all at once in fast mode

    // Start rendering
    self.display.startRendering();

    function renderChunk() {
      var endY = Math.min(currentY + chunkSize, height);
      
      // Process multiple lines in this chunk
      for (var y = currentY; y < endY; y++) {
        for (var x = 0; x < width; x++) {
          const color = getColors.getColor(self.scaleX(x), self.scaleY(y));
          self.display.draw(x, y, color);
        }
      }
      
      // Update display (skip progressive updates in fast mode)
      if (!fastMode) {
        self.display.repaint();
      }
      
      currentY = endY;
      
      // Continue rendering if not done
      if (currentY < height) {
        if (fastMode) {
          // In fast mode, don't use requestAnimationFrame delay
          renderChunk();
        } else {
          requestAnimationFrame(renderChunk);
        }
      } else {
        // Rendering complete
        self.display.finishRendering();
        self.display.repaint(); // Final repaint
      }
    }
    
    // Start rendering
    renderChunk();
  }

  Visualization.prototype.paintStep = function(y) {
    if (y % STEP_SIZE === 0) {
      this.display.repaint();
      this.display.tracker();
    }
  }

  host.Visualization = Visualization;
})(this);

// Global variables for event handling
var currentDisplay, currentVisualization;
var eventListenersSetup = false;
var centerX = 0, centerY = 0; // Center point of the visualization
var isDragging = false;
var dragStartX = 0, dragStartY = 0;
var dragStartCenterX = 0, dragStartCenterY = 0;

// final rendering function
function render(fastMode) {
  var width = window.innerWidth;
  var height = window.innerHeight;
  // get canvas element from html
  var canvas = document.getElementById('myCanvas');
  var display = new Display(canvas, width, height);
  var mandelbrot = new Visualization(display, width, height);

  display.init();
  mandelbrot.paint(fastMode);
  
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
        // Calculate drag distance in screen pixels
        var deltaX = ev.clientX - dragStartX;
        var deltaY = ev.clientY - dragStartY;
        
        // Just translate the existing image for smooth panning
        currentDisplay.panView(deltaX, deltaY);
      } else {
        // Normal mouse movement - show UI
        currentDisplay.repaint(ev.clientX, ev.clientY);

        var width = window.innerWidth;
        var height = window.innerHeight;
        
        var size = Math.min(width, height);
        var complexX = (window.SCALE_N * ev.clientX / size) - (window.SCALE_N * width) / (2 * size) + centerX;
        var complexY = (window.SCALE_N * ev.clientY / size) - (window.SCALE_N * height) / (2 * size) + centerY;
        currentDisplay.pointIndicator(complexX.toFixed(2), (-complexY).toFixed(2));
        currentDisplay.explain(ev.clientX, ev.clientY);
        currentDisplay.sourceHover(ev.clientX, ev.clientY);
      }
    }
  });

  document.addEventListener("mousedown", function(ev){
    if (currentDisplay && ev.button === 0) { // Left mouse button only
      // Check if clicking on source code link
      if (ev.clientX > 20 && ev.clientY < currentDisplay.height-27
            && ev.clientX < 250 && ev.clientY > currentDisplay.height-52) {
        currentDisplay.sourceLink(ev.clientX, ev.clientY);
        return;
      }
      
      // Start dragging
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
      
      // Re-render with new center position using fast mode
      render(true);
    }
  });

  document.addEventListener("touchstart", function(ev){
    if (currentDisplay) {
      currentDisplay.repaint(ev.touches[0].pageX, ev.touches[0].pageY);
      var width = window.innerWidth;
      var height = window.innerHeight;
      
      currentDisplay.sourceLink(ev.touches[0].pageX, ev.touches[0].pageY);
      var size = Math.min(width, height);
      var complexX = (window.SCALE_N * ev.touches[0].pageX / size) - (window.SCALE_N * width) / (2 * size) + centerX;
      var complexY = (window.SCALE_N * ev.touches[0].pageY / size) - (window.SCALE_N * height) / (2 * size) + centerY;
      currentDisplay.pointIndicator(complexX.toFixed(2), (-complexY).toFixed(2));
      currentDisplay.explain(ev.touches[0].pageX, ev.touches[0].pageY);
      currentDisplay.sourceHover(ev.touches[0].pageX, ev.touches[0].pageY);
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
    
    // Re-render with new scale and center (normal mode for zoom)
    render(false);
  });
}

render();
