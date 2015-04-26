class ApplicationController < ActionController::Base

  include SessionsHelper 

  # Skip some parts of content
  # ....
  
  include Demo::PostsHelper  
  include FeedsHelper  
  
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception
  skip_before_action :verify_authenticity_token, if: :json_request?

  before_action :set_locale  

  protected

  def json_request?
    request.format.json?
  end
end
