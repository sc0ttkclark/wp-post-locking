/***********************************************
 * This JS handles all of the heartbeat API calls
 * and post locking integration.
 ***********************************************/
(function ( $ ) {
	// Check every 15 seconds for post lock changes.
	var heartbeat_interval = 15;

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
		var received, wrap;

		if ( data['wp-refresh-post-lock'] ) {
			received = data['wp-refresh-post-lock'];

			if ( received.lock_error ) {
				// Show "editing taken over" message.
				wrap = $( '#skc_post_locking_dialog' );

				if ( wrap.length ) {
					// Show wrap if it is hidden.
					if ( wrap.hasClass( 'hidden' ) ) {
						wrap.removeClass( 'hidden' );
					}

					// Set user fields.
					$( '.skc-post-locking-user-display-name', wrap ).text( received.lock_error.display_name );
					$( '.skc-post-locking-user-role', wrap ).text( received.lock_error.role );

					// Hide ACF form on page.
					$( '.acf-form' ).addClass( 'hidden' );

					// Hide Pods form on page.
					$( '.pods-form' ).addClass( 'hidden' );

					// Hide GF form on page.
					$( '.gform_wrapper' ).addClass( 'hidden' );
				}
			}
			else {
				if ( received.new_lock ) {
					// Save current active lock.
					$( '#skc_post_locking_active' ).val( received.new_lock );
				}
			}
		}
	} ).ready( function () {
		// Set the heartbeat interval.
		if ( typeof wp !== 'undefined' && wp.heartbeat ) {
			wp.heartbeat.interval( heartbeat_interval );
		}
	} );
}( jQuery ));
