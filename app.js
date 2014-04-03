window.serverTime = 0;
window.apiURL = 'http://www.untap.in/apiv2.php';

	var untap = angular.module('untap', ['mm.foundation'])
	.filter('to_trusted', ['$sce', function($sce) {
        return function(text) {
			return $sce.trustAsHtml(text);
        };
    }]).filter('agotime', ['$sce', function($sce) {
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

    untap.directive('helptip', function($position) {
    	return {
    		restrict: 'E',
    		scope: {
		      tip: "@"
		    },
    		template: '<span class="label secondary right" popover="{{tip}}" popover-trigger="mouseenter" popover-placement="left" >Help</span>'
    		
    	}
    });

    untap.directive('upload', function() {
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
				var model = attrs.ctrlModel || uploadFile;
				scope.$parent[model] = { filename: '', data: '' };
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
				          			if(jQuery.inArray( ext, attrs.fileExtentions.split(' ')) < 0) {
				          				console.log(attrs.fileExtentions.split(' '), ext, jQuery.inArray( ext, attrs.fileExtentions.split(' ')));
				          				scope.warning = 'File type invalid.';
				          			}
				          		}

				          		if(typeof attrs.maxSize != 'undefined') {
				          			if(byteSize > parseInt(attrs.maxSize)) {
				          				scope.warning = 'File too large.';
				          			}
				          		}
				          		console.log(filename, ext, byteSize);
				          		if(scope.warning == '') {
					          		//textA.val(b64);
					          		scope.$parent[model] = { filename: filename, data: b64 };
					          		scope.upload = 'Upload : ' + filename;
				          		}else{
				          			scope.$parent[model] = { filename: '', data: '' };
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

    untap.controller('lobbyCtrl', function($scope, $http, $rootScope, lobbyFeed) {
    	$scope.g = lobbyFeed;
    	$scope.template = 'templates/lobby.html';

    	$scope.sendChat = function(ev) {
    		if(ev.which == 13) {
    			var message = ev.target.value;
    			ev.target.value = '';
    			$rootScope.$broadcast('sendChat', message);
    			var postData = { action: 'sendChat', message: message }
    			$http.post(apiURL,  postData, {responseType:'json'}).
		        	success(function(r, status) {});
    		}
    		if(ev.which == 38) {
				$scope.pmUser();
    		}
    	}

    	$scope.quickPM = function(username) {
    		$scope.selectedUser = username;
    		$scope.pmUser();
    	}

    	$scope.clickUser = function(username) {
			$scope.selectedUser = username;
		}

		$scope.arFriend = function() {
			$http.post(apiURL,  {action: 'arFriend', username: $scope.selectedUser }, {responseType:'json', withCredentials: true }).
        	success(function(r, status) { })
		}

		$scope.arBlock = function() {
			$http.post(apiURL,  {action: 'arBlock', username: $scope.selectedUser }, {responseType:'json', withCredentials: true }).
        	success(function(r, status) { })
		}

		$scope.pmUser = function() {
			console.log($scope.selectedUser, 'pmUser');
			$('.exit-off-canvas').trigger('click');
			$('#chatter').val('@'+$scope.selectedUser+': '+$('#chatter').val()).focus();
		}

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

    untap.controller('loggedout', function($scope, $http, $rootScope, lobbyFeed) {
    	$scope.g = lobbyFeed;

    	$scope.login = function() {
    		var postData = { action: 'login', username: $scope.g.user, password: $scope.password }
    		$scope.showAlert = false;
    		$http.post(apiURL,  postData, {responseType:'json', withCredentials: true }).
        	success(function(r, status) {
            	if(r.status == 'success') {
            		$scope.showAlert = { type: r.status, message: r.message };
            		$rootScope.$broadcast('loginSuccess');
            	}else{
            		$scope.showAlert = { type: r.status, message: r.message };
            	}
            	$scope.password = '';
        	});
    	}
    	
    });


    //controllers for modals

    var genModalCtrl = function($scope, $modalInstance, lobbyFeed) {
    	$scope.g = lobbyFeed;
    	$scope.cancel = function () {
			$modalInstance.dismiss('cancel');
		};
    }

    var accountModalCtrl = function($scope, $modalInstance, $http, lobbyFeed) {
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
				avatar: $scope.avatarUpload.data
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

    var deckModalCtrl = function($scope, $modalInstance, $http, $rootScope, $position, deckData, deckId) {
    	console.log(deckId);
    	if(deckId.split(' ')[0] == 'new') {
    		$scope.deck = { 
    			deckId: 'new',
    			type: deckId.split(' ')[1],
    			textdeck: {
    				main: '', main2: '', hand: '', play: '', sb: '', alt: ''
    			}
    		};
    	}else{
    		$scope.deck = jQuery.extend({}, deckData.list[deckId] );
    	}
    	
    	$scope.$on('doneDeckReload', function(event) {
    		$scope.deck = jQuery.extend({}, deckData.list[$scope.deck.deckId] );
    	});

    	$scope.saveDeck = function() {
    		$scope.showAlert = false;
    		var postData = {
				action: 'saveDeck',
				deckId: $scope.deck.deckId,
				deckType: $scope.deck.type,
				deckCards: $scope.deck.textdeck.main,
				deck2Cards: $scope.deck.textdeck.main2,
				handCards: $scope.deck.textdeck.hand,
				playCards: $scope.deck.textdeck.play,
				sideboardCards: $scope.deck.textdeck.sb,
				altCards: $scope.deck.textdeck.alt,

				deckName: $scope.deck.name,
				fetchUrl: $scope.deck.fetchUrl,
				uploadDeck_support: $scope.deckUpload.filename,
				uploadDeck: $scope.deckUpload.data,
			}
    		$http.post(apiURL,  postData, { responseType:'json', withCredentials: true }).
        	success(function(r, status) {
				$scope.showAlert = { type: r.status, message: r.message };
				if(r.status == 'success') {
					$scope.deck.deckId = r.deckId;
					console.log(r.deckId)
					$rootScope.$broadcast('reloadDecks');
				}
            	$scope.deck.fetchUrl = '';
            	console.log(r);
        	});
    	}

    	$scope.deleteDeck = function(deldeckId) {
    		var r=confirm("Delete this deck?");
			if (r==true) {
				$http.post(apiURL,  { action: 'deleteDeck', deckId: deldeckId }, { responseType:'json', withCredentials: true }).
    			success(function(r, status) {
    				$rootScope.$broadcast('reloadDecks');
    				$scope.cancel();
    			});
			}
    	}

    	$scope.cancel = function () {
			$modalInstance.dismiss('cancel');
		};
    }

    // userBar controller will control all lobbyFeed data for all other controllers
    untap.controller('userBar', function($scope, $q, $http, $timeout, $modal, $rootScope, lobbyFeed, deckData) {
    	$scope.g = lobbyFeed;
    	$scope.decks = deckData;

    	$scope.logout = function() {
    		$scope.g.userData.username = 'null';

			$http.post(apiURL,  { action: 'logout' }, { responseType:'json', withCredentials: true }).
        	success(function(r, status) {
            	if(r.status == 'success') {
            		console.log('User Logged Out');
            	}
        	});
		}

		$scope.accountModal = function() {
			var modalInstance = $modal.open({
				templateUrl: 'templates/accountModal.html',
				controller: accountModalCtrl
			});
		}

		$scope.genModal = function(which) {
			var modalInstance = $modal.open({
				templateUrl: 'templates/'+which+'.html',
				controller: genModalCtrl
			});
		}

		$scope.deckModal = function(deckId) {
			console.log(deckId);
			var modalInstance = $modal.open({
				templateUrl: 'templates/deckModal.html',
				controller: deckModalCtrl,
				resolve: {
					deckId: function () {
			        	return deckId;
			        }
				}
			});
		}

		$scope.$on('sendChat', function(event, message) {
			$scope.g.chat['deleteme'] = {
				type: 'chat',
				usertype: $scope.g.userData.usertype,
				chatId: 'deleteme',
				username: $scope.g.userData.username,
				message: message,
				gtime: window.serverTime
			}
			baselineChat();
		});

		$scope.getUpdates = function() {
			$http.post(apiURL,  { action: 'updatesFeed' }, { responseType:'json', withCredentials: true })
			.success(function(r, status) {
				$scope.updateFeed = r;
			})
		}

		$scope.getUpdates();

		$scope.getDecks = function() {
			$http.post(apiURL,  { action: 'deckData' }, { responseType:'json', withCredentials: true })
			.success(function(r, status) {
				$scope.decks.list = r;
				$scope.deckCount = Object.keys(r).length;
				$rootScope.$broadcast('doneDeckReload');
			})
		}

    	$scope.fetch = function(obj, count) {
        	var q = $q.defer()
        	$http.post(apiURL,  { action: 'lobbyFeed', count: count }, { responseType:'json', withCredentials: true })
			.success(function(r, status) {
				var k = 0;

				for(i in r.chat) {
	        		if(typeof obj.chat[i] == 'undefined') {
	        			delete obj.chat['deleteme'];
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
				console.log('failed');
				$timeout(function(){
					loop(0);
				}, 5000);
			});

        	return q.promise;
        }

    	var loop = function (loopCount) {
        	if(loopCount == 0) {
        		var loopTime = 1;
        		$scope.getDecks();
        	}else{
        		var loopTime = 30000;
        	}

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

        $scope.$on('loginSuccess', function(event) { loop(0); });
        $scope.$on('reloadDecks', function(event) { $scope.getDecks() });
        window.userData = $scope.g;
        window.deckData = $scope.decks;
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

    untap.factory('deckData', function() {
    	return {
    		list: {}
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

