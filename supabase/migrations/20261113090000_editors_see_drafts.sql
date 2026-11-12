-- Haber Var · editörler taslak sayıları ve sorularını görür (salt okunur)
-- Taslağı düzenlemek, başlatmak ve silmek yine sadece yöneticilerde. Veri değişmez;
-- tekrar çalıştırmak sorun olmaz.

create or replace function public.can_view_issue(p_issue_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.issues i
    where i.id = p_issue_id
      and public.is_member(i.group_id)
      and (i.status <> 'draft' or public.is_editor(i.group_id))
  );
$$;

-- Kuralın adı eskisi gibi kalıyor ki dosya tekrar çalıştırılabilsin.
alter policy "sayı: üyeler görür (taslakları sadece yöneticiler)" on public.issues
  using (public.is_member(group_id) and (status <> 'draft' or public.is_editor(group_id)));
