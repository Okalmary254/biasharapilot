-- BiasharaPilot AI
-- Migration 005: allow authenticated Data API requests to evaluate auth.user_id().
--
-- public.app_user_id() and the RLS policies call auth.user_id() to identify
-- the signed-in user. PostgreSQL checks schema USAGE before function EXECUTE,
-- so both privileges are required by the Data API's authenticated role.

grant usage on schema auth to authenticated;
grant execute on function auth.user_id() to authenticated;
