class User < ActiveRecord::Base
  include SignupHelper
  include UsersHelper

  belongs_to :im_type
  
  has_many :conversations, dependent: :destroy
	has_many :posts, dependent: :destroy

  # Skip some parts of content
  # ...  
  
	has_many :network_users, dependent: :destroy
	has_many :networks, through: :network_users
	has_many :group_users, dependent: :destroy
	has_many :groups, -> { where('groups.remove_flag = ?', false) }, through: :group_users

  # Skip some parts of content
  # ...  
  
  attr_accessor :password_required

	before_save { self.email = email.downcase }
	before_create :create_remember_token

	validates :name, presence: true, length: { maximum: 50 }, on: :update
	VALID_EMAIL_REGEX = /\A[\w+\-.]+@[a-z\d\-.]+\.[a-z]+\z/i
	validates :email, presence: true, format: {with: VALID_EMAIL_REGEX},
				uniqueness: {case_sensitive: false}

	has_secure_password validations: false
	validates :password, length: {minimum: 6}, if: :password_required?
	validates_confirmation_of :password, if: lambda { |m| m.password.present? }
  validates_presence_of     :password, if: :password_required?
  validates_presence_of     :password_confirmation, if: lambda { |m| m.password.present? }

  mount_uploader :photo, UserPhotoUploader

  def after_initialize
    super
    @password_required = false
  end

  def password_required?
    self.password_required
  end

  def join!(group)
    unless self.group_users.exists?(group_id: group.id)
  	 group_users.create!(group_id: group.id)
    end

    # disable pending join group request
    if JoinGroupRequest.exists?( {group_id: group.id, user_id: self.id} )
      reqs = group.join_group_requests.where(user_id: self.id)
      req = reqs.first
      if (req.approve_flag == 0)
        req.update_attributes(approve_flag: 2)
      end
    end
  end

  # Skip some parts of content
  # ...  

  def name
    "#{self.first_name} #{self.last_name}"
  end

  def to_hint
    hint = {}
    hint[:name] = self.name
    hint[:email] = self.email
    hint[:info] = self.job_title
    hint[:icon] = ActionController::Base.helpers.asset_path profile_photo(self)
    hint[:id] = self.id
    if self.active_flag == true
      return hint
    else
      return nil
    end
  end

  def to_info(current_user, params = {})
    is_followed_by_current_user = current_user.following?(self)

    joined_date = self.created_at.strftime("%Y-%m-%d")

    info = {}
    info[:id]           = self.id
    info[:infoType]     = self.class.to_s.pluralize
    info[:name]         = self.name
    info[:email]        = self.email
    info[:avator]       = profile_photo(self)
    info[:avatorThumb]  = profile_photo_thumb(self)
    info[:frozen]       = self.frozen_flag
    info[:removed]      = self.remove_flag
    # Skip some parts of content
    # ...  
    return info
  end

private

	def create_remember_token
		self.remember_token = User.encrypt(User.new_remember_token)
	end

end
