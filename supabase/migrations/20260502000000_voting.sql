-- ─────────────────────────────────────────────────────────────────────────────
-- Fase 5: Sistema de votación para punto de encuentro
-- Tablas: meetup_proposals, meetup_votes
-- Vista:  meetup_proposals_with_votes
-- RPCs:   add_meetup_proposal, vote_for_proposal
-- ─────────────────────────────────────────────────────────────────────────────

-- ── meetup_proposals ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.meetup_proposals (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id       uuid        NOT NULL REFERENCES public.groups(id)    ON DELETE CASCADE,
  proposed_by    uuid        NOT NULL REFERENCES public.profiles(id),
  location_name  text        NOT NULL CHECK (char_length(trim(location_name)) BETWEEN 1 AND 200),
  lat            float8      NOT NULL,
  lng            float8      NOT NULL,
  proposed_time  timestamptz NOT NULL,
  selected       boolean     NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON public.meetup_proposals(group_id);

ALTER TABLE public.meetup_proposals ENABLE ROW LEVEL SECURITY;

-- Solo miembros del grupo pueden leer propuestas
CREATE POLICY "members_read_proposals"
  ON public.meetup_proposals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = meetup_proposals.group_id
        AND gm.user_id  = auth.uid()
    )
  );

-- ── meetup_votes ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.meetup_votes (
  proposal_id  uuid        NOT NULL REFERENCES public.meetup_proposals(id) ON DELETE CASCADE,
  user_id      uuid        NOT NULL REFERENCES public.profiles(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (proposal_id, user_id)
);

ALTER TABLE public.meetup_votes ENABLE ROW LEVEL SECURITY;

-- Solo miembros del grupo pueden leer votos
CREATE POLICY "members_read_votes"
  ON public.meetup_votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM   public.meetup_proposals mp
      JOIN   public.group_members    gm ON gm.group_id = mp.group_id
      WHERE  mp.id          = meetup_votes.proposal_id
        AND  gm.user_id     = auth.uid()
    )
  );

-- ── Vista con conteo de votos ─────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.meetup_proposals_with_votes
  WITH (security_invoker = true)
AS
SELECT
  p.*,
  COUNT(v.user_id)::int AS vote_count
FROM public.meetup_proposals p
LEFT JOIN public.meetup_votes v ON v.proposal_id = p.id
GROUP BY p.id;

-- ── RPC: añadir propuesta ─────────────────────────────────────────────────────
-- Solo accesible para miembros del grupo; lanza NOT_MEMBER si no pertenece.

CREATE OR REPLACE FUNCTION public.add_meetup_proposal(
  p_group_id      uuid,
  p_location_name text,
  p_lat           float8,
  p_lng           float8,
  p_proposed_time timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id     uuid := auth.uid();
  v_proposal_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'NOT_MEMBER';
  END IF;

  INSERT INTO meetup_proposals (group_id, proposed_by, location_name, lat, lng, proposed_time)
  VALUES (p_group_id, v_user_id, trim(p_location_name), p_lat, p_lng, p_proposed_time)
  RETURNING id INTO v_proposal_id;

  RETURN v_proposal_id;
END;
$$;

-- ── RPC: votar por una propuesta ──────────────────────────────────────────────
-- 1 voto por usuario por grupo. Cuando todos los miembros han votado,
-- marca como ganadora la propuesta con más votos (desempate: más antigua).

CREATE OR REPLACE FUNCTION public.vote_for_proposal(p_proposal_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id       uuid := auth.uid();
  v_group_id      uuid;
  v_total_members int;
  v_total_voters  int;
  v_winner_id     uuid;
BEGIN
  -- Obtener el grupo de esta propuesta
  SELECT group_id INTO v_group_id
  FROM meetup_proposals
  WHERE id = p_proposal_id;

  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'PROPOSAL_NOT_FOUND';
  END IF;

  -- Verificar membresía
  IF NOT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = v_group_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'NOT_MEMBER';
  END IF;

  -- 1 voto por usuario por grupo
  IF EXISTS (
    SELECT 1
    FROM   meetup_votes  mv
    JOIN   meetup_proposals mp ON mp.id = mv.proposal_id
    WHERE  mp.group_id = v_group_id AND mv.user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'ALREADY_VOTED';
  END IF;

  -- Votación ya cerrada (ya hay ganador)
  IF EXISTS (
    SELECT 1 FROM meetup_proposals
    WHERE group_id = v_group_id AND selected = true
  ) THEN
    RAISE EXCEPTION 'VOTING_CLOSED';
  END IF;

  -- Insertar voto
  INSERT INTO meetup_votes (proposal_id, user_id) VALUES (p_proposal_id, v_user_id);

  -- ¿Han votado ya todos los miembros?
  SELECT COUNT(*) INTO v_total_members
  FROM group_members WHERE group_id = v_group_id;

  SELECT COUNT(DISTINCT mv.user_id) INTO v_total_voters
  FROM meetup_votes  mv
  JOIN meetup_proposals mp ON mp.id = mv.proposal_id
  WHERE mp.group_id = v_group_id;

  IF v_total_voters >= v_total_members THEN
    -- Ganadora = más votos; desempate por antigüedad (primera propuesta)
    SELECT mp.id INTO v_winner_id
    FROM   meetup_proposals mp
    LEFT JOIN meetup_votes mv ON mv.proposal_id = mp.id
    WHERE  mp.group_id = v_group_id
    GROUP BY mp.id, mp.created_at
    ORDER BY COUNT(mv.user_id) DESC, mp.created_at ASC
    LIMIT 1;

    UPDATE meetup_proposals SET selected = true WHERE id = v_winner_id;
  END IF;
END;
$$;

-- ── Realtime ──────────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE public.meetup_proposals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meetup_votes;
