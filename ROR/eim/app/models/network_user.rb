class NetworkUser < ActiveRecord::Base
	belongs_to :network
	belongs_to :user

  has_one :role
end
