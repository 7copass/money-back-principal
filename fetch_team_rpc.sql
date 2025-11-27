-- ==================================================================
-- RPC: get_company_team
-- ==================================================================
-- Descrição:
--   Retorna todos os usuários (perfis) de uma empresa específica.
--   Usa SECURITY DEFINER para contornar políticas RLS e permitir
--   que Admins vejam todos os membros da equipe.
--
-- Uso no frontend:
--   const { data, error } = await supabase.rpc('get_company_team', {
--     company_id_input: companyId
--   });
-- ==================================================================

CREATE OR REPLACE FUNCTION get_company_team(company_id_input UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    role TEXT,
    company_id UUID,
    cpf TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.name,
        p.email,
        p.role,
        p.company_id,
        p.cpf
    FROM profiles p
    WHERE p.company_id = company_id_input
    ORDER BY p.name;
END;
$$;

-- Comentário explicativo
COMMENT ON FUNCTION get_company_team IS 'Retorna todos os membros (profiles) de uma empresa específica, contornando RLS';
