class UserMailer< ActionMailer::Base
  default from: "leon7176@qq.com"

  # Skip some parts of content
  # ....

  def activate_confirm(user_id, code)
    @user = User.find user_id
    @code = code
    send_mail(:to => @user.email, :subject => "Activate your EIM account")
  end

  def login_confirm(user_id)
  	@user = User.find user_id
    send_mail(:to => @user.email, :subject => "Please log in to EIM")
  end  

  def password_reset(user_id)
    @user = User.find user_id
    send_mail :to => @user.email, :subject => "Your password recovery request"
  end

  # Skip some parts of content
  # ....

private  

  def send_mail(headers = {}, &block)
    domain_name = headers[:to].split("@").last
    if domain_name == "linchat.com"
      headers[:to] = "poppychen@Eim.com"
    end

    mail(headers)
  end

end