# Post Locking for Frontend
Drop-in post locking for WordPress on the frontend

This plugin works for Pods, ACF, and Gravity Forms out of the box.

## Example (singular)

```php
// This will render the notice and return whether or not
// the post was locked so you can do additional logic.
$is_locked = skc_post_lock_frontend_notice( $post_id );

// If the post is not locked, you may wish to show a form.
if ( ! $is_locked ) {
	// Show an ACF form.
	acf_form( $form_settings );

	// Show a Pods form.
	$pod = pods( 'my-cpt' );
	echo $pod->form();

	// Show a GF form.
	gravity_form( 123 );
}
```

## Example (list)

```php
// This will render the notice and return whether or not
// the post was locked so you can do additional logic.
$is_locked = skc_post_lock_frontend_list_notice( $post_id );

// If the post is not locked, you may wish to show a form.
if ( ! $is_locked ) {
	// Show an edit link.
	echo '<a href="/my-cpt/1234/edit/">Edit this</a>';
}
```

## FAQ

### When does post locking update?

When a person goes to the singular page that has locking support (calls `skc_post_lock_frontend_notice( $post_id )`), the lock is set as active for the current user if the user is logged on. Every 15 seconds, the browser will check the lock status and refresh it. After 150 seconds of inactivity, the lock is considered inactive and other people are given the chance to start editing. If the page becomes active again in the browser, the lock will become active again (unless someone else has taken control).

You can customize the inactivity limit by filtering the `wp_check_post_lock_window` filter:

```php
add_filter( 'wp_check_post_lock_window', function( $limit ) {
	// Set the limit to 200 seconds to timeout the lock.
	return 200;
} );
```

If you wish to disable setting the lock as active, simply set the second parameter as `false` like this: `skc_post_lock_frontend_notice( $post_id, false )`.

### What if someone else takes control?

The notice will be displayed that someone else has control already.

If you are using the form on the singular page and someone else takes control from the WP Dashboard area (/wp-admin/), the notice will be displayed within 15 seconds and the form will be hidden from view.

If you are using the integration on a list view and someone else takes control of a post, the notice will be displayed within 15 seconds.

### Can I filter what text is shown for the display name or role?

Yes! Just add a filter on 

```php
add_filter( 'skc_post_locking_display_name_role', function( $display_name_role, $user_id ) {
	// Customize display_name however you want.
	$display_name_role['display_name'] .= ' ' . get_user_meta( $user_id, 'some_meta_key', true );

	// Customize role however you want, return an empty string to hide role entirely.
	$display_name_role['role'] .= ' ' . get_user_meta( $user_id, 'some_other_meta_key', true );

	return $display_name_role;
} );
```

## What's next

* Trigger an event with JS on `$(document)` so that someone can trigger a lock/unlock action for another form provider
