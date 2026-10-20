REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_donation_review() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_request_created() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_request_status() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;