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
    
    var input = document.getElementById("fileInput");
    var reader = new FileReader();
    var words = "";

    //Listener for file upload button.
    input.addEventListener("change", function () {
      if (this.files && this.files[0]) {
        var myFile = this.files[0];
      
        reader.addEventListener('load', function (e) {
          //Make new board, change display conditions, stop stuff.
          $scope.$apply(function() {
            $scope.errors = "Currently No Errors";
          })

          reset();
          if(vm.timer){ 
            $interval.cancel(vm.timer);
          }
          var newBoard = board.createNew($scope.gridH, $scope.gridW);
          vm.isStarted = false;
          $scope.iterationCount = 0;
          $scope.cellsAlive = 0;
          var tooManyCoords = 0;

          //Get results from the reader
          words = e.target.result;
          words = words.split('\n');
          
          //For each line, parse as ints.
          words.forEach(function(pair) {
            if(!(pair == "\n" || pair.trim().length === 0)) {
              var word = pair.split(',');
              if(word.length != 2){
                $scope.$apply(function() {
                $scope.errors = "FILE ERROR: COORDINATE FORMAT IS INCORRECT";
              })
                //>>>>Error message<<<<
                tooManyCoords = 1;
                return;
              }
              var x = parseInt(word[0], 10);
              var y = parseInt(word[1], 10);
            

              if(isNaN(x) || isNaN(y)) {
                //>>>>Error message<<<<
                $scope.$apply(function() {
                $scope.errors = "FILE ERROR: FILE CONTAINS NON-COORDINATE VALUES";
                })
                console.log(word[0] + " " + word[1]);
                return;
              }
            
              //If out of bounds of the grid, abort.
              if ($scope.gridH > x + 1 && $scope.gridW > y + 1) {
                newBoard[x][y]["isAlive"] = true;
              } else {
                $scope.$apply(function() {
                $scope.errors = "FILE ERROR: COORDINATES OUTSIDE OF SPECIFIED GRID RANGE";
              })
              //Error message here.
              }
              $scope.cellsAlive++;
            }
          });
          if(tooManyCoords){
            reset();
          } else {
            vm.life = life.createNew(newBoard,$scope.surviveMin,$scope.surviveMax,$scope.revive);

            $scope.$apply(function() {
              vm.board = vm.life.board;
            })
          }
        });
        reader.readAsText(input.files[0]);
      }
    });
    
    $scope.errors = "Currently No Errors";
    $scope.time= "300";
    vm.reset = reset;
    vm.togglePlay = togglePlay;
    $scope.iterationInput=10;
    var num= $scope.iterationInput;
    $scope.shapeSelect = '\u25CF';
    $scope.gridW=15;
    $scope.gridH=15;
    $scope.cellsAlive=0;
    $scope.gridColor = '#ffffff';
    $scope.iterationCount= 0;
    $scope.surviveMin=2;
    $scope.surviveMax=3;
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
      
      if(isNaN(parseInt($scope.iterationInput))){
		    $scope.errors = "ERROR: ITERATION INPUT IS NOT A NUMBER.";
        $scope.iterationInput=10;
        vm.isStarted = false;
        return;
	    }
      
      var num = $scope.iterationInput;
      if(num > 216000 || num<1)
      {
        $scope.errors = "ERROR: NUMBER OF ITERATIONS MUST BE IN RANGE 1-216000";
        $scope.iterationInput=10;
        vm.isStarted = false;
        return;

      }
      var stableDetected = 0;
      document.getElementById("fileInput").value = "";
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
    
	function inputValidation(){
		//Validate iterationInput is a number.
		if(isNaN(parseInt($scope.iterationInput))){
			$scope.errors = "ERROR: ITERATION INPUT IS NOT A NUMBER.";
		}

		//Validate gridH is a number.
		if(isNaN(parseInt($scope.gridH))){
			$scope.errors = "ERROR: GRID WIDTH(X) INPUT IS NOT A NUMBER.";
		}
		
		//Validate gridW is a number.
		if(isNaN(parseInt($scope.gridW))){
			$scope.errors = "ERROR: GRID HEIGHT(Y) IS NOT A NUMBER.";
		}

		//Validate grid size.
		if($scope.gridH > 40 && $scope.gridW > 100){
			$scope.errors = "GRID ERROR: GRID HAS MAX SIZE OF 40 X 100. Max Size Set";
			$scope.gridW=100;
			$scope.gridH=40;
		}
		else if($scope.gridH > 40)
		{
			$scope.errors = "GRID ERROR: GRID HAS MAX HEIGHT OF 40. Max Height Set";
			$scope.gridH=40;
		}
		else if($scope.gridW > 100)
		{
			$scope.errors = "GRID ERROR: GRID HAS MAX WIDTH OF 100. Max Width Set";
			$scope.gridW=100;
		}

		//Validate surviveMin is a number.
		if(isNaN(parseInt($scope.surviveMin))){
			$scope.errors = "ERROR: SURVIVE MINIMUM(X) IS NOT A NUMBER.";
		}
		//Validate surviveMax is a number.
		if(isNaN(parseInt($scope.surviveMax))){
			$scope.errors = "ERROR: SURVIVE MAXIMUM(Y) IS NOT A NUMBER.";
		}
		//Validate revive is a number.
		if(isNaN(parseInt($scope.revive))){
			$scope.errors = "ERROR: REVIVE IS NOT A NUMBER.";
		}


	}

    function reset(){
//        if(vm.isStarted) vm.togglePlay();
      document.getElementById("fileInput").value = "";
      $scope.gridColor = '#ffffff';
      num=$scope.iterationInput;
      $scope.cellColor = '#000000';
      $scope.errors = "Currently No Errors";
      $scope.iterationCount= 0;
      $scope.cellsAlive=0;
	  inputValidation();
      var seed = board.createNew($scope.gridH,$scope.gridW);
      vm.life = life.createNew(seed,$scope.surviveMin,$scope.surviveMax,$scope.revive);
      vm.board = vm.life.board;
      vm.isStarted = false;
    }
    
    (function activate(){
      var seed = board.createNew($scope.gridH,$scope.gridW);
      vm.life = life.createNew(seed, $scope.surviveMin,$scope.surviveMax,$scope.revive);
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
        
        newCell.isAlive = newCell.isAlive ? neighbors >= surv1 && neighbors <= surv2 : neighbors == revive;
        
        return newCell;
      }
      
      function next(alive){
        var changeFlag = 0;
        previousBoard = angular.copy(board);
        for (var y = 0; y < height; y++) {
          for (var x = 0; x < width; x++) {
            var curr = previousBoard[y][x].isAlive;
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