$(document).ready(function() {
		var $sidebar, $all_group, $my_groups,
				$files_table,	$files_tbody, $tasks_table,	$tasks_tbody, $people_table, $people_tbody,
				$event_list_table, $event_list_tbody;

		$sidebar = $(".sidebar");

		$all_group = $("#menu-sidebar-allgroup");
		$my_groups = $("#menu-sidebar-mygroups");

		$files_table = $("table.table-files");
		$files_tbody = $files_table.find("> tbody");

		$tasks_table = $("table.task-table");
		$tasks_tbody = $tasks_table.find("> tbody");

		$people_table = $("table#people-table");
		$people_tbody = $people_table.find("> tbody");

		$event_list_table = $("ul.window > li#year table.event-list");
    $event_list_tbody = $("ul.window > li#year table.event-list > tbody");

		function applyFileFilter(main_filter_type, file_type, group_id){
				EIM.API.Files.getFiles(main_filter_type, file_type, null, group_id, function(data) {
						// populate files ui
						$.each(data.list, function(key, val) {
								_callback = function(data) {
										$('<tr/>').fileItem({info: data}).appendTo($files_tbody);
								}
								EIM.API.Info.get("Files", val, _callback);
						});
				});
		}

		function applyTaskFilter(main_filter_type, task_type, task_priority, task_status, group_id){
				EIM.API.Tasks.getTasks(main_filter_type, task_type, task_priority, task_status, null, group_id, function(data) {
						// populate tasks ui
						$.each(data.list, function(key, val) {
								_callback = function(data) {
										$('<tr/>').taskItem({
												info: data,
												viewType: "Record"
										}).appendTo($tasks_tbody);
								}
								EIM.API.Info.get("Tasks", val, _callback);
						});
				});
		}

		function applyUserFilter(main_filter_type, group_id){
				EIM.API.Users.getUsers(main_filter_type, null, group_id, function(data) {
						// populate users ui
						$.each(data.list, function(key, val) {
								_callback = function(data) {
										$('<tr/>').userItem({info: data}).appendTo($people_tbody);
								}
								EIM.API.Info.get("Users", val, _callback);
						});
				});
		}

		function applyEventFilter(main_filter_type, view_type, group_id, options) {
        if (typeof(options) === 'undefined') options = null;

        EIM.API.Events.getEvents(main_filter_type, view_type, null, group_id, function(data) {
            // populate events ui
            $.each(data.list, function(key, val) {
                _callback = function(data) {
                    $('<tr/>').eventItem({
                        info: data,
                        viewType: "Record"
                    }).appendTo($event_list_tbody);
                }
                EIM.API.Info.get("Events", val, _callback);
            });
        }, options);
    }

    function render_event_list() {
        var main_filter_type, group_id, view_type;
        var target_year, target_month, target_day, target_date, _options;

        main_filter_type = $(":hidden#event-main-filter").val();
        view_type = $("#event-view-type").val();
        group_id = $(":hidden#event-group-id").val();
        group_id = (group_id.length > 0) ? group_id : null;

        target_year = $(":hidden#event-target-year").val();
        target_month = $(":hidden#event-target-month").val();
        target_day = $(":hidden#event-target-day").val();
        target_date = new Date(target_year + "/" + target_month + "/" + target_day);

        switch (view_type) {
            case "month":
                _options = {
                    target_year: target_year,
                    target_month: target_month
                };
                break;
            case "week":
                _options = {
                    target_year: target_year,
                    target_month: target_month,
                    target_day: target_day
                };
                break
            case "year":
            default:
                $event_list_table.find("> thead th").text(target_year);
                _options = {
                    target_year: target_year
                };
                break;
        }

        applyEventFilter(main_filter_type, view_type, group_id, _options);
    }

		function init_default_left_sidebar() {
				EIM.API.Groups.getGroups("mine", null, null, function(data) {
						var group_list = data.list;

						$.each(group_list, function(key, val) {
								var _callback = function(data) {
										var info = data, unread_count = '', $group;

										if (info.unreadCount > 0) {
												var _count = $my_groups.find(">.count").text();
												_count = (_count.length === 0) ? 0 : parseInt(_count);
												unread_count = info.unreadCount;
												$my_groups.find(">.count").text(info.unreadCount + _count);
										}

										$group = $('<li' + ((info.id === EIM.Current.groupID) ? ' class="active"' : '') + '><a href="' + info.feedsPath + '" class="ellipsis">' + info.name + '</a><span class="count">' + unread_count +	'</span></li>');

										$group.data("group-id", info.id);

										if (info.is_default === false) {
												$group.appendTo($('.sidebar #group_list'));
										}
										else {
												$group.prependTo($('.sidebar #group_list'));
										}
								}
								EIM.API.Info.get("Groups", val, _callback);
						});
				});

				EIM.API.Networks.getNetworks(function(data) {
						var network_list = data.list;

						$.each(network_list, function(key, val) {
								var _callback = function(data) {										
										var info = data;
										
										var $_network = $('<li><a href="' + info.feedsPath + '" class="ellipsis">' + info.name + '</a></li>');

										if(info.id !== EIM.Current.networkID && info.unreadCount > 0){
												$('<span class="message"></span>').appendTo($_network);
										}										

										$_network.data("network-id", info.id)
														 .appendTo($('.sidebar #network_list'));
								}
								EIM.API.Info.get("Networks", val, _callback);
						});
				});
		}

		function init_group_left_sidebar() {
				init_default_left_sidebar();
		}

		function init_file_left_sidebar() {
				$my_groups.removeClass('open');
				$my_groups.find(".icone").removeClass('icone-group').addClass('icone-mygroup');

				EIM.API.Groups.getGroups("mine", null, null, function(data) {
						var group_list = data.list;

						$.each(group_list, function(key, val) {
								var _callback = function(data) {
										var info = data;
										var $_group = $('<li><a href="javascript:void(0)" class="ellipsis">' + info.name + '</a></li>');

										$_group.data("group-id", info.id)
												.click(function(event) {
														var main_filter_type, file_type, group_id;

														main_filter_type = "group";
														file_type = $(":hidden#file-file-type").val();
														file_type = (file_type === "alltypes") ? null : file_type;
														group_id = $(this).data("group-id");

														$files_tbody.empty().slideUp(400).slideDown(400);

														$(".menu-sidebar li.active").removeClass('active');
														$(this).addClass('active');

														$(":hidden#file-main-filter").val("group");
														$(":hidden#file-group-id").val($(this).data("group-id"));

														applyFileFilter(main_filter_type, file_type, group_id);
												});

										if (info.is_default === false) {
												$_group.appendTo($('.sidebar #group_list'));
										}
										else {
												$_group.prependTo($('.sidebar #group_list'));
										}

								}
								EIM.API.Info.get("Groups", val, _callback);
						});
				});

				EIM.API.Networks.getNetworks(function(data) {
						var network_list = data.list;

						$.each(network_list, function(key, val) {
								var _callback = function(data) {
										var info = data;
										$('.sidebar #network_list').append($('<li><a href="' + info.feedsPath + '" class="ellipsis">' + info.name + '</a>' +
												(info.id === EIM.Current.networkID ? '' : '<span class="message"></span>') + '</li>'));
								}
								EIM.API.Info.get("Networks", val, _callback);
						});
				});
		}

		function init_task_left_sidebar() {
				$my_groups.removeClass('open');
				$my_groups.find(".icone").removeClass('icone-group').addClass('icone-mygroup');

				EIM.API.Groups.getGroups("mine", null, null, function(data) {
						var group_list = data.list;

						$.each(group_list, function(key, val) {
								var _callback = function(data) {
										var info = data;
										var $_group = $('<li><a href="javascript:void(0)" class="ellipsis">' + info.name + '</a></li>');

										$_group.data("group-id", info.id)
												.click(function(event) {
														var main_filter_type, task_type, task_priority, task_status, group_id;

														main_filter_type = "group";
														task_type = $(":hidden#task-task-type").val();
														task_priority = $(":hidden#task-priority").val();
														task_status = $(":hidden#task-status").val();
														group_id = $(this).data("group-id");

														$tasks_tbody.empty().slideUp(400).slideDown(400)

														$(".menu-sidebar li.active").removeClass('active');
														$(this).addClass('active');

														$(":hidden#task-main-filter").val("group");
														$(":hidden#task-group-id").val($(this).data("group-id"));

														applyTaskFilter(main_filter_type, task_type, task_priority, task_status, group_id);
												});

										if (info.is_default === false) {
												$_group.appendTo($('.sidebar #group_list'));
										} 
										else {
												$_group.prependTo($('.sidebar #group_list'));
										}
								}
								EIM.API.Info.get("Groups", val, _callback);
						});
				});

				EIM.API.Networks.getNetworks(function(data) {
						var network_list = data.list;

						$.each(network_list, function(key, val) {
								var _callback = function(data) {
										var info = data;
										$('.sidebar #network_list').append($('<li><a href="' + info.feedsPath + '" class="ellipsis">' + info.name + '</a>' +
												(info.id === EIM.Current.networkID ? '' : '<span class="message"></span>') + '</li>'));
								}
								EIM.API.Info.get("Networks", val, _callback);
						});
				});
		}

		function init_user_left_sidebar() {
				$my_groups.removeClass('open');
				$my_groups.find(".icone").removeClass('icone-group').addClass('icone-mygroup');

				EIM.API.Groups.getGroups("mine", null, null, function(data) {
						var group_list = data.list;

						$.each(group_list, function(key, val) {
								var _callback = function(data) {
										var info = data;
										var $_group = $('<li><a href="javascript:void(0)" class="ellipsis">' + info.name + '</a></li>');

										$_group.data("group-id", info.id)
												.click(function(event) {
														var main_filter_type, group_id;

														main_filter_type = "group";
														group_id = $(this).data("group-id");

														$people_tbody.empty().slideUp(400).slideDown(400)

														$(".menu-sidebar li.active").removeClass('active');
														$(this).addClass('active');

														$(":hidden#people-main-filter").val("group");
														$(":hidden#people-group-id").val($(this).data("group-id"));

														applyUserFilter(main_filter_type, group_id);

														$("ul#people-filter > li a.active").removeClass('active');
														$("ul#people-filter > li:first a").addClass('active');
												});

										if (info.is_default === false) {
												$_group.appendTo($('.sidebar #group_list'));
										}
										else {
												$_group.prependTo($('.sidebar #group_list'));
										}
								}
								EIM.API.Info.get("Groups", val, _callback);
						});
				});

				EIM.API.Networks.getNetworks(function(data) {
						var network_list = data.list;

						$.each(network_list, function(key, val) {
								var _callback = function(data) {
										var info = data;
										$('.sidebar #network_list').append($('<li><a href="' + info.feedsPath + '" class="ellipsis">' + info.name + '</a>' +
												(info.id === EIM.Current.networkID ? '' : '<span class="message"></span>') + '</li>'));
								}
								EIM.API.Info.get("Networks", val, _callback);
						});
				});
		}

		function init_event_left_sidebar() {
				$my_groups.removeClass('open');
				$my_groups.find(".icone").removeClass('icone-group').addClass('icone-mygroup');

				EIM.API.Groups.getGroups("mine", null, null, function(data) {
						var group_list = data.list;

						$.each(group_list, function(key, val) {
								var _callback = function(data) {
										var info = data;
										var $_group = $('<li><a href="javascript:void(0)" class="ellipsis">' + info.name + '</a></li>');
										$_group.data("group-id", info.id)
												.click(function(event) {
														$event_list_tbody.empty().slideUp(400).slideDown(400);

														$(".menu-sidebar li.active").removeClass('active');
														$(this).addClass('active');

														$(":hidden#event-main-filter").val("group");
														$(":hidden#event-group-id").val($(this).data("group-id"));

														render_event_list();
												});
										if (info.is_default === false) {
												$_group.appendTo($('.sidebar #group_list'));
										}
										else {
												$_group.prependTo($('.sidebar #group_list'));	
										}
								}
								EIM.API.Info.get("Groups", val, _callback);
						});
				});

				EIM.API.Networks.getNetworks(function(data) {
						var network_list = data.list;

						$.each(network_list, function(key, val) {
								var _callback = function(data) {
										var info = data;
										$('.sidebar #network_list').append($('<li><a href="' + info.feedsPath + '" class="ellipsis">' + info.name + '</a>' +
												(info.id === EIM.Current.networkID ? '' : '<span class="message"></span>') + '</li>'));
								}
								EIM.API.Info.get("Networks", val, _callback);
						});
				});
		}

		(function init() {
				var type = $sidebar.data("type");

				$("ul.menu-sidebar").has("#network_list").hide();

				switch(type) {
						case "group":
								init_group_left_sidebar();
								break;
						case "file":
								init_file_left_sidebar();
								break;
						case "task":
								init_task_left_sidebar();
								break;
						case "people":
								init_user_left_sidebar();
								break;
						case "event":
								init_event_left_sidebar();
								break;
						case "default":
								init_default_left_sidebar();
						default:
								break;
				}
		})();

		(function bind_event() {
				var type = $sidebar.data("type");

				$("ul.menu-sidebar > li > a").click(function(){
		        if( $(this).parent().children("ul").css("display")=="none" ){
		            $(this).parent().addClass("open").children("ul").slideDown();

		        }else{
		            $(this).parent().removeClass("open").children("ul").slideUp();
		        }
		    });

				$("ul.menu-sidebar > li.opentab").click(function() {
						var submenu = $(this).children("ul");
						if (submenu.css("display") == "none") {
								submenu.slideDown(400);
								$(this).addClass("open");
						} else {
								submenu.slideUp(400);
								$(this).removeClass("open");
						}
				});

				if(type === "file") {
						function file_left_sidebar_item_onclick() {
								var main_filter_type, file_type, group_id;

								main_filter_type = $(this).find("a").data("filter");
								file_type = $(":hidden#file-file-type").val();
								file_type = (file_type === "alltypes") ? null : file_type;
								group_id = null;

								$files_tbody.empty().slideUp(400).slideDown(400);

								$(".menu-sidebar li.active").removeClass('active');
								$(this).addClass('active');

								$(":hidden#file-main-filter").val(main_filter_type);
								$(":hidden#file-group-id").val("");

								applyFileFilter(main_filter_type, file_type, group_id);
						}
						$("#menu-sidebar-allfiles").click(file_left_sidebar_item_onclick);
						$("#menu-sidebar-recent-files").click(file_left_sidebar_item_onclick);
						$("#menu-sidebar-following-files").click(file_left_sidebar_item_onclick);
						$("#menu-sidebar-updated-files").click(file_left_sidebar_item_onclick);
				}

				if(type === "task") {
						$("#menu-sidebar-alltasks").click(function() {
								var main_filter_type, task_type, task_priority, task_status, group_id;

								main_filter_type = $(this).find("a").data("filter");
								task_type = $(":hidden#task-task-type").val();
								task_priority = $(":hidden#task-priority").val();
								task_status = $(":hidden#task-status").val();
								group_id = null;

								$tasks_tbody.empty().slideUp(400).slideDown(400);

								$(".menu-sidebar li.active").removeClass('active');
								$(this).addClass('active');

								$(":hidden#task-main-filter").val(main_filter_type);
								$(":hidden#task-group-id").val("");

								applyTaskFilter(main_filter_type, task_type, task_priority, task_status, group_id);
						});
				}

				if(type === "people") {
						function user_left_sidebar_item_onclick() {
								var main_filter_type, file_type, group_id;

								main_filter_type = $(this).find("a").data("filter");
								group_id = null;

								$people_tbody.empty().slideUp(400).slideDown(400);

								$(".menu-sidebar li.active").removeClass('active');
								$(this).addClass('active');

								$(":hidden#people-main-filter").val(main_filter_type);
								$(":hidden#people-group-id").val("");

								applyUserFilter(main_filter_type, group_id);

								$("ul#people-filter > li a.active").removeClass('active');
								$("ul#people-filter > li:first a").addClass('active');
						}

						$("#menu-sidebar-all-users").click(user_left_sidebar_item_onclick);
						$("#menu-sidebar-following-users").click(user_left_sidebar_item_onclick);
				}

				if(type === "event") {
						function event_left_sidebar_item_onclick() {
								var main_filter_type, group_id;

								main_filter_type = $(this).find("a").data("filter");
								group_id = null;

								$event_list_tbody.empty().slideUp(400).slideDown(400);

								$(".menu-sidebar li.active").removeClass('active');
								$(this).addClass('active');

								$(":hidden#event-main-filter").val(main_filter_type);
								$(":hidden#event-group-id").val("");

								render_event_list();
						}
						$("#menu-sidebar-allevents").click(event_left_sidebar_item_onclick);
						$("#menu-sidebar-related-events").click(event_left_sidebar_item_onclick);
						$("#menu-sidebar-following-events").click(event_left_sidebar_item_onclick);
						$("#menu-sidebar-updated-events").click(event_left_sidebar_item_onclick);
				}
		})();

});
