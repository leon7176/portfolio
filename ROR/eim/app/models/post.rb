class Post < ActiveRecord::Base
  include ActionView::Helpers::JavaScriptHelper
  include ActionView::Helpers::DateHelper

  belongs_to :user
  belongs_to :conversation

  has_many :likes, dependent: :destroy

  # Skip some parts of content
  # ...

  has_many :like_notifications, dependent: :destroy

  # Skip some parts of content
  # ...

  default_scope -> { order('created_at DESC') }
  validates :content, presence: true, length: { maximum: 2000 }
  validates :user_id, presence: true

  # Skip some parts of content
  # ...

  def post_type_name
    post_type = PostType.find self.post_type_id

    if post_type
      return post_type.name 
    else
      return nil
    end
  end


  def post_item_id
    
    if post_type_id == PostType.normal_post_type_id
      self.id
    
    # Skip some parts of content
    # ...
    
    elsif post_type_id == PostType.event_post_type_id
      self.event.id

    elsif post_type_id == PostType.share_post_type_id
      conversation_share = ConversationShare.find_by(:shared_id => self.conversation.id)
      conversation_share.id

    elsif post_type_id == PostType.task_post_type_id
      self.task.id
    
    end
  end


  def post_item_content
    if post_type_id == PostType.normal_post_type_id
      self.content
    # Skip some parts of content
    # ...
    elsif post_type_id == PostType.event_post_type_id
      self.event.title
    elsif post_type_id == PostType.share_post_type_id
      self.content
    elsif post_type_id == PostType.task_post_type_id
      self.task.description
    end
  end

  # Skip some parts of content
  # ...
  
  def to_info(current_user, params = {})    
    # Skip some parts of content
    # ...
    
    if self.post_type_id == PostType.normal_post_type_id || self.post_type_id == PostType.share_post_type_id
      @context = self.content
    end

    @attachment = {}
    if self.post_type_id && self.post_type_id != PostType.normal_post_type_id
      @attachment[:type] = self.post_type_name
      @attachment[:id]   = self.post_item_id        
    end

    # Skip some parts of content
    # ...

    info = {}
    info[:infoType]       = self.class.to_s.pluralize
    info[:id]             = self.id
    info[:conversation]   = self.conversation_id
    info[:user]           = self.user_id    
    info[:post_type]      = self.post_type_id
    
    # Skip some parts of content
    # ...

    info[:content]        = @context if @context
    info[:stamp]          = self.updated_at
    info[:time_ago]       = "#{time_ago_in_words(self.updated_at)} ago"
    
    info[:liked]          = self.likers.include?(current_user) ? true : false
    info[:likeNUM]        = self.likes.count

    # Skip some parts of content
    # ...    
    
    return info
  end

end
