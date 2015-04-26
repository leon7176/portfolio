module SignupHelper
  def generate_token seed
    Digest::SHA1.hexdigest(seed.to_s)
  end
  
end
