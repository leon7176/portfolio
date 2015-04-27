class PagesController < ApplicationController
  before_action :signed_in_user
  layout "main"

  def home
    if params[:network_id]
      update_current_network_id(params[:network_id])
    end

=begin
    @url_params = params[:url_params] || Hash.new
    @url_params = @url_params.merge({:feed_type => 'following'}) unless @url_params[:feed_type]
    @url_params = @url_params.merge({:filter_type => 'all'}) unless @url_params[:filter_type]

    feed_type = @url_params[:feed_type]
    filter_type = @url_params[:filter_type]

    @conversations = conversations_by_filter(current_user, current_network, feed_type, filter_type, nil).take(10)

    @conversations.each do |conversation|
      register_conversation_info conversation
    end
=end

    # TEST with notifications -- begin
    # @notifications = current_user.notifications.take(5)
    # @notifications.each { |noti| register_notification_info noti }
    # -- end

    respond_to do |format|
        format.html { render "pages/DEMO/home", layout: "DEMO/main" }
        format.js
    end

  end

  # Skip some parts of content
  # ...

end
