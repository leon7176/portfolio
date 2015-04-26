class Group< ActiveRecord::Base
  include PagesHelper
  
  belongs_to :network
  has_many :group_users, dependent: :destroy
  has_many :users, through: :group_users
  has_many :conversations, -> { where("conversations.private_flag <> 1").order('updated_at DESC') }, through: :conversation_group_receivers

  # Skip some parts of content
  # ...

  validates :name, presence: true, uniqueness: { scope: :network_id, case_sensitive: false }

  mount_uploader :image, GroupImageUploader

  def has_user?(user)
    group_users.find_by(user_id: user.id)
  end
  
  # Skip some parts of content
  # ...

  def avatar_path
    if self.image?
      ActionController::Base.helpers.asset_path "#{self.image.store_dir}/#{self.image_identifier}"
    else
      ActionController::Base.helpers.asset_path "DEMO/img/group.png"
    end
  end

  def avatar_thumb_path
    if self.image?
      ActionController::Base.helpers.asset_path "#{self.image.store_dir}/thumb_#{self.image_identifier}"
    else
      ActionController::Base.helpers.asset_path "DEMO/img/group.png"
    end
  end

  def to_info(current_user, params = {})
    if params[:controller] == 'demo/groups' && params[:action] == 'feeds'
      members = self.users      
    else
      members = self.users.take(5)
    end
    
    members.each do |member|
      register_person_info member
    end

    last_update = self.conversations.order("updated_at").last ? 
                  self.conversations.order("updated_at").last[:updated_at].strftime("%Y-%m-%d %H:%M") : 
                  self.updated_at.strftime("%Y-%m-%d   %H:%M")

    info = {}
    info[:infoType]             = self.class.to_s.pluralize
    info[:id]                   = self.id
    info[:name]                 = self.name
    info[:avator]               = self.avatar_path
    info[:avatorThumb]          = self.avatar_thumb_path
    info[:removed]              = self.remove_flag
    info[:joined]               = self.has_user?(current_user) ? true : false    
    info[:members]              = members.map{ |user| user[:id] }
    info[:member_count]         = self.users.count    
    # Skip some parts of content
    # ...

    return info

  end

end