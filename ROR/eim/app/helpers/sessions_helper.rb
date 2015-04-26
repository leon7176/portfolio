module SessionsHelper

  def sign_in(user)
    remember_token = User.new_remember_token

    if user.remember_me
      cookies.permanent[:remember_token] = remember_token
      cookies.permanent[:network_id] = user.network_by_id.id
      cookies.permanent[:network_name] = user.network_by_id.name
      cookies.permanent[:email] = user.email
      cookies.permanent[:locale] = user.locale || I18n.default_locale
    else
      cookies[:remember_token] = remember_token
      cookies[:network_id] = user.network_by_id.id
      cookies[:network_name] = user.network_by_id.name
      cookies[:email] = user.email
      cookies[:locale] = user.locale || I18n.default_locale
    end
    user.update_attribute(:remember_token, User.encrypt(remember_token))
    self.current_user = user
  end

  def email_last_signed_in?
    !email_last_signed_in.nil?
  end

  def email_last_signed_in
    cookies[:email]
  end

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
      if current_user.frozen_flag        
        sign_out
        redirect_to root_url, notice: 'You are blacklisted'
      elsif current_user.remove_flag
        sign_out
        redirect_to root_url, notice: 'You are deleted'
      end
    end
  end

  # before filter
  def correct_user
    @user = User.find(params[:id])
    redirect_to(root_url) unless current_user?(@user) || current_user.home_network_admin?
  end

  def network_admin_user
    redirect_to(root_url) unless current_user.network_admin?(current_network_id)
  end

  def home_network_admin_user
    redirect_to(root_url) unless current_user.network_admin?(current_user.home_network.id)
  end

  def group_admin_user
    group = Group.find(params[:id])
    redirect_to(feeds_group_url(group)) unless group.has_admin?(current_user)
  end

  def group_inviter_user
    group = Group.find(params[:id])
    redirect_to(feeds_group_url(group)) unless group.inviter?(current_user)
  end  

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

  def redirect_back_or(default)
    redirect_to(session[:return_to] || default)
    session.delete(:return_to)
  end

  def store_location
    session[:return_to] = request.url if request.get?
  end

  def update_current_network_id(id) 
    if current_user.remember_me
      cookies.permanent[:network_id] = current_user.network_by_id(id).id
      cookies.permanent[:network_name] = current_user.network_by_id(id).name
    else
      cookies[:network_id] = current_user.network_by_id(id).id
      cookies[:network_name] = current_user.network_by_id(id).name
    end
  end

  def current_network_id
    cookies[:network_id]
  end

  def current_network_name
    cookies[:network_name]
  end

  def current_network
    current_user.network_by_id(current_network_id)
  end

  def current_group_id
    group_id = current_network.default_group.id
    if @group
      group_id = @group.id
    elsif params[:controller] == 'groups' && params[:id]
      group = Group.find params[:id]
      group_id = group.id     
    end
    group_id
  end

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
