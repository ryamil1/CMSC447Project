// Code goes here
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
    GameController.$inject = ['$interval','board','life','$scope'];
    function GameController($interval, board, life, $scope){
      var vm = this;
      
      var input = document.getElementById("myFile");
      var output = document.getElementById("output");
      var reader = new FileReader();
      var words = "potato";

      input.addEventListener("change", function () {
        if (this.files && this.files[0]) {
          var myFile = this.files[0];
    
          reader.addEventListener('load', function (e) {
            words = e.target.result;
            words = words.split('\n');
            words.forEach(function(pair) {
              var word = pair.split(',');
              var x = parseInt(word[0], 10);
              var y = parseInt(word[1], 10);
              window.initialSeed[x][y]["isAlive"] = true;
            });
            vm.life = life.createNew(window.initialSeed,$scope.survive1,$scope.survive2,$scope.revive);
            vm.board = vm.life.board;
            vm.togglePlay();
        
          });
          reader.readAsText(input.files[0]);
        }   
      });
      
      $scope.time= "1000";
      vm.thumbs = [];
      vm.reset = reset;
      vm.load = load;
      vm.togglePlay = togglePlay;
      vm.save = save;
      $scope.iteration=10;
      var num= $scope.iteration;
      $scope.userSelect = '\u25CF';
      $scope.w=15;
      $scope.h=15;
      $scope.cellsAlive=0;
      $scope.gridColor = '#ffffff';
      $scope.iterationCount= 0;
      $scope.survive1=2;
      $scope.survive2=3;
      $scope.revive=3;
      function togglePlay(){
        if(!vm.isStarted && vm.timer){ 
          $interval.cancel(vm.timer);
          vm.isStarted = false;
          return;
        }
        vm.isStarted = true;
        vm.timer = $interval(function(){$scope.iterationCount++; $scope.cellsAlive=vm.life.next($scope.cellsAlive);num--}, $scope.time, num);
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
        $scope.gridColor = '#ffffff';
        $scope.iteration=10;
        num=$scope.iteration;
        $scope.cellColor = '#000000';
        $scope.iterationCount= 0;
        $scope.cellsAlive=0;
        var seed = board.createNew($scope.h,$scope.w);
        vm.life = life.createNew(seed,$scope.survive1,$scope.survive2,$scope.revive);
        vm.board = vm.life.board;
        vm.isStarted = false;
      }
      
      (function activate(){
        vm.life = life.createNew(window.initialSeed,$scope.survive1,$scope.survive2,$scope.revive);
        vm.board = vm.life.board;
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
          
      function createNew(h,w){
        var newBoard = [];
        for(var y = 0; y < h; y++){
          newBoard[y] = [];
          for(var x = 0; x < w; x++){
            newBoard[y][x] = cell.createNew({y: y, x: x});
          }
        }
        return newBoard;
      }
    }
    
    life.$inject = ['cell'];
    function life(cell){
      return {
        createNew : createNew
      };
      
      function createNew(seed,surv1,surv2,revive){
        var height = seed.length;
        var width = seed[0].length;
        var previousBoard = [];
        var board = angular.copy(seed);
        
        return{
          next: next,
          board: board,
        };
        
        function newCellState(previousBoard,x,y){
          
          var oldCell = previousBoard[y][x];
          var newCell = cell.createNew(oldCell.position, {isAlive: oldCell.isAlive});
          var neighbors = newCell.getAliveNeighbors(previousBoard);
          
          newCell.isAlive = newCell.isAlive ? neighbors >= surv1 && neighbors <= surv2 : neighbors === revive
          
          return newCell;
        }
        
        function next(alive){
          previousBoard = angular.copy(board);
          alive=0;
          for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
              if(previousBoard[y][x].isAlive)
              {
                alive++;
              }
          }
        }
          for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
              var curr=previousBoard[x][y].isAlive;
              board[y][x] = newCellState(previousBoard, x, y);
              if(!curr && board[y][x].isAlive)
              {
                alive++;
              }
              else if(curr && !board[y][x].isAlive)
              {
                alive--;
              }
          }
        }
        return alive;
      }
    }
  }   
  
}());


          
  window.initialSeed = [[{"position":{"y":0,"x":0}},{"position":{"y":0,"x":1}},{"position":{"y":0,"x":2}},{"position":{"y":0,"x":3}},{"position":{"y":0,"x":4}},{"position":{"y":0,"x":5}},{"position":{"y":0,"x":6}},{"position":{"y":0,"x":7}},{"position":{"y":0,"x":8}},{"position":{"y":0,"x":9}},{"position":{"y":0,"x":10}},{"position":{"y":0,"x":11}},{"position":{"y":0,"x":12}},{"position":{"y":0,"x":13}},{"position":{"y":0,"x":14}}],[{"position":{"y":1,"x":0}},{"position":{"y":1,"x":1}},{"position":{"y":1,"x":2}},{"position":{"y":1,"x":3}},{"position":{"y":1,"x":4}},{"position":{"y":1,"x":5}},{"position":{"y":1,"x":6}},{"position":{"y":1,"x":7}},{"position":{"y":1,"x":8}},{"position":{"y":1,"x":9}},{"position":{"y":1,"x":10}},{"position":{"y":1,"x":11}},{"position":{"y":1,"x":12}},{"position":{"y":1,"x":13}},{"position":{"y":1,"x":14}}],[{"position":{"y":2,"x":0}},{"position":{"y":2,"x":1}},{"position":{"y":2,"x":2}},{"position":{"y":2,"x":3}},{"position":{"y":2,"x":4}},{"position":{"y":2,"x":5}},{"position":{"y":2,"x":6}},{"position":{"y":2,"x":7}},{"position":{"y":2,"x":8}},{"position":{"y":2,"x":9}},{"position":{"y":2,"x":10}},{"position":{"y":2,"x":11}},{"position":{"y":2,"x":12}},{"position":{"y":2,"x":13}},{"position":{"y":2,"x":14}}],[{"position":{"y":3,"x":0}},{"position":{"y":3,"x":1}},{"position":{"y":3,"x":2}},{"position":{"y":3,"x":3}},{"position":{"y":3,"x":4}},{"position":{"y":3,"x":5}},{"position":{"y":3,"x":6}},{"position":{"y":3,"x":7}},{"position":{"y":3,"x":8}},{"position":{"y":3,"x":9}},{"position":{"y":3,"x":10}},{"position":{"y":3,"x":11}},{"position":{"y":3,"x":12}},{"position":{"y":3,"x":13}},{"position":{"y":3,"x":14}}],[{"position":{"y":4,"x":0}},{"position":{"y":4,"x":1}},{"position":{"y":4,"x":2}},{"position":{"y":4,"x":3}},{"position":{"y":4,"x":4}},{"position":{"y":4,"x":5}},{"position":{"y":4,"x":6}},{"position":{"y":4,"x":7}},{"position":{"y":4,"x":8}},{"position":{"y":4,"x":9}},{"position":{"y":4,"x":10}},{"position":{"y":4,"x":11}},{"position":{"y":4,"x":12}},{"position":{"y":4,"x":13}},{"position":{"y":4,"x":14}}],[{"position":{"y":5,"x":0}},{"position":{"y":5,"x":1}},{"position":{"y":5,"x":2}},{"position":{"y":5,"x":3}},{"position":{"y":5,"x":4}},{"position":{"y":5,"x":5}},{"position":{"y":5,"x":6}},{"position":{"y":5,"x":7}},{"position":{"y":5,"x":8}},{"position":{"y":5,"x":9}},{"position":{"y":5,"x":10}},{"position":{"y":5,"x":11}},{"position":{"y":5,"x":12}},{"position":{"y":5,"x":13}},{"position":{"y":5,"x":14}}],[{"position":{"y":6,"x":0}},{"position":{"y":6,"x":1}},{"position":{"y":6,"x":2}},{"position":{"y":6,"x":3}},{"position":{"y":6,"x":4}},{"position":{"y":6,"x":5}},{"position":{"y":6,"x":6}},{"position":{"y":6,"x":7}},{"position":{"y":6,"x":8}},{"position":{"y":6,"x":9}},{"position":{"y":6,"x":10}},{"position":{"y":6,"x":11}},{"position":{"y":6,"x":12}},{"position":{"y":6,"x":13}},{"position":{"y":6,"x":14}}],[{"position":{"y":7,"x":0}},{"position":{"y":7,"x":1}},{"position":{"y":7,"x":2}},{"position":{"y":7,"x":3}},{"position":{"y":7,"x":4}},{"position":{"y":7,"x":5}},{"position":{"y":7,"x":6}},{"position":{"y":7,"x":7}},{"position":{"y":7,"x":8}},{"position":{"y":7,"x":9}},{"position":{"y":7,"x":10}},{"position":{"y":7,"x":11}},{"position":{"y":7,"x":12}},{"position":{"y":7,"x":13}},{"position":{"y":7,"x":14}}],[{"position":{"y":8,"x":0}},{"position":{"y":8,"x":1}},{"position":{"y":8,"x":2}},{"position":{"y":8,"x":3}},{"position":{"y":8,"x":4}},{"position":{"y":8,"x":5}},{"position":{"y":8,"x":6}},{"position":{"y":8,"x":7}},{"position":{"y":8,"x":8}},{"position":{"y":8,"x":9}},{"position":{"y":8,"x":10}},{"position":{"y":8,"x":11}},{"position":{"y":8,"x":12}},{"position":{"y":8,"x":13}},{"position":{"y":8,"x":14}}],[{"position":{"y":9,"x":0}},{"position":{"y":9,"x":1}},{"position":{"y":9,"x":2}},{"position":{"y":9,"x":3}},{"position":{"y":9,"x":4}},{"position":{"y":9,"x":5}},{"position":{"y":9,"x":6}},{"position":{"y":9,"x":7}},{"position":{"y":9,"x":8}},{"position":{"y":9,"x":9}},{"position":{"y":9,"x":10}},{"position":{"y":9,"x":11}},{"position":{"y":9,"x":12}},{"position":{"y":9,"x":13}},{"position":{"y":9,"x":14}}],[{"position":{"y":10,"x":0}},{"position":{"y":10,"x":1}},{"position":{"y":10,"x":2}},{"position":{"y":10,"x":3}},{"position":{"y":10,"x":4}},{"position":{"y":10,"x":5}},{"position":{"y":10,"x":6}},{"position":{"y":10,"x":7}},{"position":{"y":10,"x":8}},{"position":{"y":10,"x":9}},{"position":{"y":10,"x":10}},{"position":{"y":10,"x":11}},{"position":{"y":10,"x":12}},{"position":{"y":10,"x":13}},{"position":{"y":10,"x":14}}],[{"position":{"y":11,"x":0}},{"position":{"y":11,"x":1}},{"position":{"y":11,"x":2}},{"position":{"y":11,"x":3}},{"position":{"y":11,"x":4}},{"position":{"y":11,"x":5}},{"position":{"y":11,"x":6}},{"position":{"y":11,"x":7}},{"position":{"y":11,"x":8}},{"position":{"y":11,"x":9}},{"position":{"y":11,"x":10}},{"position":{"y":11,"x":11}},{"position":{"y":11,"x":12}},{"position":{"y":11,"x":13}},{"position":{"y":11,"x":14}}],[{"position":{"y":12,"x":0}},{"position":{"y":12,"x":1}},{"position":{"y":12,"x":2}},{"position":{"y":12,"x":3}},{"position":{"y":12,"x":4}},{"position":{"y":12,"x":5}},{"position":{"y":12,"x":6}},{"position":{"y":12,"x":7}},{"position":{"y":12,"x":8}},{"position":{"y":12,"x":9}},{"position":{"y":12,"x":10}},{"position":{"y":12,"x":11}},{"position":{"y":12,"x":12}},{"position":{"y":12,"x":13}},{"position":{"y":12,"x":14}}],[{"position":{"y":13,"x":0}},{"position":{"y":13,"x":1}},{"position":{"y":13,"x":2}},{"position":{"y":13,"x":3}},{"position":{"y":13,"x":4}},{"position":{"y":13,"x":5}},{"position":{"y":13,"x":6}},{"position":{"y":13,"x":7}},{"position":{"y":13,"x":8}},{"position":{"y":13,"x":9}},{"position":{"y":13,"x":10}},{"position":{"y":13,"x":11}},{"position":{"y":13,"x":12}},{"position":{"y":13,"x":13}},{"position":{"y":13,"x":14}}],[{"position":{"y":14,"x":0}},{"position":{"y":14,"x":1}},{"position":{"y":14,"x":2}},{"position":{"y":14,"x":3}},{"position":{"y":14,"x":4}},{"position":{"y":14,"x":5}},{"position":{"y":14,"x":6}},{"position":{"y":14,"x":7}},{"position":{"y":14,"x":8}},{"position":{"y":14,"x":9}},{"position":{"y":14,"x":10}},{"position":{"y":14,"x":11}},{"position":{"y":14,"x":12}},{"position":{"y":14,"x":13}},{"position":{"y":14,"x":14}}]];