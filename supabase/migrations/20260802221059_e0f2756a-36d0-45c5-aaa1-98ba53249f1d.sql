REVOKE ALL ON FUNCTION public.handle_donation_review() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_request_created() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_request_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_medicine_available() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;