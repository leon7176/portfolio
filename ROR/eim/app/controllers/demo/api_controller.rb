class Demo::ApiController < ApplicationController
	before_action :signed_in_user

  def users
    json = {
      list: [],
      infos: Set.new
    }

    group = (params[:group_id].length > 0) ? Group.find(params[:group_id]) : nil

    main_filter_type = params[:main_filter_type] || 'all'
    older_than = params[:older_than] || nil
    options = params[:options] || nil
    size = params[:size] ? params[:size].to_i : 10

    is_for_older_than = options.nil? ? 'true' : (options['is_for_older_than'] || 'true')

    older_than_datetime_str = ''
    if params[:older_than]
      if group
        older_than_group_user = GroupUser.where(group_id: group.id, user_id: params[:older_than]).first
        older_than_datetime_str = older_than_group_user.nil? ? Time.now.utc.to_s : older_than_group_user.updated_at.utc.to_s
      else
        older_than_user = User.where(id: params[:older_than]).first
        older_than_datetime_str = older_than_user.nil? ? Time.now.utc.to_s : older_than_user.updated_at.utc.to_s
      end
    else
      older_than_datetime_str = Time.now.utc.to_s
    end

    case main_filter_type
    when "search"
      search_keyword = options['search_keyword'] || ''
      search_page = options['search_page'] || -1
      search_per_page = options['search_per_page'] || 10
      @options = {
        :search_keyword => search_keyword,
        :search_page => search_page,
        :search_per_page => search_per_page
      }
      users = users_by_filter(current_user, current_network, group, main_filter_type, older_than_datetime_str, @options)
    when "group"
      is_pending = options['is_pending'] || false
      @options = {
        :is_pending => is_pending,
        :is_for_older_than => is_for_older_than,
      }
      users = users_by_filter(current_user, current_network, group, main_filter_type, older_than_datetime_str, @options)
    when "all"
      is_inviting = options['is_inviting'] || false
      @options = {
        :is_inviting => is_inviting,
        :is_for_older_than => is_for_older_than,
      }
      users = users_by_filter(current_user, current_network, group, main_filter_type, older_than_datetime_str, @options)
    else
      @options = {
        :is_for_older_than => is_for_older_than,
      }
      users = users_by_filter(current_user, current_network, group, main_filter_type, older_than_datetime_str, @options)
    end

    users.each do |user|
      json[:list] << user.id
      json[:infos] << user.to_info(current_user)
    end

    respond_to do |format|
      format.json { render :json => json }
    end
  end

  # Skip some parts of content
  # ...

	def networks
    json = {
      list: [],
      infos: Set.new
    }

		current_user.networks.each do |network|
      json[:list] << network.id
      json[:infos] << network.to_info(current_user)
    end

		respond_to do |format|
			format.json { render :json => json }
		end
	end

	def feeds
		json = {
			list: [],
			infos: Set.new
		}

    feed_filter_type = params[:feed_filter_type] || 'following'
    unread_filter_type = params[:unread_filter_type] || 'all'
    older_than = params[:older_than] || nil
    options = params[:options] || nil
    size = params[:size] ? params[:size].to_i : 10

    is_for_older_than = options.nil? ? 'true' : (options['is_for_older_than'] || 'true')

    # determine datetime string
    older_than_datetime_str = ''
    if params[:older_than].nil? || params[:older_than] == ''
      if is_for_older_than == 'true'
        older_than_datetime_str = Time.now.utc.to_s
      elsif is_for_older_than == 'false'
        older_than_conversation = Conversation.order("updated_at ASC").last
      end
    else
      older_than_conversation = Conversation.find(params[:older_than])
      older_than_datetime_str = older_than_conversation.nil? ? Time.now.utc.to_s : older_than_conversation.updated_at.utc.to_s
    end

    case feed_filter_type
    when "group"
      group = (params[:belong_id].length > 0) ? Group.find(params[:belong_id]) : nil

      if group.open_flag || group.has_user?(current_user)
        @options = {
          :is_for_older_than => is_for_older_than,
          :group => group
        }
        conversations = conversations_by_filter(current_user, current_network, feed_filter_type, unread_filter_type, older_than_datetime_str, @options).take(size)
      end

    when "user"

      user = (params[:belong_id].length > 0) ? User.find(params[:belong_id]) : nil
      @options = {
        :is_for_older_than => is_for_older_than,
        :user => user
      }
      conversations = conversations_by_filter(current_user, current_network, feed_filter_type, unread_filter_type, older_than_datetime_str, @options).take(size)

    when "search"
      search_keyword = options['search_keyword'] || ''
      search_page = options['search_page'] || -1
      search_per_page = options['search_per_page'] || 10
      @options = {
        :search_keyword => search_keyword,
        :search_page => search_page,
        :search_per_page => search_per_page
      }
      conversations = conversations_by_filter(current_user, current_network, feed_filter_type, unread_filter_type,
        older_than_datetime_str, @options)

    else
      @options = {
        :is_for_older_than => is_for_older_than,
      }
      conversations = conversations_by_filter(current_user, current_network, feed_filter_type, unread_filter_type,
        older_than_datetime_str, @options).take(size)
    end

    if conversations
      conversations.each do |conversation|
        json[:list] << conversation.id
        json[:infos] << conversation.to_info(current_user)
      end
    end

    respond_to do |format|
			format.json { render :json => json }
		end
	end

  def unread_feeds_count
    json = {
      list: [],
      infos: Set.new,
      unreadCount: 0
    }

    feed_filter_type = params[:feed_filter_type]

    case feed_filter_type
    when "group"
      current_user.groups.each do |group|
        group_info = group.to_info(current_user, params)        
        json[:list] << group.id
        json[:infos] << group_info
        json[:unreadCount] += group_info[:unreadCount]
      end
    when "network"
      current_user.networks.each do |network|
        network_info = network.to_info(current_user)
        json[:list] << network.id
        json[:infos] << network_info
        json[:unreadCount] += network_info[:unreadCount]
      end
    when "tome"
      json[:unreadCount] = current_user.tome_unread_feeds_count(current_network_id)
    when "pinned"
      json[:unreadCount] = current_user.pinned_unread_feeds_count(current_network_id)
    end

    respond_to do |format|
      format.json { render :json => json }
    end
  end

  # Skip some parts of content
  # ...  

  # Search API
  def searches_users
    response = []
    keyword = params[:q] || ''
    attribute_filters = { :network_id => current_network_id }

    results = ThinkingSphinx.search(Riddle.escape(keyword), classes: [User], star: true, :with => attribute_filters)

    results.each do |result|
      response << { id: result.id, name: result.name, avatar: profile_photo(result) }
    end

    respond_to do |format|
        format.json { render :json => response }
    end
  end

  # Skip some parts of content
  # ...

end
