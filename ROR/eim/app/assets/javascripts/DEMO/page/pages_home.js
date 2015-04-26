$(document).ready(function() {
		var $filter_panel = $("#filter-panel"),
				$unread_selecter = $filter_panel.find("select#all-unread"),
				$timeline = $("ul.wall-content");

		function applyFilter(feed_filter_type, unread_filter_type, reset_callback){
				EIM.API.Feeds.getFeeds(feed_filter_type, unread_filter_type, null, null, function(data) {
						// reset until feeds loading finished
						!!reset_callback && reset_callback();

						// populate feeds ui
						$.each(data.list, function(key, val) {
								var _callback = function(data) {
										$('<li/>').articleItem({info: data}).appendTo($timeline);
								}
								EIM.API.Info.get("Conversations", val, _callback);
						});
				});
		}

		function reset_timeline() {
				$timeline.empty().slideUp(400).slideDown(400);
		}		

		(function init(){
				// init create task button
				$("#create_task_btn").createTaskForm();

				// init create event button
				$("#create_event_btn").createEventForm();

				$unread_selecter.wrap("<div class='selecter'>").customSelect();

				// init timeline
				applyFilter("following", "all");

				$('<div class="loading"><span class="title">Loading...</span></div>').css("display", "none")
						.appendTo($timeline.parent());
		})();

		(function bind_event() {

				function load_newer_feeds() {
						var $_first, first_id, newer_than_id;

						$_first = $timeline.find("> :first-child");
						first_id = $_first.find("article").attr("id");
						if(!!first_id) {
								newer_than_id = first_id.match(/\d+/gi).toString();
						}
						else {
								newer_than_id = null;
						}

						newer_than_id = first_id.match(/\d+/gi).toString();

						var _options = {
								is_for_older_than: false
						}
						EIM.API.Feeds.getFeeds($filter_panel.find("ul.filter li.active").data("filter"), $unread_selecter.val(), newer_than_id, null, function (data) {
								// append item
								$.each(data.list, function(key, val) {
										if(!!first_id) {
												var _callback = function(data) {
														$('<li/>', {
																style: "display: none"
														}).articleItem({info: data}).insertBefore($_first).slideDown('fast');
												}
										}
										else {
												var _callback = function(data) {
														$('<li/>', {
																style: "display: none"
														}).articleItem({info: data}).appendTo($timeline).slideDown('fast');
												}
										}

										EIM.API.Info.get("Conversations", val, _callback);
								});
						}, _options);
				}

				function load_older_feeds() {
						var last_id, older_than_id;

						last_id = $timeline.find("> :last-child").find("article").attr("id");
						if(!last_id) return;

						$timeline.siblings(".loading").slideDown('400');
						EIM.API.ReqLock.lock(EIM.Constant.ReqLockType.FEEDS);

						older_than_id = last_id.match(/\d+/gi).toString();

						EIM.API.Feeds.getFeeds($filter_panel.find("ul.filter li.active").data("filter"), $unread_selecter.val(), older_than_id, null, function (data) {
								var _last = data.list[data.list.length - 1];
								$timeline.siblings(".loading").slideUp('400');

								if(data.list.length === 0) {
										setTimeout(function() {
												EIM.API.ReqLock.unlock(EIM.Constant.ReqLockType.FEEDS);
										}, 1000);
								} else {
										// append item
										$.each(data.list, function(key, val) {
												var _callback = function(data) {
														$('<li/>').articleItem({info: data}).appendTo($timeline);
														if(data.id === _last) {
																setTimeout(function() {
																		EIM.API.ReqLock.unlock(EIM.Constant.ReqLockType.FEEDS);
																}, 1000);
														}
												}
												EIM.API.Info.get("Conversations", val, _callback);
										});
								}
						});
				};

				$unread_selecter.change(function(event) {
						applyFilter($filter_panel.find("ul.filter li.active").data("filter"), $(this).val(), reset_timeline);
				});

				$filter_panel.find("ul.filter li").click(function() {
						$filter_panel.find("ul.filter li.active").removeClass("active");
						$(this).addClass("active");

						applyFilter($(this).data("filter"), $unread_selecter.val(), reset_timeline);
				});

				$(window).scroll(function(event) {
						if(!EIM.API.ReqLock.isLock(EIM.Constant.ReqLockType.FEEDS)) {
								EIM.Utils.checkAtBottom($timeline, load_older_feeds);
						}
				});

				$(document).ajaxComplete(function(event, xhr, settings) {
						var update_posts_pattern = /^\/posts\/\d*$/gi;
						var update_tasks_pattern = /^\/tasks\/\d*$/gi;
						var update_events_pattern = /^\/events\/\d*$/gi;
						var json_req_pattern = new RegExp("^\/\\S+\\.json");

            if (settings.url === "/posts" || settings.url === "/tasks" || settings.url === "/events") {
            		var conversation, post;
            		var res = JSON.parse(xhr.responseText);

                console.log("response @Data:" + res.data);

                conversation = res.data.conversation;
                post = res.data.post;

								EIM.API.Info.set(conversation);
								EIM.API.Info.set(post);

								switch(post.post_type) {
										case EIM.Constant.PostType.normal:
												if(conversation.private) {
														// reset 'private message hidden form'
														if(res.private_message_hidden_form) $("#private_message_post_hidden").replaceWith(res.private_message_hidden_form);
												}
												else {
														// reset 'post hidden form'
														if(res.post_hidden_form) $("#new_post_hidden").replaceWith(res.post_hidden_form);
												}

												if (post.id === conversation.main_post) {
														// update timeline content
														load_newer_feeds();
												} else {
														// append reply item to article
														$('<li/>', {
																style: "display: none"
														}).replyItem({info: post}).appendTo($("ul.wall-content").find("#article-view" + conversation.id + ">ul.answer")).slideDown('fast');
												}
												break;
										case EIM.Constant.PostType.poll:
												// reset 'post hidden form'
												if(res.post_hidden_form) $("#new_post_hidden").replaceWith(res.post_hidden_form);

												// update timeline content
												load_newer_feeds();
												break;
										case EIM.Constant.PostType.event:
												// reset 'event hidden form'
												if(res.event_hidden_form) $("#new_event_hidden").replaceWith(res.event_hidden_form);

												// update timeline content
												load_newer_feeds();
												break;
										case EIM.Constant.PostType.task:
												// reset 'task hidden form'
												if(res.task_hidden_form) $("#new_task_hidden").replaceWith(res.task_hidden_form);

												// update timeline content
												load_newer_feeds();
												break;
										default:
												break;
								}
            }
            else if (update_posts_pattern.test(settings.url)) {
								var conversation, post;
            		var res = JSON.parse(xhr.responseText);

                // console.log("response @Data:" + res.data);

                conversation = res.data.conversation;
                post = res.data.post;

								EIM.API.Info.set(conversation);
								EIM.API.Info.set(post);

								// reset 'post edit hidden form'
								if(res.post_edit_hidden_form) $("#edit_post_hidden").replaceWith(res.post_edit_hidden_form);

								if (post.id === conversation.main_post) {
										var $_article;
										// var $message;
										// var msg, info;

										$_article = $("ul.wall-content").find("#article-view" + conversation.id);
										$_article.trigger('updated');

										/*$message = $article.find("> .content > .message");

										// render message
                    info = conversation;

                    if(info.private) {
                    		var $_private_message;
                    		var _receiver, _hint, length, _content;

                    		$_private_message = $article.find("> .content > .private-message");
                    		length = info.receivers.length;

                    		msg = '';
                        _content = post.content ? EIM.Utils.replaceSpecialChar(post.content) : '';

                        for (var i = 0; i < length; i++) {
                            _receiver = EIM.API.Info.get("Users", info.receivers[i]);
                            _hint = '@' + _receiver.name.replace(/ /gi, '');
                            _content = _content.replace(new RegExp(_hint, 'gi'), '<a href="' + _receiver.feedsPath + '" class="messagefor">@' + _receiver.name + '</a>');
                        };

                        $_private_message.find(".e-detail > p").html(_content);

                    		$message.show();
                    		$_private_message.show();
                    }
                    else {
                    		var _receiver, _hint, length;
		                    length = info.receivers.length;

		                    msg = post.content ? EIM.Utils.replaceSpecialChar(post.content) : '';

		                    for (var i = 0; i < length; i++) {
		                        _receiver = EIM.API.Info.get("Users", info.receivers[i]);
		                        _hint = '@' + _receiver.name.replace(/ /gi, '');
		                        msg = msg.replace(new RegExp(_hint, 'gi'), '<a href="' + _receiver.feedsPath + '" class="messagefor">@' + _receiver.name + '</a>');
		                    };

		                    $message.html(msg);
												$message.show();
                    }*/
								}
								else {
										var $article, $reply, $message;
										var msg, info;

										$article = $timeline.find("#article-view" + conversation.id);
										$reply = $article.find("ul.answer > li#reply-view" + post.id);
										$message = $reply.find(".content > .message");

										// render message
										info = post;
                    msg = info.content ? EIM.Utils.replaceSpecialChar(info.content) : '';

		                if(!!info.post_receivers) {
		                    var _post_receiver, _hint, length;
		                    length = info.post_receivers.length;

		                    for (var i = 0; i < length; i++) {
		                        _post_receiver = EIM.API.Info.get("Users", info.post_receivers[i]);
		                        _hint = '@' + _post_receiver.name.replace(/ /gi, '');
		                        msg = msg.replace(new RegExp(_hint, 'gi'), '<a href="' + _post_receiver.feedsPath + '" class="messagefor">@' + _post_receiver.name + '</a>');
		                    };
		                }

		                $message.find("p").html(msg);
										$message.show();
								}
            }
            else if(update_tasks_pattern.test(settings.url)) {
            		var conversation, post, task;
                var res = JSON.parse(xhr.responseText);

                console.log("response @Data:" + res.data);

                conversation = res.data.conversation;
                post = res.data.post;
                task = res.data.task;

                EIM.API.Info.set(conversation);
                EIM.API.Info.set(post);
                EIM.API.Info.set(task);

                if (res.task_edit_hidden_form) $("#edit_task_hidden").replaceWith(res.task_edit_hidden_form);

                var $task_record;
								$task_record = $timeline.find("#task-view" + task.id);
								$task_record.taskItem("update", task);
            }
            else if(update_events_pattern.test(settings.url)) {
            		var conversation, post, event;
                var res = JSON.parse(xhr.responseText);

                console.log("response @Data:" + res.data);

                conversation = res.data.conversation;
                post = res.data.post;
                event = res.data.event;

                EIM.API.Info.set(conversation);
                EIM.API.Info.set(post);
                EIM.API.Info.set(event);

                if (res.event_edit_hidden_form) $("#edit_event_hidden").replaceWith(res.event_edit_hidden_form);

                var $event_record;
								$event_record = $timeline.find("#event-view" + event.id);
								$event_record.eventItem("update", event);
            }

            // Update unread feeds count
            if(!json_req_pattern.test(settings.url, "gi")) {
            		EIM.Utils.updateUnreadFeedsCount();
            }
        });
		})();
});
