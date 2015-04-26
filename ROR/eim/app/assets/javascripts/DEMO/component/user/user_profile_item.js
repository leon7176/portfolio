(function userProfileItem() {
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

                this.setting = $.extend({}, this.setting || $.fn.userProfileItem["default"], setting);
                this.view.init();

                _callback = function() {
                    this.component.dispatch();
                }

                return this.model.reload(this.setting.info, $.proxy(_callback, this));
            };

            /*Controller.prototype.destroy = function() {
                this.trigger('beforeDestroy');
                this.model.destroy();
                this.view.destroy();
                return this.$el.remove();
            };*/

            /*Controller.prototype.trigger = function(name, data) {
                var alias, event_name;
                if (data == null) {
                    data = [];
                }
                data.push(this);
                event_name = "" + name + ".articleItem";
                return this.$inputor.trigger(event_name, data);
            };*/

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
                // TODO
                // return this.storage.data('posts', null);
            };

            // Model.prototype.saved = function() {
            //     return this.fetch() > 0;
            // };

            // Model.prototype.query = function(query, callback) {
            //     var data, search_key, _remote_filter;
            //     data = this.fetch();
            //     search_key = this.context.get_opt("search_key");
            //     data = this.context.callbacks('filter').call(this.context, query, data, search_key) || [];
            //     _remote_filter = this.context.callbacks('remote_filter');
            //     if (data.length > 0 || (!_remote_filter && data.length === 0)) {
            //         return callback(data);
            //     } else {
            //         return _remote_filter.call(this.context, query, callback);
            //     }
            // };

            // Model.prototype.fetch = function() {
            //     return this.storage.data(this.at) || [];
            // };

            Model.prototype.save_info = function(key, val) {
                this.storage.data(key, val || []);
                this.info_loaded_ready[key] = true;
                return this;
            };

            /*Model.prototype.load = function(data) {
                if (!(this.saved() || !data)) {
                    return this._load(data);
                }
            };*/

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
                this.$el = $('<div class="profile-info"><img/><a class="name"></a><p name="job-title"></p><p name="email"></p><p name="work-phone"></p><p name="mobile-phone"></p><div class="profile-links"><a href="javascript:void(0)" class="btn green-button info-btn">Info</a><a href="javascript:void(0)" class="btn follow-btn">Follow</a><a href="javascript:void(0)" class="btn green-button send-message-btn" style="width: 140px;">Send message</a></div></div>');
                this.timeout_id = null;
                this.context.$el.append(this.$el);
            }

            View.prototype.init = function() {
                var id;
                id = this.context.info.id;
                return this.$el.attr({
                    'id': "user-profile-view" + id
                });
            };

            View.prototype.destroy = function() {
                return this.$el.remove();
            };

            View.prototype.bind_event = function() {
                var $links = this.$el.find(".profile-links"),
                    $info_btn = $links.find(".info-btn"),
                    $follow_btn = $links.find(".follow-btn"),
                    $msg_btn = $links.find(".send-message-btn");

                var info = this.context.info;

                if(info.id !== EIM.Current.userID) {
                    $follow_btn.click(function(event) {
                        var _callback = function(data) {
                            $follow_btn.removeClass().addClass("btn")
                                .addClass(data.followed ? 'orange-button' : "green-button")
                                .text(data.followed ? "Unfollow" : "Follow");
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

                return this;
            };


            View.prototype.render = function() {
                var $links = this.$el.find(".profile-links"),
                    $info_btn = $links.find(".info-btn"),
                    $follow_btn = $links.find(".follow-btn"),
                    $msg_btn = $links.find(".send-message-btn");

                var info = this.context.info;

                this.$el.find("img").attr("src", info.avator).css("width", "80px").css("height", "80px");
                this.$el.find(".name").text(info.name).attr("href", info.feedsPath);
                this.$el.find("[name='job-title']").html((info.title.length === 0) ? "&nbsp;" : "<b>" + info.title + "</b>");
                this.$el.find("[name='email']").text(info.email);
                this.$el.find("[name='work-phone']").text('work phone Ext. ' + info.number);
                this.$el.find("[name='mobile-phone']").text('mobile phone: ' + info.mobile);

                $info_btn.attr("href", info.feedsPath);

                if(info.id === EIM.Current.userID) {
                    $follow_btn.addClass('gray-button').text('Followed');
                    $msg_btn.addClass('gray-button');
                }
                else {
                    $follow_btn.addClass(info.followed ? 'orange-button' : 'green-button').text(info.followed ? 'Unfollow' : 'Follow');
                    $msg_btn.sendMessageForm({
                        info: info
                    });
                }

                return this;
            };

            return View;

        })();

        Api = {
            destroy: function() {
                this.shutdown();
                return this.$item.data('userProfileItem', null);
            }
        };

        // Constructor
        $.fn.userProfileItem = function(method) {
            var result, _args;
            _args = arguments;
            result = null;

            this.filter('div.picture, span.name').each(function() {
                var $this, component;
                if (!(component = ($this = $(this)).data("userProfileItem"))) {
                    $this.data('userProfileItem', (component = new Component(this)));
                }
                if (typeof method === 'object' || !method) {
                    return component.reg(method.info, method);
                } else if (Api[method] && component) {
                    return result = Api[method].apply(component, Array.prototype.slice.call(_args, 1));
                } else {
                    return $.error("Method " + method + " does not exist on $.userProfileItem by Eim");
                }
            });
            return result || this;
        };

        // Default Setting
        $.fn.userProfileItem["default"] = {
            delay: 50
            // delay: null
        };

    });
}).call(this);
