var boilerplate = function() {
	return {
		init: function() {
		
			$("#show-modal").live("click", function(e) {
				e.preventDefault();
				uiUtils.dialogue.modal({
					message: "Are you sure you want to close this modal dialogue?",
					confirmLabel: "Yes",
					cancelLabel: "<span>or</span> no",
					onConfirm: function() {
						console.log("ok");
					}
				});
			});
			
			$("#show-alert").live("click", function(e) {
				e.preventDefault();
				uiUtils.dialogue.message("This is just a short message!");
			});
			
			$("#show-tool-tip").live("mouseenter", function(e) {
				e.preventDefault();
				var eventElm = $(this);
				var elmOffset = eventElm.offset();
				uiUtils.dialogue.toolTip({
				  message: "This is some essential info",
					alignment: {
						"left": elmOffset.left,
						"top": (elmOffset.top + eventElm.outerHeight()/2),
						"width": eventElm.outerWidth()
					}
				});
			});
			$("#show-tool-tip").live("mouseleave", function(e) {
			  uiUtils.dialogue.hideDialogueWindow();
			});
			
			$("#show-modal-form").live("click", function(e) {
				e.preventDefault();
				uiUtils.dialogue.edit({
					title: "What do you want?",
					fields: [
				    {
				      label: "Answer",
				      type: "text",
				      id: "answer",
				      value: "",
				      required: true
				    },
				    {
				      label: "Your name",
				      type: "text",
				      id: "name",
				      value: "",
				      required: true
				    },
				    {
				      label: "Select fruit",
				      type: "checkBoxGroup",
				      value: [
				        {
				          text: "Banana",
				          value: "1"
				        },
				        {
				          text: "Orange",
				          value: "2"
				        }
				      ]
				    }
					],
					confirmLabel: "Send",
					cancelLabel: "<span>or</span> cancel",
					onConfirm: function() {
						console.log("ok");
					}
				});
			});
		}
	}
}();

boilerplate.init();