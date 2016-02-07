angular.module('starter.controllers', [])
.controller('DashCtrl', function($scope, $state, Arrivals, $ionicPlatform, MioFavs, $ionicListDelegate) {
  var savedPositionString = sessionStorage.getItem('position2');
  if (savedPositionString) {
    $scope.savedPosition = JSON.parse(savedPositionString);
  }
  // not needed i hope
  //$scope.arrivals = Arrivals.latestByStation();
  //$scope.favs = MioFavs.intersection($scope.arrivals);
  $scope.loading = true;
  Arrivals.subscribe('arrivalsChanged', $scope);
  Arrivals.subscribe('apiError', $scope);
  $scope.$on('arrivalsChanged', function(event, rawArrivals, error) {
    $scope.error = null;
    $scope.arrivals = Arrivals.latestByStation();
    $scope.favs = MioFavs.intersection($scope.arrivals);
    $scope.emptyResponse = rawArrivals.length == 0;
    $scope.loading = false;
    if ($scope.savedPosition) {
      $scope.nearbyStations = Arrivals.closestTo($scope.savedPosition, $scope.arrivals);
    }
  });
  $scope.$on('apiError', function(event, errorMsg) {
    $scope.error = errorMsg;
    $scope.loading = false;
    $scope.emptyResponse = false;
  })

  $scope.geowait = true;
  $ionicPlatform.ready(function() {
    window.navigator.geolocation.getCurrentPosition(function(position) {
      $scope.savedPosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
      var newJson = JSON.stringify($scope.savedPosition);
      var oldJson = sessionStorage.getItem('position2');
      if (newJson != oldJson) {
        sessionStorage.setItem('position2', newJson);
      }
      $scope.$apply(function() {
        $scope.nearbyStations = Arrivals.closestTo($scope.savedPosition, $scope.arrivals);
        $scope.geowait = false;
      });
    });
  });

  $scope.stationView = function(stationName) {
    $state.go("station", {stationName: stationName});
  };

  var dirOrder = ['n', 's', 'w', 'e'];
  $scope.byDirection = function(obj) {
    if (!obj) {
      return null;
    }
    var res = {};
    for (var i = 0; i < dirOrder.length; i++) {
      if (obj[dirOrder[i]]) {
        res[dirOrder[i]] = obj[dirOrder[i]];
      }
    }
    return res;
  };
  
  $scope.timeboxClass = function(arrival) {
    var ret = {
      scheduled: arrival.scheduled
    };
    ret[arrival.line + '-line'] = true;
    return ret;
  };

  $scope.isFavorite = function(stationName) {
    return MioFavs.all().indexOf(stationName) > -1;
  };
  $scope.toggleFavorite = function(stationName) {
    MioFavs.toggle(stationName);
    $ionicListDelegate.closeOptionButtons();
    $scope.favs = MioFavs.intersection($scope.arrivals);
  };


  $scope.timeDisplay = function(arrival) {
    var text = arrival.waiting_time;
    if (['arriving', 'arrived'].indexOf(text) >= 0) {
      return "<i class='icon ion-android-subway'></i>";
    } else if (text == 'boarding') {
      return "<i class='icon ion-archive rot'></i>";
    }

    // waiting_time should start with a number, and parse to int
    return ":" + (parseInt(arrival.waiting_time) || 0);
  };
})

.controller('StationCtrl', function($scope, $state, Arrivals) {
  var stationName = $scope.stationName = $state.params.stationName + " station";
  $scope.arrivals = Arrivals.by('station', stationName);
  Arrivals.subscribe('arrivalsChanged', $scope);
  $scope.$on('arrivalsChanged', function() {
    $scope.arrivals = Arrivals.by('station', stationName);
  });

  $scope.arrivalClass = function(arrival) {
    var ret = {
      scheduled: arrival.scheduled
    };
    ret[arrival.line + '-line'] = true;
    return ret;
  };

  $scope.trainView = function(trainId) {
    if (!trainId) return;
    $state.go("train", {trainId: trainId});
  };
  
})

.controller('TrainCtrl', function($scope, $state, Arrivals) {
  var trainId = $scope.trainId = $state.params.trainId;
  $scope.arrivals = Arrivals.by('train_id', trainId);
  Arrivals.subscribe('arrivalsChanged', $scope);
  $scope.$on('arrivalsChanged', function() {
    $scope.arrivals = Arrivals.by('train_id', trainId);
  });
  $scope.arrivalClass = function(arrival) {
    var ret = {
      scheduled: arrival.scheduled
    };
    ret[arrival.line + '-line'] = true;
    return ret;
  };

});
