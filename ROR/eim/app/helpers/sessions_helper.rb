module SessionsHelper

  def sign_in(user)
    remember_token = User.new_remember_token
    
    cookies[:remember_token] = # Skip ...
    cookies[:network_id] = # Skip ...
    cookies[:network_name] = # Skip ...
    cookies[:email] = # Skip ...
    cookies[:locale] = user.locale || I18n.default_locale
    
    # Skip some parts of content
  	# ...

    self.current_user = user
  end

  # Skip some parts of content
  # ...

  def signed_in?
    !current_user.nil?
  end

  def current_user=(user) 
    @current_user = user
  end

  def current_user
    remember_token = User.encrypt(cookies[:remember_token])
    @current_user ||= User.find_by(remember_token: remember_token)
  end

  def current_user?(user)
    user.id == current_user.id
  end

  def signed_in_user
    if !signed_in?
      store_location
      # redirect_to signin_url, notice: "Please sign in."
      redirect_to root_url
    else
      
      # Skip some parts of content
  		# ...
    end
  end

  # before filter
  def correct_user
    @user = User.find(params[:id])
    redirect_to(root_url) unless current_user?(@user) || current_user.home_network_admin?
  end

  # Skip some parts of content
  # ...

  def sign_out
    self.current_user = nil
    cookies.delete(:remember_token)
#    cookies.delete(:network_id)
  end

  def clear_all
    sign_out
    cookies.delete(:network_id)
    cookies.delete(:email)
  end

	# Skip some parts of content
  # ...  

  def current_network_id
    cookies[:network_id]
  end

  def current_network_name
    cookies[:network_name]
  end

  def current_network
    current_user.network_by_id(current_network_id)
  end

  # Skip some parts of content
  # ...

  def current_group
    @group.nil? ? current_network.default_group : @group
  end

  def set_locale
    if cookies[:locale] && cookies[:locale] != ""
      I18n.locale = cookies[:locale]
    else
      I18n.locale = I18n.default_locale
    end
  end

end
