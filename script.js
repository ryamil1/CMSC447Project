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
      var reader = new FileReader();
      var words = "";

      //Listener for file upload button.
      input.addEventListener("change", function () {
        if (this.files && this.files[0]) {
          var myFile = this.files[0];
        
          reader.addEventListener('load', function (e) {
            //Make new board, change display conditions, stop stuff.
		      	var newBoard = board.createNew($scope.h, $scope.w);
		      	vm.isStarted = false;
		      	$scope.iterationCount = 0;
		      	$scope.cellsAlive = 0;
		      	var tooManyCoords = 0;

            //Get results from the reader
            words = e.target.result;
            words = words.split('\n');
            
            //For each line, parse as ints.
            words.forEach(function(pair) {
              var word = pair.split(',');
              if(word.length > 2){
                //>>>>Error message<<<<
                tooManyCoords = 1;
                return;
              }
              var x = parseInt(word[0], 10);
              var y = parseInt(word[1], 10);
              
              if(isNaN(x) || isNaN(y)) {
                //>>>>Error message<<<<
                console.log(word[0] + " " + word[1]);
                return;
              }
              
              //If out of bounds of the grid, abort.
              if ($scope.h > x + 1 && $scope.w > y + 1) {
			        	newBoard[x][y]["isAlive"] = true;
		      	  } else {
			      	//Error message here.
			        }
              $scope.cellsAlive++;
            });
            if(tooManyCoords){
              reset();
            } else {
              vm.life = life.createNew(newBoard,$scope.survive1,$scope.survive2,$scope.revive);
              vm.board = vm.life.board;
              // >>>>>>>>>>>>>> Board refresh should go here <<<<<<<<<<<<<<<<<<<<<<
            }
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
      var changeFlag = 0;
      var alive = 0;
      var grandparent;
      var parent;
      
      function togglePlay(){
        if(!vm.isStarted && vm.timer){ 
          $interval.cancel(vm.timer);
          vm.isStarted = false;
          return;
        }
        var num = $scope.iteration;
        var stableDetected = 0;
        vm.isStarted = true;
        //Expanded this to be more readable.
        vm.timer = $interval(function(){
          //Kills it if it shouldn't be running.
          if(!vm.isStarted){
            return;
          }
          $scope.iterationCount++;
          if($scope.iterationCount > 1) {
            grandparent = angular.copy(parent);
          }
          parent = angular.copy(vm.life.board);
          
          alive = vm.life.next($scope.cellsAlive);
          
          if($scope.iterationCount > 1){
            stableDetected = compare(grandparent, vm.life.board);
          }

console.log(alive + " " + stableDetected);
          //Next now returns -1 if it hasn't changed anything.
          if(alive != -1 && !stableDetected){
            $scope.cellsAlive = alive;
          } else {
            $interval.cancel(vm.timer);
          }
          num--;
        }, $scope.time, num);
      }
      
      function compare(grandparent, child){
        if(grandparent.length != child.length){
          return 2;
        }
        if(grandparent[0].length != child[0].length){
          return 2;
        }
        
        var i, j, c, g;
        for(i = 0; i < grandparent.length; i++){
          for(j = 0; j < grandparent[i].length; j++){
            c = child[i][j].hasOwnProperty("isAlive");
            g = grandparent[i][j].hasOwnProperty("isAlive");
            
            if( ((c && g) && 
                 grandparent[i][j].isAlive != child[i][j].isAlive) || 
                 (c != g)){
              return 0;
            }
          }
        }
        return 1;
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
//        if(vm.isStarted) vm.togglePlay();
        $scope.gridColor = '#ffffff';
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
          
          newCell.isAlive = newCell.isAlive ? neighbors >= surv1 && neighbors <= surv2 : neighbors == revive
          
          return newCell;
        }
        
        function next(alive){
          var changeFlag = 0;
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
                changeFlag = 1;
                alive++;
              }
              else if(curr && !board[y][x].isAlive)
              {
                changeFlag = 1;
                alive--;
              }
          }
        }
        if(!changeFlag){
          return -1;
        }
        return alive;
      }
    }
  }   
  
}());

window.initialSeed = [[{"position":{"y":0,"x":0}},{"position":{"y":0,"x":1}},{"position":{"y":0,"x":2}},{"position":{"y":0,"x":3}},{"position":{"y":0,"x":4}},{"position":{"y":0,"x":5}},{"position":{"y":0,"x":6}},{"position":{"y":0,"x":7},"isAlive":false},{"position":{"y":0,"x":8}},{"position":{"y":0,"x":9}},{"position":{"y":0,"x":10}},{"position":{"y":0,"x":11}},{"position":{"y":0,"x":12}},{"position":{"y":0,"x":13}},{"position":{"y":0,"x":14}}],[{"position":{"y":1,"x":0}},{"position":{"y":1,"x":1}},{"position":{"y":1,"x":2},"isAlive":false},{"position":{"y":1,"x":3},"isAlive":true},{"position":{"y":1,"x":4},"isAlive":true},{"position":{"y":1,"x":5},"isAlive":true},{"position":{"y":1,"x":6},"isAlive":false},{"position":{"y":1,"x":7},"isAlive":false},{"position":{"y":1,"x":8}},{"position":{"y":1,"x":9},"isAlive":true},{"position":{"y":1,"x":10},"isAlive":true},{"position":{"y":1,"x":11},"isAlive":true},{"position":{"y":1,"x":12},"isAlive":false},{"position":{"y":1,"x":13}},{"position":{"y":1,"x":14}}],[{"position":{"y":2,"x":0}},{"position":{"y":2,"x":1}},{"position":{"y":2,"x":2},"isAlive":false},{"position":{"y":2,"x":3},"isAlive":false},{"position":{"y":2,"x":4},"isAlive":false},{"position":{"y":2,"x":5},"isAlive":false},{"position":{"y":2,"x":6}},{"position":{"y":2,"x":7},"isAlive":false},{"position":{"y":2,"x":8}},{"position":{"y":2,"x":9},"isAlive":false},{"position":{"y":2,"x":10},"isAlive":false},{"position":{"y":2,"x":11},"isAlive":false},{"position":{"y":2,"x":12}},{"position":{"y":2,"x":13}},{"position":{"y":2,"x":14}}],[{"position":{"y":3,"x":0}},{"position":{"y":3,"x":1},"isAlive":true},{"position":{"y":3,"x":2}},{"position":{"y":3,"x":3}},{"position":{"y":3,"x":4}},{"position":{"y":3,"x":5}},{"position":{"y":3,"x":6},"isAlive":true},{"position":{"y":3,"x":7}},{"position":{"y":3,"x":8},"isAlive":true},{"position":{"y":3,"x":9}},{"position":{"y":3,"x":10}},{"position":{"y":3,"x":11}},{"position":{"y":3,"x":12}},{"position":{"y":3,"x":13},"isAlive":true},{"position":{"y":3,"x":14}}],[{"position":{"y":4,"x":0}},{"position":{"y":4,"x":1},"isAlive":true},{"position":{"y":4,"x":2}},{"position":{"y":4,"x":3}},{"position":{"y":4,"x":4}},{"position":{"y":4,"x":5}},{"position":{"y":4,"x":6},"isAlive":true},{"position":{"y":4,"x":7}},{"position":{"y":4,"x":8},"isAlive":true},{"position":{"y":4,"x":9}},{"position":{"y":4,"x":10}},{"position":{"y":4,"x":11}},{"position":{"y":4,"x":12}},{"position":{"y":4,"x":13},"isAlive":true},{"position":{"y":4,"x":14}}] 
  ,[{"position":{"y":5,"x":0}},{"position":{"y":5,"x":1},"isAlive":true},{"position":{"y":5,"x":2}},{"position":{"y":5,"x":3}},{"position":{"y":5,"x":4}},{"position":{"y":5,"x":5}},{"position":{"y":5,"x":6},"isAlive":true},{"position":{"y":5,"x":7},"isAlive":false},{"position":{"y":5,"x":8},"isAlive":true},{"position":{"y":5,"x":9}},{"position":{"y":5,"x":10}},{"position":{"y":5,"x":11}},{"position":{"y":5,"x":12}},{"position":{"y":5,"x":13},"isAlive":true},{"position":{"y":5,"x":14}}],[{"position":{"y":6,"x":0}},{"position":{"y":6,"x":1},"isAlive":false},{"position":{"y":6,"x":2}},{"position":{"y":6,"x":3},"isAlive":true},{"position":{"y":6,"x":4},"isAlive":true},{"position":{"y":6,"x":5},"isAlive":true},{"position":{"y":6,"x":6},"isAlive":false},{"position":{"y":6,"x":7}},{"position":{"y":6,"x":8},"isAlive":false},{"position":{"y":6,"x":9},"isAlive":true},{"position":{"y":6,"x":10},"isAlive":true},{"position":{"y":6,"x":11},"isAlive":true},{"position":{"y":6,"x":12}},{"position":{"y":6,"x":13},"isAlive":false},{"position":{"y":6,"x":14}}],[{"position":{"y":7,"x":0}},{"position":{"y":7,"x":1}},{"position":{"y":7,"x":2}},{"position":{"y":7,"x":3},"isAlive":false},{"position":{"y":7,"x":4},"isAlive":false},{"position":{"y":7,"x":5},"isAlive":false},{"position":{"y":7,"x":6}},{"position":{"y":7,"x":7}},{"position":{"y":7,"x":8}},{"position":{"y":7,"x":9},"isAlive":false},{"position":{"y":7,"x":10},"isAlive":false},{"position":{"y":7,"x":11},"isAlive":false},{"position":{"y":7,"x":12}},{"position":{"y":7,"x":13}},{"position":{"y":7,"x":14}}],[{"position":{"y":8,"x":0}},{"position":{"y":8,"x":1}},{"position":{"y":8,"x":2}},{"position":{"y":8,"x":3},"isAlive":true},{"position":{"y":8,"x":4},"isAlive":true},{"position":{"y":8,"x":5},"isAlive":true},{"position":{"y":8,"x":6}},{"position":{"y":8,"x":7}},{"position":{"y":8,"x":8}},{"position":{"y":8,"x":9},"isAlive":true},{"position":{"y":8,"x":10},"isAlive":true},{"position":{"y":8,"x":11},"isAlive":true},{"position":{"y":8,"x":12},"isAlive":false},{"position":{"y":8,"x":13}},{"position":{"y":8,"x":14}}],[{"position":{"y":9,"x":0}},{"position":{"y":9,"x":1},"isAlive":true},{"position":{"y":9,"x":2}},{"position":{"y":9,"x":3},"isAlive":false},{"position":{"y":9,"x":4},"isAlive":false},{"position":{"y":9,"x":5},"isAlive":false},{"position":{"y":9,"x":6},"isAlive":true},{"position":{"y":9,"x":7}},{"position":{"y":9,"x":8},"isAlive":true},{"position":{"y":9,"x":9},"isAlive":false},{"position":{"y":9,"x":10},"isAlive":false
  },{"position":{"y":9,"x":11},"isAlive":false},{"position":{"y":9,"x":12}},{"position":{"y":9,"x":13},"isAlive":true},{"position":{"y":9,"x":14}}],[{"position":{"y":10,"x":0}},{"position":{"y":10,"x":1},"isAlive":true},{"position":{"y":10,"x":2}},{"position":{"y":10,"x":3}},{"position":{"y":10,"x":4}},{"position":{"y":10,"x":5}},{"position":{"y":10,"x":6},"isAlive":true},{"position":{"y":10,"x":7}},{"position":{"y":10,"x":8},"isAlive":true},{"position":{"y":10,"x":9}},{"position":{"y":10,"x":10}},{"position":{"y":10,"x":11}},{"position":{"y":10,"x":12},"isAlive":false},{"position":{"y":10,"x":13},"isAlive":true},{"position":{"y":10,"x":14}}],[{"position":{"y":11,"x":0}},{"position":{"y":11,"x":1},"isAlive":true},{"position":{"y":11,"x":2}},{"position":{"y":11,"x":3}},{"position":{"y":11,"x":4}},{"position":{"y":11,"x":5}},{"position":{"y":11,"x":6},"isAlive":true},{"position":{"y":11,"x":7}},{"position":{"y":11,"x":8},"isAlive":true},{"position":{"y":11,"x":9}},{"position":{"y":11,"x":10}},{"position":{"y":11,"x":11}},{"position":{"y":11,"x":12}},{"position":{"y":11,"x":13},"isAlive":true},{"position":{"y":11,"x":14}}],[{"position":{"y":12,"x":0}},{"position":{"y":12,"x":1},"isAlive":false},{"position":{"y":12,"x":2}},{"position":{"y":12,"x":3},"isAlive":false},{"position":{"y":12,"x":4},"isAlive":false},{"position":{"y":12,"x":5},"isAlive":false},{"position":{"y":12,"x":6},"isAlive":false},{"position":{"y":12,"x":7},"isAlive":false},{"position":{"y":12,"x":8},"isAlive":false},{"position":{"y":12,"x":9}},{"position":{"y":12,"x":10}},{"position":{"y":12,"x":11}},{"position":{"y":12,"x":12}},{"position":{"y":12,"x":13},"isAlive":false},{"position":{"y":12,"x":14}}],[{"position":{"y":13,"x":0}},{"position":{"y":13,"x":1}},{"position":{"y":13,"x":2}},{"position":{"y":13,"x":3},"isAlive":true},{"position":{"y":13,"x":4},"isAlive":true},{"position":{"y":13,"x":5},"isAlive":true},{"position":{"y":13,"x":6}},{"position":{"y":13,"x":7}},{"position":{"y":13,"x":8}},{"position":{"y":13,"x":9},"isAlive":true},{"position":{"y":13,"x":10},"isAlive":true},{"position":{"y":13,"x":11},"isAlive":true},{"position":{"y":13,"x":12}},{"position":{"y":13,"x":13}},{"position":{"y":13,"x":14}}],[{"position":{"y":14,"x":0}},{"position":{"y":14,"x":1}},{"position":{"y":14,"x":2}},{"position":{"y":14,"x":3}},{"position":{"y":14,"x":4}},{"position":{"y":14,"x":5}},{"position":{"y":14,"x":6}},{"position":{"y":14,"x":7}},{"position":{"y":14,"x":8}},{"position":{"y":14,"x":9}},{"position":{"y":14,"x":10
  }},{"position":{"y":14,"x":11}},{"position":{"y":14,"x":12}},{"position":{"y":14,"x":13}},{"position":{"y":14,"x":14}}]];
