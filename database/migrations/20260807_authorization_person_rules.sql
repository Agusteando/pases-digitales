CREATE TABLE IF NOT EXISTS authorization_person_rules (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  employee_curp VARCHAR(32) NOT NULL,
  employee_name VARCHAR(255) NOT NULL,
  employee_plantel VARCHAR(255) NULL,
  target_val VARCHAR(320) NOT NULL,
  channel VARCHAR(20) NOT NULL DEFAULT 'EMAIL',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_authorization_person_target_channel (employee_curp, target_val, channel),
  KEY idx_authorization_person_curp (employee_curp),
  KEY idx_authorization_person_target (target_val)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
