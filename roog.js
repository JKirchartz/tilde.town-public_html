var Grammar = {
  'pre': ['large', 'small', 'baby', 'reticulated', 'splined'],
  'post': ['pangolin', 'kobold', 'gru', 'block of cheese', 'robot'],
  generate: function() {
    var pre = this.pre[Math.floor(Math.random() * this.pre.length)];
    var post = this.post[Math.floor(Math.random() * this.post.length)];
    if ( Math.round(Math.random()) ) {
      return "You found a " + pre + " " + post + "!";
    } else {
      return "You found a " + post + "!";
    }
  }
};

var Game = {
  display: null,
  map: {},
  player: null,
  engine: null,
  luckyBox: null,
  level: 0,
  generateMap: function() {
    this.map = {};
    var mapper = new ROT.Map.Uniform();
    var freeCells = [];
    var mapperCallback = function(x, y, val) {
      if (val) { return; } // do not store walls
      var key = x + "," + y;
      freeCells.push(key);
      this.map[key] = ".";
    };
    mapper.create(mapperCallback.bind(this));
    this.generateBoxes(freeCells);
    this.createPlayer(freeCells);
    this.redraw();
  },
  generateBoxes: function(freeCells) {
    // place 10 random boxes around
    for (var i = 0; i < 10; i++) {
      var index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
      var key = freeCells.splice(index, 1)[0];
      if ( i == 0 ) { this.luckyBox = key; }
      this.map[key] = "*";
    }
  },
  createPlayer: function(freeCells) {
    var index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
    var key = freeCells.splice(index, 1)[0];
    var parts = key.split(",");
    var x = parseInt(parts[0]);
    var y = parseInt(parts[1]);
    if ( ! this.player ) { // do not create additional players
      this.player = new Player(x, y);
    } else { // move player to correct location
      this.player.teleport(x, y);
    }
  },
  drawMap: function() {
    for (var key in this.map) {
      var parts = key.split(",");
      var x = parseInt(parts[0]);
      var y = parseInt(parts[1]);
      this.display.draw(x, y, this.map[key]);
    }
  },
  getDisplay: function() {
    return this.display;
  },
  getMap: function() {
    return this.map;
  },
  show: function() {
    document.body.appendChild(this.display.getContainer());
  },
  init: function() {
    this.display = new ROT.Display({fontSize:16});
    this.show();

    this.generateMap();

    var sched = new ROT.Scheduler.Simple();
    sched.add(this.player, true);

    this.engine = new ROT.Engine(sched);
    this.engine.start();
  },
  nextLevel: function() {
    if ( this.level >= 10 ) {
      alert("You won!");
      this.player.end();
    }
    this.level += 1;
    this.generateMap();
    this.engine.start();
  },
  redraw: function() {
    this.display.clear();
    this.drawMap();
    this.player.draw();
  },
  text: function(str) {
    this.redraw();
    this.display.drawText(0, 0, str, "#FFF", "#000");
  }
};

var Player = function(x, y) {
  this.x = x;
  this.y = y;
  this.draw();
};

Player.prototype.teleport = function(x, y) {
  this.x = x;
  this.y = y;
  this.draw();
};
Player.prototype.checkTile = function() {
  var key = this.x + "," + this.y;
  if (Game.map[key] == "*") {
    if (key === Game.luckyBox) {
      Game.text("You found the portkey!");
      Game.engine.lock();
      Game.nextLevel();
    } else {
      Game.text(Grammar.generate());
    }
  } else {
    Game.text("There's nothing here.");
  }
};
Player.prototype.end = function() {
  Game.engine.lock();
  window.removeEventListener("keydown", this);
};

Player.prototype.draw = function() {
  Game.display.draw(this.x, this.y, "@", "#ff0");
}
Player.prototype.act = function() {
  Game.engine.lock();
  window.addEventListener("keydown", this);
};
Player.prototype.handleEvent = function(e) {
  // numpad directions => ROT.DIRS[8]
  var keyMap = {
    '38': 0,
    '33': 1,
    '39': 2,
    '34': 3,
    '40': 4,
    '35': 5,
    '37': 6,
    '36': 7
  };
  if (e.keyCode in keyMap) { // movement key pressed
    var direction = keyMap[e.keyCode];
    var diff = ROT.DIRS[8][direction];
    var newX = this.x + diff[0];
    var newY = this.y + diff[1];
    var newKey = newX + "," + newY;

    if(!(newKey in Game.map)) { return; } // cannot move in this direction

    Game.display.draw(this.x, this.y, Game.map[this.x+","+this.y]);
    this.x = newX;
    this.y = newY;
    this.draw();
    window.removeEventListener("keydown", this);
    Game.engine.unlock();
  } else if (e.keyCode == 13 || e.keyCode == 32) {
    // enter or space hit
    this.checkTile();
  }
  return;
};

document.addEventListener('DOMContentLoaded', function() { Game.init(); });

    
