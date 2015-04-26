(function userItem() {
    (function(factory) {
        if (typeof define === 'function' && define.amd) {
            return define(['jquery'], factory);
        } else {
            return factory(window.jQuery);
        }
    })(function($) {

        var Api, Component, Controller, Model, View, VIEW_TYPE;

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
                var controller, _base, _view_type;
                view_type = setting.viewType || VIEW_TYPE.NORMAL;
                controller = (_base = this.controller) || (_base = new Controller(this, info, view_type));
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

            Component.prototype.shutdown = function() {
                // var c, _, _ref;
                // _ref = this.controllers;
                // for (_ in _ref) {
                //     c = _ref[_];
                //     c.destroy();
                //     delete this.controllers[_];
                // }
                // return this.$inputor.off('.atwhoInner');
            };

            return Component;

        })();

        Controller = (function() {
            Controller.prototype.uid = function() {
                return (Math.random().toString(16) + "000000000").substr(2, 8) + (new Date().getTime());
            };

            function Controller(component, info, view_type) {
                this.component = component;
                this.info = info;
                this.view_type = view_type;
                this.$item = this.component.$item;
                this.id = this.$item[0].id || this.uid();
                this.setting = null;
                this.$el = this.$item;
                this.model = new Model(this);
                this.view = new View(this);
            }

            Controller.prototype.init = function(setting) {
                var _callback;

                this.setting = $.extend({}, this.setting || $.fn.userItem["default"], setting);
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

            Controller.prototype.call_default = function() {
                var args, error, func_name;
                func_name = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
                try {
                    return DEFAULT_CALLBACKS[func_name].apply(this, args);
                } catch (_error) {
                    error = _error;
                    return $.error("" + error + " Or maybe $.userItem doesn't have function " + func_name);
                }
            };

            Controller.prototype.callbacks = function(func_name) {
                return this.get_opt("callbacks")[func_name] || DEFAULT_CALLBACKS[func_name];
            };

            Controller.prototype.trigger = function(name, data) {
                var alias, event_name;
                if (data == null) {
                    data = [];
                }
                data.push(this);
                alias = this.get_opt('alias');
                event_name = alias ? "" + name + "-" + alias + ".groupMemberItem" : "" + name + ".groupMemberItem";
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
                switch(this.context.view_type) {
                    case VIEW_TYPE.INVITING:
                        this.context.$el.append($('<td></td><td></td>'));
                        break;
                    case VIEW_TYPE.NORMAL:
                    default:
                        this.context.$el.append($('<td><a><img/></a></td><td><a></a></td><td><a></a></td><td><a></a></td><td></td><td><center><a class="btn" href="javascript:void(0)" style="width:70px;display:inline-block;vertical-align:middle;">Follow</a><img style="display:inline-block;vertical-align:middle;margin-right:0;margin-left:10px;cursor:pointer"/></center></td>'));
                        break;
                }
                this.$el = this.context.$el;
            }

            View.prototype.init = function() {
                var id;
                id = this.context.info.id;
                return this.$el.attr({
                    'id': "user-view" + id
                });
            };

            View.prototype.destroy = function() {
                return this.$el.remove();
            };

            View.prototype.bind_event = function() {
                switch(this.context.view_type) {
                    case VIEW_TYPE.INVITING:
                        _bind_inviting_event.apply(this);
                        break;
                    case VIEW_TYPE.NORMAL:
                    default:
                        _bind_normal_event.apply(this);
                        break;
                }
                return this;
            };


            View.prototype.render = function() {
                switch(this.context.view_type) {
                    case VIEW_TYPE.INVITING:
                        _render_inviting_view.apply(this);
                        break;
                    case VIEW_TYPE.NORMAL:
                    default:
                        _render_normal_view.apply(this);
                        break;
                }
                return this;
            };

            function _bind_normal_event() {
                var $last_col = this.$el.find(">:nth-child(6)"),
                    $follower_count_col = this.$el.find(">:nth-child(4)"),
                    $follow_btn = $last_col.find("a.btn");

                var info = this.context.info;

                $follow_btn.click(function(event) {
                    var _callback = function(data) {
                        $follow_btn.removeClass().addClass("btn")
                            .addClass(data.followed ? 'orange-button' : "green-button")
                            .text(data.followed ? "Unfollow" : "Follow");
                        $follower_count_col.find("a").text(data.foer_count);
                    }

                    if($(this).hasClass('green-button')) {
                        EIM.API.Users.follow(info.id, _callback);
                    }
                    else if($(this).hasClass('orange-button')) {
                        EIM.API.Users.unfollow(info.id, _callback);
                    }

                    event.preventDefault();
                });
            }

            function _render_normal_view() {
                var $name_col = this.$el.find(">:nth-child(1)"),
                    $depart_col = this.$el.find(">:nth-child(2)"),
                    $job_col = this.$el.find(">:nth-child(3)"),
                    $follower_count_col = this.$el.find(">:nth-child(4)"),
                    $joined_date_col = this.$el.find(">:nth-child(5)");
                    $last_col = this.$el.find(">:nth-child(6)");

                var info = this.context.info;
                var _char;

                // render name column
                _char = info.name.match(new RegExp("[a-z]", "i"));
                _char = (!!_char && _char.length > 0) ? _char[0].toUpperCase() : "nil";
                this.$el.addClass("lemma_" + _char);

                $name_col.find("a").attr("href", info.feedsPath);
                $name_col.find("a").text(info.name);
                $("<img/>", {
                    src: info.avator,
                    style: "width: 50px; height: 50px"
                }).prependTo($name_col.find("a"));

                $depart_col.find("a").text(info.department);

                $job_col.find("a").text(info.title);

                $follower_count_col.find("a").text(info.foer_count);

                $joined_date_col.text(info.joinedDate);

                // render last column
                if(info.id === EIM.Current.userID) {
                    $last_col.empty();
                } else {
                    $last_col.find("a.btn").addClass(info.followed ? 'orange-button' : "green-button")
                        .text(info.followed ? "Unfollow" : "Follow");
                    $last_col.find("img").addClass('send-message-btn')
                        .attr("src", EIM.Utils.assetPath("DEMO/img/msg.png"))
                        .sendMessageForm({
                            info: info
                        });
                }
            }

            function _bind_inviting_event() {
                var $email_col = this.$el.find(">:nth-child(2)"),
                    $invite_btn = $email_col.find(".invite-btn");

                var info = this.context.info;

                $invite_btn.click((function(_this) {
                    return function(event) {
                        EIM.API.Users.invite(info.id, function(data) {                        
                            if(data.status === "OK") {
                                _this.context.component.$item.slideUp('fast', function() {
                                   _this.context.component.shutdown();
                                });
                            }
                            else {
                                console.log(data.error);
                            }
                        });
                    }
                })(this));
            }

            function _render_inviting_view() {
                var $name_col = this.$el.find(">:nth-child(1)"),
                    $email_col = this.$el.find(">:nth-child(2)");

                var info, name;
                info = this.context.info;
                name = info.email.split('@');

                $name_col.text((name.length > 0) ? name[0] : '');
                $email_col.text(info.email);

                $('<a class="invite-btn" href="javascript:void(0)">Invite again</a>').appendTo($email_col);
            }

            return View;

        })();

        VIEW_TYPE = {
            NORMAL: "Normal",
            INVITING: "Inviting"
        };

        Api = {
            destroy: function() {
                this.shutdown();
                return this.$item.data('userItem', null);
            }
        };

        DEFAULT_CALLBACKS = {
            on_invited: function() {
                return this;
            }
        }

        // Constructor
        $.fn.userItem = function(method) {
            var result, _args;
            _args = arguments;
            result = null;

            this.filter('tr').each(function() {
                var $this, component;
                if (!(component = ($this = $(this)).data("userItem"))) {
                    $this.data('userItem', (component = new Component(this)));
                }
                if (typeof method === 'object' || !method) {
                    return component.reg(method.info, method);
                } else if (Api[method] && component) {
                    return result = Api[method].apply(component, Array.prototype.slice.call(_args, 1));
                } else {
                    return $.error("Method " + method + " does not exist on $.userItem by Eim");
                }
            });
            return result || this;
        };

        // Default Setting
        $.fn.userItem["default"] = {
            callbacks: DEFAULT_CALLBACKS,
            delay: 50
            // delay: null
        };

    });
}).call(this);
