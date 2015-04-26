$(document).ready(function() {

		(function init(){
				$.each($('.input-checkbox'), function() {
						if($(this).find("input:checkbox").prop('checked')) {
								$(this).find("span.checkbox").addClass('checked');
						}						
				})
		})();

		(function bind_event() {
				$(".checkbox").click(function(){
		        if( $(this).hasClass("checked") ){
		            $(this).removeClass("checked");
		            $(this).siblings("input:checkbox").prop('checked', false);
		        }else{
		            $(this).addClass("checked");
		            $(this).siblings("input:checkbox").prop('checked', true);
		        }
		    });
		})();
});