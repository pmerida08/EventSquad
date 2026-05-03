-- ─────────────────────────────────────────────────────────────────────────────
-- Fase 6: Triggers de notificaciones push
-- Helper _push_send + triggers para:
--   • Nuevo mensaje en el chat
--   • Alguien se une al grupo
--   • Punto de encuentro elegido
-- Cron: recordatorio 2 horas antes del evento
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Helper: llama a la Edge Function via pg_net ────────────────────────────
CREATE OR REPLACE FUNCTION public._push_send(
  p_tokens  text[],
  p_title   text,
  p_body    text,
  p_data    jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_url     text := current_setting('app.supabase_url',     true);
  v_key     text := current_setting('app.service_role_key', true);
  v_payload jsonb;
BEGIN
  IF v_url IS NULL OR v_key IS NULL THEN RETURN; END IF;
  IF p_tokens IS NULL OR array_length(p_tokens, 1) IS NULL THEN RETURN; END IF;

  SELECT jsonb_build_object(
    'notifications',
    jsonb_agg(
      jsonb_build_object('token', t, 'title', p_title, 'body', p_body, 'data', p_data)
    )
  ) INTO v_payload
  FROM unnest(p_tokens) t
  WHERE t IS NOT NULL AND t <> '';

  IF v_payload -> 'notifications' IS NULL THEN RETURN; END IF;

  PERFORM net.http_post(
    url     := v_url || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body    := v_payload
  );
END;
$$;

-- ── 2. Trigger: nuevo mensaje en el chat ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public._notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_sender text;
  v_group  text;
  v_tokens text[];
  v_body   text;
BEGIN
  SELECT pr.display_name, g.name
    INTO v_sender, v_group
    FROM profiles pr
    JOIN groups   g ON g.id = NEW.group_id
   WHERE pr.id = NEW.user_id;

  v_body := coalesce(v_sender, 'Alguien') || ': ' || left(NEW.content, 100);
  IF char_length(NEW.content) > 100 THEN v_body := v_body || '…'; END IF;

  SELECT array_agg(pr.expo_push_token)
    INTO v_tokens
    FROM group_members gm
    JOIN profiles pr ON pr.id = gm.user_id
   WHERE gm.group_id = NEW.group_id
     AND gm.user_id  <> NEW.user_id
     AND pr.expo_push_token IS NOT NULL
     AND pr.expo_push_token <> '';

  PERFORM public._push_send(
    v_tokens,
    coalesce(v_group, 'EventSquad'),
    v_body,
    jsonb_build_object('type', 'new_message', 'groupId', NEW.group_id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_message ON public.messages;
CREATE TRIGGER trg_notify_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public._notify_new_message();

-- ── 3. Trigger: nuevo miembro en el grupo ────────────────────────────────────
CREATE OR REPLACE FUNCTION public._notify_new_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_new_member  text;
  v_group_name  text;
  v_owner_token text;
BEGIN
  -- No notificar cuando es el propio owner creando el grupo
  IF NEW.role = 'owner' THEN RETURN NEW; END IF;

  SELECT pr.display_name, g.name
    INTO v_new_member, v_group_name
    FROM profiles pr
    JOIN groups   g ON g.id = NEW.group_id
   WHERE pr.id = NEW.user_id;

  SELECT pr.expo_push_token
    INTO v_owner_token
    FROM group_members gm
    JOIN profiles pr ON pr.id = gm.user_id
   WHERE gm.group_id = NEW.group_id
     AND gm.role     = 'owner'
     AND pr.expo_push_token IS NOT NULL
     AND pr.expo_push_token <> ''
   LIMIT 1;

  IF v_owner_token IS NOT NULL THEN
    PERFORM public._push_send(
      ARRAY[v_owner_token],
      coalesce(v_group_name, 'EventSquad'),
      coalesce(v_new_member, 'Alguien') || ' se ha unido al grupo',
      jsonb_build_object('type', 'new_member', 'groupId', NEW.group_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_member ON public.group_members;
CREATE TRIGGER trg_notify_new_member
  AFTER INSERT ON public.group_members
  FOR EACH ROW EXECUTE FUNCTION public._notify_new_member();

-- ── 4. Trigger: punto de encuentro elegido ────────────────────────────────────
CREATE OR REPLACE FUNCTION public._notify_voting_winner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_tokens text[];
  v_time   text;
BEGIN
  -- Solo cuando selected pasa de false a true
  IF NOT (OLD.selected = false AND NEW.selected = true) THEN RETURN NEW; END IF;

  v_time := to_char(NEW.proposed_time AT TIME ZONE 'Europe/Madrid', 'DD/MM "a las" HH24:MI');

  SELECT array_agg(pr.expo_push_token)
    INTO v_tokens
    FROM group_members gm
    JOIN profiles pr ON pr.id = gm.user_id
   WHERE gm.group_id = NEW.group_id
     AND pr.expo_push_token IS NOT NULL
     AND pr.expo_push_token <> '';

  PERFORM public._push_send(
    v_tokens,
    'Punto de encuentro acordado',
    NEW.location_name || ' — ' || v_time,
    jsonb_build_object('type', 'voting_winner', 'groupId', NEW.group_id, 'proposalId', NEW.id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_voting_winner ON public.meetup_proposals;
CREATE TRIGGER trg_notify_voting_winner
  AFTER UPDATE ON public.meetup_proposals
  FOR EACH ROW EXECUTE FUNCTION public._notify_voting_winner();

-- ── 5. Función: recordatorio 2 horas antes del evento ────────────────────────
-- Busca propuestas ganadoras cuyo proposed_time está entre 115 y 125 min desde ahora
CREATE OR REPLACE FUNCTION public._send_meetup_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  r        record;
  v_tokens text[];
  v_time   text;
BEGIN
  FOR r IN
    SELECT mp.id, mp.group_id, mp.location_name, mp.proposed_time
    FROM   meetup_proposals mp
    WHERE  mp.selected = true
      AND  mp.proposed_time BETWEEN now() + interval '115 minutes'
                                AND now() + interval '125 minutes'
  LOOP
    v_time := to_char(r.proposed_time AT TIME ZONE 'Europe/Madrid', 'HH24:MI');

    SELECT array_agg(pr.expo_push_token)
      INTO v_tokens
      FROM group_members gm
      JOIN profiles pr ON pr.id = gm.user_id
     WHERE gm.group_id = r.group_id
       AND pr.expo_push_token IS NOT NULL
       AND pr.expo_push_token <> '';

    PERFORM public._push_send(
      v_tokens,
      '¡Faltan 2 horas!',
      r.location_name || ' — ' || v_time,
      jsonb_build_object('type', 'meetup_reminder', 'groupId', r.group_id)
    );
  END LOOP;
END;
$$;

-- Cron cada 10 minutos para detectar el window de 2h antes del evento
SELECT cron.unschedule('meetup-reminders')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'meetup-reminders');

SELECT cron.schedule(
  'meetup-reminders',
  '*/10 * * * *',
  'SELECT public._send_meetup_reminders()'
);
