(function flashAgent() {
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

            Component.prototype.reg = function(setting) {
                var controller, _base;
                controller = (_base = this.controller) || (_base = new Controller(this));
                this.controller = controller;
                controller.init(setting);
                return this;
            };

            Component.prototype.dispatch = function() {
                var _this = this,
                    delay,
                    c = _this.controller;

                // this.set_context();
                if(c.$flash_items.length === 1) {
                    c.$flash_items[0].flashItem("display");                    
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

            function Controller(component) {
                this.component = component;
                this.$item = this.component.$item;
                this.id = this.$item[0].id || this.uid();
                this.setting = null;
                this.$el = this.$item;
                this.$flash_items = [];
                this.model = new Model(this);
                this.view = new View(this);
            }

            Controller.prototype.init = function(setting) {
                var _callback;

                this.setting = $.extend({}, this.setting || $.fn.flashAgent["default"], setting);
                this.view.init();
                this.view.render().bind_event();

                return this;
            };

            Controller.prototype.destroy = function() {
                this.trigger('beforeDestroy');
                this.model.destroy();
                this.view.destroy();
                this.$flash_items = null;
                return this.$el.remove();
            };

            Controller.prototype.trigger = function(name, data) {
                var alias, event_name;
                if (data == null) {
                    data = [];
                }
                data.push(this);
                alias = this.get_opt('alias');
                event_name = alias ? "" + name + "-" + alias + ".flashAgent" : "" + name + ".flashAgent";
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

            Controller.prototype.add_flash = function(data) {
                this.model.flashes.push({name: data.name, msg: data.msg});

                var $_flash_item = $('<div class="notification-bar" />');
                $_flash_item.flashItem({
                    flashType: data.name,
                    content: data.msg
                }).prependTo($("body"));

                $_flash_item.on("beforeDestroy.flashItem", (function(_this) {
                    return function(event) {
                        _this.$flash_items.shift();

                        if(_this.$flash_items.length > 0) {
                            var interval = _this.get_opt('interval');
                            var _callback = function() {
                                _this.$flash_items[0].flashItem("display");
                            }

                            _this.displayCallback = setTimeout(_callback, interval);
                        }
                    };
                })(this));

                this.$flash_items.push($_flash_item);
                return this;
            };

            return Controller;

        })();

        Model = (function() {
            function Model(context) {
                this.context = context;
                this.storage = this.context.$item;
                this.flashes = [];
            }

            Model.prototype.destroy = function() {
                this.storage.removeData();
                this.flashes = null;
                return;
            };

            return Model;

        })();

        View = (function() {
            function View(context) {
                this.context = context;
                this.$el = this.context.$el;
                this.timeout_id = null;
            }

            View.prototype.init = function() {
                return this;
            };

            View.prototype.destroy = function() {
                return this.$el.remove();
            };

            View.prototype.bind_event = function() {
                this.$el.on("flash.flashAgent", (function(_this) {
                    return function(e, name, msg) {
                        _this.context.add_flash({name: name, msg: msg});
                        _this.context.component.dispatch();
                    };
                })(this));

                return this;
            };

            View.prototype.render = function() {
                return this;
            };

            return View;

        })();

        Api = {
            flash: function(name, msg) {
                var c;
                if (c = this.controller) {
                    return c.trigger('flash', [name, msg]);
                }
            },
            destroy: function() {
                this.shutdown();
                return this.$item.data('flashAgent', null);
            }
        };

        // Constructor
        $.fn.flashAgent = function(method) {
            var result, _args;
            _args = arguments;
            result = null;

            this.filter('#flash-agent').each(function() {
                var $this, component;
                if (!(component = ($this = $(this)).data("flashAgent"))) {
                    $this.data('flashAgent', (component = new Component(this)));
                }
                if (typeof method === 'object' || !method) {
                    return component.reg(method);
                } else if (Api[method] && component) {
                    return result = Api[method].apply(component, Array.prototype.slice.call(_args, 1));
                } else {
                    return $.error("Method " + method + " does not exist on $.flashAgent by Eim");
                }
            });
            return result || this;
        };

        // Default Setting
        $.fn.flashAgent["default"] = {
            interval: 1000
        };

    });
}).call(this);
