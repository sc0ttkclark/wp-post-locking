/***********************************************
 * This JS handles all of the heartbeat API calls
 * and post locking integration.
 ***********************************************/
(function ( $ ) {
	// Check every 15 seconds for post lock changes.
	var heartbeat_interval = 15;

	/**
	 * Handle updating the notice.
	 *
	 * @param lock_error String
	 * @param wrap       Object
	 */
	function update_notice( lock_error, wrap ) {
		if ( !wrap.length ) {
			return;
		}

		// Show wrap if it is hidden.
		if ( wrap.hasClass( 'hidden' ) ) {
			wrap.removeClass( 'hidden' );
		}

		// Set user fields.
		$( '.skc-post-locking-user-display-name', wrap ).text( lock_error.display_name );
		$( '.skc-post-locking-user-role', wrap ).text( lock_error.role );
	}

	/**
	 * Handle removing the notice.
	 *
	 * @param wrap Object
	 */
	function remove_notice( wrap ) {
		if ( !wrap.length ) {
			return;
		}

		// Hide wrap if it is not hidden.
		if ( !wrap.hasClass( 'hidden' ) ) {
			wrap.addClass( 'hidden' );
		}

		// Clear user fields.
		$( '.skc-post-locking-user-display-name', wrap ).text( '' );
		$( '.skc-post-locking-user-role', wrap ).text( '' );
	}

	$( document ).on( 'heartbeat-send.refresh-lock', function ( e, data ) {
		/**
		 * Heartbeat locks.
		 *
		 * Used to lock editing of an object by only one user at a time.
		 *
		 * When the user does not send a heartbeat in a heartbeat-time
		 * the user is no longer editing and another user can start editing.
		 */
		var lock = $( '#skc_post_locking_active' ).val(), post_id = $( '#skc_post_locking_post_id' ).val(), send = {};

		if ( !post_id || !$( '#skc_post_locking_dialog' ).length ) {
			return;
		}

		send.post_id = post_id;

		if ( lock ) {
			send.lock = lock;
		}

		data['wp-refresh-post-lock'] = send;
	} ).on( 'heartbeat-tick.refresh-lock', function ( e, data ) {
		// Post locks: update the lock string or show the dialog if somebody has taken over editing.
		var received = {}, wrap = {}, lock_error = {};

		if ( data['wp-refresh-post-lock'] ) {
			received = data['wp-refresh-post-lock'];

			wrap = $( '#skc_post_locking_dialog' );

			if ( received.lock_error ) {
				lock_error = received.lock_error;

				// Update the notice.
				update_notice( lock_error, wrap );

				// Hide ACF form on page.
				$( '.acf-form' ).addClass( 'hidden skc-post-locking-form-inactive' );

				// Hide Pods form on page.
				$( '.pods-form' ).addClass( 'hidden skc-post-locking-form-inactive' );

				// Hide GF form on page.
				$( '.gform_wrapper' ).addClass( 'hidden skc-post-locking-form-inactive' );

				$( document ).trigger( 'skc-post-locking-single-locked', {
					wrap : wrap, lock_error : received.lock_error
				} );
			}
			else {
				if ( received.new_lock ) {
					// Save current active lock.
					$( '#skc_post_locking_active' ).val( received.new_lock );
				}

				// Remove the notice
				remove_notice( wrap );

				// Show ACF form on page.
				$( '.acf-form.skc-post-locking-form-inactive' ).removeClass( 'hidden skc-post-locking-form-inactive' );

				// Show Pods form on page.
				$( '.pods-form.skc-post-locking-form-inactive' ).removeClass( 'hidden skc-post-locking-form-inactive' );

				// Show GF form on page.
				$( '.gform_wrapper.skc-post-locking-form-inactive' ).removeClass( 'hidden skc-post-locking-form-inactive' );

				// Trigger event.
				$( document ).trigger( 'skc-post-locking-single-unlocked', {
					wrap : wrap
				} );
			}
		}
	} ).on( 'heartbeat-tick.wp-check-locked-posts', function ( e, data ) {
		var locked = data['wp-check-locked-posts'] || {};

		$( '.skc-post-locking-list-dialog' ).each( function ( i, el ) {
			var row = $( el ), post_id = row.data( 'post-id' ), key = 'post-' + post_id, parent_wrapper = row.parent(),
				lock_error = {};

			if ( !post_id ) {
				return;
			}

			if ( locked.hasOwnProperty( key ) ) {
				lock_error = locked[key];

				// Update the notice.
				update_notice( lock_error, row );

				// Mark row as locked.
				if ( !parent_wrapper.hasClass( 'wp-locked' ) ) {
					parent_wrapper.addClass( 'wp-locked' );
				}

				// Trigger event.
				$( document ).trigger( 'skc-post-locking-list-locked', {
					lock_error : lock_error, row : row, parent : parent_wrapper
				} );
			}
			else {
				// Remove the notice.
				remove_notice( row );

				// Mark row as not locked.
				if ( parent_wrapper.hasClass( 'wp-locked' ) ) {
					parent_wrapper.removeClass( 'wp-locked' );
				}

				// Trigger event.
				$( document ).trigger( 'skc-post-locking-list-unlocked', {
					row : row, parent : parent_wrapper
				} );
			}
		} );
	} ).on( 'heartbeat-send.wp-check-locked-posts', function ( e, data ) {
		var check = [];

		$( '.skc-post-locking-list-dialog' ).each( function ( i, el ) {
			var row = $( el ), post_id = row.data( 'post-id' ), key = 'post-' + post_id;

			if ( post_id ) {
				check.push( key );
			}
		} );

		if ( check.length ) {
			data['wp-check-locked-posts'] = check;
		}
	} ).ready( function () {
		// Set the heartbeat interval.
		if ( typeof wp !== 'undefined' && wp.heartbeat ) {
			wp.heartbeat.interval( heartbeat_interval );
		}
	} );

	/*
	 * When the user is trying to load another page, or reloads current page
	 * show a confirmation dialog when there are unsaved changes.
	 */
	$( window ).on( 'unload.edit-post', function ( event ) {
		/*
		 * Unload is triggered (by hand) on removing the Thickbox iframe.
		 * Make sure we process only the main document unload.
		 */
		if ( event.target && event.target.nodeName != '#document' ) {
			return;
		}

		var postID = $( '#skc_post_locking_post_id' ).val();
		var postLock = $( '#skc_post_locking_active' ).val();

		if ( !postID || !postLock ) {
			return;
		}

		var data = {
			action           : 'wp-remove-post-lock',
			_wpnonce         : $( '#skc_post_locking_wpnonce' ).val(),
			post_ID          : postID,
			active_post_lock : postLock
		};

		if ( window.FormData && window.navigator.sendBeacon ) {
			var formData = new window.FormData();

			$.each( data, function ( key, value ) {
				formData.append( key, value );
			} );

			if ( window.navigator.sendBeacon( ajaxurl, formData ) ) {
				return;
			}
		}

		// Fall back to a synchronous POST request.
		// See https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon
		$.post( {
			async : false, data : data, url : ajaxurl
		} );
	} );
}( jQuery ));
