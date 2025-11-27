-- Enable pgcrypto for password hashing
create extension if not exists pgcrypto;

-- Function to create a user (Manager/Admin only)
create or replace function create_user_by_manager(
  email text,
  password text,
  name text,
  role text,
  company_id uuid,
  cpf text default null
)
returns uuid
language plpgsql
security definer -- Runs with privileges of the creator (postgres)
as $$
declare
  new_user_id uuid;
begin
  -- Generate new ID
  new_user_id := gen_random_uuid();

  -- 1. Insert into auth.users
  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  values (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    email,
    crypt(password, gen_salt('bf')), -- Hash password
    now(), -- Auto-confirm email
    null,
    null,
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('name', name, 'role', role, 'company_id', company_id),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- 2. Insert or Update public.profiles
  -- We use ON CONFLICT in case a trigger already created the profile
  insert into public.profiles (id, name, email, role, company_id, cpf)
  values (new_user_id, name, email, role, company_id, cpf)
  on conflict (id) do update
  set
    name = excluded.name,
    role = excluded.role,
    company_id = excluded.company_id,
    cpf = excluded.cpf;

  return new_user_id;
end;
$$;
