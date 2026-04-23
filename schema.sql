-- =============================================
-- ESQUEMA DE BASE DE DATOS: auth_db
-- =============================================

CREATE DATABASE IF NOT EXISTS auth_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE auth_db;

-- ---------------------------------------------
-- Tabla de roles
-- ---------------------------------------------
CREATE TABLE roles (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(50) NOT NULL UNIQUE,
  descripcion VARCHAR(255),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------
-- Tabla de permisos
-- ---------------------------------------------
CREATE TABLE permisos (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  modulo      VARCHAR(100) NOT NULL,
  accion      VARCHAR(100) NOT NULL,
  descripcion VARCHAR(255),
  UNIQUE KEY uk_modulo_accion (modulo, accion)
);

-- ---------------------------------------------
-- Tabla de relación rol - permiso
-- ---------------------------------------------
CREATE TABLE rol_permisos (
  rol_id     INT UNSIGNED NOT NULL,
  permiso_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (rol_id, permiso_id),
  FOREIGN KEY (rol_id)     REFERENCES roles(id)    ON DELETE CASCADE,
  FOREIGN KEY (permiso_id) REFERENCES permisos(id) ON DELETE CASCADE
);

-- ---------------------------------------------
-- Tabla de usuarios
-- ---------------------------------------------
CREATE TABLE usuarios (
  id                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre                VARCHAR(150) NOT NULL,
  correo                VARCHAR(255) NOT NULL UNIQUE,
  password_hash         VARCHAR(255) NOT NULL,
  rol_id                INT UNSIGNED NOT NULL,
  activo                TINYINT(1)   DEFAULT 1,
  intentos_fallidos     INT          DEFAULT 0,
  bloqueado_hasta       DATETIME     NULL,
  ultimo_login          DATETIME     NULL,
  created_at            DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (rol_id) REFERENCES roles(id)
);

-- ---------------------------------------------
-- Tabla de tokens de recuperación de contraseña
-- ---------------------------------------------
CREATE TABLE reset_tokens (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT UNSIGNED NOT NULL,
  codigo      VARCHAR(10)  NOT NULL,
  expira_en   DATETIME     NOT NULL,
  usado       TINYINT(1)   DEFAULT 0,
  created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ---------------------------------------------
-- Tabla de tokens revocados (blacklist JWT)
-- ---------------------------------------------
CREATE TABLE tokens_revocados (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  jti        VARCHAR(36)  NOT NULL UNIQUE,
  usuario_id INT UNSIGNED NOT NULL,
  expira_en  DATETIME     NOT NULL,
  revocado_en DATETIME    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ---------------------------------------------
-- Tabla de historial de cambios (auditoría)
-- ---------------------------------------------
CREATE TABLE historial_cambios (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id   INT UNSIGNED NULL,
  accion       ENUM('CREAR','MODIFICAR','ELIMINAR','LOGIN','LOGOUT','BLOQUEO','RESET_PASSWORD') NOT NULL,
  modulo       VARCHAR(100) NOT NULL,
  descripcion  TEXT,
  ip_address   VARCHAR(45),
  user_agent   VARCHAR(500),
  datos_antes  JSON         NULL,
  datos_despues JSON        NULL,
  created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ---------------------------------------------
-- Datos iniciales
-- ---------------------------------------------
INSERT INTO roles (nombre, descripcion) VALUES
  ('administrador', 'Acceso total al sistema'),
  ('dueña',         'Propietaria con acceso administrativo'),
  ('empleado',      'Acceso limitado a módulos operativos');

INSERT INTO permisos (modulo, accion, descripcion) VALUES
  ('usuarios',  'crear',    'Crear nuevos usuarios'),
  ('usuarios',  'editar',   'Editar usuarios existentes'),
  ('usuarios',  'eliminar', 'Eliminar usuarios'),
  ('usuarios',  'ver',      'Ver listado de usuarios'),
  ('roles',     'gestionar','Gestionar roles y permisos'),
  ('historial', 'ver',      'Ver historial de cambios');

-- Rol administrador: todos los permisos
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 1, id FROM permisos;

-- Rol dueña: todos los permisos
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 2, id FROM permisos;

-- Rol empleado: solo ver
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 3, id FROM permisos WHERE accion = 'ver';
