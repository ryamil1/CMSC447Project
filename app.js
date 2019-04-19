//app.js
(function(){
  'use strict';
  angular.module('app', ['app.controllers']);  
}());
//app.controllers.js
(function(){
  'use strict';
  var app = angular.module('app.controllers', ['app.services']);
  app.controller('GameController',GameController);
  GameController.$inject = ['$interval','board','life'];
  function GameController($interval, board, life){
    var vm = this;
    
    vm.thumbs = [];
    vm.reset = reset;
    vm.interval = 300;
    vm.load = load;
    vm.togglePlay = togglePlay;
    vm.save = save;
       
    function togglePlay(){
      if(!vm.isStarted && vm.timer){ 
        $interval.cancel(vm.timer);
        vm.isStarted = false;
        return;
      }
      vm.isStarted = true;
      vm.timer = $interval(vm.life.next, vm.interval);
    }
    
    function save(){
      var board = angular.copy(vm.board);
      console.log(board);
      vm.thumbs.push(board);
    }
    
    function load(thumb){
      reset();
      vm.life = life.createNew(thumb);
      vm.board = vm.life.board;
    }
    
    function reset(){
      if(vm.isStarted) vm.togglePlay();
      var seed = board.createNew(15);
      vm.life = life.createNew(seed);
      vm.board = vm.life.board;
      vm.isStarted = false;
    }
    
    (function activate(){
      reset();
      vm.life = life.createNew(window.initialSeed);
      vm.board = vm.life.board;
      vm.togglePlay();
    }());
  }
}());
//app.services.js
(function(){
  'use strict';
  var app = angular.module('app.services',[]);
  app.factory('cell', cell);
  app.factory('board', board);
  app.factory('life', life);
  
  function cell(){
    return{
      createNew: function(position, options){
        return new Cell(position, options);
      }
    };
    
    function Cell(position, options){
      var defaults = {
        isAlive: false
      };
      return {  
        position: position,
        isAlive: options && options.isAlive,
        toggle: function(){this.isAlive = !this.isAlive;},
        lives: function(){this.isAlive = true;},
        dies: function(){this.isAlive = false;},
        getAliveNeighbors: function(board){
          var y = this.position.y;
          var x = this.position.x;
          var prevRow = board[y - 1] || [];
          var nextRow = board[y + 1] || [];
          var neighbors = [
            prevRow[x - 1], prevRow[x], prevRow[x + 1],
            board[y][x - 1], board[y][x + 1],
            nextRow[x - 1], nextRow[x], nextRow[x + 1],
          ];
          return neighbors.reduce(function(prev, curr) {
            if(curr){
              return prev += +!!curr.isAlive;
            }
            return prev += 0;
          }, 0);
        }
      };
    }
  }
  
  board.$inject = ['cell'];
  function board(cell){
    return {
      createNew: createNew
    };
        
    function createNew(size){
      var newBoard = [];
      for(var y = 0; y < size; y++){
        newBoard[y] = [];
        for(var x = 0; x < size; x++){
          newBoard[y][x] = cell.createNew({y: y, x: x});
        }
      }
      return newBoard;
    }
  }
  
  life.$inject = ['cell'];
  function life(cell){
    return {
      createNew: createNew
    };
    
    function createNew(seed){
      var height = seed.length;
      var width = seed[0].length;
      var previousBoard = [];
      var board = angular.copy(seed);
      
      return{
        next: next,
        board: board
      };
      
      function newCellState(previousBoard, x, y){
        var oldCell = previousBoard[y][x];
        var newCell = cell.createNew(oldCell.position, {isAlive: oldCell.isAlive});
        var neighbors = newCell.getAliveNeighbors(previousBoard);

        newCell.isAlive = newCell.isAlive 
          ? neighbors >= 2 && neighbors <= 3
          : neighbors === 3;
        
        return newCell;
      }
      
      function next(){
        previousBoard = angular.copy(board);
        for (var y = 0; y < height; y++) {
          for (var x = 0; x < width; x++) {
            board[y][x] = newCellState(previousBoard, x, y);
          }
        }
      }
    }
  }   
  
}());
        
window.initialSeed = [[{"position":{"y":0,"x":0}},{"position":{"y":0,"x":1}},{"position":{"y":0,"x":2}},{"position":{"y":0,"x":3}},{"position":{"y":0,"x":4}},{"position":{"y":0,"x":5}},{"position":{"y":0,"x":6}},{"position":{"y":0,"x":7},"isAlive":false},{"position":{"y":0,"x":8}},{"position":{"y":0,"x":9}},{"position":{"y":0,"x":10}},{"position":{"y":0,"x":11}},{"position":{"y":0,"x":12}},{"position":{"y":0,"x":13}},{"position":{"y":0,"x":14}}],[{"position":{"y":1,"x":0}},{"position":{"y":1,"x":1}},{"position":{"y":1,"x":2},"isAlive":false},{"position":{"y":1,"x":3},"isAlive":true},{"position":{"y":1,"x":4},"isAlive":true},{"position":{"y":1,"x":5},"isAlive":true},{"position":{"y":1,"x":6},"isAlive":false},{"position":{"y":1,"x":7},"isAlive":false},{"position":{"y":1,"x":8}},{"position":{"y":1,"x":9},"isAlive":true},{"position":{"y":1,"x":10},"isAlive":true},{"position":{"y":1,"x":11},"isAlive":true},{"position":{"y":1,"x":12},"isAlive":false},{"position":{"y":1,"x":13}},{"position":{"y":1,"x":14}}],[{"position":{"y":2,"x":0}},{"position":{"y":2,"x":1}},{"position":{"y":2,"x":2},"isAlive":false},{"position":{"y":2,"x":3},"isAlive":false},{"position":{"y":2,"x":4},"isAlive":false},{"position":{"y":2,"x":5},"isAlive":false},{"position":{"y":2,"x":6}},{"position":{"y":2,"x":7},"isAlive":false},{"position":{"y":2,"x":8}},{"position":{"y":2,"x":9},"isAlive":false},{"position":{"y":2,"x":10},"isAlive":false},{"position":{"y":2,"x":11},"isAlive":false},{"position":{"y":2,"x":12}},{"position":{"y":2,"x":13}},{"position":{"y":2,"x":14}}],[{"position":{"y":3,"x":0}},{"position":{"y":3,"x":1},"isAlive":true},{"position":{"y":3,"x":2}},{"position":{"y":3,"x":3}},{"position":{"y":3,"x":4}},{"position":{"y":3,"x":5}},{"position":{"y":3,"x":6},"isAlive":true},{"position":{"y":3,"x":7}},{"position":{"y":3,"x":8},"isAlive":true},{"position":{"y":3,"x":9}},{"position":{"y":3,"x":10}},{"position":{"y":3,"x":11}},{"position":{"y":3,"x":12}},{"position":{"y":3,"x":13},"isAlive":true},{"position":{"y":3,"x":14}}],[{"position":{"y":4,"x":0}},{"position":{"y":4,"x":1},"isAlive":true},{"position":{"y":4,"x":2}},{"position":{"y":4,"x":3}},{"position":{"y":4,"x":4}},{"position":{"y":4,"x":5}},{"position":{"y":4,"x":6},"isAlive":true},{"position":{"y":4,"x":7}},{"position":{"y":4,"x":8},"isAlive":true},{"position":{"y":4,"x":9}},{"position":{"y":4,"x":10}},{"position":{"y":4,"x":11}},{"position":{"y":4,"x":12}},{"position":{"y":4,"x":13},"isAlive":true},{"position":{"y":4,"x":14}}],[{"position":{"y":5,"x":0}},{"position":{"y":5,"x":1},"isAlive":true},{"position":{"y":5,"x":2}},{"position":{"y":5,"x":3}},{"position":{"y":5,"x":4}},{"position":{"y":5,"x":5}},{"position":{"y":5,"x":6},"isAlive":true},{"position":{"y":5,"x":7},"isAlive":false},{"position":{"y":5,"x":8},"isAlive":true},{"position":{"y":5,"x":9}},{"position":{"y":5,"x":10}},{"position":{"y":5,"x":11}},{"position":{"y":5,"x":12}},{"position":{"y":5,"x":13},"isAlive":true},{"position":{"y":5,"x":14}}],[{"position":{"y":6,"x":0}},{"position":{"y":6,"x":1},"isAlive":false},{"position":{"y":6,"x":2}},{"position":{"y":6,"x":3},"isAlive":true},{"position":{"y":6,"x":4},"isAlive":true},{"position":{"y":6,"x":5},"isAlive":true},{"position":{"y":6,"x":6},"isAlive":false},{"position":{"y":6,"x":7}},{"position":{"y":6,"x":8},"isAlive":false},{"position":{"y":6,"x":9},"isAlive":true},{"position":{"y":6,"x":10},"isAlive":true},{"position":{"y":6,"x":11},"isAlive":true},{"position":{"y":6,"x":12}},{"position":{"y":6,"x":13},"isAlive":false},{"position":{"y":6,"x":14}}],[{"position":{"y":7,"x":0}},{"position":{"y":7,"x":1}},{"position":{"y":7,"x":2}},{"position":{"y":7,"x":3},"isAlive":false},{"position":{"y":7,"x":4},"isAlive":false},{"position":{"y":7,"x":5},"isAlive":false},{"position":{"y":7,"x":6}},{"position":{"y":7,"x":7}},{"position":{"y":7,"x":8}},{"position":{"y":7,"x":9},"isAlive":false},{"position":{"y":7,"x":10},"isAlive":false},{"position":{"y":7,"x":11},"isAlive":false},{"position":{"y":7,"x":12}},{"position":{"y":7,"x":13}},{"position":{"y":7,"x":14}}],[{"position":{"y":8,"x":0}},{"position":{"y":8,"x":1}},{"position":{"y":8,"x":2}},{"position":{"y":8,"x":3},"isAlive":true},{"position":{"y":8,"x":4},"isAlive":true},{"position":{"y":8,"x":5},"isAlive":true},{"position":{"y":8,"x":6}},{"position":{"y":8,"x":7}},{"position":{"y":8,"x":8}},{"position":{"y":8,"x":9},"isAlive":true},{"position":{"y":8,"x":10},"isAlive":true},{"position":{"y":8,"x":11},"isAlive":true},{"position":{"y":8,"x":12},"isAlive":false},{"position":{"y":8,"x":13}},{"position":{"y":8,"x":14}}],[{"position":{"y":9,"x":0}},{"position":{"y":9,"x":1},"isAlive":true},{"position":{"y":9,"x":2}},{"position":{"y":9,"x":3},"isAlive":false},{"position":{"y":9,"x":4},"isAlive":false},{"position":{"y":9,"x":5},"isAlive":false},{"position":{"y":9,"x":6},"isAlive":true},{"position":{"y":9,"x":7}},{"position":{"y":9,"x":8},"isAlive":true},{"position":{"y":9,"x":9},"isAlive":false},{"position":{"y":9,"x":10},"isAlive":false},{"position":{"y":9,"x":11},"isAlive":false},{"position":{"y":9,"x":12}},{"position":{"y":9,"x":13},"isAlive":true},{"position":{"y":9,"x":14}}],[{"position":{"y":10,"x":0}},{"position":{"y":10,"x":1},"isAlive":true},{"position":{"y":10,"x":2}},{"position":{"y":10,"x":3}},{"position":{"y":10,"x":4}},{"position":{"y":10,"x":5}},{"position":{"y":10,"x":6},"isAlive":true},{"position":{"y":10,"x":7}},{"position":{"y":10,"x":8},"isAlive":true},{"position":{"y":10,"x":9}},{"position":{"y":10,"x":10}},{"position":{"y":10,"x":11}},{"position":{"y":10,"x":12},"isAlive":false},{"position":{"y":10,"x":13},"isAlive":true},{"position":{"y":10,"x":14}}],[{"position":{"y":11,"x":0}},{"position":{"y":11,"x":1},"isAlive":true},{"position":{"y":11,"x":2}},{"position":{"y":11,"x":3}},{"position":{"y":11,"x":4}},{"position":{"y":11,"x":5}},{"position":{"y":11,"x":6},"isAlive":true},{"position":{"y":11,"x":7}},{"position":{"y":11,"x":8},"isAlive":true},{"position":{"y":11,"x":9}},{"position":{"y":11,"x":10}},{"position":{"y":11,"x":11}},{"position":{"y":11,"x":12}},{"position":{"y":11,"x":13},"isAlive":true},{"position":{"y":11,"x":14}}],[{"position":{"y":12,"x":0}},{"position":{"y":12,"x":1},"isAlive":false},{"position":{"y":12,"x":2}},{"position":{"y":12,"x":3},"isAlive":false},{"position":{"y":12,"x":4},"isAlive":false},{"position":{"y":12,"x":5},"isAlive":false},{"position":{"y":12,"x":6},"isAlive":false},{"position":{"y":12,"x":7},"isAlive":false},{"position":{"y":12,"x":8},"isAlive":false},{"position":{"y":12,"x":9}},{"position":{"y":12,"x":10}},{"position":{"y":12,"x":11}},{"position":{"y":12,"x":12}},{"position":{"y":12,"x":13},"isAlive":false},{"position":{"y":12,"x":14}}],[{"position":{"y":13,"x":0}},{"position":{"y":13,"x":1}},{"position":{"y":13,"x":2}},{"position":{"y":13,"x":3},"isAlive":true},{"position":{"y":13,"x":4},"isAlive":true},{"position":{"y":13,"x":5},"isAlive":true},{"position":{"y":13,"x":6}},{"position":{"y":13,"x":7}},{"position":{"y":13,"x":8}},{"position":{"y":13,"x":9},"isAlive":true},{"position":{"y":13,"x":10},"isAlive":true},{"position":{"y":13,"x":11},"isAlive":true},{"position":{"y":13,"x":12}},{"position":{"y":13,"x":13}},{"position":{"y":13,"x":14}}],[{"position":{"y":14,"x":0}},{"position":{"y":14,"x":1}},{"position":{"y":14,"x":2}},{"position":{"y":14,"x":3}},{"position":{"y":14,"x":4}},{"position":{"y":14,"x":5}},{"position":{"y":14,"x":6}},{"position":{"y":14,"x":7}},{"position":{"y":14,"x":8}},{"position":{"y":14,"x":9}},{"position":{"y":14,"x":10}},{"position":{"y":14,"x":11}},{"position":{"y":14,"x":12}},{"position":{"y":14,"x":13}},{"position":{"y":14,"x":14}}]];