-- One row per page view and metric. The SDK can report the same metric more than once per page view
-- (CLS and INP update after the tab was hidden and shown again), and counting each report would make
-- one visit count several times in p75. /api/ingest upserts on this key, so the latest value wins.

-- Safety net for any existing duplicates: keep the newest row of each (site, page view, metric).
delete from vitalscope.events e
using vitalscope.events newer
where e.site_id = newer.site_id
  and e.page_view_id = newer.page_view_id
  and e.metric = newer.metric
  and e.id < newer.id;

create unique index events_site_page_view_metric_key
  on vitalscope.events (site_id, page_view_id, metric);
