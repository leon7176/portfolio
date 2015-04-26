class Network< ActiveRecord::Base
  include PagesHelper
  include NetworksHelper
  
  has_many :groups, -> { where('groups.remove_flag = ?', false) }, dependent: :destroy
  has_many :network_users, dependent: :destroy
  has_many :users, through: :network_users
  # has_many :users, -> { where('users.remove_flag = ?', false) }, through: :network_users
  has_many :conversations, -> { order('updated_at DESC') }, dependent: :destroy

  # Skip some parts of content
  # ...
  
  validates :name, presence: true, uniqueness: { case_sensitive: false }  

  def default_group
    self.groups.find_by(:default_flag => true)
  end

  def has_user?(user)
    network_users.find_by(user_id: user.id)
  end

  def has_network_admin?(user)
    self.network_users.find_by(user_id: user.id, role_id: Role.admin_id)
  end

  # Skip some parts of content
  # ...  

  def to_info(current_user, params = {})
    members = self.users.take(5)
    
    # members.each do |member|
    #   register_person_info member
    # end

    info = {}
    info[:infoType]     = self.class.to_s.pluralize
    info[:id]           = self.id
    info[:name]         = self.name
    info[:descript]     = self.description
    info[:members]      = members.map{ |user| user[:id] }

    # Skip some parts of content
    # ...      
    
    info[:defaultGroup] = self.default_group.id
    
    return info
  end

end