
$(function(){
	
	//dom cache

	$outCardLeft = $('#outCardLeft');
	$outCardRight = $('#outCardRight');
	$spanPiles = $('.spanPile');
	$battlefield = $('#battlefield');
	$bFwrap = $('#bFwrap');
	$chatter = $('#chatter');

	//dom cache

	if(isMobile) {
		window.isTouch = 'ontouchstart' in document.documentElement;
	}else{
		window.isTouch = false;
	}

	//define window globals
	window.bfZoom = false;
    window.bfOffset = false;
    window.numPress = 1;
    window.actPress = '';
    window.leaveWarning = true;
    window.gameRunning = true;

	window.clientTime = 0;
    window.setActPressTimer = false;
    window.setNumPressTimer = false;
    window.currentHover = false;
    window.deckHover = false;
    window.activeMenu = false;
    window.keyFire = true;
    window.shiftPress = false;
    window.pointerSrc = false;
    window.pointerTgt = false;
    window.keepOldVal = false;
    window.catchDbl = false;
    window.dropnoclick = false;
    window.delayPost = [];
    window.counterDrag = 0;

    window.allcards = [];

    window.gSettings = {
        soundAlerts: 'true',
        mulligan: 'sta',
        shuffle: 'fya',
        mulhotkey: 'false',
        animate: 'true',
        showBall: 'false'
    };


    window.gsTimer = new Date().getTime();

	console.log(isTouch,'touchcheck');

	// init functions
	init.clientTime();
	init.bfScaling();
	init.preventions();
	init.deckHovers();
	init.hotkeys();
	
    init.gameSettings();  //game settings
    //hotKeys(); // start hotkeys

    init.findLists();
	init.sideBoard();
	init.expandPiles();
	init.chatter();
	init.buttons();
	init.findLists();
	
	$(document).on('touchstart mousedown', function(e){
		console.log(e,'down');
		if(((isTouch)&&(e.type == 'touchstart'))||((!isTouch)&&(e.type != 'touchstart'))) {
			
			var ev = e;

			if((spectate == true)&&($(ev.target).is('.card'))) {
				return false;
			}

			$downElem = $(ev.target);
			if($downElem.hasClass('card')) {
				ui.cardView($downElem);
			} else if($downElem.parent().hasClass('card')) {
				ui.cardView($downElem.parent());
			}

			if($(ev.target).attr('id') == 'battlefield') {
				console.log('draw box');
				var container = $('#battlefield');
		        var selection = $('#pileBox');
	                selection.hide();
	                var click_y = ((ev.originalEvent.pageY>0 ? ev.originalEvent.pageY: ev.originalEvent.targetTouches[0].pageY) - bfOffset.top)/bfZoom,
	                click_x = ((ev.originalEvent.pageX>0 ? ev.originalEvent.pageX: ev.originalEvent.targetTouches[0].pageX) - bfOffset.left)/bfZoom;
	                selection.css({
	                  'top':    click_y,
	                  'left':   click_x,
	                  'width':  0,
	                  'height': 0
	                });
	                container.on('mousemove touchmove', function(e) {
	                selection.show();
	                  var move_x = ((e.originalEvent.pageX>0 ? e.originalEvent.pageX: e.originalEvent.targetTouches[0].pageX) - bfOffset.left)/bfZoom,
	                      move_y = ((e.originalEvent.pageY>0 ? e.originalEvent.pageY: e.originalEvent.targetTouches[0].pageY) - bfOffset.top)/bfZoom,
	                      width  = Math.abs(move_x - click_x),
	                      height = Math.abs(move_y - click_y),
	                      new_x, new_y;
	                  new_x = (move_x < click_x) ? (click_x - width) : click_x;
	                  new_y = (move_y < click_y) ? (click_y - height) : click_y;
	                  selection.css({
	                    'width': width,
	                    'height': height,
	                    'top': new_y,
	                    'left': new_x
	                  });
	                }).one('mouseup touchend', function(e) {
	                    container.off('mousemove touchmove');
	                });
			}

			if(catchDbl != false) {
				menuFunc[catchDbl.action].func(catchDbl.element);
				unTapMenu.destroy();
				return false;
			}
			if($(ev.target).hasClass('ballMenuItem')){
				if($(ev.target).hasClass('numSetMulti')){
					$(document).on('touchmove', { startEvent:ev }, ui.dragNums);
				}else{
					$(document).on('touchmove', { startEvent:ev }, ui.genDrag);
				}
			}

			if($(ev.target).is('#battlefield .card .counter:not(#battlefield .card.op .counter)')) {
				console.log('counter here');
				if(e.type == 'touchstart') {
					$(ev.target).data('originalVal', parseInt($(ev.target).text()));
					$(document).on('touchmove', { startEvent:ev }, ui.dragCounter).one('touchend', function() {
						actions.counterChange($(ev.target).parent());
					});
				}
			}

			if($(ev.target).is('#avatar .counter')) {
				console.log('counter here');
				if(e.type == 'touchstart') {
					$(ev.target).data('originalVal', parseInt($(ev.target).text()));
					$(document).on('touchmove', { startEvent:ev }, ui.dragCounter).one('touchend', function() {
						actions.avaCounters($(ev.target));
					});
				}
			}

			if($(ev.target).is('#battlefield .card:not(.op)')) {

				if(shiftPress == true) {
					var card = $(ui.cardGroup($(ev.target)));
				} else {
					var card = $(ev.target);
				}
				
				var movingList = [];

				card.each(function(i,v){
					movingList[i] = {};
					movingList[i].elem = $(v);
					movingList[i].pos = $(v).position();
					movingList[i].npos = $(v).position();
				});

				var start = {
					top: Math.round((ev.originalEvent.pageY>0 ? ev.originalEvent.pageY: ev.originalEvent.targetTouches[0].pageY) - bfOffset.top),
					left: Math.round((ev.originalEvent.pageX>0 ? ev.originalEvent.pageX: ev.originalEvent.targetTouches[0].pageX) - bfOffset.left)
				};

				$(document).on('mousemove.cardmove touchmove.cardmove', function(e) {
					//console.log(e);
					var posy = {};
					activeMenu = $(ev.target).addClass('activeMenu');
					for(i in movingList) {
						movingList[i].elem.addClass('dragging').find('input').prop('disabled', true);
						var top = posy.top = Math.min(724, Math.max(0,(movingList[i].pos.top - (start.top - Math.round((e.originalEvent.pageY>0 ? e.originalEvent.pageY: e.originalEvent.targetTouches[0].pageY) - bfOffset.top)))/bfZoom));
						var left = posy.left = Math.min(1184, Math.max(0,(movingList[i].pos.left - (start.left - Math.round((e.originalEvent.pageX>0 ? e.originalEvent.pageX: e.originalEvent.targetTouches[0].pageX) - bfOffset.left)))/bfZoom));

						movingList[i].elem.css(posy);
						movingList[i].npos = {top: top, left: left};
					}
					dropnoclick = true;
	            });

				$(document).one('touchend mouseup', function() {
					$(document).off('mousemove.cardmove touchmove.cardmove');
					if(dropnoclick == false) return false;
					for(i in movingList) {
						movingList[i].elem.removeClass('dragging');
						doPost( { action: 'moveCard', cardid: movingList[i].elem.data('cardid'), top: movingList[i].npos.top, left: movingList[i].npos.left } );
					}
					setTimeout(function(){
		                dropnoclick = false;
		                activeMenu = false;
		                $('.activeMenu').removeClass('activeMenu');
		            }, 100);
				});
			}

			// catch one up binding.
			$(document).one('touchend mouseup', function(e){
					$(document).off('touchmove', ui.dragNums).off('touchmove', ui.genDrag).off('touchmove', ui.dragCounter);
					
					if(((isTouch)&&(e.type == 'touchend'))||((!isTouch)&&(e.type != 'touchend'))) {
					console.log(e,'up');

					//dTools.setRule(e.originalEvent.targetTouches[0].pageY,e.originalEvent.targetTouches[0].pageX);

					if(($(ev.target).is('#battlefield .card'))&&(shiftPress == true)&&(dropnoclick == false)) {
						if(pointerSrc == false) {
							pointerSrc = $(ev.target);
							return false;
						}
					}

					if(($(ev.target).is('#battlefield .card'))&&(pointerSrc != false)) {
						actions.arrows(pointerSrc, $(ev.target));
						if(shiftPress == false) {
							pointerSrc = false;
						}
						activeMenu = false;
		                $('.activeMenu').removeClass('activeMenu');
						return false;
					}

					$elem = $(ev.target);
					$pare = $elem.parent();

					if(($elem.hasClass('expand'))||($elem.hasClass('expandTouch'))) {
						ui.expandPile($elem);
						return false;
					}

					if($elem.is('[data-cid]')) {
						if(!isTouch) {
							$chatter.val($chatter.val()+' '+$elem.text()).focus();
						}else{
							console.log($elem);
							ui.logView($('.card[data-cardid="' + $elem.data('cid') + '"]'));
						}
					    return false;
					}
					//if($elem.is('input,textarea')) {
					//	$elem.focus();
					//	return false;
					//}


					if(($(ev.target).is('#battlefield .card .counter:not(#battlefield .card.op .counter)'))&&(e.type == 'mouseup')) {
						var counter = parseInt($(ev.target).parent().find('.counter').text());
						if(e.button == 0) {
							counter += 1;
						}else{
							counter -= 1;
						}
						$(ev.target).parent().find('.counter').text(counter);
						$(ev.target).one('mouseleave', function(){
							actions.counterChange($(ev.target).parent());
						});
						
					}

					if(($(ev.target).is('#avatar .counter'))&&(e.type == 'mouseup')) {
						var counter = parseInt($(ev.target).text());
						if(e.button == 0) {
							counter += 1;
						}else{
							counter -= 1;
						}
						$(ev.target).text(counter);
						//$(ev.target).off('mouseleave').one('mouseleave', function(){
							actions.avaCounters($(ev.target));
						//});
					}

					if((e.button == 0)||(isTouch)) {
						if($elem.is('.wholePileAction')) {
							//var pos = {top:ev.originalEvent.targetTouches[0].pageY,left:ev.originalEvent.targetTouches[0].pageX};

							var pos = {
								top: (ev.originalEvent.pageY>0 ? ev.originalEvent.pageY: ev.originalEvent.targetTouches[0].pageY),
								left: (ev.originalEvent.pageX>0 ? ev.originalEvent.pageX: ev.originalEvent.targetTouches[0].pageX)
							};

							var allMenu = menuMap['expandPile'].list;
							var menuSetup = menuMap['expandPile'].setup;

						    unTapMenu.make(pos, allMenu, $elem, menuSetup);
							return false;
						}

						if(($elem.is("[data-umenu]"))||($elem.hasClass('card')) ) {
							if(!dropnoclick) {
								var menuType = $elem.attr('data-umenu') || $elem.attr('data-location');

								if($elem.hasClass('tokenCard')) {
									menuType = 'tokenCard';
								}

								if($elem.hasClass('op')) {
									menuType += 'op';
								}
								if(menuType == 'battlefield') {
									$elem.parent().append($elem);
								}

								if((menuType == 'battlefield')&&(e.shiftKey)) {
									return false;
								}

								console.log(menuType);
								if(typeof menuMap[menuType].list != 'undefined') {
								console.log(menuMap[menuType].list);
									if(typeof menuMap[menuType].deFault != 'undefined') {
										catchDbl = {
											element: $elem,
											action: menuMap[menuType].deFault
										};
										setTimeout(function(){
											catchDbl = false;
										},350);
									}
									
									var allMenu = menuMap[menuType].list;
									var menuSetup = menuMap[menuType].setup;
									//var pos = {top:ev.originalEvent.targetTouches[0].pageY,left:ev.originalEvent.targetTouches[0].pageX};
									var pos = {
										top: (ev.originalEvent.pageY>0 ? ev.originalEvent.pageY: ev.originalEvent.targetTouches[0].pageY),
										left: (ev.originalEvent.pageX>0 ? ev.originalEvent.pageX: ev.originalEvent.targetTouches[0].pageX)
									};
									//.targetTouches[0]
						            unTapMenu.make(pos, allMenu, $elem, menuSetup);
								}
							}
							return false;
						}

						if ($elem.hasClass('ballMenuItem')){
							$(ev.target).trigger('ballActivate');
							$('.ballMenuItem').not(ev.target).animate(returnTo, 200);
			                $(ev.target).delay(200).fadeOut(100, function(){
			                    $(this).fadeIn(100, function(){
			                        $(this).fadeOut(300, function(){
			                            unTapMenu.destroy();
			                            ui.cardView('close');
			                            ui.closePile();
			                        });
			                    });
			                });
			                return false;
						}

					}else if(e.button == 2) {
						if($elem.attr('data-location') == 'battlefield') {
							$elem.parent().append($elem);
						}
					}

					unTapMenu.destroy();
					ui.cardView('close');
					ui.closePile();
				}
			});
		}
    });

});


var dTools = {
	setRule: function(top,left) {
		$('#ruleTop').css({top:top});
		$('#ruleLeft').css({left:left});
	}
};

var actions = {
	common: function(cardlist, action) { //play,playFaceDown,revealHidden,ReturnToDeck,ReturnToBottom,expel,facedownpile,ReturnToHand,ShuffleToBottom,flipUp
		if(cardlist.attr('id') == 'pileBox') {
			var cardid = general.compile($(ui.cardGroup(cardlist)), true);
			if((action != 'flipUp')&&(action != 'revealHidden')) cardlist.not('#pileBox').remove();
			doPost( { action: action, cardid: cardid } );
			return true;
		}
		if((action == 'selectRand')) {
			var cardid = general.compile(cardlist.parent().find('.card'), false);
			doPost( { action: action, cardid: cardid } );
			return true;
		}

		if((action == 'revealFaceDownPile')) {
			var cardid = general.compile(cardlist, false);
		}else{
			var cardid = general.compile(cardlist, true);
		}
		
		if((action != 'flipUp')&&(action != 'revealHidden')&&(action != 'selectRand')&&(action != 'revealFaceDownPile')) {
			cardlist.animate({top: '120%' }, function(){
				cardlist.remove();
			});
		}
		doPost( { action: action, cardid: cardid } );
	},
	arrows: function(src,target) {
		var srcId = general.compile(src, false);
		var targetId = general.compile(target, false);
		ui.arrows(srcId, targetId);
		doPost( { action: 'targetCard', src: srcId, target: targetId });
	},
	unPivot: function(card) {
		if(card.parent().attr('id') != 'battlefield') return false;
        if(card.hasClass('op')) return false;
        doPost( { action: 'unpivot', cardid: general.compile(card, true) });
        card.removeClass('pivoted');
        
	},
	pivot: function(card) {
        if(card.hasClass('op')) return false;
        if(card.hasClass('pivoted')) {
            doPost( { action: 'pivot', cardid: general.compile(card, true) });
            card.removeClass('pivoted');
        }else{
            doPost( { action: 'pivot', cardid: general.compile(card, true) });
            card.addClass('pivoted');
        }
	},
	rotate: function(card) {
		if(card.parent().attr('id') != 'battlefield') return false;
        if(card.hasClass('op')) return false;
        if(card.hasClass('rotated')) {
            doPost( { action: 'rotate', cardid: general.compile(card, true) });
            card.removeClass('rotated');
        }else{
            doPost( { action: 'rotate', cardid: general.compile(card, true) });
            card.addClass('rotated');
        }
	},
	counter: function(card) {
		if(card.hasClass('op')) { return false; }
        if(card.find('.counter').length > 0) {
            card.find('.counter').remove();
            doPost( { action: 'cardCounter', cardid: card.data('cardid'), counter: '' });
        } else {
            doPost( { action: 'cardCounter', cardid: card.data('cardid'), counter: '1' });
        }
	},
	avaCounters: function(elem) {

		if(elem.hasClass('life')) var type = 'life';
		if(elem.hasClass('genCount')) var type = 'genCount';

		clearTimeout(delayPost[type+'_avaCounter']);
		delayPost[type+'_avaCounter'] = setTimeout(function() {
			doPost( { action: type, life: elem.text() });
		}, 800);
		
	},
	counterChange: function(card) {
		var cardid = card.data('cardid');
		clearTimeout(delayPost[cardid+'_counter']);
		delayPost[cardid+'_counter'] = setTimeout(function() {
			doPost( { action: 'cardCounter', cardid: cardid, counter: card.find('.counter').text() });
		}, 500);
	},
	token: function() {
		var cardid = ui.makeid();
        doPost( { action: 'token', cardid: cardid} );
	},
	cardClone: function(card) {
		if(card.hasClass('tokenCard')) return false;
		if(card.parent().attr('id') != 'battlefield') return false;
		doPost( { action: 'cloneCard', cardid: card.data('cardid') });
	},
	tokenClone: function(card) {
		if(card.hasClass('op')) return false;
        if(!card.hasClass('tokenCard')) return false;
        var cardid = ui.makeid();
        var cloneid = card.data('cardid');
        doPost( { action: 'cloneToken', cardid: cardid, cloneid: cloneid });
	},
	draw: function(deck) {
        var from = deck.attr('id');
        doPost( { action: 'draw', from: from, amount: Math.max(numPress, 1) });
    },
	mulDraw: function(amount, shuffle) {
        shuffle = typeof shuffle !== 'undefined' ? shuffle : false;
        if(shuffle) {
            doPost( { action: 'shuffle' });
            setTimeout(function(){
                doPost( { action: 'draw', amount: amount });
            }, 500);
        }else{
            doPost( { action: 'draw', amount: amount });
        }
    },
    drawTo: function(deck, where) {
    	var from = deck.attr('id');
        doPost( { action: 'drawTo'+where, amount: Math.max(numPress, 1), from: from});
    },
    scoop: function() {
    	doPost( { action: 'allCardBack'} );
    }
};

var init = {
	preventions: function() {
		$(document).on('touchmove', function(e) {

		if($(e.target).parents('#gameLog').length > 0) return true;
		if($(e.target).parents('.popBox').length > 0) return true;
	        
        e.preventDefault(); return false;
	    })
	    .on('contextmenu', function(event){
	        event.preventDefault();
	        return false;
	    });

	    var rx = /INPUT|SELECT|TEXTAREA/i;
        $(document).on("keydown keypress", function(e){
            if( e.which == 8 ){ // 8 == backspace
                if(!rx.test(e.target.tagName) || e.target.disabled || e.target.readOnly ){
                    e.preventDefault();
                }
            }
        });

        $(window).on('beforeunload', function() {
	        ws.onclose = function () {};
	        ws.close();
	    });
	},
	bfScaling: function() {
		ui.winResize(false); //start bfscaling
	    window.onresize = function(event) { ui.winResize(true); }
	},
	expandPiles: function() {
		if(!isTouch) {
			$expand = $('<div>≡ ≡ ≡</div>').addClass('expand');
			$spanPiles.on('mouseenter', function(){
				if($(this).hasClass('expanded')) return false;
				exList = $($(this).find('.card').get().reverse());
				if(exList.length > 1) {
					$(this).append($expand);
				}
				
				var wheelCount = 0;
				$spanPiles.on('mousewheel', function(event){
					wheelCount += event.originalEvent.wheelDeltaY;
					if(Math.abs(0 - wheelCount) >= 120) {
						if(wheelCount > 0) {
							$(this).find('.card:first-child').appendTo($(this));
							ui.cardView('close');
							ui.cardView($(this).find('.card:last-child'));
						}else{
							$(this).find('.card:last-child').prependTo($(this));
							ui.cardView('close');
							ui.cardView($(this).find('.card:last-child'));
						}
						wheelCount = 0;
					}
				});
			}).on('mouseleave', function(){
				$expand.remove();
				$spanPiles.off('mousewheel');
			});
		}else{
			$spanCover = $('<div>').addClass('expandTouch');
			$spanPiles.append($spanCover);
		}
	},
	findLists: function() {
		$(".findCardList, .lookCardList, .opfindCardList").change(function() {
            ui.cardView('close');
            bg = $(this).find('option[value="'+ $(this).val() +'"]').data('image');
            if(typeof bg != 'undefined') {
                var curImg = new Image();
                curImg.src = bg;
                curImg.onload = function() {
                    $outCardRight.css("background-image", "url("+bg+")").addClass('in');
                }
            }
        });
        $('#opfindCardGo').click(function(){
            if($('.opfindCardList').val() == 'none') return false;
                doPost( { action: 'opSelect', selected: $('.opfindCardList').val() });
                ui.oppopDeckMenu('close');
        });
        $('#findCardGo').click(function(){
            if($('.findCardAction').val() == 'none') return false;
            if($('.findCardList').val() == 'none') return false;
                doPost( { action: $('.findCardAction').val(), cardid: $('.findCardList').val() });

                $('.findCardList option[value="'+$('.findCardList').val()+'"]').remove();
                //ui.popDeckMenu('close');
        });
        $('#lookCardGo').click(function() {
            if($('.lookCardAction').val() == 'none') return false;
            if($('.lookCardList').val() == 'none') return false;
            var selVal = $('.lookCardList').val().split(',');
            $.each(selVal, function(key, value) {
                if(!$('.lookCardList option[value="'+value+'"]').exists()) {
                    selVal.splice(key, 1);
                }
                $('.lookCardList option[value="'+value+'"]').remove();
                if(!$('.lookCardList option[data-image]').exists()) {
                    ui.popDeckMenu('close');
                }
            });
            doPost( { action: $('.lookCardAction').val(), cardid: selVal.join() });
        });
	},
	sideBoard: function() {
		$('#sideboardButton').click(function() {
            var sbCount = $('#sideboardList input:checked').length;
            var cuCount = $('#currentList input:checked').length;
            if((sbCount > 0)||(cuCount > 0)) {
                var sbSwap = $('#sideboardList input:checked').map(function () {return this.value;}).get() || [];
                var cuSwap = $('#currentList input:checked').map(function () {return this.value;}).get() || [];
                $('#sideboardButton').prop('disabled', true);
                doPost( { action: 'sbSwap', sideboard: sbSwap.join(), current: cuSwap.join() });

            }
        });

        $('#sideboardList>input, #currentList input').change(function() {
            var sbCount = $('#sideboardList input:checked').length;
            var cuCount = $('#currentList input:checked').length;
            if(sbCount > 0) {
                $('#sideboardButton').prop('disabled', false);
            }else{
                $('#sideboardButton').prop('disabled', true);
            }
        });
	},
	chatter: function() {
		$chatter.keyup(function(e){
            //e.preventDefault();
            if(e.which == 13) {
                var chatId = ui.makeid();
                if($(this).hasClass('public')) {
                	if(spectate == true) return false;
                    var sendMess = $(this).val();
                    $('#gameLog #publicChat.scroll').append('<div  data-chatid="'+chatId+'" class="gChat"><b>'+me+' :</b> '+$(this).val()+'</div>').scrollTop($('#gameLog #publicChat.scroll')[0].scrollHeight);
                    doPost( { action: 'pubChat', message: sendMess, chatId: chatId });
                }else
                if($(this).hasClass('spectate')) {
                    $('#gameLog #spectateChat.scroll').append('<div  data-chatid="'+chatId+'" class="specChat"><b>Spectator :</b> '+$(this).val()+'</div>').scrollTop($('#gameLog #spectateChat.scroll')[0].scrollHeight);
                    doPost( { action: 'spectateChat', message: $(this).val(), chatId: chatId });
                }else{
                    var sendMess = $(this).val();
                    // if($(this).val() == "/voice") {
                        
                    //     var sendMess = "I have started voice chat, type '/voice' to join me!";
                    // }
                    $('#gameLog #gameChat.scroll').append('<div  data-chatid="'+chatId+'" class="gChat"><b class="player">'+me+' :</b> '+sendMess+'</div>').scrollTop($('#gameLog #gameChat.scroll')[0].scrollHeight);
                    doPost( { action: 'chat', message: sendMess, chatId: chatId });
                }
                $(this).val('');
            }
        });
        

        $('.scroll').hide();
        $('#gameChat').show();
        $('#showChatPublic').click(function(){
            $chatter.removeClass('public spectate').addClass('public').focus();
            $('.scroll').hide();
            $('#publicChat').show();
        });

        $('#showChatSpectator').click(function(){
            $(this).removeClass('flasher');
            $chatter.removeClass('public spectate').addClass('spectate').focus();
            $('.scroll').hide();
            $('#spectateChat').show();
        });
        $('#showChatGame').click(function(){
            $chatter.removeClass('public spectate').focus();
            $('.scroll').hide();
            $('#gameChat').show();
        });
	},
	clientTime: function() {
		setInterval(function(){
            clientTime = clientTime+1
        }, 1000);
	},
	deckHovers: function() {
		$('.deck').on('mouseenter', function(){
			deckHover = $(this);
			ui.cardView($(this));
		}).on('mouseleave', function(){
			deckHover = false;
			ui.cardView('close');
		});

		$('#opdeck, #opdeck2').on('mouseenter', function() {
			ui.cardView($(this));
		}).on('mouseleave', function(){
			ui.cardView('close');
		});
	},
	gameSettings: function() {
		$.each(gSettings, function(key, value){
            if(typeof $.cookie(key) != 'undefined') {
                gSettings[key] = $.cookie(key);
                $('.gSettings[name="'+key+'"]').val(gSettings[key]);
            }else{
                $.cookie(key, gSettings[key], { expires: 365 });
            }
            $('.gSettings[name="'+key+'"]').change(function(){
                gSettings[key] = $(this).val();
                $.removeCookie(key);
                $.cookie(key, gSettings[key], { expires: 365 });
            });
        });
	},
	hotkeys: function() {
		if(!isTouch) {
            $(document).on('keydown', bindHotKeys);
            $(document).on('keyup', function(e){
                if(e.which == 16) { shiftPress = false; }
                console.log('keyup', e.which);
                keyFire = true; pointerSrc = false; pointerTgt = false;
            });
        }
	},
	buttons: function() {
		$('#leaveGameButton').click(function(){
            doPost( { action: 'leaveGame', winner: $('[name="lGwinner"]').val() } );
        });
        $('#changeDeckButton').click(function() {
            doPost( { action: 'swapDeck', deckid: $('[name="chDeck"]').val() });
            ui.popBox('close');
        });

        $('#swing').change(function(){
            doPost( { action: 'swing', value: $(this).val()});
        });

		$('#dice').mousedown(function(e){
            if(e.which == 1) {
                doPost( { action: 'rollDice', which: 20});
            }else if(e.which == 3) {
                doPost( { action: 'rollDice', which: 6});
            } 
        });
	}
};

var ui = {
	makeid: function() {
		var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for( var i=0; i < 10; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
	},
	dragNums: function(event) {
		event.preventDefault();
		var ev = event.data.startEvent;
		var startY = (ev.originalEvent.pageY>0 ? ev.originalEvent.pageY: ev.originalEvent.targetTouches[0].pageY);
		var startX = (ev.originalEvent.pageX>0 ? ev.originalEvent.pageX: ev.originalEvent.targetTouches[0].pageX);
		var distance = M.distance({top:startY,left:startX},{top:event.originalEvent.targetTouches[0].pageY,left:event.originalEvent.targetTouches[0].pageX})/30;
		ui.setNum(Math.max(Math.round(distance),1));
		return false;
	},
	dragCounter: function(event) {
		event.preventDefault();
		counterDrag = parseInt($(event.target).data('originalVal'));
		var ev = event.data.startEvent;
		var start = (ev.originalEvent.pageY>0 ? ev.originalEvent.pageY: ev.originalEvent.targetTouches[0].pageY);
		var distance = Math.round((start-event.originalEvent.targetTouches[0].pageY)/30)+counterDrag;


		if(distance != counterDrag) {
			//console.log(distance, 'distance');
			//console.log(counterDrag, 'target');
			$(event.target).text(distance);
		}
		return false;
	},
	genDrag: function(event) {
		event.preventDefault();
		var ev = event.data.startEvent;
		var startY = (ev.originalEvent.pageY>0 ? ev.originalEvent.pageY: ev.originalEvent.targetTouches[0].pageY);
		var startX = (ev.originalEvent.pageX>0 ? ev.originalEvent.pageX: ev.originalEvent.targetTouches[0].pageX);
		var distance = M.distance({top:startY,left:startX},{top:event.originalEvent.targetTouches[0].pageY,left:event.originalEvent.targetTouches[0].pageX})/30;
		
		if(Math.max(Math.round(distance),1) > 2) {
			unTapMenu.destroy();
		}
		//console.log(event);
	},
	cardGroup: function(elem) {
		cards = $("#battlefield .card:not(.dragging)").not('.op');
        var elems = [];
        cards.each(function() {
            var bounds = $(this).offset();
            bounds.left = bounds.left+5;
            bounds.top = bounds.top+5;
            bounds.right = bounds.left + ($(this).outerWidth()-10);
            bounds.bottom = bounds.top + ($(this).outerHeight()-10);

            var compare = elem.offset();
            compare.left = compare.left+5;
            compare.top = compare.top+5;
            compare.right = compare.left + (elem.outerWidth()-10);
            compare.bottom = compare.top + (elem.outerHeight()-10);

            if (!(compare.right < bounds.left ||
                  compare.left > bounds.right ||
                  compare.bottom < bounds.top ||
                  compare.top > bounds.bottom)
               ) {
                elems.push(this);
            }
        });
        return elems;
	},
	setNum: function(num) {
		clearTimeout(setActPressTimer);
		clearTimeout(setNumPressTimer);
		console.log(window);
		numPress = Math.max(num, 1);

		var nDraw = $("#deckContext a:contains('Draw'), #deck2Context a:contains('Draw')");
        var nDisc = $("#deckContext a:contains('Discard'), #deck2Context a:contains('Discard')");
        var nReve = $("#deckContext a:contains('Look at'), #deck2Context a:contains('Look at')");
        var nExpe = $("#deckContext a:contains('Expel'), #deck2Context a:contains('Expel')");
        var nPlay = $("#deckContext a:contains('Play Top')");
        var nFace = $("#deckContext a:contains('Play Face'), #deck2Context a:contains('Play Face')");

		if(numPress > 1) {
	       	$('.numSetMulti').text(numPress);
            nDraw.text('Draw '+numPress);
            nDisc.text('Discard Top '+numPress);
            nReve.text('Look at Top '+numPress);
            nExpe.text('Expel Top '+numPress);
            nFace.text('Play '+numPress+' Facedown');
            nPlay.text('Play Top '+numPress);

            setActPressTimer = setTimeout(function(){
	            actPress = '';
	        }, 2000);

	        setNumPressTimer = setTimeout(function(){
	            ui.setNum(1);
	        }, 2500);

        }else{
        	$('.numSetMulti').text('');
        	nDraw.text('Draw');
            nDisc.text('Discard Top Card');
            nReve.text('Look at Top Card');
            nExpe.text('Expel Top Card');
            nPlay.text('Play Top Card');
            nFace.text('Play Facedown');
        }
	},
	cardView : function(card) {
		if($('textarea').is(':focus')) return false;
		if(card == 'close') {
            $outCardLeft.removeClass('in');
            $outCardRight.removeClass('in');
            $('.activeMenu').removeClass('activeMenu');
            $outCardLeft.add($outCardRight).find('textarea').hide();
			return true;
		}
		if(!card.hasClass('card')) return false;
		if(card.data('location') == 'battlefield') {
			//console.log(card.find('textarea'));
			if(card.find('textarea').length > 0) {
				var $tNotes = $outCardLeft.find('textarea').add($outCardRight.find('textarea'));
				var $cNotes = card.find('textarea');
				var card = card;
				$tNotes.val($cNotes.val()).show().off('keyup change').on('keyup', function() {
					$cNotes.val($(this).val());
				}).on('change', function() {
					doPost( { action: 'upNotes', cardid: card.data('cardid'), value: $(this).val() });
				});
			}else{
				$outCardLeft.add($outCardRight).find('textarea').hide();
			}
		}
		var bg = card.css('background-image');
		card.addClass('activeMenu');
        if((String(bg).search('/backs/') == -1)||(card.find('textarea').length > 0)) {
        	$outCardRight.css('background-image', bg).data('currentCardid', card.data('cardid')).addClass('in');
        }
	},
	logView: function(card) {
		if($('textarea').is(':focus')) return false;
		if(card == 'close') {
            $outCardLeft.removeClass('in');
            $outCardRight.removeClass('in');
            $('.activeMenu').removeClass('activeMenu');
            $outCardLeft.add($outCardRight).find('textarea').hide();
			return true;
		}
		if(!card.hasClass('card')) return false;

		if(card.data('location') == 'battlefield') {
			//console.log(card.find('textarea'));
			if(card.find('textarea').length > 0) {
				var $tNotes = $outCardLeft.find('textarea').add($outCardRight.find('textarea'));
				var $cNotes = card.find('textarea');
				var card = card;
				$tNotes.val($cNotes.val()).show().off('keyup change').on('keyup', function() {
					$cNotes.val($(this).val());
				}).on('change', function() {
					doPost( { action: 'upNotes', cardid: card.data('cardid'), value: $(this).val() });
				});
			}else{
				$outCardLeft.add($outCardRight).find('textarea').hide();
			}
		}
		var bg = card.css('background-image');
        if((String(bg).search('/backs/') == -1)||(card.find('textarea').length > 0)) {
        	$outCardLeft.css('background-image', bg).data('currentCardid', card.data('cardid')).addClass('in');
        }
	},
	closePile: function() {
		$spanPiles.find('.card').animate({ top:0, left:0 }, 'fast');
		$('.wholePileAction').remove();
		$spanPiles.removeClass('expanded');
	},
	expandPile : function($elem) {
		ui.closePile();
		$elem.parent().addClass('expanded');
		if($elem.parent().attr('id').substring(0, 2) != "op") {
			var $pileActions = $('<div>').addClass('wholePileAction');
			$elem.parent().append($pileActions);
		}
		
		var taketop = 104;
		var addleft = 0;
		c=1;
		if(!isTouch) {
			var max = 10;
		}else{
			var max = 6;
		}
		if($elem.parent().offset().top > (winHeight/2)) {
			exList = $($elem.parent().find('.card').get().reverse());
			exList.each(function(i,v){
				$(v).animate({top: '-='+taketop, left: '+='+addleft }, 'fast');
				if(c > max) {
					addleft += 75;
					taketop = 104;
					c=0;
				}else{
					taketop += 60;
				}
				c++;
			});
		}else{
			zin = 1;
			exList.each(function(i,v){
				exList = $elem.parent().find('.card');
				$(v).animate({top: '+='+taketop, left: '+='+addleft }, 'fast').css({'z-index': zin+i});
				if(c > max) {
					addleft += 75;
					taketop = 104;
					c=0;
				}else{
					taketop += 60;
				}
				c++;
			});
		}

	},
	winResize: function(ignore) {
		winHeight = $(window).height();
        winWidth = $(window).width();

        if(winWidth < winHeight) {
        	$('#landscapePlease').show();
        }else{
        	$('#landscapePlease').hide();
        }

        if((isTouch)&&(ignore)) return false;

        bfZoom = $bFwrap.height()/$battlefield.height();

        $battlefield
        .css({ 'transform': 'scale(' + bfZoom + ')', '-webkit-transform': 'scale(' + bfZoom + ')'});
        var newWidth = $battlefield.width()*bfZoom;
        var chatWidth = $('#chatter').width()+74;
        var bcDif = (winWidth - (newWidth+chatWidth))/2;
        $battlefield.css({left: Math.max(bcDif, 0)});
        $('#bfButtons').css({left: (Math.max(bcDif, 0)+newWidth)-28 });

        if(newWidth>(winWidth*0.80)) {
            chatter.chatCloser();
        }else{
        	if((winWidth*0.80)-newWidth > 48) {
            	$('#bfButtons').css( { left: "+=24" } );
            }
            chatter.pullChat('in');
            $('#gameLog, #chatter, #bFwrap').off('mouseenter mouseleave');
            $('#chatter').off('focus', chatter.chatterBindIn).off('blur', chatter.chatterBindOut);
        }
        bfOffset = $battlefield.offset();

        if(isTouch) {
        	$('html,body').height($(window).height());
        }
	},
	popDeckMenu: function(id) {
		if(id == 'close') {
            ui.cardView('close');
            $(".findCardList").empty();
            $('.deckMenu').animate({ width : 0 }, function(){ $(this).hide() });
            return false;
        }
        $('#'+id).show().animate({ width : 180 });
	},
	oppopDeckMenu: function(id) {
		if(id == 'close') {
            ui.cardView('close');
            $(".opfindCardList").empty();
            $('.opdeckMenu').animate({ width : 0 }, function(){ $(this).hide() });
            return false;
        }
        $('#'+id).show().animate({ width : 180 });
	},
	popBox: function(id) {
	    if(id == 'close') {
	        $('.popBox').fadeOut(200);
	        return false;
	    }
	    if(id == 'sideboardPop') {
	    	doPost( { action: 'sbList'});
	    }
	    $('.popBox').hide();
	    $('#'+id+'.popBox').fadeIn(200);
	    $('#'+id+'.popBox>b').click(function() {
	        ui.popBox('close');
	    });
	},
	arrows: function(src,target) {
		var srcTarget = $('div[data-cardid="'+target+'"]');
        var srcCache = $('div[data-cardid="'+src+'"]');
        if(target != 'me' && target != 'player0000') {
            if(srcTarget.length == 0 || srcCache.length == 0) {
                setTimeout(function(){
                    if(srcTarget.length > 0 && srcCache.length > 0) {
                        actPointer(src, target);
                    }
                }, 1000);
                return false;
            }
        }
        if(target == 'me') {
            tarX = 0; tarY = 1258;
        }else if(target == 'player0000') {
            tarX = 0; tarY = 1258;
        }else{
            var sTp = srcTarget.position();
            tarX = (sTp.top)/bfZoom+51;
            tarY = (sTp.left)/bfZoom+37;
        }
        
        var sCp = srcCache.position();
        srcX = (sCp.top)/bfZoom+51;
        srcY = (sCp.left)/bfZoom+37;

        var length = Math.sqrt((tarX - srcX) * (tarX - srcX) + (tarY - srcY) * (tarY - srcY));
        if(length < 10) { return false; }
        var angle = 180 / 3.1415 * Math.acos((tarY - srcY) / length);
        angle -= 90;
        if(srcX > tarX) {
            angle *= -1;
            angle += 180;
        }
        var linkLine = $('<div id="new-link-line"><div id="triangle-down"></div></div>').appendTo('#battlefield');

        linkLine.css('top', srcX).css('left', srcY).animate( { height: length })
        .css('-webkit-transform', 'rotate(' + angle + 'deg)').css('transform', 'rotate(' + angle + 'deg)').css('z-index', '5');

        setTimeout(function(){
            linkLine.fadeOut(500, function (){
                $(this).remove();
            });
        }, 10000);
	},
	resAlert: function() {
		$('#resAlert').css("background-color", 'red');
        doPost( { action: 'resAlert'});
	},
	actChangePhase: function() {
        if(spectate == true) return false;
        var to = $(this).data('phase');
        $('#phase div').removeClass('active');
        $(this).addClass('active');
        doPost( { action: 'changePhase', phase: to } );
    }
};

var general = {
	compile: function(elems, notop) {
		if(!elems.hasClass('card')){
			elems = elems.parent().find('.card');
		}
        var compile = []
        if(notop == true) {
            elems.not('.op').each(function(){
                compile.push($(this).data('cardid'));
            });
        }else{
            elems.each(function(){
                compile.push($(this).data('cardid'));
            });
        }
        return compile.join();
	},
	toTitleCase: function(str) {
		try { str = str.replace(/\w\S*/g, function(txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); }); } catch(e) {}
        return str;
	}
}

// menus types
var menuMap = {
	battlefield: {
		list: ['pivot,rotate','discard,expel','flip','ReturnToHand','ReturnToDeck,ReturnToBottom','notes,counter','facedownpile,target'],
		setup: {start: 205, deg: 230, rad: 50},
		deFault: 'pivot'
	},
	hand: {
		list: ['play,playFaceDown','discard,expel','ReturnToDeck,ReturnToBottom','revealHidden,revealHand','randomCard', 'facedownpile'],
		setup: {start: 180, deg: 180, rad: 60},
		deFault: 'play'
	},
	expelled: {
		list: ['play','discard','ReturnToHand', 'ReturnToDeck,ReturnToBottom','randomCard', 'facedownpile'],
		setup: {start: 180, deg: 180, rad: 60}
	},
	discard: {
		list: ['play','expel','ReturnToHand', 'ReturnToDeck,ReturnToBottom','randomCard', 'facedownpile'],
		setup: {start: 180, deg: 180, rad: 60}
	},
	facedownpile: {
		list: ['play','discard,expel','ReturnToHand', 'ReturnToDeck,ReturnToBottom','randomCard', 'revealFaceDownPile'],
		setup: {start: 180, deg: 180, rad: 60}
	},
	facedownpileop: {
		list: ['randomCard', 'revealFaceDownPile'],
		setup: {start: 180, deg: 180, rad: 40}
	},
	deck: {
		list: ['draw', 'find,looktop', 'drawDiscard,drawExpel', 'drawPlay,drawFaceDown', 'flipTop,drawFacedownpile', 'shuffle', 'mulligan'],
		setup: {start: 190, deg: 200, rad: 60 },
		deFault: 'draw'
	},
	deck2: {
		list: ['drawFaceDown,draw', 'find,looktop', 'drawDiscard,drawExpel', 'flipTop,drawFacedownpile', 'shuffle'],
		setup: {start: 180, deg: 180, rad: 60 },
		deFault: 'drawFaceDown'
	},
	opdeck: {
		list: ['findOp', 'nill'],
		setup: {start: 180, deg: 180, rad: 40 }
	},
	opdeck2: {
		list: ['findOp', 'nill'],
		setup: {start: 180, deg: 180, rad: 40 }
	},
	spile: {
		list: ['pivot', 'discard,expel', 'flip', 'facedownpile', 'ReturnToDeck,ReturnToBottom','randomCard'],
		setup: {start: 180, deg: 180, rad: 60 }
	},
	expandPile: {
		list: ['play', 'discard,expel', 'ReturnToHand','ShuffleToBottom', 'ReturnToDeck,ReturnToBottom', 'randomCard'],
		setup: {start: 180, deg: 180, rad: 60 }
	},
	tokenCard: {
		list: ['pivot', 'rotate', 'discard', 'counter', 'cloneToken'],
		setup: {start: 180, deg: 180, rad: 50 }
	}

}

var menuFunc = {
	play: {
		func: function(elem) { actions.common(elem, 'play'); },
		tip: 'Play',
		sprite: 14
	},
	playFaceDown: {
		func: function(elem) { actions.common(elem, 'playFaceDown'); },
		tip: 'Play Face Down',
		sprite: 22
	},
	ShuffleToBottom: {
		func: function(elem) { actions.common(elem, 'ShuffleToBottom'); },
		tip: 'Shuffle To Bottom',
		sprite: 3
	},
	pivot: {
		func: function(elem) {
			if(elem.attr('id') == 'pileBox') {
				actions.pivot($(ui.cardGroup(elem)));
				return true;
			}
			actions.pivot(elem);
		},
		tip: 'Pivot',
		sprite: 0
	},
	flip: {
		func: function(elem) {
			actions.common(elem, 'flipUp');
		},
		tip: 'Flip Card',
		sprite: 10
	},
	rotate: {
		func: function(elem) { actions.rotate(elem); },
		tip: 'Rotate 180',
		sprite: 6
	},
	discard: {
		func: function(elem) {
			actions.common(elem, 'discard');
		},
		tip: 'Discard',
		sprite: 2
	},
	facedownpile: {
		func: function(elem) { actions.common(elem, 'facedownpile'); },
		tip: 'Facedown Pile',
		sprite: 13
	},
	expel: {
		func: function(elem) {
			actions.common(elem, 'expel');
		},
		tip: 'Expel',
		sprite: 24
	},
	ReturnToDeck: {
		func: function(elem) { actions.common(elem, 'ReturnToDeck'); },
		tip: 'Deck Top',
		sprite: 8
	},
	ReturnToBottom: {
		func: function(elem) { actions.common(elem, 'ReturnToBottom'); },
		tip: 'Deck bottom',
		sprite: 9
	},
	revealHidden: {
		func: function(elem) { actions.common(elem, 'revealHidden'); },
		tip: 'Reveal',
		sprite: 18
	},
	revealFaceDownPile: {
		func: function(elem) { actions.common(elem, 'revealFaceDownPile'); },
		tip: 'Reveal to me',
		sprite: 18
	},
	revealHand: {
		func: function(elem) {
			var r=confirm("You're about to reveal your hand!");
	        if (r==true) {
	            actions.common($('#hand .card'), 'revealHidden');
	            return true;
	        }
	        return false;
		},
		tip: 'Reveal Hand',
		sprite: 21
	},
	ReturnToHand: {
		func: function(elem) { actions.common(elem, 'ReturnToHand'); },
		tip: 'Hand',
		sprite: 16
	},
	counter: {
		func: function(elem) { actions.counter(elem); },
		tip: 'Counter',
		sprite: 19
	},
	randomCard: {
		func: function(elem) { actions.common(elem, 'selectRand'); },
		tip: 'Random Card',
		sprite: 25
	},
	notes: {
		func: function(card) {
			if(card.hasClass('op')) { return false; }
	        if((!card.hasClass('tokenCard'))&&(card.find('textarea').length == 0)) {
	        	$notes = $('<textarea class="notes" spellcheck="false"> </textarea>').change(function(){
                    doPost( { action: 'upNotes', cardid: card.data('cardid'), value: $(this).val() });
                });
	            card.append($notes);
	            //$(document).off('keydown', bindHotKeys);
	            ui.cardView(card);

	            $outCardRight.find('textarea').focus();

	            //$notes.focus();
	        }else if((!card.hasClass('tokenCard'))&&(card.find('textarea').length > 0)) {
	        	card.find('textarea').remove();
	        	doPost( { action: 'upNotes', cardid: card.data('cardid'), value: '' });
	        }
		},
		tip: 'Notes',
		sprite: 1
	},
	draw: {
		func: function(elem) {
			actions.draw(elem);
		},
		tip: 'Draw',
		sprite: 15,
		multi: true
	},
	drawDiscard: {
		func: function(elem) {
			actions.drawTo(elem,'Discard');
		},
		tip: 'Discard',
		sprite: 2,
		multi: true
	},
	drawExpel: {
		func: function(elem) {
			actions.drawTo(elem,'Expel');
		},
		tip: 'Expel',
		sprite: 24,
		multi: true
	},
	drawFacedownpile: {
		func: function(elem) {
			actions.drawTo(elem,'facedownpile');
		},
		tip: 'Face Down Pile',
		sprite: 13,
		multi: true
	},
	drawPlay: {
		func: function(elem) {
			actions.drawTo(elem,'Play');
		},
		tip: 'Play',
		sprite: 20,
		multi: true
	},
	drawFaceDown: {
		func: function(elem) {
			actions.drawTo(elem,'PlayFaceDown');
		},
		tip: 'Play Facedown',
		sprite: 13,
		multi: true
	},
	looktop: {
		func: function(elem) {
			var from = elem.attr('id');
	        $(".lookCardList, #lookCardGo").prop('disabled', true);
	        ui.popDeckMenu('lookCard');
	        doPost( { action: 'revealCard', amount: Math.max(numPress, 1), from: from});
		},
		tip: 'Look Top',
		sprite: 17,
		multi: true
	},
	findOp: {
		func: function(elem) {
			$(".opfindCardList, #opfindCardGo").prop('disabled', true);
	        ui.oppopDeckMenu('opfindCard');
	        doPost( { action: 'opfindCard'});
		},
		tip: 'Find',
		sprite: 4
	},
	find: {
		func: function(elem) {
			var from = elem.attr('id');
	        $(".findCardList, #findCardGo").prop('disabled', true);
	        ui.popDeckMenu('findCard');
	        doPost( { action: 'findCard', from: from});
		},
		tip: 'Find',
		sprite: 4
	},
	flipTop: {
		func: function(elem) {
			var from = elem.attr('id');
        	doPost( { action: 'faceUpTopDeck', from: from });
		},
		tip: 'Flip Top',
		sprite: 26
	},
	shuffle: {
		func: function(elem) {
			var from = elem.attr('id');
        	doPost( { action: 'shuffle', from: from });
		},
		tip: 'Shuffle',
		sprite: 3
	},
	cloneToken: {
		func: function(elem) {
			actions.tokenClone(elem);
		},
		tip: 'Clone Token',
		sprite: 27
	},
	mulligan: {
		func: function() {
			var r=confirm("You're about to mulligan your hand!");
	        if (r==true) {
	            var handCount = $('#hand .card').length;
		        if(gSettings.mulligan == 'sta') {
		            actions.common($('#hand .card'), 'ReturnToDeck', true);
		            handCount--;
		            setTimeout(function(){
		                actions.mulDraw(handCount, true);
		            }, 1000);
		        }

		        if(gSettings.mulligan == 'spo') {
		            actions.common($('#hand .card'), 'ReturnToBottom', true);
		            setTimeout(function(){
		                actions.mulDraw(handCount);
		            }, 1000);
		        }

		        if(gSettings.mulligan == 'edh') {
		            actions.common($('#hand .card'), 'expel', true, $('#expelled'));
		            handCount--;
		            setTimeout(function(){
		                actions.mulDraw(handCount);
		            }, 1000);
		        }
	            return true;
	        }
			return false;
		},
		tip: 'Mulligan',
		sprite: 23
	},
	target: {
		func: function(elem) {
			pointerSrc = elem;
		},
		tip: 'Target',
		sprite: 7
	},
	nill: {
		func: function() {

		},
		tip: 'no action',
		sprite: 5
	}
}

unTapMenu = {
    make: function(pos,menus,element,setup) {
    	if(spectate == true) return false;
		unTapMenu.destroy();
        activeMenu = element;
        window.returnTo = {top:pos.top,left:pos.left, opacity:0};
        var c=0;
        for(i in menus) {
        	var breakDuals = menus[i].split(',')
        	for(sp in breakDuals) {
        		var $item = $('<div>')
        			.addClass('ballMenuItem')
        			.one('ballActivate', { element: element, ballFunc: menuFunc[breakDuals[sp]].func}, function(e){
		            	e.data.ballFunc(e.data.element);
		            	$('#pileBox').hide();
		            }).css('pointer-events', 'none');
	            var angle = (((setup.deg*0.0174532925)/(menus.length-((setup.deg*0.0174532925)<6.28 ? 1 : 0)))*i)-(setup.start*0.0174532925);
	            
	            var where = M.makeCoord(angle, (setup.rad+(sp*35)), {top:pos.top,left:pos.left});
	            where.top -= 15;
	            where.left -= 15;
	            
	            if(gSettings.animate == 'true') {
		            $item.css({top:pos.top,left:pos.left}).animate(where, 350, function(){
		            	$(this).css('pointer-events', 'auto');
		            });
	            }else{
	            	$item.css(where).css('pointer-events', 'auto');;
	            }
	            
	            $item.attr('data-ttip', menuFunc[breakDuals[sp]].tip)
	            .css('background-position', menuFunc[breakDuals[sp]].sprite*-30+'px '+0)
	            .addClass('ballitem_'+menus[i]);
	            if(menuFunc[breakDuals[sp]].multi) {
	            	$item.addClass('numSetMulti');
	            }
	            $item.appendTo('body');
        	}
        }
    },
    destroy: function() {
    	$('.ballMenuItem').remove();
    	$(document).off('touchmove', ui.dragNums);
		$(document).off('touchmove', ui.genDrag);
		activeMenu = false;
    }
}

var chatter = {
	chatterBindIn: function() {
		chatter.pullChat('in');
	},
	chatterBindOut: function() {
		chatter.pullChat('out');
	},
	chatCloser: function() {
        $chatter.on('focus', chatter.chatterBindIn).on('blur', chatter.chatterBindOut);
        $chatter.hover(function(e){ e.stopPropagation(); chatter.pullChat('in'); }, function(){ chatter.pullChat('out'); });
        $chatter.hover(function(){ chatter.pullChat('in'); });
        $('#bFwrap').hover(function(){ chatter.pullChat('out'); }, function(){ chatter.pullChat('in'); });
    },
    pullChat: function(dir) {
        switch(dir){
            case 'in':
                $('#gameLog').stop().animate( { right: 0 } );
            break;
            case 'out':
                if(!$chatter.is(':focus')) {
                    $('#gameLog').stop().animate( { right: '-20%' } );
                }
            break;
        }
    }

}

var M = {
	distance: function(a,b) {
		var dx = a.top - b.top;
		var dy = a.left - b.left;
		var dist = Math.sqrt(dx*dx + dy*dy);
		return dist;
	},
	angle: function(a,b) {

		//console.log(a,b);
		//dy = ey - cy;
		//dx = ex - cx;
		dtop = b.top - a.top;
		dleft = b.left - a.left;
		theta = Math.atan2(dtop, dleft); //* (180 / Math.PI);
		//if(theta < 0) theta += 180;
		return theta;
	},
	makeCoord: function(angle, distance, pos) {
		var b = {};
		b.left = pos.left + (Math.cos(angle) * distance);
		b.top = pos.top + (Math.sin(angle) * distance);
		return b;
	}
};

function cardSync(data) {

	allcards[data.cardid] = data.cardName;

	var cardid = data.cardid;
	var cardCache = $('div[data-cardid="'+cardid+'"]');
	var currentLocation = cardCache.parent().attr('id');

	if($('#deck').data('tempcid') == cardid) {
	    $('#deck').css("background-image", "url('/backs/<?=$gData[me][userRow][deckBack]?>')").data('tempcid', '');
	}
	if($('#opdeck').data('tempcid') == cardid) {
	    $('#opdeck').css("background-image", "url('/backs/<?=$gData[opponents][1][userRow][deckBack]?>')").data('tempcid', '');
	}
	if($('#deck2').data('tempcid') == cardid) {
	    $('#deck2').css("background-image", "url('/backs/<?=$gData[me][userRow][deckBack]?>')").data('tempcid', '');
	}
	if($('#opdeck2').data('tempcid') == cardid) {
	    $('#opdeck2').css("background-image", "url('/backs/<?=$gData[opponents][1][userRow][deckBack]?>')").data('tempcid', '');
	}

	if(String(currentLocation).search(data.location) < 0) {
	    //$('.context-menu[data-id="'+cardid+'"]').remove();
	    cardCache.remove();
	}

	setTimeout(function(){
	    if(!isTouch) {
	        $('i[data-cid="'+cardid+'"]').text(data.cardName).hover(function(){
	            ui.logView($('div[data-cardid="'+cardid+'"]'));
	        }, function(){
	            ui.logView('close');
	        });
	    }
	},500);

	$('#gameLog #gameChat.scroll').scrollTop($('#gameLog #gameChat.scroll')[0].scrollHeight);

	if(!$('div[data-cardid="'+cardid+'"]').exists()) {
	    if(data.location == 'gone') return false;
	    if(data.location == 'deck') return false;
	    if(data.location == 'deck2') return false;
	    if(data.location == 'battlefield') {
	        $('#battlefield').append('<div class="card" data-cardid="'+cardid+'"></div>');
	    }else{
	        if(data.owner != me) {
	            $('#op'+data.location).append('<div class="card" data-cardid="'+cardid+'"></div>');
	        }else{
	            $('#'+data.location).append('<div class="card" data-cardid="'+cardid+'"></div>');
	        }
	    }
	}
	cardCache = $('div[data-cardid="'+cardid+'"]');

	if(typeof data.img != 'undefined') {
	    var curImg = new Image();
	    curImg.src = data.img;
	    curImg.onload = function(){
	        cardCache.css("background-image", "url("+data.img+")");
	    }
	}

	if(data.owner != me) {
	    if(!cardCache.hasClass('op')) {
	        var klone = $('div[data-cardid="'+cardid+'"]').clone(false);
	        var cardParent = cardCache.parent();
	        klone.addClass('op');
	        $('div[data-cardid="'+cardid+'"]:not(.op)').remove();
	        klone.appendTo(cardParent);
	        cardCache = $('div[data-cardid="'+cardid+'"]');
	    }
	}


	if(data.location == "battlefield") {
	    if(data.owner == me) {
	        var p = cardCache.position();
	        if(Math.abs(p.top - parseInt(data.posTop)) < 2) {
	            data.posTop = p.top;
	        }
	        if(Math.abs(p.left - parseInt(data.posLeft)) < 2) {
	            data.posLeft = p.left;
	        }
	        if(data.facedown == 'true') {
	            cardCache.css({'opacity': 0.6});
	        }else{
	            cardCache.css({'opacity': 1});
	        }
	    }
	    
	    if(!cardCache.hasClass('dragging')) {
	        if(data.owner != me) {
	            cardCache.animate({bottom: data.posTop, left: data.posLeft });
	        }else{
	            cardCache.animate({top: data.posTop, left: data.posLeft });
	        }
	    }
	    if(data.cardState != null) {
	        var splitState = data.cardState.split(',');
	        if($.inArray('pivoted',splitState) >= 0) {
	            cardCache.addClass('pivoted');
	        }else{
	            cardCache.removeClass('pivoted');
	        }

	        if($.inArray('rotated',splitState) >= 0) {
	            cardCache.addClass('rotated');
	        }else{
	            cardCache.removeClass('rotated');
	        }
	    }
	}

	cardCache.empty();

	if(typeof data.notes != 'undefined') {
	    var $notes = $('<textarea class="notes">'+data.notes+'</textarea>');
	    cardCache.append($notes);
	}

	if(data.slug == 'token-card') {
	    cardCache.addClass('tokenCard');
	    cardCache.append('<input type="text" class="tStat" value="'+data.tStat+'" maxlength="5">')
	            .append('<input type="text" class="tName" value="'+data.tName+'" maxlength="10">');

	    if(data.owner == me) {
	        cardCache.find('input').focus(function(){ keepOldVal = $(this).val(); $(this).val(''); })
	        .blur(function() {if($(this).val() == '') { $(this).val(keepOldVal); }})
	        .change(function(){
	            doPost( { action: 'upToken',cardid: $(this).closest('.card').data('cardid'), value: $(this).val(), field: $(this).attr('class') });
	        });
	    }
	}

	if(typeof data.cardCounter != 'undefined') {
	    cardCache.append('<div class="counter">'+data.cardCounter+'<div>');
	}

	cardCache.attr('data-ownership', data.ownership);
	cardCache.addClass('ready');

	if(data.owner != me) {
	    cardCache.addClass('op');
	    cardCache.find('input,textarea').prop('disabled', true);
	}else{
	    if(typeof $notes != 'undefined') {
	        $notes.off('focus touchstart').on('focus touchstart', function() {
	            setTimeout(function(){
	                $outCardRight.find('textarea').focus();
	            }, 250);
	            
	        });
	    }
	}
	cardCache.attr('data-ownership', data.ownership);
	cardCache.attr('data-cardname', data.cardName);
	cardCache.attr('data-location', data.location).data('location', data.location);

	if(!isTouch) {
	    cardCache.off('mouseenter').on('mouseenter', function(){
	        currentHover = $(this);
	        ui.cardView($(this));
	        $(this).one('mouseleave', function(){
	            ui.cardView('close');
	            currentHover = false;
	            if(activeMenu) {
	                ui.cardView(activeMenu);
	            }
	        });
	    });
	}


    if(($('#hand .card').length * 74) > $('#hand').width()) {
        var handLap = ((($('#hand .card').length * 74) - $('#hand').width()) / ($('#hand .card').length-1))+1;
        $('#hand .card:not(:first-child)').stop().animate({ marginLeft: -Math.abs(handLap) });
    }

    if(($('#ophand .card').length * 74) > $('#ophand').width()) {
        var handLap = ((($('#ophand .card').length * 74) - $('#ophand').width()) / ($('#ophand .card').length-1))+1;
        $('#ophand .card:not(:first-child)').stop().animate({ marginLeft: -Math.abs(handLap) });
    }
}

var bindHotKeys = function(e) {
    if(e.which == 27) { // ESC
        if($('.popBox').is(':visible')) {
            ui.popBox('close');
            $chatter.blur();
        }else{
            $chatter.blur();
            ui.popBox('gameMenu');
        }
        return false;
    }

    if(e.which == 13) {
        return true;
    }

    if($('input,textarea').is(':focus')) return true; //prevent keybinding fireing in input fields

    if(e.which != 17) { e.preventDefault(); } //contol key

    if(e.which == 192) { ui.popBox('tildPop'); } //tild setting

    if((keyFire == false)&&(shiftPress==false)) return false;
    keyFire = false;

    if(e.which == 16) { shiftPress = true; } //shift down

    
    if(e.keyCode == 38) { //up key Life Up
        //console.log(e);
        if(shiftPress == true) {
            var countChange = parseInt($('#avatar .life').text())+5;
        }else{
            var countChange = parseInt($('#avatar .life').text())+1;
        }
        $('#avatar .life').text(countChange);
        actions.avaCounters($('#avatar .life'));
        return false;
    }
    
    if(e.keyCode == 40) { //down key Life Down
        if(shiftPress == true) {
            var countChange = parseInt($('#avatar .life').text())-5;
        }else{
            var countChange = parseInt($('#avatar .life').text())-1;
            
        }
        $('#avatar .life').text(countChange);
        actions.avaCounters($('#avatar .life'));
        return false;
    }

    

    if(currentHover != false) {
        if(e.which == 68) { actions.common(currentHover, 'discard'); return false; } // D discard
        if(e.which == 80) { actions.common(currentHover, 'facedownpile'); return false; } // P facedownpile
        if(e.which == 84) { actions.common(currentHover, 'ReturnToDeck'); return false; } // T top of deck
        if(e.which == 89) { actions.common(currentHover, 'ReturnToBottom'); return false; } // Y bottom of deck
        if(e.which == 82) {
            if(currentHover.data('location') != 'hand') {
                actions.common(currentHover, 'ReturnToHand'); return false;
            }
        } // R return to hand
        if(e.which == 83) { actions.common(currentHover, 'expel'); return false; } // S Expel
        if(e.which == 74) { actions.tokenClone(currentHover); return false; } // J clone token
        if(e.which == 76) { actions.cardClone(currentHover); return false; } // L clone card
        if(e.which == 75) { //K flipUp
            if(currentHover.data('location') == 'battlefield') {
                actions.common(currentHover, 'flipUp');
            }
            return false;
        }
        if(e.which == 90) { //Z pivit group
            if(currentHover.data('location') == 'battlefield') {
                var group = $(ui.cardGroup(currentHover));
                if(group.length > 0) {
                    actions.pivot(group);
                }
                return false;
            }
        } // Z tap group

        if(e.which == 32) { // space
            if(currentHover.data('location') == 'battlefield') {
                if(currentHover != false) { actions.pivot(currentHover); }
            } else {
                if(currentHover != false) { actions.common(currentHover, 'play'); }
                currentHover = false;
            }
            return false;
        }
    }

    if(deckHover != false) {
        if(e.which == 32) { actions.draw(deckHover); } //space
        if(e.which == 68) { actions.drawTo(deckHover, 'Discard'); return false; } //D Discard
        if(e.which == 83) { actions.drawTo(deckHover, 'Expel'); return false; } //S Expel
    }

    // M mulligan
    if(e.which == 77) {
        if(gSettings.mulhotkey == 'true') { menuFunc.mulligan.func(); }
        return false;
    }

    if(e.which == 78) { $('#phase .active').next().click(); return false; } // N Next Phase
    if(e.which == 65) { ui.resAlert(); return false; } // A Respond
    if(e.which == 81) { doPost( { action: 'chat', message: 'No Response', chatId: ui.makeid() }); return false; } // Q noRespond
    if(e.which == 86) { menuFunc.shuffle.func($('#deck')); return false; } // V shuffle
    if(e.which == 66) { $chatter.focus(); return false; } // B focus chat
    if(e.which == 88) { actions.unPivot($('#battlefield .card.pivoted:not(.op)')); return false; } // X untap ALL
    if(e.which == 67) { actions.draw($('#deck')); return false; } // C Draw
    if(e.which == 70) { menuFunc.find.func($('#deck')); return false; } // F find card
    if(e.which == 71) { menuFunc.looktop.func($('#deck')); return false; } // G Look at top cards

    if(e.which == 48){ ui.setNum(parseInt(actPress+0)) }
    if(e.which == 49){ ui.setNum(parseInt(actPress+1)); actPress = '1'; }
    if(e.which == 50){ ui.setNum(parseInt(actPress+2)); actPress = '2'; }
    if(e.which == 51){ ui.setNum(parseInt(actPress+3)); actPress = '3'; }
    if(e.which == 52){ ui.setNum(parseInt(actPress+4)); actPress = '4'; }
    if(e.which == 53){ ui.setNum(parseInt(actPress+5)); actPress = '5'; }
    if(e.which == 54){ ui.setNum(parseInt(actPress+6)); actPress = '6'; }
    if(e.which == 55){ ui.setNum(parseInt(actPress+7)); actPress = '7'; }
    if(e.which == 56){ ui.setNum(parseInt(actPress+8)); actPress = '8'; }
    if(e.which == 57){ ui.setNum(parseInt(actPress+9)); actPress = '9'; }
}

$(function() {
	window.ws = new WebSocket('ws://www.untap.in:443/');
    
    ws.onopen = function() {
        $('#SocketStatus').text('Connected');
        var device = ''
        if(isMobile) device = 'tablet';
        $('#gameLog #gameChat.scroll').append('<div class="gLog">CONNECTED '+device+'</div>');
    };
    ws.onclose = function() {
    //$('#gameLog #gameChat.scroll').append('<div class="gLog">DISCONNECTED</div>');
        parent.showFrame(2, 'two.html');
    };
    ws.onerror = function(e) {
        $('#gameLog #gameChat.scroll').append('<div class="gLog">ERRROR'+e.toString()+'</div>');
    };

    window.onbeforeunload = function() {
        ws.onclose = function () {}; // disable onclose handler first
        ws.close();
    };

    ws.onmessage = function(event) {
    var jData = $.parseJSON(event.data);

    $.each(jData, function(key, value){
        if ((value !== null) && value.hasOwnProperty('type')) {

            //console.log(value);
            switch(value.type) {

                case 'elements':
                    //console.log(value);
                    for(element in value) {
                        $('[data-livelements="'+element+'"]').text(value[element]);
                    }
                    if(parseInt($('#deck .deckCount').text()) > 0) { $('#deck').show(); $('#noDeck').hide(); }else{ $('#deck').hide(); }
                    if(parseInt($('#opdeck .deckCount').text()) > 0) { $('#opdeck').show(); }else{ $('#opdeck').hide(); }

                    if(parseInt($('#deck2 .deckCount').text()) > 0) { $('#deck2').show(); }else{ $('#deck2').hide(); }
                    if(parseInt($('#opdeck2 .deckCount').text()) > 0) { $('#opdeck2').show(); }else{ $('#opdeck2').hide(); }
                break;

                case 'debug':
                    
                    if(typeof value.dump != 'undefined'){
                        console.log(value.dump);
                    }
                    // }else{
                    //     $('#SocketSync').text(value.SocketSync);
                    // }
                    
                break;

                case 'val':
                    $(value.element).val(value.value);
                break;

                case 'gsStatus':
                    var end = new Date().getTime();
                    var time = end - gsTimer;
                    $('#gsStatus_loopTime').text(value.loopTime);
                    $('#gsStatus_memoryUsage').text(value.memoryUsage);
                    $('#gsStatus_loopTime').text(value.loopTime);
                    $('#gsStatus_loopNum').text(value.loopNum);
                    $('#gsStatus_memcache').text(value.memcache);
                    $('#gsStatus_cTime').text(time/2);
                    $('#SocketSync').text(value.SocketSync);
                    gsTimer = new Date().getTime();
                break;

                case 'sendResp':
                    $('#gsStatus_lSend').text(value.sendid+' : '+value.execTime);
                break;

                case 'flipuptd':
                    if(value.username == me) {
                        $('#'+value.deck).css("background-image", "url("+value.cardimg+")").data('tempcid', value.cardid);
                    }
                    if(value.username == op) {
                        $('#op'+value.deck).css("background-image", "url("+value.cardimg+")").data('tempcid', value.cardid);
                    }

                break;

                case 'flash':
                    parent.tabAlert(gSettings.soundAlerts);
                    $battlefield.addClass('flasher');
                    setTimeout(function(){
                        $battlefield.removeClass('flasher');
                    }, 10000);
                break;

                case 'phase':
                    $('#swing').hide();
                    $('#phase div').removeClass('active');
                    $('#phase div[data-phase="'+value.phase+'"]').addClass('active');
                    if(value.phase == 'cp') {
                        $('#swing').show();
                        $('#swing').val('');
                    }
                    if(value.turn == 'op') {
                        $('#phase div').off('click touchend', ui.actChangePhase);
                        $('#phase').animate({bottom: ($('#playObjects').height()-$('#phase').height()-5)}).addClass('opTurn').removeClass('myTurn');
                        $('#swing').prop('disabled', true);
                    }else{
                        if($('#phase').hasClass('opTurn')) {
                            if(spectate == false) {
                                parent.tabAlert(gSettings.soundAlerts);
                            }
                        }
                        $('#phase div').off('click touchend', ui.actChangePhase).on('click touchend', ui.actChangePhase);
                        $('#phase').animate({bottom: 5}).addClass('myTurn').removeClass('opTurn');
                        $('#swing').prop('disabled', false);
                    }
                break;

                case 'gameDown':
                    parent.tabAlert(gSettings.soundAlerts);
                    $('#leaveGameButton').text('10');
                    setInterval(function(){
                        var ct = parseInt($('#leaveGameButton').text()) - 1;
                        $('#leaveGameButton').text(ct);
                    }, 1000);
                    $('#gameLog #gameChat.scroll').append('<div class="gLog"><b>Server :</b> Game is going down in 10 seconds ('+value.value+')</div>');
                    $('#leaveGameButton').prop('disabled', true);
                    leaveWarning = false;
                    setTimeout(function(){
                        if(spectate == false) {
                            parent.showFrame(2, 'two.html');
                        }else{
                            parent.showFrame(2, 'two.html');
                        }
                    }, 10000);
                    $('#gameLog #gameChat.scroll').scrollTop($('#gameLog #gameChat.scroll')[0].scrollHeight);
                    gameRunning = false;
                break;

                case 'log':
                    //console.log('gameLog', value);
                    if(value.username == me) { var who = 'player' }
                    if(value.username == op) { var who = 'opponent' }

                    if($('.gLog[data-logid="'+value.logId+'"]').exists()) {
                        $('.gLog[data-logid="'+value.logId+'"]').remove();
                    }

                    $('#gameLog #gameChat.scroll')
                        .append('<div class="gLog" data-logid="'+value.logId+'"><b class="'+who+'">'+value.username+'</b> '+value.value+'</div>')
                        .scrollTop($('#gameLog #gameChat.scroll')[0].scrollHeight);

                     $('#gameLog #gameChat.scroll').find('i[data-cid]').each(function(i,v){
                        var cardid = $(v).data('cid');
                        $(v).text(allcards[cardid]);
                     });
                break;

                case 'chat':
                    if(spectate == false) {
                        parent.tabAlert(gSettings.soundAlerts);
                    }
                
                    if(value.username == me) { var who = 'player' }
                    if(value.username == op) { var who = 'opponent' }
                    if($('.gChat[data-chatid="'+value.chatId+'"]').exists()) {
                        $('.gChat[data-chatid="'+value.chatId+'"]').remove();
                    }
                    $('#gameLog #gameChat.scroll').append('<div data-chatid="'+value.chatId+'" class="gChat"><b class="'+who+'">'+value.username+' :</b> '+value.value+'</div>')
                                .scrollTop($('#gameLog #gameChat.scroll')[0].scrollHeight);
                    
                break;

                case 'spectateChat':
                    if($('.specChat[data-chatid="'+value.chatId+'"]').exists()) {
                        $('.specChat[data-chatid="'+value.chatId+'"]').remove();
                    }
                    $('#gameLog #spectateChat.scroll').append('<div data-chatid="'+value.chatId+'" class="gChat"><b style="color: #f89406;">'+value.username+' :</b> '+value.value+'</div>')
                                .scrollTop($('#gameLog #spectateChat.scroll')[0].scrollHeight);

                    console.log(clientTime, $('#spectateChat').is(':visible'), 'flahser check');
                    if((clientTime > 5)&&(!$('#spectateChat').is(':visible'))) {
                        $('#showChatSpectator').addClass('flasher');
                    }
                break;
                
                case 'pubChat':
                    var style = '#5bc0de';
                      if(value.usertype == 'mod') {
                        var style = '#ee5f5b';
                      }

                      if(value.usertype == 'friend') {
                        var style = '#62c462';
                      }
                    if($('.gChat[data-chatid="'+value.chatId+'"]').exists()) {
                        $('.gChat[data-chatid="'+value.chatId+'"]').remove();
                    }
                    $('#gameLog #publicChat.scroll').append('<div data-chatid="'+value.chatId+'" class="gChat"><b style="color: '+style+';">'+value.username+' :</b> '+value.message+'</div>')
                                .scrollTop($('#gameLog #publicChat.scroll')[0].scrollHeight);
                    
                break;

                case 'target':
                    if(value.target == 'player0000') {
                        value.target = 'me';
                    }
                    ui.arrows(value.src, value.target);
                break;

                case 'card':
                    cardSync(value);
                break;

                case 'opfindcard':
                    $(".opfindCardList").empty().append('<option value="none">Select Card</option>');
                    $.each(value.showList, function(rK, rV) {
                        $(".opfindCardList").append('<option value="'+rV.cardName+'" data-image="'+rV.img+'">'+rV.cardName+'</option>');
                    });
                    $(".opfindCardList, #opfindCardGo").prop('disabled', false);
                break;

                case 'findCard':
                    $(".findCardList").empty().append('<option value="none">Select Card</option>');

                    $.each(value.showList, function(rK, rV) {
                        $(".findCardList").append('<option value="'+rV.cardid+'" data-image="'+rV.img+'">'+rV.cardName+'</option>');
                    });
                    $(".findCardList, #findCardGo").prop('disabled', false);
                break;

                case 'revealCard':
                    $(".lookCardList").empty().append('<option value="none">Select Card</option>');
                    var alList = new Array();
                    $.each(value.showList, function(rK, rV) {
                        $(".lookCardList").append('<option value="'+rV.cardid+'" data-image="'+rV.img+'">'+rV.cardName+'</option>');
                        alList.push(rV.cardid);
                    });
                    if(alList.length > 1) {
                        $(".lookCardList").append('<option value="'+alList.join()+'">Select All</option>');
                    }
                    $(".lookCardList, #lookCardGo").prop('disabled', false);
                break;

                case 'sbList':
                    $('#sideboardList, #currentList').empty();
                    $('#sidboardButton').prop('disabled', true);
                    $.each(value.current, function(rK, rV) {
                        $('#currentList').append('<label><input type="checkbox" name="" value="'+rV.cardid+'">'+rV.name+'</label>');
                    });
                    $.each(value.sideboard, function(rK, rV) {
                        $('#sideboardList').append('<label><input type="checkbox" name="" value="'+rV.cardid+'">'+rV.name+'</label>');
                    });
                break;

                case 'eval':
                    eval(value.runMe);
                break;

                case 'closePop':
                    ui.popBox('close');
                    $('#sideboardButton').prop('disabled', false);
                break;
              }
            }
    });
  };
});

$('[data-ttip]').livequery(function() {
    if(spectate == false) {
        $(this).hover(function(){
            $('#toolTips').text('Tip: '+$(this).data('ttip')).show();
        }, function(){
            $('#toolTips').text('').hide();
        });
    }
    
});

function doPost(data, func) {
    data.sendid = ui.makeid();
    console.log(data);
    ws.send(JSON.stringify(data));
}

$.fn.topZ = function() {
    var zH = 1;
	this.each(function() {
    var zC = parseInt($(this).css("zIndex"), 10);
    
    if ((zC > zH)&&(!isNaN(zC))) {
        zH = zC;
    }
});
	return zH;
};

(function( $ ) {
    $.fn.exists = function(){return this.length>0;}
})( jQuery );
