class HomeentriesController < ApplicationController
  
  # GET /homeentries
  def index

    store_location
    @user = User.new
    if params[:return_home]
      
      render layout: 'home'
      #render layout: false
    elsif signed_in?
      redirect_to feeds_path    
    else      
      render layout: 'home'
    end
    
  end

  def logout
    render layout: 'entry'
  end

end
