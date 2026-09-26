-- Neither PayPal capture-order nor Razorpay verify-payment recorded which
-- workspace/plan an order was actually created for — verify-payment took
-- `plan` straight from the client request body, and the Razorpay signature
-- only proves the (order_id, payment_id) pair is genuine, not which plan
-- was paid for. That let a user pay for Silver, then call verify-payment
-- claiming plan: "Platinum" with that same valid signature, and get
-- upgraded for free. This table lets both capture/verify routes look up
-- the plan/workspace THEY recorded at order-creation time instead of
-- trusting whatever the client claims afterward.

create table if not exists payment_orders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  provider text not null check (provider in ('paypal', 'razorpay')),
  provider_order_id text not null,
  plan text not null check (plan in ('Silver', 'Gold', 'Platinum')),
  amount numeric,
  currency text,
  status text not null default 'pending' check (status in ('pending', 'completed')),
  created_at timestamptz not null default now(),
  unique (provider, provider_order_id)
);

create index if not exists idx_payment_orders_workspace on payment_orders(workspace_id);

alter table payment_orders enable row level security;
create policy payment_orders_all on payment_orders for all
  using (workspace_id in (select workspace_id from my_workspace_ids))
  with check (workspace_id in (select workspace_id from my_workspace_ids));
