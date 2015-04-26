# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20141124080454) do

  # Skip some parts of content
  # ....

  create_table "conversation_receivers", force: true do |t|
    t.integer  "conversation_id"
    t.integer  "user_id"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "post_id"
  end

  create_table "conversations", force: true do |t|
    t.integer  "network_id"
    t.boolean  "private_flag", default: false
    t.boolean  "remove_flag",  default: false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "user_id"
    t.boolean  "delta",        default: true,  null: false
  end

  create_table "group_users", force: true do |t|
    t.integer  "group_id"
    t.integer  "user_id"
    t.boolean  "admin",      default: false
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "groups", force: true do |t|
    t.string   "name"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "network_id"
    t.boolean  "open_flag",                    default: true
    t.boolean  "default_flag",                 default: false
    t.boolean  "delta",                        default: true,  null: false
    t.string   "description"
    t.string   "image"
    t.boolean  "network_member_join_flag",     default: true
    t.boolean  "remove_flag",                  default: false
    t.boolean  "approved_join_by_member_flag", default: false
    t.boolean  "list_in_directory_flag",       default: true
  end

  add_index "groups", ["network_id"], name: "index_groups_on_network_id", using: :btree

  create_table "network_users", force: true do |t|
    t.integer  "network_id"
    t.integer  "user_id"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "role_id"
  end

  create_table "networks", force: true do |t|
    t.string   "name"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "home_network_id"
    t.string   "image"
    t.string   "description"
    t.boolean  "invite_flag",           default: true
    t.boolean  "home_member_join_flag", default: false
  end

  create_table "posts", force: true do |t|
    t.text     "content"
    t.integer  "user_id"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "network_id"
    t.integer  "conversation_id"
    t.integer  "post_type_id"
    t.integer  "reply_to"
  end

  add_index "posts", ["user_id", "created_at"], name: "index_posts_on_user_id_and_created_at", using: :btree

  create_table "users", force: true do |t|
    t.string   "first_name"
    t.string   "email"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "password_digest"
    t.string   "remember_token"
    t.boolean  "active_flag",            default: false
    t.string   "photo"
    t.string   "last_name"
    t.boolean  "remove_flag",            default: false
    t.boolean  "delta",                  default: true,  null: false
    t.string   "password_reset_token"
    t.datetime "password_reset_sent_at"
    t.string   "locale"
  end

  add_index "users", ["email"], name: "index_users_on_email", unique: true, using: :btree
  add_index "users", ["remember_token"], name: "index_users_on_remember_token", using: :btree  

  # Skip some parts of content
  # ....

end
