$(document).ready(function() {
		var $functions = $(".user-function .functions"),
				$post_form = $functions.find('ul.windows form#sharepost'),
				$poll_form = $functions.find('ul.windows form#postpoll'),
				$create_task_btn = $functions.find("#create_task_btn"),
				$create_event_btn = $functions.find("#create_event_btn");

		(function init() {
				$post_form.postForm({
						post_type: $post_form.data("type"),
            having_group_chooser: true,
				});

				function _validate_poll_form() {
						var $inputor;
						var _options = [];

						$inputor = this.$el.find("textarea.toresize");
						this.$el.find(".row > :text.answer-text").each(function() {
            		if($(this).val() !== "") {
            				_options.push($(this).val());
            		}
            });

            if($inputor.val() === "" && _options.length === 0) {
            		alert("Please fill the subject field and define the options");
            		return false;
            }
            else if($inputor.val() === "") {
            		alert("Please fill the subject field.");
            		return false;
            }
            else if(_options.length === 0) {
            		alert("Please define the options.");
            		return false;
            }
            else{
            		return true;
            }
				}

				$poll_form.postForm({
						post_type: $poll_form.data("type"),
            having_group_chooser: true,
            against_composing_area: true,
            'callbacks': {
            		on_extra_elements_init: function() {

            		},
            		on_extra_events_bind: function() {
            				function keyup_callback(event) {
            						if($(this).is($poll_form.find(":text.answer-text:last")) && $(this).val().length > 0) {
            								var answer_char = String.fromCharCode($(this).prev().text().charCodeAt() + 1);
            								var row = $('<div class="row"><label class="answer">' + answer_char + '</label> <input type="text" class="answer-text" name="answer_addon" placeholder="Answer"></div>');
            								row.insertAfter($(this).parent());
            								row.find("> :text.answer-text").keyup(keyup_callback);
            						}
            				}
            				this.$el.find(".row > :text.answer-text").keyup(keyup_callback);
            		},
                on_submit: function (query, callback) {
                		var isValid = _validate_poll_form.apply(this);
                		if(!isValid) return this;

                    var $inputor, $group_chooser, $file_list;
		                var callback, result, choosed_group, group_id, post_type, _options = [];
		                var having_group_chooser = this.context.get_opt("having_group_chooser");

		                $inputor = this.$el.find("textarea.toresize");
		                $file_list = this.$el.find("ul.filelist");

		                post_type = this.context.post_type;

		                if(having_group_chooser) {
		                    $group_chooser = this.$el.find(":text.group-chooser");
		                    choosed_group = $group_chooser.tokenInput("get");
		                    group_id = (choosed_group.length > 0) ? choosed_group[0].id : EIM.Current.groupID;
		                } else {
		                    group_id = EIM.Current.groupID;
		                }

		                result = {
		                    post_type: post_type,
		                    group_id: group_id,
		                    values: {},
		                    infos: {},
		                    files: [],
		                };

		                this.$el.find(".row > :text.answer-text").each(function() {
		                		if($(this).val() !== "") {
		                				_options.push($(this).val());
		                		}
		                });

		                result.values = {
												title: this.$el.find('textarea[name="message"]').val(),
												options: _options
										}

		                result.infos["mentions"] = {};
		                result.infos["mentions"].users = [];
		                $.each($inputor.data("mentions"), function(index, val){
		                    result.infos["mentions"].users.push(val[1]);
		                });

		                $.each($file_list.find("> li"), function(index, val) {
		                    result.files.push($(val).data("info"));
		                })

		                callback = function() {
		                    // reset poll form
		                    $inputor.val("");
		                    $inputor.data("mentions", []);
		                    $file_list.empty();
		                    this.$el.find(".row > :text.answer-text[name='answer_addon']").parent().remove();
		                    this.$el.find(".row > :text.answer-text").val("");

		                    if(having_group_chooser) {
		                    		group = EIM.API.Info.get("Groups", EIM.Current.groupID);
                            $group_chooser.tokenInput("clear").tokenInput("add", {
                            		id: group.id,
                            		name: group.name
				                    });
				                }
		                };

		                EIM.API.Posts.submitPost(result, $.proxy(callback, this));
		                return this;
                }
            }
				});
		})();

		(function bind_event() {
				$functions.find(".tabmore").mouseover(function() {
						$functions.find(".menumore").slideDown(500);	
				})

				$functions.find(".tabmore").mouseleave(function() {
						$functions.find(".menumore").stop(true, true).slideUp();
				});

				$functions.find(".opentab").mouseover(function() {
						/*$(this).parent().parent().find(".windows").slideDown(400);
						mousein = 1;*/
				});

				$functions.find("ul.tabs li").click(function() {
						if($(this).is($functions.find("ul.tabs li.active"))) {
								$functions.find("ul.windows li.active").slideUp(400, function() {
										$(this).removeClass("active");
								});
								$(this).removeClass("active");
						} else {
								var $_active_window = $functions.find("ul.windows li.active");

								$functions.find("ul.tabs li.active").removeClass("active");
								$(this).addClass("active");

								if($(this).data("tab") === "more") return;

				        if ($_active_window.length > 0) {
				        		$_active_window.hide().removeClass("active");
										$functions.find("ul.windows li#" + $(this).data("tab")).show().addClass("active").find("textarea").focus();
				        }
				        else {
				        		$functions.find("ul.windows li#" + $(this).data("tab")).slideDown(400, function() {
												 $(this).addClass("active").find("textarea").focus();
										});
				        }
						}
				});
		})();

});
