module FeedsHelper

  FILTER_ALL_ALL = 0
  FILTER_ALL_UNREAD = 1
  FILTER_FOLLOWING_ALL = 2
  FILTER_FOLLOWING_UNREAD = 3
  FILTER_TOME_ALL = 4
  FILTER_TOME_UNREAD = 5
  FILTER_MYPOST_ALL = 6
  FILTER_MYPOST_UNREAD = 7
  FILTER_PINNED_ALL = 8
  FILTER_PINNED_UNREAD = 9
  FILTER_GROUP_ALL = 10
  FILTER_GROUP_UNREAD = 11
  FILTER_USER_ALL = 12
  FILTER_USER_UNREAD = 13
  FILTER_SEARCH_ALL = 14

  def self.filter_id(main_filter, sub_filter)
    id = FILTER_ALL_ALL

    if main_filter == 'following'
      if sub_filter == 'unread'
        id = FILTER_FOLLOWING_UNREAD
      else
        id = FILTER_FOLLOWING_ALL
      end
    elsif main_filter == 'tome'
      if sub_filter == 'unread'
        id = FILTER_TOME_UNREAD
      else
        id = FILTER_TOME_ALL
      end
    elsif main_filter == 'mypost'
      if sub_filter == 'unread'
        id = FILTER_MYPOST_UNREAD
      else
        id = FILTER_MYPOST_ALL
      end

    # Skip some parts of content
    # ...
    
    elsif main_filter == 'group'
      if sub_filter == 'unread'
        id = FILTER_GROUP_UNREAD
      else
        id = FILTER_GROUP_ALL
      end
    elsif main_filter == 'user'
      if sub_filter == 'unread'
        id = FILTER_USER_UNREAD
      else
        id = FILTER_USER_ALL
      end
    elsif main_filter == 'search'
      id = FILTER_SEARCH_ALL
    else
      if sub_filter == 'unread'
        id = FILTER_ALL_UNREAD
      else
        id = FILTER_ALL_ALL
      end
    end

    id
  end

  def conversations_by_filter(user, network, main_filter, sub_filter, older_than_utc_datetime_str, options = nil)
    filter_id = FeedsHelper.filter_id(main_filter, sub_filter)
    datetimeFilter = _conversations_datatime_filter(older_than_utc_datetime_str, options)

    if main_filter == "group"
      group = options[:group]
    elsif main_filter == "user"
      whom = options[:user]
    end

    # construct groups filter #
    groups_filter = ''
    groups_filter_list = []      
    
    # get the public groups in the network
    network_public_groups_ids_list = ''

    network.groups.where(:open_flag => true).each do |_group|
      network_public_groups_ids_list += "," + _group.id.to_s
    end
    network_public_groups_ids_list = network_public_groups_ids_list.from(1)
    if network_public_groups_ids_list
      groups_filter_list << "groups.id in (" + network_public_groups_ids_list + ")"
    end

    # get the private groups that user joined
    user_private_groups_ids_list = ''

    user.groups.where(:open_flag => false).each do |_group|
      user_private_groups_ids_list += "," + _group.id.to_s
    end
    user_private_groups_ids_list = user_private_groups_ids_list.from(1)
    if user_private_groups_ids_list
      groups_filter_list << "groups.id in (" + user_private_groups_ids_list + ")"
    end

    if groups_filter_list.length == 2
      groups_filter = groups_filter_list[0] + " OR " + groups_filter_list[1]
    elsif groups_filter_list.length == 1
      groups_filter = groups_filter_list[0]
    end
    # end #

    case filter_id
    when FILTER_ALL_ALL
      network.conversations.includes(:main_post, :posts, :group_receivers)
                           .joins('INNER JOIN `users` ON `users`.`id` = `conversations`.`user_id`')
                           .joins(:conversation_group_receivers)
                           .joins("LEFT JOIN groups on groups.id = conversation_group_receivers.group_id")
                           .where(groups_filter)
                           .where(datetimeFilter)
                           .where('conversations.private_flag = ?', false)
                           .order('updated_at DESC')
    when FILTER_ALL_UNREAD     
      network.conversations.includes(:main_post, :posts, :group_receivers)
                           .joins("CROSS JOIN users")
                           .joins("LEFT JOIN messages on messages.conversation_id = conversations.id AND messages.user_id = users.id")
                           .joins(:conversation_group_receivers)
                           .joins("LEFT JOIN groups on groups.id = conversation_group_receivers.group_id")
                           .where(groups_filter)
                           .where(datetimeFilter)
                           .where('conversations.private_flag = ?', false)
                           .where("(messages.user_id=#{user.id} AND messages.read_flag=false) OR (users.id=#{user.id} AND messages.id IS NULL)")
                           .order('updated_at DESC')
    when FILTER_FOLLOWING_ALL
      network.conversations.joins("LEFT JOIN followings ON conversations.user_id = followings.followed_id")
                           .joins("LEFT JOIN conversation_receivers ON conversations.id = conversation_receivers.conversation_id")
                           .joins("LEFT JOIN messages on messages.conversation_id = conversations.id")
                           .joins("LEFT JOIN conversation_group_receivers ON conversations.id = conversation_group_receivers.conversation_id")
                           .joins("LEFT JOIN groups on groups.id = conversation_group_receivers.group_id")
                           .where("conversations.user_id = :user_id " +
                                  "OR (followings.follower_id = :user_id) " +
                                  "OR (conversation_receivers.user_id = :user_id) " +
                                  "OR (messages.user_id = :user_id) " +
                                  "OR (conversation_group_receivers.group_id in (SELECT group_users.group_id FROM group_users WHERE group_users.user_id = :user_id))", { user_id: user.id })
                           .where("conversations.private_flag = ?", false)
                           .where(groups_filter)
                           .where(datetimeFilter)
                           .order('updated_at DESC')                           
                           .distinct
    when FILTER_FOLLOWING_UNREAD
      network.conversations.joins("CROSS JOIN users")
                           .joins("LEFT JOIN followings ON conversations.user_id = followings.followed_id")
                           .joins("LEFT JOIN conversation_receivers ON conversations.id = conversation_receivers.conversation_id")
                           .joins("LEFT JOIN messages on messages.conversation_id = conversations.id AND messages.user_id = users.id")
                           .joins("LEFT JOIN conversation_group_receivers ON conversations.id = conversation_group_receivers.conversation_id")
                           .joins("LEFT JOIN groups on groups.id = conversation_group_receivers.group_id")
                           .where("conversations.user_id = :user_id " +
                                  "OR (followings.follower_id = :user_id) " +
                                  "OR (conversation_receivers.user_id = :user_id) " +
                                  "OR (messages.user_id = :user_id) " +
                                  "OR (conversation_group_receivers.group_id in (SELECT group_users.group_id FROM group_users WHERE group_users.user_id = :user_id))", { user_id: user.id })
                           .where("conversations.private_flag = ?", false)
                           .where("(messages.user_id=#{user.id} AND messages.read_flag=false) OR (users.id=#{user.id} AND messages.id IS NULL)")
                           .where(groups_filter)                           
                           .where(datetimeFilter)
                           .order('updated_at DESC')
                           .distinct
    when FILTER_TOME_ALL
      network.conversations.includes(:main_post, :posts, :group_receivers)
                           .joins(:conversation_receivers)
                           .where("conversation_receivers.user_id = ?", user.id)
                           .where(datetimeFilter)
                           .order('updated_at DESC')
                           .distinct
    when FILTER_TOME_UNREAD      
      network.conversations.includes(:main_post, :posts, :group_receivers)
                           .joins(:conversation_receivers)
                           .joins("INNER JOIN messages ON messages.conversation_id = conversations.id AND messages.user_id = conversation_receivers.user_id")
                           .where("conversation_receivers.user_id = ?", user.id)
                           .where("messages.read_flag = false")
                           .where(datetimeFilter)
                           .order('updated_at DESC')
                           .distinct
    when FILTER_MYPOST_ALL
      network.conversations.includes(:main_post, :posts, :group_receivers)
                           .joins(:conversation_chatters)
                           .where("conversation_chatters.user_id = ?", user.id)
                           .where(datetimeFilter)
                           .order('updated_at DESC')
    when FILTER_MYPOST_UNREAD
      network.conversations.includes(:main_post, :posts, :group_receivers)
                           .joins(:conversation_chatters)
                           .joins("INNER JOIN messages ON messages.conversation_id = conversation_chatters.conversation_id AND messages.user_id = conversation_chatters.user_id")
                           .where("conversation_chatters.user_id = ?", user.id)
                           .where("messages.read_flag = false")
                           .where(datetimeFilter)
                           .order('updated_at DESC')
    when FILTER_PINNED_ALL      
      datetimeFilter = _messages_datatime_filter(older_than_utc_datetime_str, options)
      network.conversations.includes(:main_post, :posts, :group_receivers)
                           .joins("INNER JOIN messages ON messages.conversation_id = conversations.id AND messages.user_id = #{user.id}")
                           .where("messages.pin_type_id > 0")
                           .where(datetimeFilter)
                           .order("messages.updated_at DESC")
                           .distinct
    when FILTER_PINNED_UNREAD
      datetimeFilter = _messages_datatime_filter(older_than_utc_datetime_str, options)
      network.conversations.includes(:main_post, :posts, :group_receivers)
                           .joins("INNER JOIN messages ON messages.conversation_id = conversations.id AND messages.user_id = #{user.id}")
                           .where("messages.pin_type_id > 0 AND messages.read_flag = false")
                           .where(datetimeFilter)
                           .order("messages.updated_at DESC")
                           .distinct
    when FILTER_GROUP_ALL
      group.conversations.includes(:main_post, :posts, :group_receivers)
                         .where('conversations.private_flag = ?', false)
                         .where(datetimeFilter)                         
                         .order('updated_at DESC')
    when FILTER_GROUP_UNREAD
      group.conversations.includes(:main_post, :posts, :group_receivers)
                         .joins("CROSS JOIN users")
                         .joins("LEFT JOIN messages on messages.conversation_id = conversations.id AND messages.user_id = users.id")
                         .where('conversations.private_flag = ?', false)
                         .where("(messages.user_id=#{user.id} AND messages.read_flag=false) OR (users.id=#{user.id} AND messages.id IS NULL)")
                         .where(datetimeFilter)
                         .order('updated_at DESC')
    when FILTER_USER_ALL
      # TODO caused by obsoleted conversations_joined method
      conversations = whom.conversations_joined
                          .includes(:main_post, :posts, :group_receivers)
                          .joins('INNER JOIN `users` ON `users`.`id` = `conversations`.`user_id`')
                          .joins('INNER JOIN `network_users` ON `users`.`id` = `network_users`.`user_id` AND `network_users`.`network_id` = ' + network.id.to_s)
                          .where(datetimeFilter)
                          .where('conversations.private_flag = ?', false)
                          .order('conversations.updated_at DESC')
    when FILTER_USER_UNREAD
      # TODO caused by obsoleted conversations_joined method
      conversations = whom.conversations_joined
                          .includes(:main_post, :posts, :group_receivers)
                          .joins(:messages)
                          .joins('INNER JOIN `users` ON `users`.`id` = `conversations`.`user_id`')
                          .joins('INNER JOIN `network_users` ON `users`.`id` = `network_users`.`user_id` AND `network_users`.`network_id` = ' + network.id.to_s)
                          .where('messages.user_id=' + user.id.to_s + ' AND messages.read_flag=false')
                          .where(datetimeFilter)
                          .where('conversations.private_flag = ?', false)
                          .order('conversations.updated_at DESC')
    when FILTER_SEARCH_ALL
      if options[:search_page].to_i <= 0
        conversations = ThinkingSphinx.search(Riddle.escape(options[:search_keyword]), classes: [Conversation], star: false, :with => { :network_id => network.id }, :order => 'updated_at DESC', :sql => {:include => :main_post})
      else
        conversations = ThinkingSphinx.search(Riddle.escape(options[:search_keyword]), classes: [Conversation], star: false, :page => options[:search_page], :per_page => options[:search_per_page], :with => { :network_id => network.id }, :order => 'updated_at DESC', :sql => {:include => :main_post})
      end      
    else
      network.conversations.includes(:main_post, :posts, :group_receivers)
                           .joins('INNER JOIN `users` ON `users`.`id` = `conversations`.`user_id`')
                           .where(datetimeFilter)
                           .where('users.remove_flag = ?', false)
                           .where('conversations.private_flag = ?', false)
                           .where('conversations.remove_flag = ?', false)
                           .order('updated_at DESC')
    end

  end

  private

  def _conversations_datatime_filter(older_than_utc_datetime_str, options)
    conversation_datetimeFilter = ''
    unless older_than_utc_datetime_str.blank?
      if options[:is_for_older_than] == 'true'
        conversation_datetimeFilter = 'conversations.updated_at < "' + older_than_utc_datetime_str + '"'
      else
        conversation_datetimeFilter = 'conversations.updated_at > "' + older_than_utc_datetime_str + '"'
      end
    end

    conversation_datetimeFilter
  end

  # Skip some parts of content
  # ...

end
