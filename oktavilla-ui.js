/** @class */
var uiUtils = function() {
	/** @lends uiUtils */

	return {
		/**
		 * Initialise class
		 */
		init: function() {
			$.ajaxSettings.cache = false;
			this.isCrappyBrowser = window.XMLHttpRequest ? false : true;
		},
		/**
		 * Write a debug message, requires uiUtils.debug to be true to display
		 * @param {string} str The message to display
		 */
		debug: function(str) {
			if (str !== null && uiUtils.showDebug && !uiUtils.isCrappyBrowser) {
				str = str + "";
				str = str.replace(">", "&gt;").replace("<", "&lt;");
				if ($("#debug").length === 0) {
					$("<div id=\"debug\"><div class=\"msg\"></div><a href=\"#\" style=\"position: absolute; top: -5px; right: -5px; padding: 2px 5px; color: black; background: white; text-decoration: none;\">Debug</a></div>").appendTo("body");
					$("#debug").css({
						"position": "fixed",
						"right": "10px",
						"top": ((window.pageYOffset || document.documentElement.scrollTop) + 10) + "px",
						"width": "300px",
						"font": "10px verdana",
						"background": "black",
						"color": "white",
						"padding": "6px",
						"opacity": ".6",
						"filter": "alpha(opacity = 60)",
						"z-index": "99999999",
						"-moz-border-radius": "4px",
						"-webkit-border-radius": "4px"
					});
					$("#debug").data("n", 1);
					$("#debug a").bind("click", function() { if ($("#debug .msg").css("margin-top") == "0px") {$("#debug").css("width", "20px"); $("#debug .msg").css("margin-top", "-9999px"); } else { $("#debug .msg").css("margin-top", "0px"); $("#debug").css("width", "300px"); } $(this).get(0).blur(); uiUtils.writeCookie("debug", ($("#debug .msg").css("margin-top") == "0px"), 2); return false; });
				}
				var n = $("#debug").data("n");
				$("<div id=\"debug-line-" + n + "\" style=\"border-bottom: 1px solid #333; padding-bottom: 3px; margin-bottom: 3px;\">" + n + ": " + str + "</div>").appendTo("#debug .msg");
				var prevLine = $("#debug-line-" + (n-8));
				if(prevLine.length > 0) { prevLine.remove(); }
				$("#debug").data("n", n+1);
				if (uiUtils.readCookie("debug") == "false") { $("#debug .msg").css("margin-top", "-9999px"); $("#debug").css("width", "20px"); }
			}
		},
		/**
		 * Handle an error given a specific error code.
		 * If the error code exists i uiUtils.lang.errors it will show a message
		 * If the code exists in uiUtils.paths.errors it will redirect to that url
		 * Else it will redirect to uiUtils.paths.errors.default
		 * @param {string} code Error code
		 */
		handleError: function(code) {
			uiUtils.debug("Encountered error with code " + code);
			errorMessage = typeof(uiUtils.lang.errors[code]) != "undefined" ? uiUtils.lang.errors[code] : "";
			if (errorMessage !== "") {
				uiUtils.debug("Found error message for code " + code);
				uiUtils.dialogue.message(errorMessage, "error");
			} else {
				redirectUrl = typeof(code) != "undefined" ? (typeof(uiUtils.path.errors[code]) != "undefined" ? uiUtils.path.errors[code]: uiUtils.path.errors["default"]) : uiUtils.path.errors["default"];
				uiUtils.debug("Found redirect url for code " + code);
				if (!uiUtils.showDebug) {
					document.location.href = redirectUrl;
				} else {
					uiUtils.debug("Error occurred, redirecting to: " + redirectUrl);
				}
			}
		},
		/**
		 * Shows a standard message using the text inside the element "#message" (if it exists)
		 */
		showMessage: function() {
			var message = $("#message");
			if (message.length > 0) {
				uiUtils.dialogue.message(message.html(), message.hasClass("error") ? "error" : "message");
			}
		},
		/**
		 * Gets the suffixed value of a class name of a given object
		 * The function assumes the format "prefix-suffix"
		 * @param {object} el A DOM object
		 * @param {string} prefix The prefix of the class name
		 */
		getClassNameValue: function(el, prefix) {
			var ret = new RegExp(".*" + prefix + "-(.*?)(?:\\s|$).*").exec(el.className);
			if (ret) {
				return ret[1];
			}
			return null;
		},
		/**
		 * Loads json data
		 * @param {object} args All the arguments
		 * @param {string} args.path The url to get
		 * @param {object/json} args.params Params in json format
		 * @param {function} args.callback A function to trigger on completion
		 */
		getData: function(args) {
			args.params.ajax = "true";
			var url = args.path + ((args.path.indexOf("?") < 0) ? "?" : "&") + $.param(args.params);
			
			uiUtils.debug("Getting data from: " + url);
			$.getJSON(url,
				function(data) {
					if (data.response.status == "ok") {
						var responseData = typeof(data.response.value) != "undefined" ? data.response.value : null;
						if (typeof(args.callback) != "undefined") {
							var metaData = typeof(data.response.metadata) != "undefined" ? data.response.metadata : null;
							args.callback.call(this, responseData, metaData);
						} else {
							return responseData;
						}
					} else {
						uiUtils.handleError(data.response.code);
					}
				} 
			);
		},
		/**
		 * Posts data with a query string
		 * @param {object} args All the arguments
		 * @param {string} args.path The url to post to
		 * @param {object/json} args.params Params in json format
		 * @param {function} args.callback A function to trigger on completion
		 */
		postData: function(args) {
			args.params.ajax = "true";
			uiUtils.debug("Posting data to: " + args.path + " with params: " + $.param(args.params));
			$.post(args.path, $.param(args.params), function(data) {
					if (data.response.status == "ok") {
						responseData = typeof(data.response.value) != "undefined" ? data.response.value : null;
						if (typeof(args.callback) != "undefined") {
							var metaData = typeof(data.response.metadata) != "undefined" ? data.response.metadata : null;
							args.callback.call(this, responseData, metaData);
						} else {
							return responseData;
						}
					} else {
						uiUtils.handleError(data.response.code);
					}
				},
				"json"
			);
			
		},		
		/**
		 * Serializes a form into json
		 * @param {formSelector} formSelector A jQuery selector specifying the form
		 */
		serialize: function(formSelector) {
			var form = typeof formSelector === "object" ? formSelector : $(formSelector);
			
			var json = {};
			var formData = decodeURIComponent(form.serialize().replace(/%2b/gi, "[[[isaplus]]]"));
			if (formData !== "") {
				formData = formData.replace(/\+/gi, " ");
				formData = formData.replace(/\[\[\[isaplus\]\]\]/gi, "+");
				var tempArray = formData.split("&");
				for (var part in tempArray) {
					var pair = tempArray[part].split("=");
					json[pair[0]] = pair[1];
				}
			} else {
				json = {};
			}
			return json;
		},
		flash: function(selector, callback) {
			var elm = $(selector);
			elm.stop();
			elm.animate(
				{ "backgroundColor": "#fdfcbb" }, 
				"slow", 
				function() {
					elm.animate(
						{ "backgroundColor": "#ffffff" }, 
						"slow", 
						function() {
							if (typeof(callback != "undefined")) {
								callback.call(this, elm);
							}
						}
					);
				}
			);
		},
		shake: function(selector, callback) {
			var elm = $(selector);
			elm.stop();
			elm.animate({ "marginLeft": "-4px", "backgroundColor": "#fdfcbb" }, "fast"). 
			animate({ "marginLeft": "4px" }, "fast"). 
			animate({ "marginLeft": "-4px" }, "fast"). 
			animate({ "marginLeft": "4px" }, "fast").
			animate({ "marginLeft": "-4px" }, "fast"). 
			animate({ "marginLeft": "0px", "backgroundColor": "#ffffff" }, "fast", 
				function() {
					if (typeof(callback != "undefined")) {
						callback.call(this, elm);
					}
				}
			);
		}
	};
}();


/** @class 
 * Creates a semi transparent cover over the screen.
 */
uiUtils.cover = function() {
	var setSize = function() { 
        $("#cover").css({
            "height": Math.max(uiUtils.isCrappyBrowser ? $("body").outerHeight() : $("html").outerHeight(), $(window).height()) + "px",
            "display": "block"
        });
	};
    return {
		/**
		 * Shows the cover.
		 * @param {function} callback A function to execute on completion
		 */
        show: function(callback) {
            var el = $("#cover");
            if (el.length < 1) {
            	el = $("<div id=\"cover\" style=\"position:absolute;left:0px;top:0px;width:100%;z-index:999;background:#000;opacity:0;\"></div>");
                $("body").append(el);
            }
            el.animate({"opacity": 0.6}, { 
            	duration: "normal", 
            	complete: typeof(callback) !== "undefined" ? callback : function() {}
            });
			$(window).bind("resize", setSize).trigger("resize");
        },
        
		/**
		 * Hides the cover.
		 * @param {function} callback A function to execute on completion
		 */
        hide: function(callback) {
            var el = $("#cover");
            if (el.length > 0) {
	            el.animate({"opacity": 0}, { 
	            	duration: 600, 
	            	complete: function() { 
	            		el.css("display", "none");
	            		if (typeof(callback) !== "undefined") {
	            			callback.call();
	            		}
	            	}
	            });
				$(window).unbind("resize", setSize);
            }
        }
    };
}();


/** 
 * @class 
 * Shows different kinds of dialogues to the user
*/
uiUtils.dialogue = function() {
	var state = "idle";
	var timer = "";
	var html = {
		closeButton: "<a href=\"#\" id=\"close-o-ui-msg\">x</a>",
		cancelButton: "<a href=\"#\"class=\"btn discrete\">{label}</a>",
		confirmButton: "<a href=\"#\" class=\"btn primary\">{label}</a>"
	};
	
	/**
	 * @private
	 */
	var showDialogueWindow = function(args) {
		var messageBox = $("#o-ui-msg");
		if (timer !== "") {
			clearTimeout(timer);
			timer = "";
			messageBox.fadeOut("fast");
		}
		if (messageBox.length < 1) {
			$("body").append("<div id=\"o-ui-msg\"><div class=\"message-body\"></div></div>");
			messageBox = $("#o-ui-msg");
		}
		$("#o-ui-msg .message-body").html(args.message);
		messageBox.attr("class", args.type);
		
		var initTop = 0;
		var initLeft = 0;
		
		if (typeof(args.alignment) !== "undefined") {
			var messageBoxWidth = messageBox.outerWidth();
			var messageBoxHeight = messageBox.outerHeight();

			initTop = Math.round(args.alignment.top - messageBoxHeight/2);
			initLeft = Math.round(args.alignment.left - messageBoxWidth);
			
			if (initLeft <= 0) {
				initLeft = args.alignment.left + args.alignment.width;
				messageBox.addClass("aligned-to-right");
			} else {
				messageBox.addClass("aligned-to-left");
			}
		} else {
			var scrollTop = window.pageYOffset ? window.pageYOffset : document.documentElement.scrollTop;
			initTop = scrollTop + 100;
			initLeft = ($(window).width()/2) - (messageBox.outerWidth()/2);
		}
		messageBox.css({
			"top": initTop + "px",
			"left": initLeft + "px",
			"display": "none",
            "z-index": "9999"
		});
		messageBox.fadeIn("normal", function() {
			if (typeof(args.callback) != "undefined") {
				args.callback.call();
			} 
		});
	};
	
	/**
	 * @private
	 */
	var hideDialogueWindow = function() {
		state = "idle";
		if (timer !== "") { clearTimeout(timer); timer = ""; }
		$("#o-ui-msg").fadeOut("slow");
	};
	
	return {
		/**
		 * Forces an open dialogue window to hide
		 */
		hideDialogueWindow: function() {
			hideDialogueWindow();
		},
		
		/**
		 * Shows a message. The message will go away automatically after a short while
		 * @param {string} message A text to display to the user
		 * @param {string} type Type of message. "message" or "error" (will be set as a class on the message div)
		 */
		message: function(message, type) {
			if (state == "idle") {
				message += html.closeButton;
				showDialogueWindow({
					"message": message,
					"type": typeof(type) != "undefined" ? type : "message",
					"callback": function() {
						$("#close-o-ui-msg").bind("click", function() {
							hideDialogueWindow();
							$("#close-o-ui-msg").unbind();
							return false;
						});
						timer = setTimeout( function() { hideDialogueWindow(); }, 3000 );
					}
				});
			}
		},
		
		/**
		 * Shows a modal dialogue. The dialogue will not go away until the user cancels or confirms
		 * @param {object} args All arguments
		 * @param {string} args.message A text to display to the user
		 * @param {string} args.confirmLabel The label for the "confirm" button
		 * @param {string} args.cancelLabel The label for the "cancel" button
		 * @param {function} args.onConfirm A function to execute when the user confirms
		 * @param {function} args.onCancel A function to execute when the user cancels (optional)
		 * @param {function} args.onShow A function to execute when the dialogue appears (optional)
		 * @param {boolean} args.prohibitCancel Do not allow the user to cancel (optional)
		 * @param {boolean} args.onConfirmKeepCover Keeps the cover visible even after confirm is clicked (useful when chaining modal dialogues) (optional)
		 */
		modal: function(args) {
			if (state == "idle") {
				var content = args.message;
				content += "<p class=\"question\">";
				content += html.confirmButton.replace("{label}", args.confirmLabel);
				if (args.prohibitCancel === true) {
					content += "</p>";
				} else {
					content += "&nbsp;" + html.cancelButton.replace("{label}", args.cancelLabel);
					content += "</p>";
					content += html.closeButton;
				}
				state = "busy";
				uiUtils.cover.show(function() {
					showDialogueWindow({
						"message": content,
						"type": "modal",
						"callback": function() {
							if (args.onShow) {
								args.onShow.call(this, $("#o-ui-msg"));
							}
  						$("#close-o-ui-msg").bind("click", function() {
  							hideDialogueWindow();
								if (!args.onConfirmKeepCover) {
									uiUtils.cover.hide();							
								}
  							$("#close-o-ui-msg").unbind();
  							return false;
  						});
							$("#o-ui-msg .question .btn.primary").bind("click", function() {
								hideDialogueWindow();
								if (!args.onConfirmKeepCover) {
									uiUtils.cover.hide();							
								}
								if (typeof(args.onConfirm) !== "undefined") {
									args.onConfirm.call();
								}
								$("#o-ui-msg .question .btn.primary").unbind();
								return false;
							});
							$("#o-ui-msg .question .btn.discrete").bind("click", function() {
								hideDialogueWindow();
								uiUtils.cover.hide();
								if (typeof(args.onCancel) != "undefined") {
									args.onCancel.call();
								}
								$("#o-ui-msg .question .btn.discrete").unbind();
								return false;
							});
						}
					});
				});
			}
		},

		/**
		 * Shows a tooltip.
		 * @param {object} args All arguments
		 * @param {string} args.message A text to display to the user
		 * @param {string} args.alignment A Jquery object to cling to
		 */
		toolTip: function(args) {
			if (state == "idle") {
				var content = args.message;
				showDialogueWindow({
					"message": content,
					"type": "tooltip",
					"alignment": args.alignment,
					"callback": function() {
						if (typeof(args.callback) != "undefined") {
							args.callback.call();
						}
					}
				});
			}
		},
		
		/**
		 * Shows a modal box with html content and a close button
		 * @param {object} args All arguments
		 * @param {string} args.html The html to insert
		 */		
		html: function(args) {
			if (state == "idle") {
				var content = args.html;
				content += html.closeButton;
				state = "busy";
				uiUtils.cover.show(function() {
					showDialogueWindow({
						"message": content,
						"type": "html",
						"alignment": args.alignment,
						"callback": function() {
							if (typeof(args.callback) != "undefined") {
								args.callback.call();
							}
							$("#close-o-ui-msg").bind("click", function() {
								hideDialogueWindow();
								uiUtils.cover.hide();
								$("#close-o-ui-msg").unbind();
								return false;
							});
						}
					});
				});
			}
		},
		
		/**
		 * @private
		 */
		fileUploadCallback: function(elm, onConfirmKeepCover) {
			var iframe = $("#file-upload-proxy");
			var callbackFunction = iframe.data("on-complete");
			if (iframe.hasClass("submitted")) {
				var responseCode = "unknown";
				if (typeof(elm) != "undefined") {
					responseCode = $.trim(elm.contentWindow.document.body.innerHTML);
				}
				$("#dummy-file-input").find("input").unbind();
				$("#close-o-ui-msg").unbind();
				$("#o-ui-msg .question .cancel").unbind();
				hideDialogueWindow();
				if (!onConfirmKeepCover) {
					uiUtils.cover.hide();							
				}
				if (typeof(callbackFunction) != "undefined") {
					callbackFunction.call(this, responseCode);
				}
				iframe.removeClass("submitted");
			}
		},
		
		/**
		 * Shows a file upload form. The form will not go away until the user cancels or submits
		 * @param {object} args All arguments
		 * @param {string} args.title A title for the form
		 * @param {string} args.info A text/instruction to display
		 * @param {string} args.id A name/id for the file (used in the post)
		 * @param {string} args.path Where to post the file
		 * @param {string} args.confirmLabel The label for the "confirm" button
		 * @param {string} args.cancelLabel The label for the "cancel" button
		 * @param {function} args.onConfirm A function to execute when the user confirms/submits
		 * @param {function} args.onCancel A function to execute when the user cancels (optional)
		 * @param {boolean} args.toggleOn Can be used on date fields (on per default or not). Only works when allowToggle is true (optional)
		 * @param {boolean} args.onConfirmKeepCover Keeps the cover visible even after confirm is clicked (useful when chaining modal dialogues) (optional)
		 */
		fileUpload: function(args) {
			if (typeof args.onConfirmKeepCover === "undefined") {
				args.onConfirmKeepCover = false;
			}
			if (state == "idle") {
				if($("#file-upload-proxy").length === 0) {
					$(document.body).append("<iframe id=\"file-upload-proxy\" name=\"file-upload-proxy\" onload=\"parent.uiUtils.dialogue.fileUploadCallback(this, " + args.onConfirmKeepCover + ");\"></iframe>");
				}
				
				var content = "";
				content += "<form target=\"file-upload-proxy\" action=\"" + args.path + "\" method=\"post\" enctype=\"multipart/form-data\">";
				content += "<h2>" + args.title + "</h2>";
				if (typeof(args.info) != "undefined" && args.info !== "") {
					content += "<p>" + args.info + "</p>";
				}
				content += "<fieldset>";
				content += "<div id=\"dummy-file-input\" style=\"display: none;\"><input type=\"file\" name=\"" + args.id + "\"/></div>";
				content += "</fieldset></form>";
				content += "<p class=\"question\">";
				content += html.confirmButton.replace("{label}", args.confirmLabel);
				content += " or ";
				content += html.cancelButton.replace("{label}", args.cancelLabel);
				content += "</p>";
				content += html.closeButton;

				state = "busy";
				uiUtils.cover.show(function() {
					showDialogueWindow({
						"message": content,
						"type": "form",
						"callback": function() {
							
							var button = $("#o-ui-msg .btn.primary");
							var pos = button.position();
							var height = button.outerHeight();
							var width = button.outerWidth();
							var dummyFileInput = $("#dummy-file-input");
							
							dummyFileInput.css({
								"position": "absolute",
								"top": pos.top + "px",
								"left": pos.left + "px",
								"height": height + "px",
								"width": width + "px",
								"overflow": "hidden",
								"display": "block",
								"opacity": "0",
								"cursor": "pointer",
								"background": "red",
								"z-index": "99",
								"border": "5px solid white"
							});
							
							dummyFileInput.find("input").bind("change", function() {
								$("#file-upload-proxy").addClass("submitted");
								if (typeof(args.onComplete) != "undefined") {
									$("#file-upload-proxy").data("on-complete", args.onComplete);
								}
								$("#o-ui-msg form").submit();
								$("#o-ui-msg .message-body").html("<div class=\"loader\"><p>" + args.loaderText + "</p></div>");
								
							});
							
							var uploadButton = $("#o-ui-msg .btn.primary");
							dummyFileInput.bind("mouseover", function() {
								uploadButton.addClass("button-hover");
							});
							dummyFileInput.bind("mouseout", function() {
								uploadButton.removeClass("button-hover");
							});
							
							$("#close-o-ui-msg").bind("click", function() {
								hideDialogueWindow();
								uiUtils.cover.hide();							
								if (typeof(args.onCancel) != "undefined") {
									args.onCancel.call();
								}
								$("#close-o-ui-msg").unbind();
								return false;
							});
							$("#o-ui-msg .question .btn.discrete").bind("click", function() {
								hideDialogueWindow();
								uiUtils.cover.hide();
								if (typeof(args.onCancel) != "undefined") {
									args.onCancel.call();
								}
								$("#o-ui-msg .question .btn.discrete").unbind();
								return false;
							});
						}
					});
				});
			}
		},
		
		/**
		 * Shows an edit form. The form will not go away until the user cancels or submits
		 * @param {object} args All arguments
		 * @param {string} args.title A title for the form
		 * @param {array} args.fields An array of field objects
		 * @param {string} args.fields[x].label The label to use for the field
		 * @param {string} args.fields[x].type The field type ("text", "hidden", "select", "password", "checkBoxGroup", "textarea", "info")
		 * @param {string} args.fields[x].id The name to use for the field when posting
		 * @param {string} args.fields[x].value The preset value of the field. If the field type is "select" or "checkBoxGroup" this should be an array of options.
		 * @param {string} args.fields[x].value[x].text The text for an option or checkbox.
		 * @param {string} args.fields[x].value[x].value The value for an option or checkbox.
		 * @param {boolean} args.fields[x].required Is the field required for submit? Does not work with selects ot checkboxes.
		 * @param {string} args.confirmLabel The label for the "confirm" button
		 * @param {string} args.cancelLabel The label for the "cancel" button
		 * @param {function} args.onConfirm A function to execute when the user confirms/submits
		 * @param {function} args.onCancel A function to execute when the user cancels (optional)
		 * @param {boolean} args.prohibitCancel Do not allow the user to cancel (optional)
		 * @param {boolean} args.onConfirmKeepCover Keeps the cover visible even after confirm is clicked (useful when chaining modal dialogues) (optional)
		 */
		edit: function(args) {
			if (state == "idle") {
				var content = "<form class=\"form\" method=\"post\">";
				content += "<h2>" + args.title + "</h2>";
				content += "<fieldset>";
				
				var fields = args.fields;
				for (var i = 0, l = fields.length; i < l; i++) {
				  content += "<div class=\"form-element\">";
				  fields[i].value = typeof(fields[i].value) != "undefined" ? fields[i].value : "";
					if (typeof(fields[i].label) !== "undefined" && fields[i].label !== "" && fields[i].type !== "hidden") {
						content += "<label for=\"input-field-" + fields[i].id + "\">" + fields[i].label + "</label>";
					}
					
					switch(fields[i].type) {
						case "text":
							content += "<input type=\"text\" name=\"" + fields[i].id + "\" id=\"input-field-" + fields[i].id + "\" value=\"" + fields[i].value + "\"/>";
							break;
						case "hidden":
							content += "<input type=\"hidden\" name=\"" + fields[i].id + "\" id=\"input-field-" + fields[i].id + "\" value=\"" + fields[i].value + "\"/>";
							break;
						case "textarea":
							content += "<textarea name=\"" + fields[i].id + "\" id=\"input-field-" + fields[i].id + "\" cols=\"10\" rows=\"10\">" + fields[i].value + "</textarea>";
							break;
						case "select":
							content += "<select name=\"" + fields[i].id + "\" id=\"input-field-" + fields[i].id + "\">";
							for (var o = 0, lo = fields[i].value.length; o < lo; o++) {
								content += "<option value=\"" +fields[i].value[o].value + "\">" + fields[i].value[o].text  + "</option>";
							}
							content += "</select>";
							break;
						case "checkBoxGroup":
							content += "<ul class=\"inputs-list\">";
							for (var o = 0, lo = fields[i].value.length; o < lo; o++) {
								content += "<li><label for=\"" + fields[i].id + "-" + fields[i].value[o].value + "\"><input type=\"checkbox\" " + (fields[i].value[o].checked ? "checked=\"checked\" " : "") + "name=\"" + fields[i].id + "-" + fields[i].value[o].value + "\" id=\"" + fields[i].id + "-" + fields[i].value[o].value + "\" value=\"true\"/>" + fields[i].value[o].text  + "</label></li> ";
							}
							content += "</ul>";
							break;
						case "password":
							content += "<input type=\"password\" name=\"" + fields[i].id + "\" id=\"input-field-" + fields[i].id + "\">";
							break;
						case "info":
							content += "<div class=\"faux-input\">" + fields[i].value + "</div>";
							content += "<input type=\"hidden\" name=\"" + fields[i].id + "\" id=\"input-field-" + fields[i].id + "\" value=\"" + fields[i].value + "\"/>";
							break;
					}
					content += "</div>";
				}
				content += "</fieldset></form>";
				content += "<p class=\"question\">";
				content += html.confirmButton.replace("{label}", args.confirmLabel);
				if (args.prohibitCancel === true) {
					content += "</p>";
				} else {
					content += "&nbsp;";
					content += html.cancelButton.replace("{label}", args.cancelLabel);
					content += "</p>";
					content += html.closeButton;
				}
				
				state = "busy";
				uiUtils.cover.show(function() {
					showDialogueWindow({
						"message": content,
						"type": "form",
						"callback": function() {
							$("#close-o-ui-msg").bind("click", function() {
								hideDialogueWindow();
								uiUtils.cover.hide();
								if (typeof(args.onCancel) != "undefined") {
									args.onCancel.call();
								}
								$("#close-o-ui-msg").unbind();
								return false;
							});
							$("#o-ui-msg form").bind("submit", function() {
								var valid = true;
								for (var i = 0, l = args.fields.length; i < l; i++) {
									var fieldElm = $("#input-field-" + args.fields[i].id);
									if ((args.fields[i].required && $.trim(fieldElm.attr("value")) === "")) {
										valid = false;
										fieldElm.addClass("has-error");
									} else if (typeof(args.fields[i].match) != "undefined") {
										if ($.trim(fieldElm.attr("value")) != $.trim($("#input-field-" + args.fields[i].match).attr("value"))) {
											valid = false;
											fieldElm.addClass("no-match");
											uiUtils.debug("passwords don't match");
										}
									}
								}
								if (valid) {
									hideDialogueWindow();
									if (!args.onConfirmKeepCover) {
										uiUtils.cover.hide();							
									}
									if (typeof(args.onConfirm) != "undefined") {
										args.onConfirm.call(this, uiUtils.serialize("#o-ui-msg form"));
									}
									$("#o-ui-msg form").unbind();
									$("#o-ui-msg .question .btn.primary").unbind();
								} else {
									uiUtils.flash(".has-error", function(elm) {
										elm.removeClass("has-error");
									});
									uiUtils.shake(".no-match", function(elm) {
										elm.removeClass("no-match");
									});
								}
								return false;
							});
							$("#o-ui-msg .question .btn.primary").bind("click", function() {
								$("#o-ui-msg form").submit();
								return false;
							});
							$("#o-ui-msg .question .btn.discrete").bind("click", function() {
								hideDialogueWindow();
								uiUtils.cover.hide();
								if (typeof(args.onCancel) != "undefined") {
									args.onCancel.call();
								}
								$("#o-ui-msg .question .btn.discrete").unbind();
								return false;
							});
						}
					});
				});
			}
		}
	};
}();	

/* color tweening & easings */
(function(c){c.each(["backgroundColor","borderBottomColor","borderLeftColor","borderRightColor","borderTopColor","color","outlineColor"],function(e,d){c.fx.step[d]=function(f){if(f.state===0){f.start=b(f.elem,d);f.end=a(f.end)}f.elem.style[d]="rgb("+[Math.max(Math.min(parseInt((f.pos*(f.end[0]-f.start[0]))+f.start[0]),255),0),Math.max(Math.min(parseInt((f.pos*(f.end[1]-f.start[1]))+f.start[1]),255),0),Math.max(Math.min(parseInt((f.pos*(f.end[2]-f.start[2]))+f.start[2]),255),0)].join(",")+")"}});function a(e){var d;if(e&&e.constructor==Array&&e.length==3){return e}if(d=/rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(e)){return[parseInt(d[1]),parseInt(d[2]),parseInt(d[3])]}if(d=/rgb\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*\)/.exec(e)){return[parseFloat(d[1])*2.55,parseFloat(d[2])*2.55,parseFloat(d[3])*2.55]}if(d=/#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(e)){return[parseInt(d[1],16),parseInt(d[2],16),parseInt(d[3],16)]}if(d=/#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/.exec(e)){return[parseInt(d[1]+d[1],16),parseInt(d[2]+d[2],16),parseInt(d[3]+d[3],16)]}}function b(f,d){var e;do{e=c.curCSS(f,d);if(e!=""&&e!="transparent"||c.nodeName(f,"body")){break}d="backgroundColor"}while(f=f.parentNode);return a(e)}})(jQuery);jQuery.easing["jswing"]=jQuery.easing["swing"];jQuery.extend(jQuery.easing,{def:"easeOutQuad",easeInOutExpo:function(e,f,a,h,g){if(f==0){return a}if(f==g){return a+h}if((f/=g/2)<1){return h/2*Math.pow(2,10*(f-1))+a}return h/2*(-Math.pow(2,-10*--f)+2)+a}});

uiUtils.init();