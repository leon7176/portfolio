class Demo::ConversationsController < ApplicationController
	before_action :signed_in_user
	layout "DEMO/main"

	def show
		# TODO
	end

  # Conversations API
	def info
		conversation = Conversation.find params[:id]

    respond_to do |format|
			format.json { render :json => conversation.to_info(current_user) }
		end
	end

	def follow
    error = nil
    begin
      ActiveRecord::Base.transaction do
        @conversation = Conversation.find(params[:id])
        current_user.create_or_update_message(@conversation.id, false)
      end
    rescue Exception => e
      error = e.message
      puts e.message
      puts e.backtrace.inspect
    end

    response = {
      :status => error == nil ? 'OK' : 'ERROR',
      :error  => error == nil ? ''   : error,
      :data   => error == nil ? {
        :info => @conversation.to_info(current_user),
      } : {}
    }

    respond_to do |format|
        format.json { render :json => response }
    end
  end

  def unfollow
    error = nil
    begin
      ActiveRecord::Base.transaction do
        @conversation = Conversation.find(params[:id])
        Message.where(conversation_id: @conversation.id, user_id: current_user.id).destroy_all
      end
    rescue Exception => e
      error = e.message
      puts e.message
      puts e.backtrace.inspect
    end

    response = {
      :status => error == nil ? 'OK' : 'ERROR',
      :error  => error == nil ? ''   : error,
      :data   => error == nil ? {
        :info => @conversation.to_info(current_user),
      } : {}
    }

    respond_to do |format|
        format.json { render :json => response }
    end
  end

  def pin
    error = nil
    @conversation = Conversation.find(params[:id])

    begin
      ActiveRecord::Base.transaction do
        @message = current_user.messages.where(:conversation_id => @conversation.id)

        unless @message.any?
          raise "no message found" unless Message.where(:conversation_id => @conversation.id).any?

          current_user.create_or_update_message(@conversation.id, true)
          @message = current_user.messages.where(:conversation_id => @conversation.id)
        end

        pin_type = PinType.find(params[:pin_type_id])

        @message.each do |message|
          message.update_attributes({pin_type_id: pin_type.id})
        end
      end
    rescue Exception => e
      error = e.message
      puts e.message
      puts e.backtrace.inspect
    end

    response = {
      :status => error == nil ? 'OK' : 'ERROR',
      :error  => error == nil ? ''   : error,
      :data   => error == nil ? {
        :info => @conversation.to_info(current_user),
      } : {}
    }

    respond_to do |format|
        format.json { render :json => response }
    end
  end

  def unpin
    error = nil
    @conversation = Conversation.find(params[:id])

    begin
      ActiveRecord::Base.transaction do
        @message = current_user.messages.where(:conversation_id => @conversation.id)

        if @message.any?
          @message.each do |message|
            message.update_attributes( {pin_type_id: nil} )
          end
        else
          raise "no message found"
        end
      end
    rescue Exception => e
      error = e.message
      puts e.message
      puts e.backtrace.inspect
    end

    response = {
      :status => error == nil ? 'OK' : 'ERROR',
      :error  => error == nil ? ''   : error,
      :data   => error == nil ? {
        :info => @conversation.to_info(current_user),
      } : {}
    }

    respond_to do |format|
        format.json { render :json => response }
    end
  end

  def read
    error = nil
    begin
      ActiveRecord::Base.transaction do
        @conversation = Conversation.find(params[:id])
        current_user.create_or_update_message(@conversation.id, true)
      end
    rescue Exception => e
      error = e.message
      puts e.message
      puts e.backtrace.inspect
    end

    response = {
      :status => error == nil ? 'OK' : 'ERROR',
      :error  => error == nil ? ''   : error,
      :data   => error == nil ? {
        :info => @conversation.to_info(current_user),
      } : {}
    }

    respond_to do |format|
        format.json { render :json => response }
    end
  end

  def unread
  	error = nil
    begin
      ActiveRecord::Base.transaction do
        @conversation = Conversation.find(params[:id])
        current_user.create_or_update_message(@conversation.id, false)
      end
    rescue Exception => e
      error = e.message
      puts e.message
      puts e.backtrace.inspect
    end

    response = {
      :status => error == nil ? 'OK' : 'ERROR',
      :error  => error == nil ? ''   : error,
      :data   => error == nil ? {
        :info => @conversation.to_info(current_user),
      } : {}
    }

    respond_to do |format|
        format.json { render :json => response }
    end
  end  
end
