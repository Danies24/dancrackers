-- Captain commission rate is now admin-set per captain (editable anytime),
-- replacing the automatic 3/4/5% tier lookup. Frozen onto the order at
-- DELIVERED, same as before — changing a captain's rate only affects orders
-- delivered after the change.
alter table captains add column commission_rate numeric(5, 2) not null default 3;
