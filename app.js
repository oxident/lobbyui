window.serverTime = 0;
window.apiURL = 'http://www.untap.in/apiv2.php';

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

    untap.directive('upload', function(){
    	return {
    		restrict: 'E',
    		template: '<div><a class="button expand secondary small" ng-click="click()">'+
    					'<i class="fi-upload"></i> {{upload}}'+
    					'</a>'+
    					'<div data-alert class="alert-box warning radius" ng-show="warning != \'\'">'+
						'  {{warning}}'+
						'</div>'+
    					'<input style="display: none;" type="file"></div>',
    		link: function(scope, elem, attrs) {
				scope.upload = 'Upload';
				scope.warning = '';
    			scope.click = function() {
    				inputF = elem.find('input[type="file"]');
    				textA = elem.find('textarea');
    				inputF.trigger('click').bind('change', function(e) {
						var input = this;
						
						if (input.files && input.files[0]) {
							scope.warning = '';
				            var reader = new FileReader();
				            reader.onload = function (e) {
				                var b64 = e.target.result.split(',')[1];
				                var byteSize = encodeURI(b64).split(/%..|./).length - 1;
				                var filename = $(input).val().replace(/^.*[\\\/]/, '');
				          		var ext = filename.split('.').pop();

				          		if(typeof attrs.fileExtentions != 'undefined') {
				          			if(jQuery.inArray( ext, attrs.fileExtentions.split(' ') )) {
				          				scope.warning = 'File type invalid.';
				          			}
				          		}

				          		if(typeof attrs.maxSize != 'undefined') {
				          			if(byteSize > parseInt(attrs.maxSize)) {
				          				scope.warning = 'File too large.';
				          			}
				          		}

				          		var model = attrs.ctrlModel || uploadFile;
				          		console.log(filename, ext, byteSize);
				          		if(scope.warning == '') {
					          		//textA.val(b64);
					          		scope.$parent[model] = b64;
					          		scope.upload = 'Upload : ' + filename;
				          		}else{
				          			scope.$parent[model] = '';
					          		scope.upload = 'Upload';
				          		}
				            }
				            reader.readAsDataURL(input.files[0]);
				        }
    				});
    			}
    		}
    	}	
    });

    untap.controller('lobbyCtrl', function($scope, lobbyFeed) {
    	$scope.g = lobbyFeed;
    	$scope.template = 'templates/lobby.html';

    	$scope.onloadTemp = function() {
    		if($('#chatFeed').length > 0) {
    			//fix caht height window height with no scroll
    			$('#chatFeed').height($(window).height()-($('#menuTopBar')
    				.outerHeight()+$('#menuButtons')
    				.outerHeight()+$('#menuLobbyBar')
    				.outerHeight()+$('#chatter')
    				.outerHeight()+20));
    			baselineChat();
    			setTimeout(function(){
    				$(document).foundation();
    			}, 750);
    		}
    	}

    	$scope.changeTemplate = function(template) {
    		if($scope.template != template) {
    			$scope.template = 'templates/'+template+'.html';
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
			$scope.showAlert = false;
			var postData = {
				action: 'updateUserData',
				email: $scope.userData.email,
				deckBack: $scope.userData.deckBack,
				password: $scope.userData.password,
				avatar: $scope.avatarUpload
			}
			$http.post(apiURL,  postData, { responseType:'json', withCredentials: true }).
			success(function(r, status) {
				$scope.showAlert = { type: r.status, message: r.message };
				if(postData.avatar != '') {
					$scope.userData.avatar = $scope.userData.avatar + '?' + new Date().getTime();
				}
			});
		}

		window.pjh = $scope;
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
				templateUrl: 'templates/accountModal.html',
				controller: modalInstanceCtrl
			});
		}

    	$scope.fetch = function(obj, count) {
        	var q = $q.defer()
        	$http.post(apiURL,  { action: 'lobbyFeed', count: count }, { responseType:'json', withCredentials: true })
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

	        	if(JSON.stringify(obj.userData) != JSON.stringify(r.userData)) { obj.userData = r.userData; }
	        	if(JSON.stringify(obj.gameList) != JSON.stringify(r.gameList)) { obj.gameList = r.gameList; }
	        	if(JSON.stringify(obj.specList) != JSON.stringify(r.specList)) { obj.specList = r.specList; }
	        	
	        	
	        	
	        	if(typeof r.online != 'undefined') { // catch blanks from odd count
		        	if(JSON.stringify(obj.friends) != JSON.stringify(r.friends)) { obj.friends = r.friends; }
		        	if(JSON.stringify(obj.blocks) != JSON.stringify(r.blocks)) { obj.blocks = r.blocks; }
		        	if(JSON.stringify(obj.online) != JSON.stringify(r.online)) { obj.online = r.online; }
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

    function makeid() {
	    var text = "";
	    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	    for( var i=0; i < 10; i++ )
	        text += possible.charAt(Math.floor(Math.random() * possible.length));
	    return text;
	}

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

