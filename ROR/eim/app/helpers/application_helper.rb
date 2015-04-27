module ApplicationHelper
	def full_title(page_title)
		# base_title = "EIM"
		base_title = "Demo"
		if page_title.empty?
			base_title
		else
			# "#{base_title} | #{page_title}"
			"#{base_title} - #{page_title}"
		end
	end

	def show_flash_within_ajax_response
		@embed_str = "$('#flash').html('#{escape_javascript raw(flash_display)}')"
		@embed_str
	end
end