$(document).ready(function(){
		var $header = $("header > div.header"),
				$nav = $("header > div.menu ul#main-menu");

		var profileMenu = 0;

		(function init_header(){
				var $locale_btn = $header.find("#set-locale-btn");
				var loc_path = window.location.pathname;

				$nav.find("> li > a.active").removeClass('active');

				if (loc_path.match(/\badmin\b/i)) {
						$nav.find('li>a[href="/admin"]').addClass('active');
				}
				else if (loc_path.match(/\bgroups\b/i)) {
						$nav.find('li>a[href="/groups"]').addClass('active');
				}
				else if (loc_path.match(/\btasks\b/i)) {
						$nav.find('li>a[href="/tasks"]').addClass('active');
				}
				else if (loc_path.match(/\bevents\b/i)) {
						$nav.find('li>a[href="/events"]').addClass('active');
				}
				else if (loc_path.match(/\bfiles\b/i)) {
						$nav.find('li>a[href="/files"]').addClass('active');
				}
				else if (loc_path.match(/\busers\b/i)) {
						$nav.find('li>a[href="/users"]').addClass('active');
				}
				else if (loc_path.match(/\binvitations\b/i)) {
						$nav.find('li>a[href="/users"]').addClass('active');
				}				
				else {
						$nav.find('li>a[href="/feeds"]').addClass('active');
				}				

				$locale_btn.languageForm();
				switch(EIM.Current['locale']) {						
						case EIM.Constant.LocaleType.ZH_TW:
								$locale_btn.text(EIM.Constant.LocaleText.ZH_TW);
								break;
						case EIM.Constant.LocaleType.ZH_CN:
								$locale_btn.text(EIM.Constant.LocaleText.ZH_CN);
								break;
						case EIM.Constant.LocaleType.EN:
						default:
								$locale_btn.text(EIM.Constant.LocaleText.EN);
								break;
				}				
		})();

		(function bind_event() {
				$header.find("#profile-link").mouseover(function() {
		        $header.find(".profile-menu-block").fadeIn();
		        profileMenu = 1;
		    });

		    $header.find(".profile-menu-block").mouseleave(function() {
		        $(this).stop(true, true).fadeOut();
		        profileMenu = 0;
		    });

				$nav.find("> li").click(function(event) {
						if(!$(this).children('a').hasClass('active')) {
								$nav.find("> li > a.active").removeClass('active');
								$(this).children('a').addClass('active');
						}
				});

				$(window).click(function(){
				    if(profileMenu == 1){
				        $header.find(".profile-menu-block").stop(true,true).fadeOut();
				        profileMenu = 0;
				    }
				});
		})();

});