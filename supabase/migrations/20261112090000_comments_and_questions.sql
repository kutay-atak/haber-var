-- Haber Var · anketlere ve "Kim daha çok?" sorularına yorum
-- Yorum artık bir yanıta ya da (oylamalı) bir soruya yazılabilir. Var olan yorumlar,
-- yanıtlar ve sayılar değişmez. Tekrar çalıştırmak sorun olmaz.

alter table public.comments
  add column if not exists issue_question_id uuid references public.issue_questions (id) on delete cascade;
alter table public.comments alter column response_id drop not null;
alter table public.comments drop constraint if exists comments_one_target;
alter table public.comments
  add constraint comments_one_target check ((response_id is null) <> (issue_question_id is null));

-- Yorumun sayısını yanıttan ya da sorudan bulur (güvenlik kuralları sayıya bakar).
create or replace function public.set_comment_defaults()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.response_id is not null then
    select r.issue_id into new.issue_id from public.responses r where r.id = new.response_id;
  else
    select q.issue_id into new.issue_id from public.issue_questions q where q.id = new.issue_question_id;
  end if;
  if new.issue_id is null then
    raise exception 'Yorum yazılacak yanıt ya da soru bulunamadı.';
  end if;
  return new;
end;
$$;

drop trigger if exists comments_set_defaults on public.comments;
create trigger comments_set_defaults
  before insert on public.comments
  for each row execute function public.set_comment_defaults();
