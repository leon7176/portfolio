$(document).ready(function() {
	
		var GROUP_NAME_CHECKING	= 'Checking...';
		var GROUP_NAME_CHECK_FAIL	= 'Checking fail';
		var GROUP_NAME_CHECK_PASS	= 'Name is available.';
		var GROUP_NAME_CHECK_TOOSHORT	= 'Name is too short.';
		var GROUP_NAME_CHECK_EMPTY = 'Name is required.';

		(function bind_event() {

				$("#create_group_btn").click(function(event) {
						var $create_group_form = $("#create-group-form").clone(),
								$name_inputor = $create_group_form.find(":text[name='groupname']"),
								$alarm = $create_group_form.find(".alarm"),
								$descript_inputor = $create_group_form.find("textarea[name='description']"),
								$members_inputor = $create_group_form.find(":text[name='members']"),
								$public_radio = $create_group_form.find(":radio[name='type']:first"),
								$private_radio = $create_group_form.find(":radio[name='type']:last"),
								$list_checkbox = $create_group_form.find(":checkbox[name='type']"),
								$image_file = $create_group_form.find(".groupimage > :file"),
								$image_cache = $create_group_form.find(".groupimage > :hidden#image-cache"),
								$submit = $create_group_form.find(":submit");

						(function init_group_form() {
								$members_inputor.tokenInput("/api/searches/users.json", {
                    resultsLimit: 10,
                    preventDuplicates: true
                });

								$public_radio.prop("checked", true);
                $list_checkbox.prop("checked", true);
                $alarm.attr("pass", false).text(GROUP_NAME_CHECK_EMPTY);
                $submit.prop("disabled", true).addClass('disabled');
						})();

						(function bind_group_form_event() {

								/*$create_group_form.find(":radio[name='type']").click(function(event) {
										if($(this).val() === "0") {
												$list_checkbox.prop("checked", false).prop("disabled", true);
										} else {
												$list_checkbox.prop("disabled", false);
										}
								});*/

								$name_inputor.on("input", function(event) {
										var _group_name = $name_inputor.val();

										if (_group_name.length === 0) {
												$alarm.attr("pass", false).text(GROUP_NAME_CHECK_EMPTY);
												$submit.prop("disabled", true).addClass('disabled');												
												return;
										}

										if (_group_name.length < 2) {
												$alarm.attr("pass", false).text(GROUP_NAME_CHECK_TOOSHORT);
												$submit.prop("disabled", true).addClass('disabled');
												return;
										}

										$alarm.attr("pass", true).text(GROUP_NAME_CHECKING);										

										EIM.API.Groups.validateName(_group_name, function(json) {
												if(json.data.isValid) {
														$alarm.attr("pass", true).text(GROUP_NAME_CHECK_PASS);
														$submit.prop("disabled", false).removeClass('disabled');
												}
												else {
														$alarm.attr("pass", false).text(json.error);
														$submit.prop("disabled", true).addClass('disabled');
												}
										});
								});

								$submit.click(function(event) {
										var result, callback, _open_flag, _group_list_in_directory_flag;
										result = {
		                    values: {},
		                    infos: {}
		                };

		                _open_flag = $create_group_form.find(":radio[name='type']:checked").val();
		                if(_open_flag === "0") {
		                		_open_flag = true;
		                } else {
		                		_open_flag = false;
		                }

		                _group_list_in_directory_flag = $list_checkbox.is(":checked");

		                result.values = {
												group_name: $name_inputor.val(),
												group_open_flag: _open_flag,
												group_list_in_directory_flag: _group_list_in_directory_flag,
												group_description: $descript_inputor.val(),
												image_cache: $image_cache.val()
										}

										result.infos["members"] = {};
										result.infos["members"].users = [];
										$.each($members_inputor.tokenInput("get"), function(index, val) {
												result.infos["members"].users.push(val.id);
										})

										callback = function() {
		                    EIM.Utils.Litebox.closeLitebox();
		                };

										EIM.API.Groups.createGroup(result, callback);
								});


						})();

						EIM.Utils.Litebox.callMore($create_group_form);
				});

		})();
});