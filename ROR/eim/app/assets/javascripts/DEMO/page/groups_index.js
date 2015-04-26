$(document).ready(function() {
		var $filter_panel = $("#filter-panel"),
				$group_filter = $("ul.group-filter"),
				$group_table = $("table.table-group"),
				$group_tbody = $group_table.find("> tbody");

		function applyFilter(main_filter_type){
				EIM.API.Groups.getGroups(main_filter_type, null, null, function(data) {
						// populate groups ui
						$.each(data.list, function(key, val) {
								_callback = function(data) {
										$('<tr/>').groupRecordItem({info: data}).appendTo($group_tbody);
								}
								EIM.API.Info.get("Groups", val, _callback);
						});
				});
		}

		(function init(){
				applyFilter("all");
		})();

		(function bind_event() {
				$group_filter.find("> li").click(function() {
						$group_filter.find("> li > a.active").removeClass('active');
						$(this).find("> a").addClass('active');

						var _lemma = $(this).find("a").text().toLowerCase();
						switch(_lemma) {
								case "all":
										$group_tbody.find("tr").removeClass("close").slideDown(400);
										break;
								case "#":
										var filter = ".lemma_" + "nil";
										$group_tbody.find("tr").not(filter).addClass('close').slideUp(400);
										$group_tbody.find("tr" + filter).removeClass("close").slideDown(400);
										break;
								default:
										var filter = ".lemma_" + _lemma.toUpperCase();
										$group_tbody.find("tr").not(filter).addClass('close').slideUp(400);
										$group_tbody.find("tr" + filter).removeClass("close").slideDown(400);
										break;
						}
				});

				$filter_panel.find("ul.filter li").click(function() {
						$group_tbody.empty().slideUp(400).slideDown(400);

						$filter_panel.find("ul.filter li.active").removeClass("active");
						$(this).addClass("active");

						applyFilter($(this).data("filter"));
				});

				$(document).ajaxComplete(function(event, xhr, settings) {
            if (settings.url === "/groups") {
            		var group;
            		var res = JSON.parse(xhr.responseText);

                console.log("response @Data:" + res.data);

                group = res.data.group;

								EIM.API.Info.set(group);

								// reset 'group hidden form'
        				if(res.group_hidden_form) $("#new_group_hidden").replaceWith(res.group_hidden_form);

        				setTimeout(function() {
										$group_tbody.empty().slideUp(400).slideDown(400);

										applyFilter("all");
								}, 10);								
            }
        });
		})();
});