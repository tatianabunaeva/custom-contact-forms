( function( $, ccfSettings ) {
	'use strict';

	window.wp = window.wp || {};

	wp.ccf = wp.ccf || {};
	wp.ccf.validators = wp.ccf.validators || {};

	function isIE() {
		var userAgent = navigator.userAgent.toLowerCase();
		if ( userAgent.indexOf( 'msie' ) != -1 ) {
			return parseInt( userAgent.split( 'msie' )[1] );
		} else {
			return false;
		}
	}


	var _verifiedRecaptcha = {};

	window.ccfRecaptchaOnload = function() {
		var recaptchas = document.querySelectorAll( '.ccf-recaptcha-wrapper' );

		var setupCaptcha = function( formId ) {
			grecaptcha.render( recaptchas[i], {
				sitekey: recaptchas[i].getAttribute( 'data-sitekey' ),
				theme: ccfSettings.recaptcha_theme,
				callback: function() {
					_verifiedRecaptcha[formId] = true;
				}
			});
		};

		for ( var i = 0; i < recaptchas.length; i++ ) {
			var formId = recaptchas[i].getAttribute( 'data-form-id' );

			setupCaptcha( formId );
		}
	};

	var choiceValidator = function( fieldWrapperElement ) {
		this.wrapper = fieldWrapperElement;
		this.errors = {};

		if ( fieldWrapperElement.className.match( ' field-required' ) ) {
			this.inputs = this.wrapper.querySelectorAll( '.field-input' );

			var oldErrorNode = this.wrapper.querySelectorAll( '.error' );
			if ( oldErrorNode.length ) {
				oldErrorNode[0].parentNode.removeChild( oldErrorNode[0] );
			}

			var found = false;

			_.each( this.inputs, function( input ) {
				if ( ( input.checked && input.value ) || input.selected ) {
					found = true;
				}
			});

			if ( ! found ) {
				this.errors[this.inputs[this.inputs.length - 1].getAttribute( 'name' )] = {
					required: true
				};

				var newErrorNode = document.createElement( 'div' );
				newErrorNode.className = 'error required-error';
				newErrorNode.innerHTML = ccfSettings.required;

				fieldWrapperElement.appendChild( newErrorNode );
			}
		}
	};

	var validator = function( inputCallback, fieldCallback ) {
		return function( fieldWrapperElement ) {
			this.wrapper = fieldWrapperElement;
			this.inputs = this.wrapper.querySelectorAll( '.field-input' );
			this.errors = {};

			var oldErrorNodes = this.wrapper.querySelectorAll( '.error' );
			for ( var i = oldErrorNodes.length - 1; i >= 0; i-- ) {
				oldErrorNodes[i].parentNode.removeChild( oldErrorNodes[i] );
			}

			_.each( this.inputs, function( input ) {
				var name = input.getAttribute( 'name' );
				this.errors[name] = {};

				if ( input.getAttribute( 'aria-required' ) ) {
					if ( input.value === '' ) {
						this.errors[name].required = input;
					}
				}

				if ( inputCallback ) {
					inputCallback.call( this, input );
				}
			}, this );

			if ( fieldCallback ) {
				fieldCallback.call( this );
			}

			var newErrorNode;

			for ( var field in this.errors ) {
				if ( this.errors.hasOwnProperty( field ) ) {

					for ( var errorKey in this.errors[field] ) {
						newErrorNode = document.createElement( 'div' );
						newErrorNode.className = 'error ' + errorKey + '-error';
						newErrorNode.setAttribute( 'data-field-name', field );
						newErrorNode.innerHTML = ccfSettings[errorKey];

						this.errors[field][errorKey].parentNode.insertBefore( newErrorNode, this.errors[field][errorKey].nextSibling );
					}
				}
			}
		};
	};

	wp.ccf.validators['single-line-text'] = wp.ccf.validators['single-line-text'] || validator();

	wp.ccf.validators['paragraph-text'] = wp.ccf.validators['paragraph-text'] || validator();

	wp.ccf.validators.name = wp.ccf.validators.name || validator();

	wp.ccf.validators.email = wp.ccf.validators.email || validator( false, function() {
		var email = this.inputs[0].value;

		if ( email ) {
			if ( this.inputs.length === 2 ) {
				if ( email !== this.inputs[1].value ) {
					this.errors[this.inputs[0].getAttribute( 'name' )].match = this.wrapper.lastChild;
				}
			}

			var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
			if ( ! re.test( email ) ) {
				this.errors[this.inputs[0].getAttribute( 'name' )].email = this.wrapper.lastChild;
			}
		}
	});

	wp.ccf.validators.recaptcha = wp.ccf.validators.recaptcha || function( fieldWrapperElement, formId ) {
		this.wrapper = fieldWrapperElement;
		this.inputs = this.wrapper.querySelectorAll( '.g-recaptcha-response' );
		this.errors = {};

		var oldErrorNodes = this.wrapper.querySelectorAll( '.error' );
		for ( var i = oldErrorNodes.length - 1; i >= 0; i-- ) {
			oldErrorNodes[i].parentNode.removeChild( oldErrorNodes[i] );
		}

		if ( ! _verifiedRecaptcha[formId] ) {
			this.errors['g-recaptcha-response'] = {};
			this.errors['g-recaptcha-response'].recaptcha = this.wrapper.lastChild;
		}

		var newErrorNode;

		for ( var field in this.errors ) {
			if ( this.errors.hasOwnProperty( field ) ) {

				for ( var errorKey in this.errors[field] ) {
					newErrorNode = document.createElement( 'div' );
					newErrorNode.className = 'error ' + errorKey + '-error';
					newErrorNode.setAttribute( 'data-field-name', field );
					newErrorNode.innerHTML = ccfSettings[errorKey];

					this.errors[field][errorKey].parentNode.insertBefore( newErrorNode, this.errors[field][errorKey].nextSibling );
				}
			}
		}
	};

	wp.ccf.validators.phone = wp.ccf.validators.phone || validator( false, function() {
		var phone = this.inputs[0].value;

		if ( phone ) {
			var re = /^[0-9+.)(\-]+$/;

			if ( ! re.test( phone ) ) {
				this.errors[this.inputs[0].getAttribute( 'name' )].phone = this.wrapper.lastChild;
			} else {
				if ( 'us' === this.wrapper.getAttribute( 'data-phone-format' ) ) {
					var strippedPhone = phone.replace( /[^0-9]/, '' );

					if ( strippedPhone.length !== 10 ) {
						this.errors[this.inputs[0].getAttribute( 'name' )].digits = this.wrapper.lastChild;
					}
				}
			}
		}
	});

	wp.ccf.validators.date = wp.ccf.validators.date || function( fieldWrapperElement ) {
		this.wrapper = fieldWrapperElement;
		this.errors = {};
		this.inputs = this.wrapper.querySelectorAll( '.field-input' );

		var oldErrorNodes = this.wrapper.querySelectorAll( '.error' );
		for ( var i = oldErrorNodes.length - 1; i >= 0; i-- ) {
			oldErrorNodes[i].parentNode.removeChild( oldErrorNodes[i] );
		}

		var newErrorNode;

		_.each( this.inputs, function( input ) {
			var name = input.getAttribute( 'name' );
			this.errors[name] = {};

			if ( input.getAttribute( 'aria-required' ) ) {
				if ( input.value === '' ) {
					this.errors[name].required = true;

					newErrorNode = document.createElement( 'div' );
					newErrorNode.className = 'error required-error';

					if ( this.inputs.length === 1 ) {
						newErrorNode.innerHTML = ccfSettings.required;
						newErrorNode.className += ' right-error';
						input.parentNode.insertBefore( newErrorNode, input.nextSibling );
					} else {
						newErrorNode.innerHTML = ccfSettings[ name.replace( /.*\[(.*?)\]/i, '$1' ) + '_required'];
						fieldWrapperElement.appendChild( newErrorNode );
					}
				}
			}

			if ( input.value !== '' ) {
				var type = name.replace( /^.*\[(.*?)\]$/, '$1');

				if ( type === 'date' ) {
					if ( ! input.value.match( /^([0-9]|\/)+$/ ) ) {
						newErrorNode = document.createElement( 'div' );
						newErrorNode.className = 'error date-error';
						newErrorNode.innerHTML = ccfSettings.date;
						fieldWrapperElement.appendChild( newErrorNode );
					}
				} else if ( type === 'hour' ) {
					if ( ! input.value.match( /^[0-9]+$/ ) ) {
						newErrorNode = document.createElement( 'div' );
						newErrorNode.className = 'error hour-error';
						newErrorNode.innerHTML = ccfSettings.hour;
						fieldWrapperElement.appendChild( newErrorNode );
					}
				} else if ( type === 'minute' ) {
					if ( ! input.value.match( /^[0-9]+$/ ) ) {
						newErrorNode = document.createElement( 'div' );
						newErrorNode.className = 'error minute-error';
						newErrorNode.innerHTML = ccfSettings.minute;
						fieldWrapperElement.appendChild( newErrorNode );
					}
				}
			}
		}, this );
	};

	wp.ccf.validators.address = wp.ccf.validators.address || validator();

	wp.ccf.validators.file = wp.ccf.validators.file || function( fieldWrapperElement ) {
		this.wrapper = fieldWrapperElement;
		this.inputs = this.wrapper.querySelectorAll( '.field-input' );
		this.errors = {};

		var oldErrorNodes = this.wrapper.querySelectorAll( '.error' );
		for ( var i = oldErrorNodes.length - 1; i >= 0; i-- ) {
			oldErrorNodes[i].parentNode.removeChild( oldErrorNodes[i] );
		}

		_.each( this.inputs, function( input ) {
			var name = input.getAttribute( 'name' );
			this.errors[name] = {};

			if ( input.getAttribute( 'aria-required' ) ) {
				if ( input.value === '' ) {
					this.errors[name].required = input;
				}
			}
		}, this );

		var file = this.inputs[0];
		var maxFileSize = this.wrapper.getAttribute( 'data-max-file-size' );
		var fileExtensions = this.wrapper.getAttribute( 'data-file-extensions' );

		if ( file.value ) {

			if ( maxFileSize ) {
				var maxFileSizeBytes = parseInt( maxFileSize ) * 1000 * 1000;

				if ( file.files ) {
					if ( maxFileSizeBytes < file.files[0].size ) {
						this.errors[this.inputs[0].getAttribute( 'name' )].fileSize = this.wrapper.lastChild;
					}
				} else if ( typeof ActiveXObject !== 'undefined' ) {
					var fso = new ActiveXObject("Scripting.FileSystemObject");
					var filePath = document.upload.file.value;
					var ieFile = fso.getFile( filePath );
					var size = ieFile.size;

					debugger;
				}
			}

			if ( fileExtensions ) {
				var fileExtensionsArray = fileExtensions.replace( ';', ',' );
				fileExtensionsArray = fileExtensionsArray.replace( ' ', '' );
				fileExtensionsArray = fileExtensionsArray.split( ',' );

				if ( fileExtensionsArray.length ) {
					if ( file.files ) {
						var extension = file.files[0].name.replace( /^.*\.(.+)$/g, '$1' );

						if ( _.indexOf( fileExtensionsArray, extension ) === -1 ) {
							this.errors[this.inputs[0].getAttribute( 'name' )].fileExtension = this.wrapper.lastChild;
						}
					}
				}
			}
		}

		var newErrorNode;

		for ( var field in this.errors ) {
			if ( this.errors.hasOwnProperty( field ) ) {

				for ( var errorKey in this.errors[field] ) {
					newErrorNode = document.createElement( 'div' );
					newErrorNode.className = 'error ' + errorKey + '-error';
					newErrorNode.setAttribute( 'data-field-name', field );
					newErrorNode.innerText = ccfSettings[errorKey];

					if ( 'fileExtension' === errorKey && fileExtensions ) {
						newErrorNode.innerText += ' (' + fileExtensions + ')';
					} else if ( 'fileSize' === errorKey && maxFileSize ) {
						newErrorNode.innerText += ' (' + maxFileSize + ' MB)';
					}

					this.errors[field][errorKey].parentNode.insertBefore( newErrorNode, this.errors[field][errorKey].nextSibling );
				}
			}
		}
	};

	wp.ccf.validators.website = wp.ccf.validators.website || validator( function( input ) {
		if ( input.value ) {
			var re = /^http(s?)\:\/\/(([a-zA-Z0-9\-\._]+(\.[a-zA-Z0-9\-\._]+)+)|localhost)(\/?)([a-zA-Z0-9\-\.\?\,\'\/\\\+&amp;%\$#_]*)?([\d\w\.\/\%\+\-\=\&amp;\?\:\\\&quot;\'\,\|\~\;]*)$/;

			if ( ! re.test( input.value ) ) {
				this.errors[input.getAttribute( 'name' )].website = input;
			}
		}
	});

	wp.ccf.validators.checkboxes = wp.ccf.validators.checkboxes || choiceValidator;

	wp.ccf.validators.dropdown = wp.ccf.validators.dropdown || validator();

	wp.ccf.validators.radio = wp.ccf.validators.radio || choiceValidator;

	wp.ccf.setupDOM = wp.ccf.setupDOM || function() {
		var datepickers = document.querySelectorAll( '.ccf-datepicker' );

		for ( var i = 0; i < datepickers.length; i++ ) {
			$( datepickers[i] ).datepicker();
		}

		var forms = document.querySelectorAll( '.ccf-form-wrapper' );

		if ( forms.length >= 1 ) {
			_.each( forms, function( formWrapper ) {

				var form = formWrapper.querySelectorAll( '.ccf-form' )[0];
				var $form = $( form );
				var formId = parseInt( formWrapper.getAttribute( 'data-form-id' ) );
				var button = form.querySelectorAll( '.ccf-submit-button' )[0];
				var frame = document.getElementById( 'ccf_form_frame_' + formId );
				var $loading = $( form.querySelectorAll( '.loading-img' )[0] );
				var $frame = $( frame );

				button.setAttribute( 'type', 'button' );

				var fieldsBySlug = {};

				$frame.on( 'load', function() {
					var data;
					try {
						data = $.parseJSON( frame.contentWindow.document.body.innerText );
					} catch ( error ) {

					}

					form.className = form.className.replace( / loading/i, '' );
					$loading.animate( { opacity: 0 } );
					_verifiedRecaptcha[formId] = false;

					if ( data.success ) {
						if ( 'text' === data.action_type && data.completion_message ) {
							form.innerHTML = data.completion_message;

							$( 'html, body' ).animate( {
								scrollTop: $( form ).offset().top
							}, 500 );
						} else if ( 'redirect' === data.action_type && data.completion_redirect_url ) {
							document.location = data.completion_redirect_url;
						}
					} else {
						if ( data.field_errors ) {
							_.each( data.field_errors, function( errors, slug ) {
								var inputs = fieldsBySlug[slug].querySelectorAll( '.field-input' );

								for ( var error in errors ) {
									if ( errors.hasOwnProperty( error ) ) {
										var newErrorNode = document.createElement( 'div' );
										newErrorNode.className = 'error ' + error + '-error';
										newErrorNode.innerHTML = errors[error];

										if ( inputs.length === 1 ) {
											inputs[inputs.length - 1].parentNode.insertBefore( newErrorNode, inputs[inputs.length - 1].nextSibling );
										} else {
											fieldsBySlug[slug].appendChild( newErrorNode );
										}
									}
								}
							});
						}
					}

				});

				button.onclick = function() {
					form.target = 'ccf_form_frame_' + formId;
					form.action = ccfSettings.ajaxurl;
					$form.submit();
				};

				function formSubmit( event ) {
					var fields = formWrapper.querySelectorAll( '.field' );

					var errors = [];

					_.each( fields, function( field ) {
						if ( field.className.match( / skip-field/i ) ) {
							return;
						}

						var type = field.getAttribute( 'data-field-type' );
						var slug = field.getAttribute( 'data-field-slug' );

						fieldsBySlug[slug] = field;

						var validation = new ( wp.ccf.validators[type] )( field, formId );

						if ( _.size( validation.errors ) ) {
							var validationErrors = 0;
							for ( var key in validation.errors ) {
								if ( validation.errors.hasOwnProperty( key ) ) {
									if ( _.size( validation.errors[key] ) ) {
										validationErrors++;
									}
								}
							}

							if ( validationErrors > 0 ) {
								errors.push( validation );
							}
						}
					});

					if ( errors.length ) {
						event.returnFalse = false;

						if ( event.preventDefault ) {
							event.preventDefault();
						}

						// Trigger errors, mostly for unit testing
						$form.trigger( 'ccfFormError', errors );

						var docViewTop = $( window ).scrollTop();
						var docViewBottom = docViewTop + $( window ).height();

						var $firstError = $( errors[0].wrapper );
						var $firstErrorOffset = $firstError.offset();

						var top = $firstErrorOffset.top;
						var bottom = top + $firstError.height();

						if ( ! ( docViewTop <= top && docViewBottom >= bottom ) ) {
							$( 'html, body' ).animate( {
								scrollTop: $firstError.offset().top
							}, 500 );
						}

						return false;
					} else {
						// Notify form complete, mostly for unit testing
						$form.trigger( 'ccfFormSuccess' );

						formWrapper.className = formWrapper.className.replace( / loading/i, '' ) + ' loading';

						$loading.animate( { opacity: 100 } );
					}

					return true;
				}

				$form.on( 'submit', formSubmit );

			});
		}
	};

	/**
	 * Register listeners on DOM
	 */
	$( document ).ready( wp.ccf.setupDOM );
})( jQuery, ccfSettings );