module Demo::UsersHelper
	FILTER_ALL = 0
	FILTER_FOLLOWING = 1
  FILTER_GROUP = 2
  FILTER_SEARCH = 3

  def self.filter_id(main_filter)
    id = FILTER_ALL

    if main_filter == 'following'
      id = FILTER_FOLLOWING
    elsif main_filter == 'group'
      id = FILTER_GROUP
    elsif main_filter == 'search'
    	id = FILTER_SEARCH
    end

    id
  end

  def users_by_filter(user, network, group, main_filter, older_than_utc_datetime_str, options = nil)
    filter_id = UsersHelper.filter_id(main_filter)

    datetimeFilter = ''

    unless older_than_utc_datetime_str.blank?
    	if group
        if options[:is_pending] == 'true'
          if options[:is_for_older_than] == 'true'
            datetimeFilter = 'join_group_requests.updated_at < "' + older_than_utc_datetime_str + '"'
          else
            datetimeFilter = 'join_group_requests.updated_at > "' + older_than_utc_datetime_str + '"'
          end
        else
          if options[:is_for_older_than] == 'true'
            datetimeFilter = 'group_users.updated_at < "' + older_than_utc_datetime_str + '"'
          else
            datetimeFilter = 'group_users.updated_at > "' + older_than_utc_datetime_str + '"'
          end
        end    		
    	else
    		if options[:is_for_older_than] == 'true'
	        datetimeFilter = 'users.updated_at < "' + older_than_utc_datetime_str + '"'
	      else
	        datetimeFilter = 'users.updated_at > "' + older_than_utc_datetime_str + '"'
	      end
    	end
    end

    case filter_id
    when FILTER_ALL
    	if options[:is_inviting] == 'true'
    		Network.inviting_users
    					 .where(datetimeFilter)
	    				 .order("users.updated_at DESC")
    	else
    		network.users
	    				 .where(:remove_flag => false)
	    				 .where(datetimeFilter)
	    				 .order("users.updated_at DESC")
    	end    	
    when FILTER_FOLLOWING
    	user.followed_users.joins(:network_users)
    										 .where('network_users.network_id=' + network.id.to_s + '')
    										 .where(datetimeFilter)
    										 .order("users.updated_at DESC")
    when FILTER_GROUP
    	if group
        if options[:is_pending] == 'true'
          group.pending_join_requesters
               .where(datetimeFilter)
               .order("users.updated_at DESC")
        else
          group.users
               .where(datetimeFilter)
               .order("users.updated_at DESC")
        end    		
    	end
    when FILTER_SEARCH
    	if options[:search_page].to_i <= 0
    		ThinkingSphinx.search(Riddle.escape(options[:search_keyword]), classes: [User], star: false, :with => { :network_id => network.id }, :order => 'full_name ASC')
    	else
    		ThinkingSphinx.search(Riddle.escape(options[:search_keyword]), classes: [User], star: false, :page => options[:search_page], :per_page => options[:search_per_page], :with => { :network_id => network.id }, :order => 'full_name ASC')
    	end      
    end
  end

  def profile_photo(user)
		if user.photo?
			ActionController::Base.helpers.asset_path "#{user.photo.store_dir}/#{user.photo_identifier}"
		else
			ActionController::Base.helpers.asset_path "default_profile.jpg"
		end
	end

	def profile_photo_thumb(user)
		if user.photo?
			ActionController::Base.helpers.asset_path "#{user.photo.store_dir}/thumb_#{user.photo_identifier}"
		else
			ActionController::Base.helpers.asset_path "default_profile.jpg"
		end
	end

	def imtype_options
		ImType.all.map { |i| [i.name, i.id]}
	end

	def roletype_options
		Role.all.map { |i| [i.name, i.id]}
	end

	def user_options
		User.where(:active_flag => true, :remove_flag => false).map { |i| [i.name, i.id]}
	end	
end
