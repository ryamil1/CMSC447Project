//This code is based on an implementation of Conway's Game of Life found
//at https://codepen.io/alanrsoares/pen/payKn
//There does not appear to be a license attached to it.

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
        //Adding an event handler for when the file is uploaded.
        reader.addEventListener('load', function (e) {
          //Make new board, change display conditions, stop stuff.
          $scope.$apply(function() {
            $scope.errors = "Currently No Errors";
          });

          //Clear existing game and reset some things.
          reset();
          if(vm.timer){
            $interval.cancel(vm.timer);
          }
          var newBoard = board.createNew($scope.gridH, $scope.gridW);
          vm.isStarted = false;
          $scope.iterationCount = 0;
          $scope.cellsAlive = 0;
          var tooManyCoords = 0;
          var outOfBounds = 0;
          var nanError = 0;
      
          //Get results from the reader
          words = e.target.result;
          words = words.split('\n');

          //For each line, parse as ints.
          words.forEach(function(pair) {

            //If the line is white space, skip it.
            if(!(pair == "\n" || pair.trim().length === 0)) {
              var word = pair.split(',');
              
              //If the line doesn't have two tokens, it is malformed.
              if(word.length != 2){
                if(!isNaN(parseInt(word[0]))){
                  tooManyCoords = 1;
                }
              }
              var x = parseInt(word[0], 10);
              var y = parseInt(word[1], 10);

              //If the tokens do not parse as ints, abort.
              if(isNaN(x) || isNaN(y)) {
                nanError = 1;
              }

              //If out of bounds of the grid, abort.
              if ($scope.gridH > x + 1 && $scope.gridW > y + 1 && 
                  x >= 0 && y >= 0) {
                newBoard[x][y]["isAlive"] = true;
              } else {
        				outOfBounds = 1;
              }
              $scope.cellsAlive++;
            }
          });
          if(tooManyCoords){
            reset();
            $scope.$apply(function() {
              $scope.errors = "FILE ERROR: COORDINATE FORMAT IS INCORRECT";
            });
          } else if(nanError){
            reset();
            $scope.$apply(function() {
              $scope.errors = "FILE ERROR: FILE CONTAINS NON-COORDINATE VALUES";
            });
          } else if(outOfBounds){
            reset();
            $scope.$apply(function() {
              $scope.errors = "FILE ERROR: COORDINATES OUTSIDE OF SPECIFIED GRID RANGE";
            });
          } else {
            vm.life = life.createNew(newBoard,$scope.surviveMin,$scope.surviveMax,$scope.revive);

            //Rerender board
            $scope.$apply(function() {
              vm.board = vm.life.board;
            });
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
      //Abort if the game should not be running.
      if(!vm.isStarted && vm.timer){
        $interval.cancel(vm.timer);
        vm.isStarted = false;
        return;
      }

      //Validate iterationInput is number
      if(isNaN(parseInt($scope.iterationInput))){
        $scope.errors = "ERROR: ITERATION INPUT IS NOT A NUMBER.";
        $scope.iterationInput=10;
        vm.isStarted = false;
        return;
      }

      //Validate iteration input is a valid number.
      var num = $scope.iterationInput;
      if(num > 216000 || num<1)
      {
        $scope.errors = "ERROR: NUMBER OF ITERATIONS MUST BE IN RANGE 1-216000";
        $scope.iterationInput=10;
        vm.isStarted = false;
        return;

      }
      var stableDetected = 0;
      //Reset fileInput so that it can recognize the same file more than once.
      document.getElementById("fileInput").value = "";
      vm.isStarted = true;
      //Expanded this to be more readable.
      vm.timer = $interval(function(){
        //Kills it if it shouldn't be running.
        if(!vm.isStarted){
          return;
        }
        $scope.iterationCount++;

        //Save off the n-2 state for stable state detection.
        if($scope.iterationCount > 1) {
          grandparent = angular.copy(parent);
        }
        //Save off the n-1 state for stable state detection.
        parent = angular.copy(vm.life.board);

        //Advance one step and get number of living cells.
        alive = vm.life.next($scope.cellsAlive);

        //Check if the current state is the same as n-2 state.
        if($scope.iterationCount > 1){
          stableDetected = compare(grandparent, vm.life.board);
        }

        //Next returns -1 if it hasn't changed anything, thus a stable state.
        if(alive != -1 && !stableDetected){
          $scope.cellsAlive = alive;
        } else {
          $interval.cancel(vm.timer);
        }
        num--;
      }, $scope.time, num);
    }

    //Deep comparison of object.
    function compare(grandparent, child){
      if(grandparent.length != child.length){
        return 2;
      }
      if(grandparent[0].length != child[0].length){
        return 2;
      }

      var i, j, c, g;
      //Loop over all rows and columns.  If any pair are not equal, return false.
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
      //If all member cells are equal to their parellel cell, return true.
      return 1;
    }

    //Check the validity of the fields provided by the user.
    function inputValidation(){
      //Validate iterationInput is a number.
      if(isNaN(parseInt($scope.iterationInput))){
        $scope.errors = "INPUT ERROR: ITERATION INPUT IS NOT A NUMBER.";
      }

      //Validate gridH is a number.
      if(isNaN(parseInt($scope.gridH))){
        $scope.errors = "INPUT ERROR: GRID WIDTH(X) INPUT IS NOT A NUMBER.";
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
      else if($scope.gridW < 1){
        $scope.errors = "GRID ERROR: GRID HAS MIN WIDTH OF 1. Min Width Set";
        $scope.gridW=1;
      }
      else if($scope.gridH < 1){
        $scope.errors = "GRID ERROR: GRID HAS MIN HEIGHT OF 1. Min Width Set";
        $scope.gridH=1;
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
    //Process new parameters and trigger input validation.
    function reset(){
      document.getElementById("fileInput").value = "";
      $scope.gridColor = '#ffffff';
      num=$scope.iterationInput;
      $scope.cellColor = '#000000';
      $scope.errors = "Currently No Errors";
      $scope.iterationCount= 0;
      $scope.cellsAlive=0;
      inputValidation();

      //Make a new representation of the board.
      var seed = board.createNew($scope.gridH,$scope.gridW);
      vm.life = life.createNew(seed,$scope.surviveMin,$scope.surviveMax,$scope.revive);
      vm.board = vm.life.board;
      vm.isStarted = false;
    }

    //Loading the default state when page loads.
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

  //A series of functions to run the simulation.
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
        //Setters for whether a cell is alive.
        lives: function(){this.isAlive = true;},
        dies: function(){this.isAlive = false;},
        //Function to count living neighbors.
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

    //Function to make a new empty board.
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

    //Function to make a new living board.
    function createNew(seed,surv1,surv2,revive){
      var height = seed.length;
      var width = seed[0].length;
      var previousBoard = [];
      var board = angular.copy(seed);

      return{
        next: next,
        board: board,
      };

      //Helper function to process whether a cell should be alive or dead.
      function newCellState(previousBoard,x,y){

        var oldCell = previousBoard[y][x];
        var newCell = cell.createNew(oldCell.position, {isAlive: oldCell.isAlive});
        var neighbors = newCell.getAliveNeighbors(previousBoard);

        //Count neighbors and assess living status based on specified rules.
        newCell.isAlive = newCell.isAlive ? neighbors >= surv1 && neighbors <= surv2 : neighbors == revive;

        return newCell;
      }

      //Function to process a board into the next time step.
      function next(alive){
        var changeFlag = 0;
        previousBoard = angular.copy(board);
        //For each cell, assess if it should be living, whether this means the
        //board has changed, and how many total cells are alive.
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
        //If no cells changed, return -1 to indicate we are in a steady state.
        if(!changeFlag){
          return -1;
        }
        return alive;
      }
    }
  }

}());