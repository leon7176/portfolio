class Conversation < ActiveRecord::Base
  belongs_to :network
  belongs_to :user

  has_one  :main_post, -> { order('id ASC').limit(1) }, class_name: "Post"

  # has_many :posts, -> { joins(:user).where('users.remove_flag = ?', false).order('updated_at ASC') }
  has_many :posts, -> { order('id ASC') }, dependent: :destroy

  # Skip some parts of content
  # ...

  def to_info(current_user, params = {})
    limit = params[:last_limit] ? params[:last_limit] : 2

    @messages = Message.where({:conversation_id => self.id, :user_id => current_user.id})

    info = {}
    info[:infoType]       = self.class.to_s.pluralize
    info[:id]             = self.id
    info[:user]           = self.user_id
    info[:private]        = self.private_flag
    info[:removed]        = self.remove_flag
    info[:network]        = self.network_id
    info[:main_post]      = self.main_post.id
    info[:last_posts]     = self.last_posts(limit).map{ |post| post[:id] }
    info[:posts]          = self.posts.map{ |post| post[:id] }
    # Skip some parts of content
    # ...
    info[:read]           = @messages.any? ? (@messages.first.read_flag ? true : false ) : false
    return info
  end
  
end
