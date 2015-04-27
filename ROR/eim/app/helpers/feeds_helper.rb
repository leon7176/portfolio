module FeedsHelper

  FILTER_ALL_ALL = 0
  FILTER_ALL_UNREAD = 1

  # Skip some part of content
  # ...
  
  FILTER_SEARCH_ALL = 14

  def self.filter_id(main_filter, sub_filter)
    id = FILTER_ALL_ALL

    if main_filter == 'following'
      if sub_filter == 'unread'
        id = FILTER_FOLLOWING_UNREAD
      else
        id = FILTER_FOLLOWING_ALL
      end    

    # Skip some parts of content
    # ...
        
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

    # Skip some part of content
    # ...

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

    # Skip some part of content
    # ...
    
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
