-- Audit events are append-only (NFR-015). UPDATE and DELETE are rejected for every role.
-- TRUNCATE is intentionally not blocked: it is used only by the test suite and the
-- synthetic seed reset, both of which operate on disposable databases.
CREATE FUNCTION audit_events_reject_modification() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_events is append-only: % is not allowed', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER audit_events_append_only
  BEFORE UPDATE OR DELETE ON audit_events
  FOR EACH ROW EXECUTE FUNCTION audit_events_reject_modification();
