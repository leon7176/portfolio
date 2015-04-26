module Demo::EventsHelper
	FILTER_ALL = 0
  FILTER_GROUP = 1
  FILTER_RELATED = 2
  FILTER_UPDATED = 3
  FILTER_FOLLOWING = 4
  FILTER_SEARCH = 5

  TYPE_MONTH = 0
  TYPE_WEEK = 1
  TYPE_YEAR = 2


  def self.filter_id(main_filter)
    id = FILTER_ALL

    if main_filter == 'group'
      id = FILTER_GROUP
    elsif main_filter == 'related'
      id = FILTER_RELATED
    elsif main_filter == 'updated'
      id = FILTER_UPDATED
    elsif main_filter == 'following'
      id = FILTER_FOLLOWING
    elsif main_filter == 'search'
      id = FILTER_SEARCH
    end

    id
  end

  def self.type_id(view_type)
    id = TYPE_YEAR

    if view_type == 'month'
      id = TYPE_MONTH
    elsif view_type == 'week'
      id = TYPE_WEEK
    end

    id
  end

  def events_by_filter(user, network, group, main_filter, view_type, older_than_utc_datetime_str, options = nil)
    filter_id = Demo::EventsHelper.filter_id(main_filter)
    filter_type_id = Demo::EventsHelper.type_id(view_type)

    datetimeFilter = ''
    # unless older_than_utc_datetime_str.blank?
    #   if options[:is_for_older_than] == 'true'
    #     datetimeFilter = 'events.updated_at < "' + older_than_utc_datetime_str + '"'
    #   else
    #     datetimeFilter = 'events.updated_at > "' + older_than_utc_datetime_str + '"'
    #   end
    # end

    case filter_type_id
		when TYPE_MONTH
			target_date = Time.zone.local(options[:target_year], options[:target_month], 1)
			beginning_of_month_date = target_date.beginning_of_month.utc.to_s
			end_of_month_date = target_date.end_of_month.utc.to_s
			datetimeFilter = "(start_date >= '#{beginning_of_month_date}' AND start_date <= '#{end_of_month_date}') OR " +
                   "(due_date >= '#{beginning_of_month_date}' AND due_date <= '#{end_of_month_date}') OR " +
                   "(start_date <= '#{beginning_of_month_date}' AND due_date >= '#{end_of_month_date}')"
		when TYPE_WEEK
			target_date = Time.zone.local(options[:target_year], options[:target_month], options[:target_day])
			beginning_of_week_date = target_date.beginning_of_week.utc.to_s
			end_of_week_date = target_date.end_of_week.utc.to_s
			datetimeFilter = "(start_date >= '#{beginning_of_week_date}' AND start_date <= '#{end_of_week_date}') OR " +
                   "(due_date >= '#{beginning_of_week_date}' AND due_date <= '#{end_of_week_date}') OR " +
                   "(start_date <= '#{beginning_of_week_date}' AND due_date >= '#{end_of_week_date}')"

		when TYPE_YEAR
			target_date = Time.zone.local(options[:target_year], 1, 1)
			beginning_of_year_date = target_date.beginning_of_year.utc.to_s
			end_of_year_date = target_date.end_of_year.utc.to_s
			datetimeFilter = "(start_date >= '#{beginning_of_year_date}' AND start_date <= '#{end_of_year_date}') OR " +
                   "(due_date >= '#{beginning_of_year_date}' AND due_date <= '#{end_of_year_date}') OR " +
                   "(start_date <= '#{beginning_of_year_date}' AND due_date >= '#{end_of_year_date}')"
		else
			unless older_than_utc_datetime_str.blank?
      if options[:is_for_older_than] == 'true'
        datetimeFilter = 'events.updated_at < "' + older_than_utc_datetime_str + '"'
      else
        datetimeFilter = 'events.updated_at > "' + older_than_utc_datetime_str + '"'
      end
    end
		end

    case filter_id
    when FILTER_ALL
      @events = Event.includes(:conversation)
                     .includes(:event_participants)
                     .where(datetimeFilter)
                     .where('conversations.remove_flag = ?', false)
                     .where('conversations.network_id = ?', network.id)
                     .where('events.private_flag = ? OR
                             conversations.user_id = ? OR
                             event_participants.participant_id = ?',
                            false, current_user.id, current_user.id)
                     .references(:conversation)
                     .references(:event_participants)
                     .distinct
                     .order("events.start_date ASC")
    when FILTER_GROUP
      @events = Event.includes(:conversation)
                     .includes(:event_related_groups)
                     .includes(:event_participants)
                     .where('event_related_groups.group_id IN (?)',
                            group.id)
                     .where(datetimeFilter)
                     .where('conversations.remove_flag = ?', false)
                     .where('events.private_flag = ? OR
                             conversations.user_id = ? OR
                             event_participants.participant_id = ?',
                            false, current_user.id, current_user.id)
                     .references(:conversation)
                     .references(:event_related_groups)
                     .references(:event_participants)
                     .distinct
                     .order("events.start_date ASC")
    when FILTER_RELATED
      @events = Event.includes(:conversation)
                     .includes(:event_participants)
                     .where('event_participants.participant_id = ?',
                            current_user.id)
                     .where(datetimeFilter)
                     .where('conversations.remove_flag = ?', false)
                     .references(:conversation)
                     .references(:event_participants)
                     .distinct
                     .order("events.start_date ASC")
  	when FILTER_UPDATED
      @events = Event.includes(:conversation)
                     .where('conversations.user_id = ?',
                            current_user.id)
                     .where(datetimeFilter)
                     .where('conversations.remove_flag = ?', false)
                     .references(:conversation)
                     .distinct
                     .order("events.start_date ASC")
  	when FILTER_FOLLOWING
  		## Query Events:
	    # 1. (OR) Current user created
	    # 2. (OR) Current user participated
	    # 3. (OR) The group which current user joined was related
	    # 4. (AND) i. Start date between the target time OR
	    #          ii. End date between the target time OR
	    #          iii. Target date between the Start date and the End date
	    # 5. (AND) The conversation of event is not removed
	    @events = Event.includes(:conversation)
	                   .includes(:event_related_groups)
	                   .includes(:event_participants)
                     .joins("LEFT JOIN conversation_receivers ON conversations.id = conversation_receivers.conversation_id")
                     .where('((event_related_groups.group_id IN (?) OR 
                             conversation_receivers.user_id = ?) AND
                             events.private_flag = ?) OR
                             conversations.user_id = ? OR
                             event_participants.participant_id = ?',
                            current_user.groups, current_user.id, false, current_user.id, current_user.id)
	                   .where(datetimeFilter)
	                   .where('conversations.remove_flag = ?', false)
	                   .references(:conversation)
	                   .references(:event_related_groups)
	                   .references(:event_participants)
                     .references(:conversation_receivers)
	                   .distinct
                     .order("events.start_date ASC")
    when FILTER_SEARCH
    end

  end
end
