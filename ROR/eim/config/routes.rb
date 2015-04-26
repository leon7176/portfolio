Eim::Application.routes.draw do  

  ## DEMO SCOPE ################################################################
  
  scope module: "demo" do
    # Root routes
    root 'home_entries#index'

    # Pages routes
    match '/feeds', to: 'pages#home', via:'get'    
    match '/help', to: 'pages#help', via:'get'

    # Skip some parts of content
    # ...

    #Session routes
    resources :sessions, only: [:new, :create, :destroy]
    match '/signin', to: 'sessions#new', via:'get'
    match '/signout', to: 'sessions#destroy', via:'delete'
    match '/api/signin', to: 'sessions#signin', via:'get'

    # Skip some parts of content
    # ...

    #Search routes
    resources :search, only: [:index]
    get 'search/user', to: 'search#search_user_hint'
    get 'search/group', to: 'search#search_group_hint'

    #Users routes
    resources :users, only: [:create, :index, :edit, :update] do
      member do
        get :feeds
        get :password, to: :edit_password
        patch :password, to: :update_password
        # get :suggested_groups
      end
      post :upload, on: :new, to: :upload_image
    end
    match '/signup/register', to: 'users#register', via:'post'

    match '/api/users/(:id)/info', to: 'users#info', via:'get'
    match '/api/users/(:id)/follow', to: 'users#follow', via:'get'
    match '/api/users/(:id)/unfollow', to: 'users#unfollow', via:'get'
    match '/api/users/(:id)/invite', to: 'users#invite', via:'get'
    match '/api/users/(:id)/setup_locale', to: 'users#setup_locale', via:'get'

    #Groups routes
    resources :groups, only: [:index, :create, :update] do
      member do
        get :feeds
      end
      post :upload, on: :new, to: :upload_image
    end
    match '/api/groups/(:id)/info', to: 'groups#info', via:'get'
    match '/api/groups/(:id)/join', to: 'groups#join', via:'get'
    match '/api/groups/(:id)/leave', to: 'groups#leave', via:'get'
    match '/api/groups/(:id)/delete', to: 'groups#delete', via:'get'
    match '/api/groups/(:id)/approve', to: 'groups#approve', via:'get'
    match '/api/groups/(:id)/deny', to: 'groups#deny', via:'get'

    # Skip some parts of content
    # ...

    match '/api/groups/(:id)/add_members', to: 'groups#add_members', via:'get'
    match '/api/groups/(:id)/remove_member', to: 'groups#remove_member', via:'get'
    match '/api/groups/(:id)/make_admin', to: 'groups#make_admin', via:'get'

    # Skip some parts of content
    # ...
    
    match '/api/groups/validate', to: 'groups#validate', via:'get'

    #Conversations routes
    resources :conversations, only: [:show]
    match '/api/conversations/(:id)/info', to: 'conversations#info', via:'get'
    match '/api/conversations/(:id)/follow', to: 'conversations#follow', via:'get'
    match '/api/conversations/(:id)/unfollow', to: 'conversations#unfollow', via:'get'

    # Skip some parts of content
    # ...
    
    match '/api/conversations/(:id)/read', to: 'conversations#read', via:'get'
    match '/api/conversations/(:id)/unread', to: 'conversations#unread', via:'get'    

    #Posts routes
    resources :posts, only: [:create, :update]
    match '/api/posts/(:id)/info', to: 'posts#info', via:'get'
    match '/api/posts/(:id)/like', to: 'posts#like', via:'get'
    match '/api/posts/(:id)/unlike', to: 'posts#unlike', via:'get'
    match '/api/posts/(:id)/delete', to: 'posts#delete', via:'get'

    # API routes
    match '/api/users', to: 'api#users', via:'get'
    match '/api/groups', to: 'api#groups', via:'get'
    match '/api/networks', to: 'api#networks', via:'get'
    match '/api/feeds', to: 'api#feeds', via:'get'
    match '/api/unread_feeds_count', to: 'api#unread_feeds_count', via:'get'

    # for Networks
    match '/api/networks/(:id)/info', to: 'api#networks_info', via:'get'

    # for Searches
    match '/api/searches/users', to: 'api#searches_users', via:'get'
    match '/api/searches/groups', to: 'api#searches_groups', via:'get' 

    # Skip some parts of content
    # ...
    
  end

  ##############################################################################

  # The priority is based upon order of creation: first created -> highest priority.
  # See how all your routes lay out with "rake routes".

  # You can have the root of your site routed with "root"
  # root 'welcome#index'

  # Example of regular route:
  #   get 'products/:id' => 'catalog#view'

  # Example of named route that can be invoked with purchase_url(id: product.id)
  #   get 'products/:id/purchase' => 'catalog#purchase', as: :purchase

  # Example resource route (maps HTTP verbs to controller actions automatically):
  #   resources :products

  # Example resource route with options:
  #   resources :products do
  #     member do
  #       get 'short'
  #       post 'toggle'
  #     end
  #
  #     collection do
  #       get 'sold'
  #     end
  #   end

  # Example resource route with sub-resources:
  #   resources :products do
  #     resources :comments, :sales
  #     resource :seller
  #   end

  # Example resource route with more complex sub-resources:
  #   resources :products do
  #     resources :comments
  #     resources :sales do
  #       get 'recent', on: :collection
  #     end
  #   end

  # Example resource route with concerns:
  #   concern :toggleable do
  #     post 'toggle'
  #   end
  #   resources :posts, concerns: :toggleable
  #   resources :photos, concerns: :toggleable

  # Example resource route within a namespace:
  #   namespace :admin do
  #     # Directs /admin/products/* to Admin::ProductsController
  #     # (app/controllers/admin/products_controller.rb)
  #     resources :products
  #   end
end
