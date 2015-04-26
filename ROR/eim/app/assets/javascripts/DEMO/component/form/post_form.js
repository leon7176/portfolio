(function postForm() {
    (function(factory) {
        if (typeof define === 'function' && define.amd) {
            return define(['jquery'], factory);
        } else {
            return factory(window.jQuery);
        }
    })(function($) {

        var Api, Component, Controller, DEFAULT_CALLBACKS, Model, View, POST_TYPE;

        Component = (function() {
            function Component(item) {
                this.$item = $(item);
                this.controller = null;
            }

            Component.prototype.controller = function() {
                return this.controller;
            };

            Component.prototype.set_context = function() {
                return this;
            };

            Component.prototype.reg = function(post_type, setting) {
                var controller, _base;
                controller = (_base = this.controller) || (_base = new Controller(this, post_type));
                this.controller = controller;
                controller.init(setting);
                return this;
            };

            Component.prototype.dispatch = function() {
                this.controller.render_view();
                return this;
            };

            Component.prototype.shutdown = function() {
            };

            return Component;

        })();

        Controller = (function() {
            Controller.prototype.uid = function() {
                return (Math.random().toString(16) + "000000000").substr(2, 8) + (new Date().getTime());
            };

            function Controller(component, post_type) {
                this.component = component;
                this.post_type = post_type || POST_TYPE.NORMAL;
                this.$item = this.component.$item;
                this.id = this.$item[0].id || this.uid();
                this.setting = null;
                this.$el = this.$item;
                this.model = new Model(this);
                this.view = new View(this);
            }

            Controller.prototype.init = function(setting) {
                var _callback;

                this.setting = $.extend({}, this.setting || $.fn.postForm["default"], setting);
                this.view.init();
                this.component.dispatch();
                return this;
            };

            Controller.prototype.render_view = function() {
                return this.view.render().bind_event();
            };

            Controller.prototype.destroy = function() {
                this.trigger('beforeDestroy');
                this.model.destroy();
                this.view.destroy();
                return this.$el.remove();
            };

            Controller.prototype.trigger = function(name, data) {
                var alias, event_name;
                if (data == null) {
                    data = [];
                }
                data.push(this);
                alias = this.get_opt('alias');
                event_name = alias ? "" + name + "-" + alias + ".postForm" : "" + name + ".postForm";
                return this.$item.trigger(event_name, data);
            };

            Controller.prototype.call_default = function() {
                var args, error, func_name;
                func_name = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
                try {
                    return DEFAULT_CALLBACKS[func_name].apply(this, args);
                } catch (_error) {
                    error = _error;
                    return $.error("" + error + " Or maybe $.postForm doesn't have function " + func_name);
                }
            };

            Controller.prototype.callbacks = function(func_name) {
                return this.get_opt("callbacks")[func_name] || DEFAULT_CALLBACKS[func_name];
            };

            Controller.prototype.get_opt = function(key, default_value) {
                var e;
                try {
                    return this.setting[key];
                } catch (_error) {
                    e = _error;
                    return null;
                }
            };

            return Controller;

        })();

        Model = (function() {
            function Model(context) {
                this.context = context;
                this.storage = this.context.$item;
            }

            Model.prototype.destroy = function() {
            };

            return Model;

        })();

        View = (function() {
            function View(context) {
                this.context = context;
                this.$el = this.context.$el;
                this.locks = {
                    text: false,
                    file: false
                };
            }

            View.prototype.init = function() {
                return this;
            };

            View.prototype.destroy = function() {
                return this.$el.remove();
            };

            View.prototype.bind_event = function() {
                var $form, $file_input, $inputor, $group_chooser, $file_list, $submit_btn, $file_uploader;
                var post_type, _on_extra_events_bind, having_group_chooser, against_composing_area;

                $form = this.$el;
                $file_input = this.$el.find("input:file");
                $inputor = this.$el.find("textarea.toresize");
                $file_list = this.$el.find("ul.filelist,ul.filelist2");
                $submit_btn = this.$el.find("input:submit");
                $file_uploader = this.$el.find("div.attach-files");

                post_type = this.context.post_type;
                having_group_chooser = this.context.get_opt("having_group_chooser");
                against_composing_area = this.context.get_opt("against_composing_area");

                function _readURL(input, obj) {
                    if (input.files && input.files[0]) {
                        var $new_file_input, $_li, $_progress_bar;

                        var _file_name = input.files[0].name;

                        if(input.files[0].size > EIM.Constant.File.MaxSize * FileAPI.MB) {
                            window.alert("The file you choosed is now greater than max size!\n(" + EIM.Constant.File.MaxSize + " MB for the free account)");
                            return;
                        }

                        if($file_list.hasClass('filelist')) {
                            $_li = $('<li><div class="progress-bar"></div><p>' + _file_name + '</p><span></span></li>');
                        }
                        else if($file_list.hasClass('filelist2')) {
                            $_li = $('<li><div class="progress-bar"><div/><span class="file-ico odt"></span>' + _file_name + '<span class="remove"></span></li>');
                        }

                        $form.find(".jquery-filestyle").first().hide();

                        $_progress_bar = $_li.find(".progress-bar");
                        $_progress_bar.progressbar({value: 0});

                        $new_file_input = $("<input type='file' name='file[]'/>");
                        $new_file_input.insertAfter(obj);
                        $file_list.append($_li);

                        $new_file_input.jfilestyle({
                            input: false
                        });
                        $new_file_input.change(function() {
                            _readURL(this, $(this));
                        });

                        $_li.find("span").click(function() {
                            var _info = $_li.data("info");

                            if(!!_info) {
                                $file_uploader.fileUploader("cancel", _info);
                            }
                            else {
                                $file_uploader.fileUploader("cancel", _file_name);
                            }

                            $(this).parent().remove();
                        });

                        // read(load) file content
                        var reader = new FileReader();
                        reader.onload = function(e) {
                            //obj.next().css("display","block").attr('src', e.target.result);
                        }
                        reader.readAsDataURL(input.files[0]);

                        // upload file
                        var on_complete_callback = function(uid, file_cache) {
                            $_li.data("info", { uid: uid, file_cache: file_cache });
                            $_progress_bar.hide();
                        };

                        var on_progress_callback = function(evt) {
                            var _percentage = Math.round((evt.loaded * 100) / evt.total);
                            $_progress_bar.progressbar({value: _percentage});
                        };

                        $file_uploader.fileUploader("upload", input.files[0], on_complete_callback, on_progress_callback);
                    }
                }

                $file_input.change(function() {
                    _readURL(this, $(this));
                });

                $file_uploader.on('upload.fileUploader', (function(_this) {
                    return function(event) {
                        _this._lock_file();
                    };
                })(this));

                $file_uploader.on('complete.fileUploader', (function(_this) {
                    return function(event) {
                        _this._unlock_file();
                    };
                })(this));

                if(having_group_chooser) {
                    $group_chooser = this.$el.find(":text.group-chooser");

                    $inputor.focus(function(){
                        $(this).parent().find(".writeto").slideDown(400);
                        $(this).parent().find(".writeto").next().slideDown(400);
                    });
                }

                $inputor.keyup((function(_this) {
                    return function(event) {
                        if($(this).val().length > EIM.Constant.Post.MaxLength) {
                            _this._lock_text();
                            window.alert("The text you entered is now greater than max length!\n(" + EIM.Constant.Post.MaxLength + " characters for English and 1000 words for Chinese)");
                        }
                        else if($(this).val().length === 0) {
                            _this._lock_text();
                        }
                        else {
                            if($submit_btn.hasClass("disabled")) {
                                _this._unlock_text();
                            }
                        }

                        if(against_composing_area) {
                            var lines = $(this).val().split("\n").length;
                            var line_height = 18;
                            var scroll_height = this.scrollHeight;
                            var height = (lines * line_height);

                            if(scroll_height - this.scrollTop > scroll_height) {
                                height = (parseInt((scroll_height - this.scrollTop) / line_height) + 1) * line_height;
                            }
                            else if (scroll_height % line_height > 0) {
                                height = (parseInt(scroll_height / line_height) + 1) * line_height;
                            }
                            else {
                                height = scroll_height;
                            }

                            if(height > 130) {
                                height = 7 * line_height;
                            }

                            $(this).height(height);
                        }
                    };
                })(this));

                $form.submit(function(event) {
                    event.preventDefault();
                });

                $submit_btn.click($.proxy(function() {
                    this.context.callbacks("on_submit").call(this);
                }, this));

                _on_extra_events_bind = this.context.callbacks("on_extra_events_bind");

                if (!!_on_extra_events_bind) {
                    _on_extra_events_bind.call(this);
                }

                this.$el.on("validate.postForm", (function(_this) {
                    return function(event) {
                        _this._validate();
                    };
                })(this));

                return this;
            };

            View.prototype.render = function() {
                var $inputor, $group_chooser, $file_list, $submit_btn, $file_uploader;
                var having_group_chooser, on_extra_elements_init;
                having_group_chooser = this.context.get_opt("having_group_chooser")

                $inputor = this.$el.find("textarea.toresize");
                $file_list = this.$el.find("ul.filelist, ul.filelist2");
                $submit_btn = this.$el.find("input:submit");
                $file_uploader = this.$el.find("div.attach-files");

                this.$el.find(":file").jfilestyle({
                    input: false
                });

                $file_uploader.fileUploader();
                $file_list.data("uploadFiles", []);

                $inputor.data("mentions", []);
                $inputor.atwho({
                    at: "@",
                    limit: 10,
                    tpl: "<li data-value='@${name}'>${name} <small>${email}</small></li>",
                    'callbacks': {
                        remote_filter: function(query, callback) {
                            if (query.length > 0) {
                                $.getJSON("/search/user.json", {
                                    name_hint: query
                                }, function(data) {
                                    callback(data);
                                });
                            }
                        },
                        before_insert: function(value, $li) {
                            var $_inputor, _mentions, _value;
                            $_inputor = this.$inputor;
                            _value = value.replace(/ /gi, '');
                            _mentions = $_inputor.data("mentions");
                            _mentions.push([_value, $li.data().itemData.id]);
                            $_inputor.data("mentions", _mentions);
                            return _value;
                        }
                    }
                });

                this.locks = {
                    text: true,
                    file: false
                };
                $submit_btn.addClass("disabled").attr("disabled", true);

                if(having_group_chooser) {
                    $group_chooser = this.$el.find(":text.group-chooser");
                    $group_chooser.tokenInput("/api/searches/groups.json", {
                        resultsLimit: 10,
                        tokenLimit: 1
                    });

                    EIM.API.Info.get("Groups", EIM.Current.groupID, function (data) {
                        $group_chooser.tokenInput("add", {
                            id: data.id,
                            name: data.name
                        });
                    })
                }

                _on_extra_elements_init = this.context.callbacks("on_extra_elements_init");

                if (!!_on_extra_elements_init) {
                    _on_extra_elements_init.call(this);
                }

                return this;
            };

            View.prototype._lock_text = function() {
                this.locks.text = true;
                this.context.trigger('validate');
            };

            View.prototype._unlock_text = function() {
                this.locks.text = false;
                this.context.trigger('validate');
            };

            View.prototype._lock_file = function() {
                this.locks.file = true;
                this.context.trigger('validate');
            };

            View.prototype._unlock_file = function() {
                this.locks.file = false;
                this.context.trigger('validate');
            };

            View.prototype._validate = function() {
                var _fail = false;
                var $submit_btn = this.$el.find("input:submit");

                $.each(this.locks, function(key, value) {
                    if(value) {
                        _fail = true;
                        return false;
                    }
                });

                if(_fail) {
                    $submit_btn.addClass("disabled").attr("disabled", true);
                }
                else {
                    $submit_btn.removeClass("disabled").attr("disabled", false);
                }
            };

            return View;

        })();

        POST_TYPE = {
            NORMAL: "normal",
            POLL: "poll",
            TASK: "task",
            EVENT: "event",
            PRIVATE_MESSAGE: "private-message"
        }

        Api = {
            destroy: function() {
                this.shutdown();
                return this.$item.data('postForm', null);
            }
        };

        DEFAULT_CALLBACKS = {
            on_extra_elements_init: function() {
            },
            on_extra_events_bind: function() {
            },
            on_submit: function() {
                var $inputor, $group_chooser, $file_list, $submit_btn;
                var callback, result, choosed_group, group_id, post_type;
                var having_group_chooser = this.context.get_opt("having_group_chooser");

                $inputor = this.$el.find("textarea.toresize");
                $file_list = this.$el.find("ul.filelist, ul.filelist2");
                $submit_btn = this.$el.find("input:submit");

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
                    files: []
                };

                result.values["content"] = $inputor.val();
                result.infos["mentions"] = {};

                result.infos["mentions"].users = [];
                $.each($inputor.data("mentions"), function(index, val){
                    result.infos["mentions"].users.push(val[1]);
                });

                $.each($file_list.find("> li"), function(index, val) {
                    result.files.push($(val).data("info"));
                })

                callback = function() {
                    $inputor.val('');
                    $inputor.data("mentions", []);
                    $file_list.empty();
                    
                    this.locks = {
                        text: true,
                        file: false
                    };
                    this.context.trigger('validate');

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

        // Constructor
        $.fn.postForm = function(method) {
            var result, _args;
            _args = arguments;
            result = null;

            this.filter('form').each(function() {
                var $this, component;
                if (!(component = ($this = $(this)).data("postForm"))) {
                    $this.data('postForm', (component = new Component(this)));
                }
                if (typeof method === 'object' || !method) {
                    return component.reg(method.post_type, method);
                } else if (Api[method] && component) {
                    return result = Api[method].apply(component, Array.prototype.slice.call(_args, 1));
                } else {
                    return $.error("Method " + method + " does not exist on $.postForm by Eim");
                }
            });
            return result || this;
        };

        // Default Setting
        $.fn.postForm["default"] = {
            having_group_chooser: true,
            against_composing_area: true,
            callbacks: DEFAULT_CALLBACKS
        };

    });
}).call(this);
