(function eimAPI() {
		EIM.namespace('API');

		EIM.API = {
				Info: {
						set: function(info) {
								return EIM.Models[info.infoType].set(info.id.toString(), info);
						},
						get: function(info_type, id, callback) {
								return EIM.Models[info_type].get(id.toString(), callback);
						},
						fetch: function(info_type, id, callback) {
								return EIM.Models[info_type].update(id.toString(), callback);
						},
						delete: function(info_type, id) {
								return EIM.Models[info_type].delete(id.toString());
						},
						clearAll: function() {
								$.removeAllStorages();
						},
						clearFeeds: function() {
								$.initNamespaceStorage("EIM.Infos.Users").localStorage.removeAll(true);
								$.initNamespaceStorage("EIM.Infos.Groups").localStorage.removeAll(true);
								$.initNamespaceStorage("EIM.Infos.Networks").localStorage.removeAll(true);
								$.initNamespaceStorage("EIM.Infos.Conversations").localStorage.removeAll(true);
								$.initNamespaceStorage("EIM.Infos.Posts").localStorage.removeAll(true);
						}
				},

				Feeds: {
						/*
							@feed_filter_type: "all", "following", "tome", "mypost", "pinned", "group", "user", "search"
							@unread_filter_type: "all", "unread"
							@belong_id: group_id, user_id, null
							@options: 'is_for_older_than', 'search_keyword', 'search_page', 'search_per_page' key entry
						*/
						getFeeds: function(feed_filter_type, unread_filter_type, older_than, belong_id, callback, options) {
								if(typeof(options) === 'undefined') options = null;

								$.getJSON("/api/feeds.json", {
										feed_filter_type: feed_filter_type,
										unread_filter_type: unread_filter_type,
										older_than: older_than,
										belong_id: belong_id,
										options: options,
										size: 10,
										last_limit: 2
								})
										.done(function(data) {
												var _infos = data.infos,
														_length = _infos.length;
												for (var _i = 0; _i < _length; _i++) {
														EIM.API.Info.set(_infos[_i]);
												}
												!!callback && callback(data);
										});
						},
						/*
							@feed_filter_type: "tome", "pinned", "group", "network"
						*/
						getUnreadFeedsCount: function(feed_filter_type, callback) {
								// console.log("getUnreadFeedsCount", feed_filter_type);
								$.getJSON("/api/unread_feeds_count.json", {
										feed_filter_type: feed_filter_type
								})
										.done(function(data) {
												switch(feed_filter_type) {
														case "group":
														case "network":
																var _infos = data.infos,
																		_length = _infos.length;
																for (var _i = 0; _i < _length; _i++) {
																		EIM.API.Info.set(_infos[_i]);
																}
																break;
														case "pinned":
														case "tome":
														default:
																// do nothing
																break;
												}
												!!callback && callback(data);
										});
						}
				},
				// 
				// Skip some parts of content
  			// ....
  			// 
				Users: {
						/*
							@main_filter_type: "all", "following", "group",
							@options: 'is_pending', 'is_inviting' key entry
						*/
						getUsers: function(main_filter_type, older_than, group_id, callback, options) {
								if(typeof(options) === 'undefined') options = null;

								$.getJSON("/api/users.json", {
										main_filter_type: main_filter_type,
										older_than: older_than,
										group_id: group_id,
										options: options,
										size: 10
								})
										.done(function(data) {
												var _infos = data.infos,
														_length = _infos.length;
												for (var _i = 0; _i < _length; _i++) {
														EIM.API.Info.set(_infos[_i]);
												}
												!!callback && callback(data);
										});
						},
						follow: function(user_id, callback) {
								console.log('followUser', user_id);

								$.getJSON('/api/users/' + user_id + '/follow')
										.done(function(json, textStatus) {
												var _info = json.data.info;
												EIM.API.Info.set(_info);
												!!callback && callback(_info);
										});
						},
						// 
						// Skip some parts of content
  					// ....
  					// 
						setLocale: function(user_id, locale, callback){
								console.log('setLocale', user_id, locale);

								$.getJSON('/api/users/' + user_id + '/setup_locale', {
										locale: locale
								})
										.done(function(json, textStatus) {
												!!callback && callback(json);
										});
						}
				},
				Groups: {
						/*
							@main_filter_type: "all", "mine", "user"
							@sort_by: "name", "members"
							@reverse: true, false
						*/
						getGroups: function(main_filter_type, older_than, belong_id, callback, options) {
								// console.log('getGroups', main_filter_type, older_than, belong_id, options);
								if(typeof(options) === 'undefined') options = null;
								$.getJSON("/api/groups.json", {
										main_filter_type: main_filter_type,
										older_than: older_than,
										belong_id: belong_id,
										options: options,
										size: 10
								})
										.done(function(data) {
												var _infos = data.infos,
														_length = _infos.length;
												for (var _i = 0; _i < _length; _i++) {
														EIM.API.Info.set(_infos[_i]);
												}
												!!callback && callback(data);
										});
						},
						join: function(group_id, callback) {
								console.log('joinGroup', group_id);

								$.getJSON('/api/groups/' + group_id + '/join')
										.done(function(json, textStatus) {
												var _info = json.data.info;
												EIM.API.Info.set(_info);
												!!callback && callback(_info);
										});
						},
						leave: function(group_id, callback) {
								console.log('leaveGroup', group_id);

								$.getJSON('/api/groups/' + group_id + '/leave')
										.done(function(json, textStatus) {
												var _info = json.data.info;
												EIM.API.Info.set(_info);
												!!callback && callback(_info);
										});
						},
						validateName: function(group_name, callback) {
								console.log('validateName', group_name);

								$.getJSON('/api/groups/validate', {
										name: group_name
								})
										.done(function(json, textStatus) {
												!!callback && callback(json);
										})
										.fail(function() {
												console.log("Check the group name " + group_name + " fail!");
										})
						},
						// 
						// Skip some parts of content
  					// ....
  					// 
						uploadImage: function(file, callback) {
								return FileAPI.upload({
										url: '/groups/new/upload.json',
										files: { images:
												file
										},
										progress: function (e) {
												var percentage = Math.round((e.loaded * 100) / e.total);
												console.log("upload image:" + percentage + "%");
										},
										complete: function (err, xhr){
												var res, obj, uid;
												res = xhr.responseText;
												if(!!res) {
														obj = jQuery.parseJSON(res);
		                        uid = xhr.uid;
		                        !!callback && callback(uid, obj.image_cache);
												}
										}
								});
						},
						updateGroup: function(info, callback) {
								console.log('updateGroup', info);

								var $form = $('#edit_group_hidden > form');
								$form.attr("action", "/groups/" + info.group_id);
								$form.find('#group_name').val(info.values.group_name);
								$form.find('#group_open_flag').val(info.values.group_open_flag);
								$form.find('#group_list_in_directory_flag').val(info.values.group_list_in_directory_flag);
								$form.find('#group_approved_join_by_member_flag').val(info.values.group_approved_join_by_member_flag);
								$form.find('#group_description').val(info.values.group_description);
								$form.find('#image_cache').val(info.values.image_cache);
								$form.submit();
								!!callback && callback();
						},
						deleteGroup: function(delete_group_id, callback) {
								console.log('deletePost', delete_group_id);

								$.getJSON('/api/groups/' + delete_group_id + '/delete')
										.done(function(json, textStatus) {
												var _infos = json.data.deleted,
														_length = _infos.length;
												for (var _i = 0; _i < _length; _i++) {
														EIM.API.Info.delete(_infos[_i].info_type, _infos[_i].id);
												}
												!!callback && callback(json.data);
										});
						},
						//						
						// Skip some parts of content
  					// ....
  					// 
				},
				Networks: {
						getNetworks: function(callback) {
								$.getJSON("/api/networks.json", {
										size: 10
								})
										.done(function(data) {
												var _infos = data.infos,
														_length = _infos.length;
												for (var _i = 0; _i < _length; _i++) {
														EIM.API.Info.set(_infos[_i]);
												}
												!!callback && callback(data);
										});
						},
				},
				// 
				// Skip some parts of content
  			// ....
  			// 
		}

})();

(function() {
		EIM.namespace('Current');
		EIM.API.Info.get('Users', EIM.Current.userID, function(data) {
				EIM.Current['user'] = data;
		});
		EIM.API.Info.get('Groups', EIM.Current.groupID, function(data) {
				EIM.Current['group'] = data;
		});
		EIM.API.Info.get('Networks', EIM.Current.networkID, function(data) {
				EIM.Current['network'] = data;
		});

})();
