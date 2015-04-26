module Demo::PostsHelper

  def create_post(params)
    conversation_id = params[:conversation_id]
    @private_flag = params[:private_flag] == "true" ? true : false
    @conversation = nil

    if conversation_id.to_i == 0
      conv_attrs = { network_id: current_network.id, private_flag: @private_flag, user_id: current_user.id }
      @conversation = Conversation.create!(conv_attrs)
      conversation_id = @conversation.id
    else
      @conversation = Conversation.find(conversation_id)
      @conversation.touch
    end

    # Parse the input values of the post form
    @values = {}
    ActiveSupport::JSON.decode(params[:values]).each do |key, value|
      @values[key.to_sym] = value
    end

    # Create post
    @post = current_user.posts.build(post_attributes(conversation_id))
    @post.save!

    # Create content
    case @post.post_type_id
    when PostType.normal_post_type_id
      # do nothing

    when PostType.event_post_type_id
      attributes = @values
      attributes[:post_id] = @post.id
      @event = create_event(attributes)

    when PostType.poll_post_type_id
      @poll = Poll.create!(post_id: @post.id, title: @values[:title], multi_flag: false)
      @values[:options].each do |option|
        @poll.poll_options.create!(option: option)
      end

    when PostType.task_post_type_id
      attributes = @values
      attributes[:post_id] = @post.id
      @task = create_task(attributes)

    when PostType.share_post_type_id
      shared_post = Post.find(@values[:post_id])
      sharing_id = shared_post.conversation.id
      shared_id = @conversation.id
      @conversation_share = ConversationShare.create!(sharing_id: sharing_id, shared_id: shared_id, post_id: shared_post.id)
    end

    # Create attached files
    unless params[:upload_file].nil?
      create_post_files
    end

    # Setup topics
    # unless params[:topic_hint_normal].nil?
    #   setup_topics
    # end

    # Create poster message
    current_user.create_or_update_message(conversation_id, true)
    current_user.add_conversation_chatter(conversation_id)

    # Setup receiver
    if params[:conversation_id].to_i == 0
      setup_conversation_group_receiver
      setup_conversation_receiver
    else
      setup_post_receiver
    end

    # Return post.id
    @post.id
  end

  def update_post(params)
    logger.debug("========================#{params.inspect}")
    @values = {}
    ActiveSupport::JSON.decode(params[:values]).each do |key, value|
      @values[key.to_sym] = value
    end

    case params[:post_type_id].to_i
    when PostType.normal_post_type_id
      @post = Post.find(params[:id])
    when PostType.event_post_type_id
      @event = Event.find(params[:id])
      @post = @event.post
    when PostType.poll_post_type_id
      @poll = Poll.find(params[:id])
      @post = @poll.post
    when PostType.task_post_type_id
      @task = Task.find(params[:id])
      @post = @task.post
    end

    @conversation = @post.conversation
    @conversation.touch
    @private_flag = params[:private_flag] == "true" ? true : false
    conv_attrs = { private_flag: @private_flag }
    @conversation.update_attributes!(conv_attrs)

    #update post
    @post.update_attributes(update_post_attributes)

    # update content
    case @post.post_type_id
    when PostType.normal_post_type_id
      # do nothing
    when PostType.event_post_type_id
      attributes = @values
      @event = update_event(attributes)
    when PostType.poll_post_type_id
      # TODO
    when PostType.task_post_type_id
      attributes = @values
      @task = update_task(attributes)
    when PostType.share_post_type_id
      # TODO
    end

    # update files
    # TODO

    # Create poster message
    current_user.create_or_update_message(@conversation.id, true)
    current_user.add_conversation_chatter(@conversation.id)

    # Setup receiver
    if @post.id == @conversation.main_post.id
      @conversation.conversation_receivers.destroy_all
      setup_conversation_receiver
    else
      @post.post_receivers.destroy_all
      setup_post_receiver
    end

    # Return post.id
    @post.id
  end

private

  def task_params
    params.require(:task).permit(:due_date)
  end

  def post_attributes(conversation_id)
    attributes = { :post_type_id => params[:post_type_id],
                   :network_id => current_network.id,
                   :conversation_id => conversation_id,
                   :reply_to => params[:reply_to] != 0 ? params[:reply_to] : '0' ,
                   :content => @values[:content].nil? ? 'nil' : @values[:content] }
  end

  def update_post_attributes
  	attributes = { :content => @values[:content].nil? ? 'nil' : @values[:content] }
  end

  def create_event(attributes)
    @event = Event.create!(attributes)
    setup_event_related_group(attributes)
    setup_event_participant(attributes)
    #Return event
    @event
  end

  def update_event(attributes)
    # logger.debug("========================#{attributes.inspect}")
    @event.update_attributes!(attributes)

    # setup event's participant
    @event.event_participants.destroy_all if @event.event_participants
    setup_event_participant(attributes)

    #Return event
    @event
  end

  def create_task(attributes)
    @task = Task.new(task_params)
    @task.description = attributes[:task_description]
    @task.notes = attributes[:task_notes]
    @task.priority = attributes[:task_priority]
    @task.user_id = current_user.id
    @task.post_id = @post.id
    @task.start_date = Time.now.to_date
    @task.task_type_id = TaskType.not_specified_task_type_id
    @task.task_status_id = TaskStatus.created_task_status_id
    # @task.task_recurrence_flag = attributes[:task_recurrence_pattern_id].to_i > 0 ? "true" : "false"

    if @task.save!
      setup_task_owner(attributes)
      setup_task_reviewer(attributes)
      # if attributes[:task_recurrence_pattern_id].to_i > 0
      #   setup_task_recurrence(attributes)
      # end
    end

    # Return task
    @task
  end

  def update_task(attributes)
    logger.debug("========================#{attributes.inspect}")
    @task.update_attributes!(task_params)
    @task.description = attributes[:task_description]
    @task.notes = attributes[:task_notes]
    @task.priority = attributes[:task_priority]
    @task.task_type_id = TaskType.not_specified_task_type_id

    if @task.save!
      @task.task_owners.destroy_all if @task.task_owners
      setup_task_owner(attributes)

      @task.task_reviewers.destroy_all if @task.task_reviewers
      setup_task_reviewer(attributes)

      # @task.task_recurrence.destroy_all if @task.task_recurrence
      # if attributes[:task_recurrence_pattern_id].to_i > 0
      #   setup_task_recurrence(attributes)
      # end
    end

    #Return task
    @task
  end

  def create_post_files
    files = params[:upload_file]
    file_keys = files.keys.grep /^fileapi/
    file_keys.each do |file_key|
      group_id = current_group_id
      if params[:group_hint_normal] && params[:group_hint_normal] != ""
        group_id_list = params[:group_hint_normal].split(',')
        if group_id_list.length > 0
          group_id = group_id_list[0]
        end
      elsif params[:private_flag] && params[:private_flag] == "true"
        group_id = nil
      end
      # TOFIX neet to set the file to be private if the post is private
      upload_file_id = create_upload_files(files[file_key], current_user.id, group_id, current_network.id)
      @upload_file = UploadFile.find upload_file_id

      @post.add_post_file upload_file_id
    end
  end

  def setup_topics
    # add topics
    params[:topic_hint_normal].split(',').each { |topic_id| @conversation.add_topic(topic_id, current_user.id) }
    # create topics
    params[:topic_hint_append].split(',').each do |topic_name|
      unless Topic.exists?( {name: topic_name, network_id: current_network_id} )
        topic = Topic.create!( {name: topic_name, network_id: current_network_id} )
      end
      @conversation.add_topic(topic.id, current_user.id)
    end
  end

  def setup_conversation_group_receiver
    unless @private_flag
      group_receivers = params[:group_hint_normal] ? params[:group_hint_normal].split(',') : [current_group_id.to_s]
      group_receivers.each do |group_id|
        group = Group.find group_id
        unless group.open_flag || group.has_user?(current_user)
          raise "#{current_user.name} is not the #{group.name} group member."
        end
      end

      @conversation.add_group_receivers(group_receivers)
    end
  end

  def setup_conversation_receiver
    # Set the assigned person receiver
    unless params[:person_hint_normal].nil?
      @conversation.add_receivers(params[:person_hint_normal].split(','), @post.id)
    end
  end

  def setup_post_receiver
    # if params[:reply_to] != 0
    #   reply_post = Post.find(params[:reply_to])
    #   reply_post.user.create_or_update_message(reply_post.conversation.id, false) if reply_post
    # end

    # Set the assigned person receiver for post
    unless params[:person_hint_normal].nil?
      @post.add_receivers(params[:person_hint_normal].split(','))
    end
  end

  def update_topics(params)
    @post = Post.find(params[:post_id])

    conversation = @post.conversation

    old_topics = Set.new; new_topics = Set.new;
    to_delete = Set.new; to_add = Set.new;

    conversation.topics.each { |topic| old_topics << topic.id }

    unless params[:topic_hint_normal].nil?
      params[:topic_hint_normal].each { |topic_id| new_topics << topic_id.to_i }
    end

    new_topics.each { |topic_id| to_add << topic_id unless old_topics.include? topic_id }
    old_topics.each { |topic_id| to_delete << topic_id unless new_topics.include? topic_id }

    # add topics
    to_add.each { |topic_id| conversation.add_topic(topic_id, current_user.id) }
    # delete topics
    to_delete.each { |topic_id| conversation.delete_topic(topic_id) }

    # create topics
    unless params[:topic_hint_append].nil?
      params[:topic_hint_append].each do |topic_name|
        unless Topic.exists?( {name: topic_name, network_id: current_network_id} )
          topic = Topic.create!( {name: topic_name, network_id: current_network_id} )
        end
        conversation.add_topic(topic.id, current_user.id)
      end
    end
  end

  def setup_event_related_group(attributes)
    if params[:group_hint_normal] == ""
      # Add the default group to be related group
      if attributes[:private_flag] == "false"
        @event.add_related_group([current_group_id.to_s], current_user.id)
      end
    else
      # Add the assigned group to be related group
      @event.add_related_group(params[:group_hint_normal].split(','), current_user.id)
    end
  end

  def setup_event_participant(attributes)
    # Add the assigned participant
    @event.add_participant(params[:participants_hint_normal].split(','), current_user.id)
  end

  def setup_task_owner(attributes)
    # Add the assigned owner
    @task.add_owner(params[:owner_hint_normal].split(','), current_user.id)
  end

  def setup_task_reviewer(attributes)
    # Add the assigned reviewer
    @task.add_reviewer(params[:reviewer_hint_normal].split(','), current_user.id)
  end

  def setup_task_recurrence(attributes)
    @task.add_task_recurrence(attributes[:task_recurrence_pattern_id])
  end
end