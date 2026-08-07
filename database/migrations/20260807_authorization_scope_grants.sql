CREATE TABLE IF NOT EXISTS authorization_scope_grants (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  authorizer_email VARCHAR(254) NOT NULL,
  scope_type VARCHAR(16) NOT NULL,
  scope_value VARCHAR(191) NOT NULL,
  condition_plantel VARCHAR(191) NOT NULL DEFAULT 'ALL',
  channel VARCHAR(16) NOT NULL DEFAULT 'EMAIL',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_authorization_scope_grant (authorizer_email, scope_type, scope_value, condition_plantel, channel),
  KEY idx_authorization_scope_match (scope_type, scope_value, condition_plantel),
  KEY idx_authorization_scope_authorizer (authorizer_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
