module GroupsHelper

  FILTER_ALL = 0
  FILTER_MINE = 1
  FILTER_USER = 2
  FILTER_SEARCH = 3

  SORT_BY_NAME = 0
  SORT_BY_MEMBER = 1

	def self.filter_id(main_filter)
    id = FILTER_ALL

    if main_filter == 'mine'
      id = FILTER_MINE
    elsif main_filter == 'user'
      id = FILTER_USER
    elsif main_filter == 'search'
      id = FILTER_SEARCH
    end

    id
  end

  def self.sort_by_id(sort_by)
    id = SORT_BY_NAME

    if sort_by == 'member'
      id = SORT_BY_MEMBER
    end

    id
  end

  def groups_by_filter(user, network, main_filter, older_than_utc_datetime_str, options = nil)
	
		filter_id = GroupsHelper.filter_id(main_filter)
    sort_by_id = GroupsHelper.sort_by_id(options[:sort_by])

    datetimeFilter = ''
    unless older_than_utc_datetime_str.blank?
      if options[:is_for_older_than] == 'true'
        datetimeFilter = 'groups.updated_at <= "' + older_than_utc_datetime_str + '"'
      else
        datetimeFilter = 'groups.updated_at > "' + older_than_utc_datetime_str + '"'
      end
    end

    order = 'DESC'
    if options[:reverse] == 'false'
      order = 'ASC'
    end

		case filter_id
    when FILTER_ALL
      case sort_by_id
      when SORT_BY_NAME
        current_network.not_default_groups.joins("LEFT JOIN group_users ON group_users.group_id = groups.id")
                                          .where("(groups.list_in_directory_flag = true) OR (group_users.user_id = :user_id)", { user_id: user.id })
                                          .where(datetimeFilter)
                                          .order("groups.name #{order}").distinct
      when SORT_BY_MEMBER
        current_network.not_default_groups.joins("LEFT JOIN group_users ON group_users.group_id = groups.id")
                                        .group("groups.id")
                                        .where("(groups.list_in_directory_flag = true) OR (group_users.user_id = :user_id)", { user_id: user.id })
                                        .where(datetimeFilter)
                                        .order("count(*) #{order}, group_users.created_at Desc")
      end
    when FILTER_MINE
      case sort_by_id
      when SORT_BY_NAME
        current_user.groups_by_network(current_network).where(datetimeFilter)
                                                       .order("groups.name #{order}")
      when SORT_BY_MEMBER
        my_groups = []
        groups = current_network.not_default_groups
                                .joins("LEFT JOIN group_users ON group_users.group_id = groups.id")
                                .group("groups.id")
                                .where(datetimeFilter)
                                .order("count(*) #{order}, group_users.created_at Desc")
        groups.each do |group|
          if group.has_user?(user)
            my_groups << group
          end
        end

        my_groups
      end
    when FILTER_USER
      case sort_by_id
      when SORT_BY_NAME
        # TODO
      when SORT_BY_MEMBER
        # TODO
      end

    when FILTER_SEARCH
      if options[:search_page].to_i <= 0
        ThinkingSphinx.search(Riddle.escape(options[:search_keyword]), classes: [Group], star: false, :with => { :network_id => network.id }, :order => 'name ASC')
      else
        ThinkingSphinx.search(Riddle.escape(options[:search_keyword]), classes: [Group], star: false, :page => options[:search_page], :per_page => options[:search_per_page], :with => { :network_id => network.id }, :order => 'name ASC')
      end
    end

	end

end
