class Demo::SessionsController < ApplicationController
	layout "DEMO/sessionless"

	def new
  end

  def create
    error = nil
    remember_me = params[:remember_me] ? true : false
    begin
      ActiveRecord::Base.transaction do
        user = User.find_by(email: params[:email].downcase, active_flag: true)

        if user && user.authenticate(params[:password]) && !user.frozen_flag && !user.remove_flag
          user.update_attributes({remember_me: remember_me})
          sign_in user
          redirect_to feeds_path
        else
          raise "The account you entered does not exist or your password is incorrect."
        end
      end
    rescue Exception => e
      error = e.message
      puts e.message
      puts e.backtrace.inspect

      # still render login page
      flash[:error] = error
      redirect_to signin_path
    end
  end

  def destroy
    sign_out
    redirect_to logout_path
  end

  # Skip some parts of content
  # ...
  
end
