# Post Locking for Frontend
Drop-in post locking for WordPress on the frontend

## Example (singular)

```php
// This will render the notice and return whether or not
// the post was locked so you can do additional logic.
$is_locked = bpl_post_lock_frontend_notice( $post_id );

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
$is_locked = bpl_post_lock_frontend_list_notice( $post_id );

// If the post is not locked, you may wish to show a form.
if ( ! $is_locked ) {
	// Show an edit link.
	echo '<a href="/my-cpt/1234/edit/">Edit this</a>';
}
```
