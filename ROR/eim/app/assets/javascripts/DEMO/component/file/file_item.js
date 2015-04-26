(function fileItem() {
    (function(factory) {
        if (typeof define === 'function' && define.amd) {
            return define(['jquery'], factory);
        } else {
            return factory(window.jQuery);
        }
    })(function($) {

        var Api, Component, Controller, Model, View;

        Component = (function() {
            function Component(item) {
                this.$item = $(item);
                this.controller = null;
                // this.listen();
            }

            Component.prototype.controller = function() {
                return this.controller;
            };

            Component.prototype.set_context = function() {
                return this;
            };

            Component.prototype.reg = function(info, setting) {
                var controller, _base;
                controller = (_base = this.controller) || (_base = new Controller(this, info));
                this.controller = controller;
                controller.init(setting);
                return this;
            };

            Component.prototype.dispatch = function() {
                var _this = this,
                    delay,
                    c = _this.controller;

                if (delay = c.get_opt('delay')) {
                    clearTimeout(_this.delayedCallback);
                    var _callback = function() {
                        if (c.check_info_ready()) {
                            _this.set_context();
                            c.render_view();
                        } else {
                            _this.delayedCallback = setTimeout(_callback, delay);
                        }
                    }

                    return _this.delayedCallback = setTimeout(_callback, delay);
                } else {
                    if (c.check_info_ready()) {
                        this.set_context();
                        c.render_view();
                    }
                }
            };

            Component.prototype.redispatch = function() {
                var _this = this,
                    delay,
                    c = _this.controller;

                if (delay = c.get_opt('delay')) {
                    clearTimeout(_this.delayedCallback);
                    var _callback = function() {
                        if (c.check_info_ready()) {
                            _this.set_context();
                            c.update_view();
                        } else {
                            _this.delayedCallback = setTimeout(_callback, delay);
                        }
                    }

                    return _this.delayedCallback = setTimeout(_callback, delay);
                } else {
                    if (c.check_info_ready()) {
                        this.set_context();
                        c.udpate_view();
                    }
                }
            };

            Component.prototype.shutdown = function() {
                this.controller.destroy();
                delete this.controller;
                return this;
            };

            return Component;

        })();

        Controller = (function() {
            Controller.prototype.uid = function() {
                return (Math.random().toString(16) + "000000000").substr(2, 8) + (new Date().getTime());
            };

            function Controller(component, info) {
                this.component = component;
                this.info = info;
                this.$item = this.component.$item;
                this.id = this.$item[0].id || this.uid();
                this.setting = null;
                this.$el = this.$item;
                this.model = new Model(this);
                this.view = new View(this);
            }

            Controller.prototype.init = function(setting) {
                var _callback;

                this.setting = $.extend({}, this.setting || $.fn.fileItem["default"], setting);
                this.view.init();

                _callback = function() {
                    this.component.dispatch();
                }

                return this.model.reload(this.setting.info, $.proxy(_callback, this));
            };

            Controller.prototype.destroy = function() {
                this.trigger('beforeDestroy');
                this.model.destroy();
                this.view.destroy();
                return this.$el.remove();
            };

            Controller.prototype.update = function(info) {
                var _callback;
                this.trigger('beforeUpdate');
                this.info = info;

                _callback = function() {
                    this.component.redispatch();
                }

                return this.model.reload(this.info, $.proxy(_callback, this));
            };

            Controller.prototype.trigger = function(name, data) {
                var alias, event_name;
                if (data == null) {
                    data = [];
                }
                data.push(this);
                alias = this.get_opt('alias');
                event_name = alias ? "" + name + "-" + alias + ".fileItem" : "" + name + ".fileItem";
                return this.$item.trigger(event_name, data);
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

            Controller.prototype.render_view = function() {
                return this.view.render().bind_event();
            };

            Controller.prototype.update_view = function() {
                return this.view.reset().render().bind_event();
            };

            Controller.prototype.check_info_ready = function() {
                var ready_flags = this.model.info_loaded_ready,
                    is_ready = true;

                for (var key in ready_flags) {
                    if (!ready_flags[key]) {
                        is_ready = false;
                        break;
                    }
                }
                return is_ready;
            };

            return Controller;

        })();

        Model = (function() {
            function Model(context) {
                this.context = context;
                this.storage = this.context.$item;
                this.info_loaded_ready = {};
            }

            Model.prototype.destroy = function() {
                this.storage.removeData();
                delete this.info_loaded_ready;
                return;
            };

            Model.prototype.save_info = function(key, val) {
                this.storage.data(key, val || []);
                this.info_loaded_ready[key] = true;
                return this;
            };

            Model.prototype.reload = function(info, callback) {
                this._load(info);

                return !!callback && callback();
            };

            Model.prototype._load = function(info) {
                var _length, _i;
                // load updater info
                this._load_info('Users', info.user);

                // load group info
                if(!!info.group) {
                    this._load_info('Groups', info.group);
                }

                return this;
            };

            Model.prototype._load_info = function(_type, _id) {
                var _callback, _val, _key = _type + '_' + _id;

                this.info_loaded_ready[_key] = false;

                _callback = function(key, data) {
                    this.save_info(key, data);
                };
                EIM.API.Info.get(_type, _id, $.proxy(_callback, this, _key));
            }

            return Model;

        })();

        View = (function() {
            function View(context) {
                this.context = context;
                this.timeout_id = null;
                this.context.$el.append($('<td><span style="width:250px;display:inline-flex;"><a class="ellipsis"></a></span></td><td><span class="file-ico" style="margin-left:10px"></span></td><td style="text-align:center"><span style="max-width:110px;display:inline-flex;"><a class="ellipsis"></a></span></td><td style="text-align:center"><a></a></td><td style="text-align:center"></td>'));
                this.$el = this.context.$el;
            }

            View.prototype.init = function() {
                var id;
                id = this.context.info.id;
                return this.$el.attr({
                    'id': "file-view" + id
                });
            };

            View.prototype.destroy = function() {
                return this.$el.remove();
            };

            View.prototype.bind_event = function() {
                var $last_col = this.$el.find(">:nth-child(5)"),
                    $follow_btn = $last_col.find(".follow-btn"),
                    $delete_btn = $last_col.find(".delete-btn");

                var info = this.context.info;

                $last_col.find(".option").click(function() {
                    if ($(this).next().css("display") == "none") {
                        $(this).next().slideDown();
                    } else {
                        $(this).next().slideUp();
                    }
                });

                $last_col.find(".options").mouseleave(function() {
                    $(this).slideUp();
                });

                $follow_btn.click(function() {
                    var _callback = function(data) {
                        var _file = data;

                        if(_file.followed) {
                            $follow_btn.data('is_followed', true).text('Unfollow');
                        }
                        else {
                            $follow_btn.data('is_followed', false).text('Follow');
                        }
                    }

                    if($(this).data('is_followed')) {
                        EIM.API.Files.unfollow(info.id, _callback);
                    }
                    else {
                        EIM.API.Files.follow(info.id, _callback);
                    }
                });

                $delete_btn.click((function(_this) {
                    return function(e) {
                        if (window.confirm("Do you really want to delete this file?")) {
                            EIM.API.Files.deleteFile(info.id, function(data) {
                                _this.context.component.$item.slideUp('fast', function() {
                                   _this.context.component.shutdown();
                                });
                            });
                        }
                    }
                })(this));

                return this;
            };


            View.prototype.render = function() {
                var $file_name_col = this.$el.find(">:nth-child(1)"),
                    $file_type_col = this.$el.find(">:nth-child(2)"),
                    $group_col = this.$el.find(">:nth-child(3)"),
                    $updater_col = this.$el.find(">:nth-child(4)"),
                    $last_col = this.$el.find(">:nth-child(5)");

                var info = this.context.info;

                var showGroupColumn = this.context.get_opt('showGroupColumn');

                var updater, group;
                updater = EIM.API.Info.get("Users", info.user);
                if(!!info.group) {
                    group = EIM.API.Info.get("Groups", info.group);
                }

                $file_name_col.find('a').attr("href", info.downloadPath).text(info.name);

                $_info = $('<div class="info"><div class="info-text"><h3></h3><p></p></div></div>');
                $_info.find("h3").text(info.name);
                $_info.find("p").text(info.descript);
                $_info.appendTo($file_name_col);

                $file_type_col.find("span.file-ico").text(info.extName);

                switch(info.fileType) {
                    case FILE_TYPES.DOCUMENT:
                      $file_type_col.find("span.file-ico").addClass('ico-doc')
                      break;
                    case FILE_TYPES.IMAGE:
                      $file_type_col.find("span.file-ico").addClass('ico-img')
                      break;
                    case FILE_TYPES.VIDEO:
                      $file_type_col.find("span.file-ico").addClass('ico-video')
                      break;
                    case FILE_TYPES.AUDIO:
                      $file_type_col.find("span.file-ico").addClass('ico-mp3')
                      break;
                    default:
                      break;
                }

                if(showGroupColumn) {
                    if(!!group) {
                        $group_col.find("a").attr("href", group.feedsPath).text(group.name);  
                    }
                    else {
                        $group_col.find("a").text("N/A").css("cursor", "default");
                    }
                } else {
                    $group_col.hide();
                    $file_name_col.find("span").css("width", "310px");
                }

                $updater_col.find("a").attr("href", updater.feedsPath).text(updater.name);

                $last_col.text(info.lastUpdate)

                // render option menu
                $("<img/>", {
                    src: EIM.Utils.assetPath("DEMO/img/option.png"),
                    class: "option"
                }).appendTo($last_col);

                $('<div class="options"><ul><li><a href="javascript:void(0)" class="update-file-btn">Edit</a></li><li><a href="javascript:void(0)" class="follow-btn"></a></li><li><a class="download-btn">Download</a></li><li><a href="javascript:void(0)" class="delete-btn">Delete</a></li></ul></div>').appendTo($last_col);

                if(info.followed) {
                    $last_col.find(".follow-btn").text("Unfollow").data("is_followed", true);
                }
                else {
                    $last_col.find(".follow-btn").text("Follow").data("is_followed", false);
                }

                $last_col.find(".download-btn").attr("href", info.downloadPath);

                $last_col.find(".update-file-btn").hide();
                $last_col.find(".delete-btn").hide();

                if(info.user === EIM.Current.userID) {
                    $last_col.find(".update-file-btn").updateFileForm({info: info}).show();
                    $last_col.find(".delete-btn").show();
                }

                return this;
            };

            View.prototype.reset = function() {
                this.context.$el.empty();
                this.context.$el.append($('<td><span style="width:270px;display:inline-flex;"><a class="ellipsis"></a></span></td><td><span class="file-ico" style="margin-left:10px"></span></td><td style="text-align:center"><a></a></td><td style="text-align:center"><a></a></td><td style="text-align:center"></td>'));
                this.$el = this.context.$el;

                return this;
            };

            return View;

        })();

        FILE_TYPES = {
            DOCUMENT: "document",
            IMAGE: "image",
            VIDEO: "video",
            AUDIO: "audio"
        }

        Api = {
            update: function(data) {
                var c;
                if (c = this.controller) {
                    return c.update(data);
                }
            },
            destroy: function() {
                this.shutdown();
                return this.$item.data('fileItem', null);
            }
        };

        // Constructor
        $.fn.fileItem = function(method) {
            var result, _args;
            _args = arguments;
            result = null;

            this.filter('tr').each(function() {
                var $this, component;
                if (!(component = ($this = $(this)).data("fileItem"))) {
                    $this.data('fileItem', (component = new Component(this)));
                }
                if (typeof method === 'object' || !method) {
                    return component.reg(method.info, method);
                } else if (Api[method] && component) {
                    return result = Api[method].apply(component, Array.prototype.slice.call(_args, 1));
                } else {
                    return $.error("Method " + method + " does not exist on $.fileItem by Eim");
                }
            });
            return result || this;
        };

        // Default Setting
        $.fn.fileItem["default"] = {
            showGroupColumn: true,
            delay: 50
            // delay: null
        };

    });
}).call(this);
