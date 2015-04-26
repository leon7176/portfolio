(function EimUtils() {
		EIM.namespace('Utils');

		EIM.Utils = {
				replaceSpecialChar: function(text) {
						if (text.length <= 0) return text;

						var ret_text;
						if (text.search(/&(lt|gt|amp|nbsp|quot|copy);/gi) > 0) {
								ret_text = text
										.replace(/&lt;/gi, '<')
										.replace(/&gt;/gi, '>')
										.replace(/&amp;/gi, '&')
										.replace(/&nbsp;/gi, ' ')
										.replace(/&quot;/gi, '"')
										.replace(/&copy;/gi, '©');
						} else {
								ret_text = text.replace(/\r\n|\n|\r/gm, '<br />');
						}

						return ret_text;
				},
				formatDateTime: function(stamp, time_ago) {
						var now = new Date(),
								bound = new Date(),
								target;
						bound.setHours(now.getHours() - 24);
						target = new Date(stamp);

						if (target >= bound) {
								return time_ago;
						} else {
								return stamp;
						}
				},
				isGroupMember: function(group, user_id) {
						return group.members.indexOf(user_id) >= 0 ? true : false;
				},
				isGroupAdmin: function(group, user_id) {
						return group.admins.indexOf(user_id) >= 0 ? true : false;
				},
				assetPath: function(path) {
						return "/assets/" + path;
				},
				checkAtBottom: function($target, callback) {
						var rect = $target[0].getBoundingClientRect();
						if (rect.top + rect.height - $(window).innerHeight() < 10) {
								!!callback && callback();
						}
				},

				// Skip some parts of content
  			// ....
		};

})();
