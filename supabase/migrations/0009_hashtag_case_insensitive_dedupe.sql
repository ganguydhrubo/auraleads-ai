-- Hashtag dedupe (#SalesAutomation vs #salesautomation) was only ever
-- checked client-side against in-memory state (lib/store/app-store.tsx),
-- so two browser tabs, a slow reload, or the client simply being stale could
-- both add "the same" hashtag with different casing. This makes the
-- workspace-scoped case-insensitive uniqueness a real DB constraint instead
-- of a client convenience.
--
-- If duplicates already exist in a given workspace, keep the earliest row
-- and drop the rest before the index can be created.

delete from hashtags a
using hashtags b
where a.workspace_id = b.workspace_id
  and lower(a.tag) = lower(b.tag)
  and (a.created_at, a.id) > (b.created_at, b.id);

create unique index if not exists idx_hashtags_workspace_tag_ci
  on hashtags (workspace_id, lower(tag));
