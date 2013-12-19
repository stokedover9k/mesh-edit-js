Mode = function (name, parent) {this.name = name, this.parent;};

Mode.prototype.handleMouseDown = function(x, y) {
  console.log(this.name, "mouse down", x, y);
};

Mode.prototype.handleMouseUp = function(x, y) {
  console.log(this.name, "mouse up", x, y);
};

Mode.prototype.handleKeyDown = function(key) {
  console.log(this.name, "key down", key);
};

Mode.prototype.handleKeyUp = function(key) {
  console.log(this.name, "key up", key);
};

Mode.prototype.enter = function() {
  console.log(this.name, "enter");
};

Mode.prototype.exit = function() {
  console.log(this.name, "exit");
};

Controls = function (mode) {
  this.mode = mode;
  this.defaultMode = mode;
};

Controls.prototype.handleMouseDown = function(x, y) {
  Mode.prototype.handleMouseDown.call(this.mode);
  this.mode.handleMouseDown(x, y);
};
Controls.prototype.handleMouseUp = function(x, y) {
  Mode.prototype.handleMouseUp.call(this.mode);
  this.mode.handleMouseUp(x, y);
};
Controls.prototype.handleKeyDown = function(key) {
  Mode.prototype.handleKeyDown.call(this.mode);
  this.mode.handleKeyDown(key);
};
Controls.prototype.handleKeyUp = function(key) {
  Mode.prototype.handleKeyUp.call(this.mode);
  this.mode.handleKeyUp(key);
};

Controls.prototype.setMode = function(mode) {
  this.mode.exit();
  this.mode = mode;
  this.mode.enter();
};

/////////////////////////////////////////////////////////////

var controls = (function() {

  var ModeNone = new Mode("NONE");
  var ModeSelect = new Mode("SELECT");
  var ModeMove = new Mode("MOVE");

  var container = new Controls(ModeNone);

  ModeNone.handleMouseDown = function (x, y) {
    container.setMode(ModeMove);
    enterMovingMode();
  };

  ModeMove.handleMouseUp = function (x, y) {
    exitMovingMode();
    container.setMode(ModeNone);
  };

  ModeNone.handleKeyDown = function (key) {
    if( key == 16 ) {        // Alt
      container.setMode(ModeSelect);
    }

    else if( key == 45 )            // Insert key
      handleSplit();
    else if( key == 82 )            // 'r'
      handleRotate();
    else if( key == 69 )            // 'e'
      SELECTORS.set('e');
    else if( key == 70 )            // 'f'
      SELECTORS.set('f');
    else if( key == 86 )            // 'v'
      SELECTORS.set('v');
    else if( key == 65 )            // 'a'
      SELECTORS.set('vs');
  };

  ModeSelect.handleKeyUp = function (key) {
    if( key == 16 ) {        // Alt
      container.setMode(ModeNone);
    }
  };
  ModeSelect.handleMouseDown = function (x, y) {
    handleSelection();
  };

  return container;
})();


