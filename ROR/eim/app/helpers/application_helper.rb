module ApplicationHelper
	def full_title(page_title)
		# base_title = "EIM"
		base_title = "Linchat"
		if page_title.empty?
			base_title
		else
			# "#{base_title} | #{page_title}"
			"#{base_title} - #{page_title}"
		end
	end

	def flash_display
	  response = ""
	  flash.each do |key, value|
	    response = response + content_tag(:div, :id => "eh-error", class: "eh-alert eh-error") do
	    	content_tag(:span, '', class: "alert-icon eh-icon") +
	    	content_tag(:div, value, :id => "flash_#{key}", class: "alert-content")
	    end
	  end
	  flash.discard
	  response
	end

	def show_flash_within_ajax_response
		@embed_str = "$('#flash').html('#{escape_javascript raw(flash_display)}')"
		@embed_str
	end
end