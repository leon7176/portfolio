(function articleItem() {
    (function(factory) {
        if (typeof define === 'function' && define.amd) {
            return define(['jquery'], factory);
        } else {
            return factory(window.jQuery);
        }
    })(function($) {

        var Api, Component, Controller, Model, View, PIN_TYPES;

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

                this.setting = $.extend({}, this.setting || $.fn.articleItem["default"], setting);
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

            Controller.prototype.trigger = function(name, data) {
                var alias, event_name;
                if (data == null) {
                    data = [];
                }
                data.push(this);
                alias = this.get_opt('alias');
                event_name = alias ? "" + name + "-" + alias + ".articleItem" : "" + name + ".articleItem";
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

                // load author info
                this._load_info('Users', info.user);

                // load receivers info
                _length = info.receivers.length;
                for (_i = 0; _i < _length; _i++) {
                    this._load_info('Users', info.receivers[_i]);
                };

                // load group receivers info
                _length = info.group_receiver.length;
                for (_i = 0; _i < _length; _i++) {
                    this._load_info('Groups', info.group_receiver[_i]);
                };

                // load attached info of main_post
                var callback = function (key, data) {
                    this.save_info(key, data);

                    var _main_post = data;
                    switch (_main_post.post_type) {
                        case EIM.Constant.PostType.poll:
                            this._load_info('Polls', _main_post.attach.id);
                            break;
                        case EIM.Constant.PostType.task:
                            this._load_info('Tasks', _main_post.attach.id);
                            break;
                        case EIM.Constant.PostType.event:
                            this._load_info('Events', _main_post.attach.id);
                            break;
                        case EIM.Constant.PostType.file:
                        case EIM.Constant.PostType.normal:
                        default:
                            // do nothing
                            break;
                    }
                }

                this._load_info('Posts', info.main_post, callback);

                // load last posts info
                _length = info.last_posts.length;
                for (_i = 0; _i < _length; _i++) {
                    this._load_info('Posts', info.last_posts[_i]);
                };

                return this;
            };

            Model.prototype._load_info = function(_type, _id, _callback) {
                if(typeof(_callback) === 'undefined') {
                    _callback = function(key, data) {
                        this.save_info(key, data);
                    };
                }

                var _val, _key = _type + '_' + _id;
                this.info_loaded_ready[_key] = false;
                EIM.API.Info.get(_type, _id, $.proxy(_callback, this, _key));
            };

            return Model;

        })();

        View = (function() {
            function View(context) {
                this.context = context;
                this.$el = $('<article class="following"><div class="picture"></div><div class="content"><div class="row"><a class="name"></a><span class="read-unread-ico"></span><span class="current-pin pin"></span><span class="time">2 minutes ago</span><div class="pin-panel"><ul class="pin-list"><li class="red" data-color="pin-red"><span class="pin pin-red"></span>Red</li><li class="orange" data-color="pin-orange"><span class="pin pin-orange"></span>Orange</li><li class="yellow" data-color="pin-yellow"><span class="pin pin-yellow"></span>Yellow</li><li class="green" data-color="pin-green"><span class="pin pin-green"></span>Green</li><li class="gray" data-color="unpinned"><span class="pin unpinned"></span>Unpinned</li></ul></div></div><div class="message"></div><div class="clear"></div><div class="attachment"></div><div class="operation"><div class="operation-menu"><div class="container"><ul><li><span class="ope-icon icon-edit">Edit</span></li><li><span class="ope-icon icon-remove">Remove</span></li></ul></div></div></div><div class="links"><span class="button button-reply">Reply</span><span class="button button-share">Share</span><span class="button button-follow">Follow</span><span class="button button-like">Like</span><span class="like-count-bubble"></span></div></div><div class="clear"></div><ul class="answer"></ul><form class="comment"><img/><textarea class="toresize" placeholder="Say Something..."></textarea><input type="submit" value="Comment"/><div class="attach-files"><input type="file" name="file[]" /><ul class="filelist"></ul></div></form></article>');
                this.timeout_id = null;
                this.context.$el.append(this.$el);
            }

            View.prototype.init = function() {
                var id;
                id = this.context.info.id;
                return this.$el.attr({
                    'id': "article-view" + id
                });
            };

            View.prototype.destroy = function() {
                return this.$el.remove();
            };

            View.prototype.bind_event = function() {
                var $links, $reply_btn, $share_btn, $edit_btn, $delete_btn, $follow_btn, $like_btn, $read_btn,
                    $pin_btn, $pin_panel, $pin_list, $operation, $operation_menu, $answer, $read_more_btn, $show_more_btn, $content, $message, $private_message, $attachment, $time;

                var info, author, main_post, preview_height, pinMenu = 0;

                info = this.context.info;
                author = EIM.API.Info.get('Users', info.user);
                main_post = EIM.API.Info.get('Posts', info.main_post);

                preview_height = this.context.get_opt('preview_height');

                $links = this.$el.find('>.content .links');
                $operation = this.$el.find('>.content .operation');
                $attachment = this.$el.find('>.content .attachment');
                $reply_btn = $links.find('.button-reply');
                $share_btn = $links.find('.button-share');
                $operation_menu = this.$el.find('> .content .operation-menu');
                $edit_btn = $operation_menu.find('span.icon-edit');
                $delete_btn = $operation_menu.find('span.icon-remove');
                $follow_btn = $links.find('.button-follow, .button-unfollow');
                $like_btn = $links.find('.button-like, .button-unlike');
                $read_btn = this.$el.find('.read-unread-ico');
                $pin_btn = this.$el.find('.current-pin');
                $pin_panel = this.$el.find('div.pin-panel');
                $pin_list = this.$el.find('ul.pin-list');
                $answer = this.$el.find('ul.answer');
                $read_more_btn = this.$el.find('.readmore');
                $show_replies_btn = this.$el.find('.show-replies span');
                $content = this.$el.find("> .content");
                $time = $content.find(".time");
                $message = $content.find('.message');
                $private_message = $content.find(".private-message");

                this.context.$item.on("edit.articleItem", (function(_this) {
                    return function(event, post_type) {
                        if(post_type === EIM.Constant.PostType.normal) {
                            var $_edit_post_form = $('<form class="edit-post-form edit" />');
                            $_edit_post_form.editPostForm({info: info});
                            $_edit_post_form.insertAfter($message).show();                       
                        }                        
                        else if(post_type === EIM.Constant.PostType.poll) {
                            var $_edit_poll_form = $('<form class="edit-poll-form edit" />');
                            // TODO init edit-poll form
                        }
                        else {
                            return false;
                        }

                        $message.hide();
                        if(info.private) {
                            $private_message.hide();
                        }

                        $time.hide();
                        $read_btn.hide();
                        $pin_btn.hide();
                        $links.hide();
                        $operation.hide();
                        $attachment.hide();                        

                        return false;
                    };
                })(this));

                this.context.$item.on("cancel.articleItem", (function(_this) {
                    return function(event, post_type) {
                        console.log(event);
                        if(post_type === EIM.Constant.PostType.normal) {                            
                            // destroy edit-post form
                        }                        
                        else if(post_type === EIM.Constant.PostType.poll) {
                            // destroy edit-poll form
                        }
                        else {
                            return false;
                        }

                        $message.show();
                        if(info.private) {
                            $private_message.show();
                        }

                        $time.show();
                        $read_btn.show();
                        $pin_btn.show();
                        $links.show();
                        $operation.show();
                        // TOFIX
                        $attachment.show();

                        return false;
                    };
                })(this));

                this.context.$item.on("updated.articleItem", (function(_this) {
                    return function(event, post_type) {
                        console.log(event);
                        if(post_type === EIM.Constant.PostType.normal) {                            
                            // destroy edit-post form
                        }                        
                        else if(post_type === EIM.Constant.PostType.poll) {
                            // destroy edit-poll form
                        }
                        else {
                            return false;
                        }

                        // TODO update message

                        $message.show();
                        if(info.private) {
                            $private_message.show();
                        }

                        $time.show();
                        $read_btn.show();
                        $pin_btn.show();
                        $links.show();
                        $operation.show();
                        // TOFIX
                        $attachment.show();

                        return false;
                    };
                })(this));

                $reply_btn.click(function() {
                    $(this).parent().parent().parent().find(".comment").slideDown(500);
                });

                $share_btn.click(function(e) {
                    console.log(e.type);
                });

                $operation_menu.click(function(e){
                    if($(this).children().is(":visible")) {
                        $(this).children().slideUp();
                    }
                    else {
                        $(this).children().slideDown();
                    }
                });

                $operation_menu.mouseleave(function(event) {
                    $(this).children().slideUp();
                });

                $operation_menu.find("> .container").mouseleave(function(e) {
                    $(this).slideUp();
                });

                $edit_btn.click((function(_this) {
                    return function(event) {
                        _this.context.trigger('edit', [main_post.post_type]);
                        return false;
                    };
                })(this));

                $delete_btn.click((function(_this) {
                    return function(e) {
                        if (window.confirm("Do you really want to delete this message?")) {
                            EIM.API.Posts.deletePost(info.main_post, info.id, function(data) {
                                _this.context.component.$item.slideUp('fast', function() {
                                   _this.context.component.shutdown();
                                });
                            });
                        }
                    }
                })(this));

                $follow_btn.click(function() {
                    var _callback = function(data) {
                        var _conversation = data;

                        if(_conversation.followed) {
                            $follow_btn.data('is_followed', true).text('Unfollow').removeClass('button-follow').addClass('button-unfollow');
                        }
                        else {
                            $follow_btn.data('is_followed', false).text('Follow').removeClass('button-unfollow').addClass('button-follow');
                        }
                    }

                    if($(this).data('is_followed')) {
                        EIM.API.Conversations.unfollow(info.id, _callback);
                    }
                    else {
                        EIM.API.Conversations.follow(info.id, _callback);
                    }
                });

                $like_btn.click(function() {
                    var is_liked = $(this).data('is_liked');
                    // TODO move to EIM.API.likePost
                    $.getJSON('/api/posts/' + info.main_post + (is_liked ? '/unlike' : '/like'), (function(_this, _is_liked) {
                        return function(json, textStatus) {
                            var $like_btn = $(_this),
                                $like_bubble = $like_btn.siblings('.like-count-bubble');

                            $like_btn.data('is_liked', _is_liked).text(_is_liked ? 'Unlike' : 'Like')
                                .toggleClass('button-like button-unlike');
                            $like_bubble.toggleClass('unlike').text(json.data.likeNUM);

                            EIM.API.Info.fetch('Posts', info.main_post);
                        };
                    })(this, !is_liked));
                });

                $read_btn.click((function(_this) {
                    return function(event) {
                        var _callback = function(data) {
                            var _conversation = data;

                            if (_conversation.read) {
                                // dirty trick to determine if current read filter is 'unread'
                                $_unread_selecter = $("#filter-panel select#all-unread");
                                if($_unread_selecter.val() === "unread") {
                                    _this.context.component.$item.slideUp('fast', function() {
                                       _this.context.component.shutdown();
                                    });
                                }
                                else if($_unread_selecter.val() === "all") {
                                    $read_btn.data('is_read', true).addClass('read').attr('title', 'Mark feed as unread');
                                }
                            } else {
                                $read_btn.data('is_read', false).removeClass('read').attr('title', 'Mark feed as read');
                            }
                        }

                        if($(this).data('is_read')) {
                            EIM.API.Conversations.markUnread(info.id, _callback);
                        }
                        else {
                            EIM.API.Conversations.markRead(info.id, _callback);
                        }
                    }
                })(this));

                $pin_btn.click(function() {
                    if ($pin_panel.width() <= 0) {
                        $pin_panel.css("display", "block").animate({
                            "width": "138px",
                            "height": "156px"
                        }, 400, function() {
                            pinMenu = 1;
                        });
                    }
                    else {
                        $pin_panel.stop(true, true)
                            .animate({
                                "width": "0px",
                                "height": "0px"
                            }, 400, function() {
                                $pin_panel.css("display", "none");
                                pinMenu = 0;
                            });
                    }
                });

                $pin_list.mouseleave(function(event) {
                    $pin_panel.stop(true, true)
                        .animate({
                            "width": "0px",
                            "height": "0px"
                        }, 400, function() {
                            $pin_panel.css("display", "none");
                            pinMenu = 0;
                        });
                });

                $pin_list.find('li').each(function() {
                    $(this).click(function() {
                        var pin_type_id = $(this).data('pin_type_id'), _callback;

                        $pin_panel.stop(true, true)
                            .animate({
                                "width": "0px",
                                "height": "0px"
                            }, 400, function() {
                                $pin_panel.css("display", "none");
                                pinMenu = 0;
                            });

                        _callback = function(data) {
                            var _conversation = data;

                            $pin_btn.removeClass().addClass('pin').addClass('current-pin');

                            switch (_conversation.pinned) {
                                case PIN_TYPES.URGENT:
                                    $pin_btn.addClass('pin-red');
                                    break;
                                case PIN_TYPES.IMPORTANT:
                                    $pin_btn.addClass('pin-orange');
                                    break;
                                case PIN_TYPES.FOLLOW_UP:
                                    $pin_btn.addClass('pin-yellow');
                                    break;
                                case PIN_TYPES.READ_IT_LATER:
                                    $pin_btn.addClass('pin-green');
                                    break;
                                case PIN_TYPES.UNPINNED:
                                default:
                                    $pin_btn.addClass('unpinned');
                                    break;
                            }
                        }

                        if(pin_type_id === 0) {
                            EIM.API.Conversations.unpin(info.id, _callback);
                        }
                        else {
                            EIM.API.Conversations.pin(info.id, pin_type_id, _callback);
                        }
                        /*$pin_btn.removeClass("pin-red pin-orange pin-yellow pin-green unpinned")
                            .addClass($(this).data("color"));
                        */
                    });
                });

                $read_more_btn.click(function() {
                    $(this).parent().animate({
                        "height": $(this).parent().data("height")
                    }, 400);
                    $(this).remove();
                });

                $show_replies_btn.click((function(_this) {
                    return function(e) {
                        $_before = $answer.find(">li:first-child")
                        $(this).remove();

                        _this.delayedCallbacks = [];

                        var _length = info.posts.length, _callback;
                        for (var _i = 1; _i < _length; _i++) {
                            if(info.last_posts.indexOf(info.posts[_i]) < 0) {
                                _this.context.model._load_info("Posts", info.posts[_i]);

                                var delay,
                                    post_id = info.posts[_i];
                                    c = _this.context;
                                if (delay = c.get_opt('delay')) {
                                    clearTimeout(_this.delayedCallbacks[post_id]);
                                    var _callback = function(_post_id) {
                                        if (c.check_info_ready()) {
                                            var _post = EIM.API.Info.get('Posts', _post_id);
                                            $('<li/>').replyItem({ info: _post }).insertBefore($_before);
                                        } else {
                                            _this.delayedCallbacks[_post_id] = setTimeout(_callback, delay, _post_id);
                                        }
                                    }

                                    _this.delayedCallbacks[post_id] = setTimeout(_callback, delay, post_id);
                                }
                            }
                        };
                    }
                })(this));

                $(window).click(function(){
                    if(pinMenu == 1){
                        $pin_panel.stop(true, true)
                            .animate({
                                "width": "0px",
                                "height": "0px"
                            }, 400, function() {
                                $pin_panel.css("display", "none");
                                pinMenu = 0;
                            });
                    }
                });

                return this;
            };

            View.prototype.render = function() {
                var $pic, $content, $answer, $row, $pin_list, $message, $cur_pin, $attachment, $links, $operation_menu, $reply_btn, $read_btn, $share_btn, $follow_btn, $like_btn, $like_bubble, $comment_form, $group_receiver_msg;

                var info, author, msg, main_post, upload_file, length, callback;

                var last_limit = this.context.get_opt('last_limit'),
                    preview_height = this.context.get_opt('preview_height');

                info = this.context.info;
                author = EIM.API.Info.get('Users', info.user);
                main_post = EIM.API.Info.get('Posts', info.main_post);

                if(!info.read) {
                    this.$el.addClass('unread');
                }

                $pic = this.$el.find('> .picture');
                $content = this.$el.find('> .content');
                $answer = this.$el.find('ul.answer');
                $row = $content.find('.row');
                $message = $content.find('.message');
                $attachment = $content.find('.attachment');
                $links = this.$el.find('.links');
                $comment_form = this.$el.find('form.comment');
                $operation_menu = this.$el.find('.content .operation-menu');

                function _render_files_in_attachment(files) {
                    var length = files.length;
                    var callback;

                    if (length <= 0) {
                        $attachment.css('display', 'none');
                    }

                    for (var i = 0; i < length; i++) {
                        callback = function(data) {
                            $('<a href="' + data.downloadPath + '"><span class="file">' + data.name + '</span></a>')
                                .appendTo($attachment);
                        };

                        EIM.API.Info.get('Files', files[i].id, callback);
                    }
                }

                function _render_files_in_file_container(files) {
                    var $_file_container;
                    var length, callback;

                    length = files.length;

                    if(length > 0) {
                        $_file_container = $('<div class="files-container"/>');
                        $_file_container.append($("<ul/>")).appendTo(this.$el.find(".e-detail"));

                        for (var i = 0; i < length; i++) {
                            callback = function(data) {
                                var $_li = $('<li><a href="' + data.downloadPath + '"><img><span>' + data.name + '</span></a></li>');
                                
                                $_li.find("img").attr("src", EIM.Utils.assetPath("DEMO/img/files.png"));
                                $_li.appendTo($_file_container.find("ul"));
                            };

                            EIM.API.Info.get('Files', files[i].id, callback);
                        }
                    }
                }


                // <div class="files-container">
                //     <ul>
                //         <li><img src="img/files.png"><span>sample.jpg</span></li>
                //     </ul>
                // </div>

                $("<img/>", {
                    src: author.avator,
                    style: "width: 81px; height: 80px"
                }).appendTo($pic);

                $pic.userProfileItem({info: author});

                $row.find('.name').attr("href", author.feedsPath).text(author.name);
                // $row.find('.name').userProfileItem({info: author});

                $content.find('.time').text(EIM.Utils.formatDateTime(main_post.stamp, main_post.time_ago));

                // render operation menu
                if(author.id === EIM.Current.userID) {
                    $operation_menu.css("display", "block");
                }
                else {
                    $operation_menu.css("display", "none");
                }

                // render group receiver message
                var _group_receiver;
                $group_receiver_msg = $('<div/>', {class: "invitedyou"}).text("in ");
                length = info.group_receiver.length;

                for (var i = 0; i < length; i++) {
                    _group_receiver = EIM.API.Info.get("Groups", info.group_receiver[i]);
                    $group_receiver_msg.append($('<a/>', {
                        href: _group_receiver.feedsPath
                    }).text(_group_receiver.name))
                };

                $group_receiver_msg.insertAfter($row.find('.name'));

                // render message
                switch (main_post.post_type) {
                    case EIM.Constant.PostType.poll:
                        var poll = EIM.API.Info.get("Polls", main_post.attach.id);
                        $('<div class="poll" />').pollItem({ info: poll }).insertAfter($message);
                        msg = poll.title ? EIM.Utils.replaceSpecialChar(poll.title) : '';

                        $operation_menu.find("span.icon-edit").attr("id", "edit_poll_btn");

                        _render_files_in_attachment.call(this, main_post.files);
                        break;
                    case EIM.Constant.PostType.task:
                        var task = EIM.API.Info.get("Tasks", main_post.attach.id);

                        msg = '';

                        $('<div class="task" />').taskItem({
                            info: task,
                            viewType: "Feed"
                        }).insertAfter($message);

                        $operation_menu.find("span.icon-edit").addClass("edit_task_btn").editTaskForm({info: task});

                        $attachment.css('display', 'none');
                        _render_files_in_file_container.call(this, main_post.files);
                        break;
                    case EIM.Constant.PostType.event:
                        var event = EIM.API.Info.get("Events", main_post.attach.id);

                        msg = '';

                        $('<div class="event" />').eventItem({
                            info: event,
                            viewType: "Feed"
                        }).insertAfter($message);

                        $operation_menu.find("span.icon-edit").addClass("edit_event_btn").editEventForm({info: event});

                        $attachment.css('display', 'none');
                        _render_files_in_file_container.call(this, main_post.files);
                        break;
                    case EIM.Constant.PostType.file:
                    case EIM.Constant.PostType.normal:
                    default:
                        if(info.private) {
                            var $_private_message;
                            var _content, _receiver, _hint;

                            if(info.user === EIM.Current.userID) {
                                $group_receiver_msg.text("Send the message to ");

                                if(!!info.receivers) {
                                    length = info.receivers.length;
                                    for (var i = 0; i < length; i++) {
                                        _receiver = EIM.API.Info.get("Users", info.receivers[i]);
                                        $group_receiver_msg.append($('<a/>', {
                                            href: _receiver.feedsPath
                                        }).text(_receiver.name))
                                    };
                                }
                            }
                            else {
                                $group_receiver_msg.text("Send the message to you");
                            }

                            msg = '';

                            _content = main_post.content ? EIM.Utils.replaceSpecialChar(main_post.content) : '';

                            $_private_message = $('<div class="private-message"><div class="e-icon"></div><div class="e-detail"><p></p></div></div>');

                            $_private_message.find(".e-icon").append($("<img/>", {
                                src: EIM.Utils.assetPath("DEMO/img/bubble2.png")
                            }));

                            length = info.receivers.length;
                            for (var i = 0; i < length; i++) {
                                _receiver = EIM.API.Info.get("Users", info.receivers[i]);
                                _hint = '@' + _receiver.name.replace(/ /gi, '');
                                _content = _content.replace(new RegExp(_hint, 'gi'), '<a href="' + _receiver.feedsPath + '" class="messagefor">@' + _receiver.name + '</a>');
                            };

                            $_private_message.find(".e-detail > p").html(_content);

                            $_private_message.insertAfter($message);

                            $attachment.css('display', 'none');
                            _render_files_in_file_container.call(this, main_post.files);
                        }
                        else {
                            msg = main_post.content ? EIM.Utils.replaceSpecialChar(main_post.content) : '';

                            _render_files_in_attachment.call(this, main_post.files);
                        }
                        break;
                }

                var _receiver, _hint;
                length = info.receivers.length;
                for (var i = 0; i < length; i++) {
                    _receiver = EIM.API.Info.get("Users", info.receivers[i]);
                    _hint = '@' + _receiver.name.replace(/ /gi, '');
                    msg = msg.replace(new RegExp(_hint, 'gi'), '<a href="' + _receiver.feedsPath + '" class="messagefor">@' + _receiver.name + '</a>');
                };
                $message.html(msg);

                if ($message.height() > preview_height) {
                    $message.data("height", $message.height()).append("<span class='readmore'>...read more</span>").height(preview_height);
                }

                // render pin area
                $cur_pin = $row.find('.current-pin');
                switch (info.pinned) {
                    case PIN_TYPES.URGENT:
                        $cur_pin.addClass('pin-red');
                        break;
                    case PIN_TYPES.IMPORTANT:
                        $cur_pin.addClass('pin-orange');
                        break;
                    case PIN_TYPES.FOLLOW_UP:
                        $cur_pin.addClass('pin-yellow');
                        break;
                    case PIN_TYPES.READ_IT_LATER:
                        $cur_pin.addClass('pin-green');
                        break;
                    case PIN_TYPES.UNPINNED:
                    default:
                        $cur_pin.addClass('unpinned');
                        break;
                }

                $pin_list = $row.find('.pin-panel .pin-list');
                $pin_list.find('.red').data('pin_type_id', PIN_TYPES.URGENT);
                $pin_list.find('.orange').data('pin_type_id', PIN_TYPES.IMPORTANT);
                $pin_list.find('.yellow').data('pin_type_id', PIN_TYPES.FOLLOW_UP);
                $pin_list.find('.green').data('pin_type_id', PIN_TYPES.READ_IT_LATER);
                $pin_list.find('.gray').data('pin_type_id', PIN_TYPES.UNPINNED);

                // render function button
                $share_btn = $links.find('.button-share');
                $share_btn.hide();

                $follow_btn = $links.find('.button-follow');
                if (info.followed) {
                    $follow_btn.removeClass('button-follow');
                    $follow_btn.addClass('button-unfollow');
                    $follow_btn.text('Unfollow');
                    $follow_btn.data('is_followed', true);
                } else {
                    $follow_btn.text('Follow');
                    $follow_btn.data('is_followed', false);
                }

                $read_btn = this.$el.find('.read-unread-ico');
                if (info.read) {
                    $read_btn.addClass('read').data('is_read', true).attr('title', 'Mark feed as unread');
                } else {
                    $read_btn.removeClass('read').data('is_read', false).attr('title', 'Mark feed as read');
                }

                $like_btn = $links.find('.button-like');
                $like_bubble = $links.find('.like-count-bubble');
                $like_bubble.text(main_post.likeNUM);
                if (main_post.liked) {
                    $like_btn.removeClass('button-like');
                    $like_btn.addClass('button-unlike');
                    $like_btn.text('Unlike');
                    $like_btn.data('is_liked', true);
                    $like_bubble.addClass('unlike');
                } else {
                    $like_btn.text('Like');
                    $like_btn.data('is_liked', false);
                }

                // populate replies ui
                var _post;
                length = info.last_posts.length;
                for (var i = 0; i < length; i++) {
                    _post = EIM.API.Info.get('Posts', info.last_posts[i]);
                    $('<li/>').replyItem({ info: _post }).appendTo($answer);
                };

                // render show replies button
                _size = info.posts.length - 1;
                $answer.data("size", _size);
                if (_size > last_limit) {
                    $("<div class='show-replies'><span>" + _size + " Replies</span></div>").insertBefore($comment_form);
                }

                // render comment form
                $comment_form.replyForm({
                    main_post: info.main_post,
                    conversation: info.id,
                    reply_to_post_id: info.main_post
                });

                return this;
            };

            return View;

        })();

        PIN_TYPES = {
            UNPINNED: 0,
            URGENT: 1,
            IMPORTANT: 2,
            FOLLOW_UP: 3,
            READ_IT_LATER: 4
        }

        Api = {
            destroy: function() {
                this.shutdown();
                return this.$item.data('articleItem', null);
            }
        };

        // Constructor
        $.fn.articleItem = function(method) {
            var result, _args;
            _args = arguments;
            result = null;

            this.filter('li').each(function() {
                var $this, component;
                if (!(component = ($this = $(this)).data("articleItem"))) {
                    $this.data('articleItem', (component = new Component(this)));
                }
                if (typeof method === 'object' || !method) {
                    return component.reg(method.info, method);
                } else if (Api[method] && component) {
                    return result = Api[method].apply(component, Array.prototype.slice.call(_args, 1));
                } else {
                    return $.error("Method " + method + " does not exist on $.articleItem by Eim");
                }
            });
            return result || this;
        };

        // Default Setting
        $.fn.articleItem["default"] = {
            last_limit: 2,
            preview_height: 72,
            delay: 50
            // delay: null
        };

    });
}).call(this);
