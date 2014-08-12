'use strict';

// Angular Weather App
var weatherApp = angular.module('weatherApp', []);

weatherApp.config(function ($httpProvider) {
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
});

weatherApp.factory('configService', function () {
    var options = {
        messages: {
            noLocation: 'Please insert a location'
        }
    }
    return options;
});

weatherApp.factory('commonService', function ($http) {
    return {
        crossDomainGet: function (ajaxUrl) {
            return $http({
                url: ajaxUrl,
                method: 'GET'
            }).success(function (data) {
                return data;
            });
        }
    };
});

weatherApp.factory('weatherService', function () {
    var viewModel = {
        locations: [],
        loadingLocation: false,
        loadingError: {
            hasError: false,
            message: null
        },
        locationInput: null,
        apiUrl: 'http://api.openweathermap.org/data/2.5/weather?'
    };
    return {
        viewModel: viewModel,
        addLocation: function (data) {
            this.resetLoadingLocation();
            viewModel.locations.push(data);
        },
        removeLocation: function (scope) {
            for (var i = 0, locationsLength = viewModel.locations.length; i < locationsLength; i++) {
                if (scope.id === viewModel.locations[i].id) {
                    viewModel.locations.splice(i,1);
                    return true;
                }
            }
            return false;
        },
        getApiUrl: function (location, geolocation) {
            var apiUrl = viewModel.apiUrl;
            if (geolocation) {
                return apiUrl + 'lat=' + location.latitude + '&lon=' + location.longitude + '&units=metric';
            }
            return apiUrl = apiUrl + 'q=' + location + '&units=metric';
        },
        resetLocationInput: function () {
            viewModel.locationInput = null;
        },
        enableLoadingLocation: function () {
            viewModel.loadingLocation = true;
        },
        resetLoadingLocation: function () {
            viewModel.loadingLocation = false;
        },
        resetLoadingError: function () {
            viewModel.loadingError.hasError = false;
        },
        enableLoadingError: function () {
            viewModel.loadingError.hasError = true;
        },
        setLoadingErrorMessage: function (message) {
            viewModel.loadingError.message = message;
        }
    };
});

weatherApp.controller('WeatherController', ['$timeout', 'weatherService', 'commonService', 'configService',
    function ($timeout, weatherService, commonService, configService) {

        function addLocation (apiUrl) {
            commonService.crossDomainGet(apiUrl).then(function(data){
                weatherService.addLocation(data.data);
            });           
        };

        this.viewModel = weatherService.viewModel;
        
        this.removeLocation = function (event, scope) {
            event.preventDefault();
            weatherService.removeLocation(scope);
        };

    	this.getWeather = function (event, geolocation, location) {
            event.preventDefault();
            var _this = this,
                apiUrl,
                canGeoLocate = geolocation && this.hasGeoLocation;
            weatherService.enableLoadingLocation();
            weatherService.resetLoadingError();
            if (canGeoLocate) {
                var options = {
                    timeout: 10000
                };
                navigator.geolocation.getCurrentPosition(_this.success, _this.error, options);
            } else if (location) {
                apiUrl = weatherService.getApiUrl(location, false);
                addLocation(apiUrl);
                weatherService.resetLocationInput();
            } else {
                _this.error({message:configService.messages.noLocation});
            }
        };
        this.success = function (data) {
            apiUrl = weatherService.getApiUrl(data.coords, true);
            addLocation(apiUrl);
        }
        this.error = function (errorData) {
            weatherService.resetLoadingLocation();
            weatherService.enableLoadingError();
            weatherService.setLoadingErrorMessage(errorData.message);
        }
        // Enables location submit by pressing Enter
        this.inputSubmit = function (event, inputValue) {
            if (event.keyCode === 13) { // If user presses Enter
                this.getWeather(event, false, inputValue);
            }
        };

        // Check if the Browser has geolocation available
        // Also used to hide the get current location link
        this.hasGeoLocation = function () {
            return navigator && !!navigator.geolocation;
        };
        
        // Returns if the viewModel as locations
        this.hasLocations = function () {
            return this.viewModel.locations.length > 0;
        }

    }
]);
