--- DEBARRO-SQL/Belépési jogosultságok és szerepkörök séma ---

CREATE TABLE szerepkorok (
  szerepkor_id  INT AUTO_INCREMENT PRIMARY KEY,
  szerepkor     VARCHAR(50) NOT NULL,
  modul         VARCHAR(50) NOT NULL,
  tier          INT NOT NULL DEFAULT 1,
  leiras        VARCHAR(255),
  CONSTRAINT uq_szerepkor UNIQUE (szerepkor)
);

CREATE TABLE users (
  user_id       INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  szerepkor_id  INT,
  nev           VARCHAR(100),
  allapot       VARCHAR(20) NOT NULL DEFAULT 'AKTÍV',
  letrehozva    DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT FK_users_szerepkor FOREIGN KEY (szerepkor_id) REFERENCES szerepkorok(szerepkor_id)
);


--- DEBARRO-SQL/ belépési jogosultságok és szerepkörök INSERT ---


INSERT INTO szerepkorok (szerepkor, modul, tier) VALUES
('ADMIN_1', 'ADMIN', 1),
('ADMIN_2', 'ADMIN', 2),
('ADMIN_3', 'ADMIN', 3),
('UA_1', 'UZEMANYAG', 1),
('UA_2', 'UZEMANYAG', 2),
('UA_3', 'UZEMANYAG', 3),
('HR_1', 'HR', 1),
('HR_2', 'HR', 2),
('HR_3', 'HR', 3);