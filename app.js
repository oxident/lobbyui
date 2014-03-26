window.serverTime = 0;

	var untap = angular.module('untap', ['mm.foundation'])
	.filter('to_trusted', ['$sce', function($sce){
        return function(text) {
			return $sce.trustAsHtml(text);
        };
    }]).filter('agotime', ['$sce', function($sce){
        return function(time) {
        	var seconds = serverTime-parseInt(time);
        	var interval;
		    interval = Math.floor(seconds / 3600);
		    if (interval > 1) { return interval + " hours ago"; }
		    if (interval >= 1) { return interval + " hour ago"; }
		    interval = Math.floor(seconds / 60);
		    if (interval >= 1) { return interval + " minutes ago"; }
		    return Math.floor(seconds) + " seconds ago";
        };
    }]);

    untap.controller('lobbyCtrl', function($scope, lobbyFeed) {
    	$scope.g = lobbyFeed;
    	$scope.template = 'lobbyui/templates/lobby.html';

    	$scope.onloadTemp = function() {
    		if($('#chatFeed').length > 0) {
    			$('#chatFeed').height($(window).height()-($('#menuTopBar').outerHeight()+$('#menuButtons').outerHeight()+$('#menuLobbyBar').outerHeight()+$('#chatter').outerHeight()+20));
    			baselineChat();
    			setTimeout(function(){
    				$(document).foundation();
    			}, 750);
    		}
    	}

    	$scope.changeTemplate = function(template) {
    		if($scope.template != template) {
    			$scope.template = 'lobbyui/templates/'+template+'.html';
    		}
    	}
    });

    untap.controller('loggedout', function($scope, lobbyFeed) {
    	$scope.g = lobbyFeed;
    });


    //controllers for modals

    var modalInstanceCtrl = function($scope, $modalInstance, $http, lobbyFeed) {
    	$scope.g = lobbyFeed;

    	$scope.userData = jQuery.extend({}, lobbyFeed.userData );

    	$scope.cancel = function () {
			$modalInstance.dismiss('cancel');
		};

		$scope.saveProfile = function() {
			$scope.userData.action = 'logback';
			$http.post('apiv2.php',  $scope.userData, {responseType:'json'}).
			success(function(r, status) {

			});
		}
    }

    // userBar controller will control all lobbyFeed data for all other controllers
    untap.controller('userBar', function($scope, $q, $http, $timeout, $modal, lobbyFeed) {
    	$scope.g = lobbyFeed;

    	$scope.logout = function() {
			$http.post('apiv2.php',  { action: 'logout' }, {responseType:'json'}).
        	success(function(r, status) {
            	if(r.status == 'OK') {
            		console.log('User Logged Out');
            	}
        	});
		}

		$scope.openModal = function() {
			var modalInstance = $modal.open({
				templateUrl: '/lobbyui/templates/accountModal.html',
				controller: modalInstanceCtrl
			});
		}

    	$scope.fetch = function(obj, count) {
        	var q = $q.defer()
        	$http.post('apiv2.php',  { action: 'lobbyFeed', count: count }, {responseType:'json'})
			.success(function(r, status) {
				var k = 0;

				for(i in r.chat) {
	        		if(typeof obj.chat[i] == 'undefined') {
	        			obj.chat[i] = r.chat[i];
	        			baselineChat();
	        		}else{
	        			obj.chat[i].gtime = r.chat[i].gtime;
	        		}
	        	}

	        	if(JSON.stringify(obj.userData) != JSON.stringify(r.userData)) {
	        		obj.userData = r.userData;
	        		console.log('changed')
	        	}
	        	if(JSON.stringify(obj.gameList) != JSON.stringify(r.gameList)) {
	        		obj.gameList = r.gameList;
	        	}
	        	if(JSON.stringify(obj.specList) != JSON.stringify(r.specList)) {
	        		obj.specList = r.specList;
	        	}
	        	
	        	
	        	
	        	if(typeof r.online != 'undefined') { // catch blanks from odd count
		        	if(JSON.stringify(obj.friends) != JSON.stringify(r.friends)) {
		        		obj.friends = r.friends;
		        	}
		        	if(JSON.stringify(obj.blocks) != JSON.stringify(r.blocks)) {
		        		obj.blocks = r.blocks;
		        	}
		        	if(JSON.stringify(obj.online) != JSON.stringify(r.online)) {
		        		obj.online = r.online;
		        	}
		        }
		        if(typeof r.user != 'undefined') {
		        	obj.user = r.user;
		        }

	        	window.serverTime = parseInt(r.serverTime);

	        	if(obj.userData.username == 'null') {
	        		var loggedin = false;
	        	}else{
	        		var loggedin = true;
	        	}
	        	q.resolve(loggedin);
				
			}).error(function(){
				console.log('failed')
			});

        	return q.promise;
        }

    	var loop = function (loopCount) {
        	if(loopCount == 0) { var loopTime = 1; }else{ var loopTime = 3000; }
        	$timeout(function(){
	        	$scope.promise = $scope.fetch($scope.g, loopCount);
		        loopCount++;
		        $scope.promise.then(
		        	function(v) {
		        		if(v) {
		        			loop(loopCount);
		        		}
		        	}
		        );
	        }, loopTime);
        }
        loop(0);

        window.pjh = $scope.g;
    });

    //factory for lobbyFeed this will set up the object template ready for resource sharing.
    untap.factory('lobbyFeed', function() {
    	return {
            chat: {},
            blocks: {},
            friends: {},
            online: {},
            specList: {},
            userData: {
            	username: 'null' //set default as null for no login.
            },
            gameList: {},
            user: {}
        }
    });

    function baselineChat() {
    	if($('#chatFeed').length < 1) return false;
    	clearTimeout(window.scrollDowner);
		window.scrollDowner = setTimeout(function() {
			$('#chatFeed').scrollTop($('#chatFeed')[0].scrollHeight);
		}, 100);
    }


	$(document).foundation();
	// $(function(){
	// 	$('#chatFeed').height($(window).height()-($('#menuTopBar').outerHeight()+$('#menuButtons').outerHeight()+$('#menuLobbyBar').outerHeight()+$('#chatter').outerHeight()+20));
	// });
    var doc = document.documentElement;
    doc.setAttribute('data-useragent', navigator.userAgent);

