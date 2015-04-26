$(document).ready(function(){
		var $header = $("header");

		(function init_header(){
				var $locale_btn = $header.find("#set-locale-btn");

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
		})();

});