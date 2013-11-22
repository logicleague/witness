
/* Left to do: 
 * pass the hot keys as a parameter
 * don't allow setting the color multiple times
 * clean up code
 * denote some methods as private
 * add comments
 * add a readme and sample
 * add functions to Witness class
 * look at other libraries and see how they handle options
 * test all color types
 * test inherited css colors
 */

function Witness (options) {
  if(!options) options = { type: "Deuteranope", hotkeys: true };  
  if (options.hotkeys) {
    $(document).bind('keypress', '1', $.proxy(function(e) {this.simulate(options.type);}, this));
  }
};

Witness.prototype.simulate = function(type) {
  // cache the cvd_matrix so it's only generated once per simulate request
  this.cvd_matrix = this.generateCVDMatrix(type);
  this.simulateForNode($(document), type);
};

Witness.prototype.simulateForNode = function(element, type) {
  if (element.prop('nodeName') == "IMG") {
    this.simulateImage(element, type);
  }
  else {
    this.simulateElement(element, type);
  }
  var me = this;
  element.each(function(a, b) {
    var childNodes = $(b).children();
    for (var i = 0; i < childNodes.length; ++i) {
      me.simulateForNode($(childNodes[i]), type);
    }
  });
};

Witness.prototype.generateCVDMatrix = function (type) {
  var CVDMatrix = { // Color Vision Deficiency
    "Protanope": [ // reds are greatly reduced (1% men)
      0.0, 2.02344, -2.52581,
      0.0, 1.0,      0.0,
      0.0, 0.0,      1.0
    ],
    "Deuteranope": [ // greens are greatly reduced (1% men)
      1.0,      0.0, 0.0,
      0.494207, 0.0, 1.24827,
      0.0,      0.0, 1.0
    ],
    "Tritanope": [ // blues are greatly reduced (0.003% population)
      1.0,       0.0,      0.0,
      0.0,       1.0,      0.0,
      -0.395913, 0.801109, 0.0
    ]
  };
  return CVDMatrix[type];
};

Witness.prototype.simulateColor = function(color, type) {
    // RGB to LMS matrix conversion
    var L = (17.8824 * color.R) + (43.5161 * color.G) + (4.11935 * color.B),
        M = (3.45565 * color.R) + (27.1554 * color.G) + (3.86714 * color.B),
        S = (0.0299566 * color.R) + (0.184309 * color.G) + (1.46709 * color.B);
    
  var cvd = this.cvd_matrix;

    // Simulate color blindness
    l = (cvd[0] * L) + (cvd[1] * M) + (cvd[2] * S);
    m = (cvd[3] * L) + (cvd[4] * M) + (cvd[5] * S);
    s = (cvd[6] * L) + (cvd[7] * M) + (cvd[8] * S);
    
    // LMS to RGB matrix conversion
    R = (0.0809444479 * l) + (-0.130504409 * m) + (0.116721066 * s);
    G = (-0.0102485335 * l) + (0.0540193266 * m) + (-0.113614708 * s);
    B = (-0.000365296938 * l) + (-0.00412161469 * m) + (0.693511405 * s);
    
    // Clamp values
    if(R < 0) R = 0;
    if(R > 255) R = 255;
    if(G < 0) G = 0;
    if(G > 255) G = 255;
    if(B < 0) B = 0;
    if(B > 255) B = 255;

    return {R: R, G: G, B: B};
};

function colorToHex(color) {
    if (color.substr(0, 1) === '#') {
        return color;
    }
    var digits = /(.*?)rgb\((\d+), (\d+), (\d+)\)/.exec(color);
    
    var red = parseInt(digits[2]);
    var green = parseInt(digits[3]);
    var blue = parseInt(digits[4]);
    
    return {R: red, G: green, B: blue};
};

function hexToColor(color) {
    return "rgb(" + Math.round(color.R) + ", " + Math.round(color.G) + ", " + Math.round(color.B) + ")";
};

Witness.prototype.simulateElement = function(element, type) {
  try {
    console.log('simulating for ' + element);

    console.log('color is ' + element.css('color'));

    var color = colorToHex(element.css('color'));   
    var newColor = this.simulateColor(color, type);
    
    console.log("new color is " + newColor.R + " " + newColor.G + " " + newColor.B);

    var f = hexToColor(newColor);
    console.log(f);

    element.css('color', f);
    // element.css('color', "rgb(0.00001, 0, 255)");
  }
  catch (e) {
    return;
  }
};

Witness.prototype.simulateImage = function(image, type) {
  var canvas = document.createElement("canvas"),
    ctx = canvas.getContext("2d");

  canvas.width = image.width();
  canvas.height = image.height();
  
  ctx.drawImage(image.get(0), 0, 0);
  try {
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height),
      data = imageData.data;    
  } catch(e) { }

  var L, M, S, l, m, s, R, G, B, RR, GG, BB;

  for(var id = 0, length = data.length; id < length; id += 4) {
    // var r = data[id],
    //   g = data[id + 1],
    //   b = data[id + 2];

     color = this.simulateColor({R: data[id], G: data[id + 1], B: data[id + 2]}, type);
    
    // Record color
    data[id] = color.R >> 0;
    data[id + 1] = color.G >> 0;
    data[id + 2] = color.B >> 0;
  }
  // Record data
  ctx.putImageData(imageData, 0, 0);

  image.replaceWith(canvas);
};