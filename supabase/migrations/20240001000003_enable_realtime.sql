-- Enable realtime for session_registrations
begin;
  -- supabase_realtime publication usually exists, we just add the table to it
  alter publication supabase_realtime add table session_registrations;
commit;
