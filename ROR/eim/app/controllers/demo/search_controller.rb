class Demo::SearchController < ApplicationController
	before_action :signed_in_user
	layout "DEMO/main"

  def index
    @results = nil
    @datatypes = Hash.new
    attribute_filters = { :network_id => current_network_id }

    # TODO to search Poll, Event
    @results = ThinkingSphinx.search(Riddle.escape(params[:search]), classes: [User, Group, Conversation, UploadFile, Task],
                                     star: false, :with => attribute_filters)
    @results.each do | result |
      if @datatypes[result.class.to_s.to_sym].nil?
        @datatypes[result.class.to_s.to_sym] = Array.new
        @datatypes[result.class.to_s.to_sym] << result
      else
        @datatypes[result.class.to_s.to_sym] << result
      end
    end

  end

  def self.define_search_hint (data_type)
    define_method "search_#{data_type.to_s.downcase}_hint" do
      attribute_filters = { :network_id => current_network_id }

      response = []

      keyword = params[:name_hint] || ''
      results = ThinkingSphinx.search(Riddle.escape(keyword), classes: [data_type], star: true,
                                         :with => attribute_filters, :limit => 10)
      results.each do |result|
        hint = result.to_hint
        if hint
          response.push(hint)
        # else
        #   debugger
        end        
      end

      respond_to do |format|
        format.json { render :json => response.to_json }
      end
    end
  end

  define_search_hint User
  # define_search_hint Topic
  define_search_hint Group

end
