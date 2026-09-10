-- Real business WhatsApp number confirmed — replaces the empty-string
-- default from 20260909000003_default_settings.sql.
update settings set value = '"8248365737"' where key = 'whatsapp_business_number';
