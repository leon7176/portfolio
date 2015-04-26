# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ name: 'Chicago' }, { name: 'Copenhagen' }])
#   Mayor.create(name: 'Emanuel', city: cities.first)
 
private

def seed(model, seeds)
  seeds.each do |seed|
    model.create(name: seed) unless model.find_by(name: seed)
  end
end

# Skip some parts of content
# ....

seed(PostType, ['normal', 'file', 'poll', 'praise', 'event', 'share', 'task'])
seed(NotificationType, ['like', 'invite', 'follow', 'message', 'task_assigned', 'task_status'])