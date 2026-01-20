-- Creación
CREATE DATABASE teg_pg 
WITH ENCODING = 'UTF8' 
LC_COLLATE = 'Spanish_Venezuela.1252'
LC_CTYPE = 'Spanish_Venezuela.1252';

-- Tabla de Usuarios
CREATE TABLE tm_user (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    pass VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Tabla de Responsables (Staff)
CREATE TABLE responsables (
    id SERIAL PRIMARY KEY,
    cedula INTEGER UNIQUE NOT NULL CHECK (cedula > 0 AND cedula <= 99999999),
    nombre_completo VARCHAR(255) NOT NULL,
    especialidad VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    telefono VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Proyectos (Relacionada con Usuario)
CREATE TABLE proyectos (
    id SERIAL PRIMARY KEY,
    id_user INTEGER NOT NULL, 
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT, 
    ubicacion VARCHAR(255),
    presupuesto NUMERIC(15, 2),
    presupuesto_usado NUMERIC(15, 2) DEFAULT 0,
    estado VARCHAR(50) DEFAULT 'ejecucion',
    porcentaje_avance NUMERIC(5, 2) DEFAULT 0,
    fecha_inicio DATE,
    fecha_final_estimada DATE,
    fecha_final_real DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuario_proyecto 
        FOREIGN KEY (id_user) REFERENCES tm_user(id) ON DELETE CASCADE
);

-- Índice para optimizar búsquedas por usuario
CREATE INDEX idx_proyectos_user ON proyectos(id_user);

-- Tabla Intermedia (Equipo del Proyecto)
CREATE TABLE proyecto_responsables (
    proyecto_id INTEGER REFERENCES proyectos(id) ON DELETE CASCADE,
    responsable_id INTEGER REFERENCES responsables(id) ON DELETE CASCADE,
    rol VARCHAR(100),
    PRIMARY KEY (proyecto_id, responsable_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Partidas
CREATE TABLE partidas (
    id SERIAL PRIMARY KEY,
    proyecto_id INTEGER NOT NULL,
    responsable_id INTEGER,
    nombre_partida VARCHAR(100),
    descripcion TEXT NOT NULL,
    monto_total NUMERIC(12, 2),
    fecha_inicio DATE,
    fecha_final_estimada DATE,
    fecha_final_real DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_partida_responsable_proyecto 
        FOREIGN KEY (proyecto_id, responsable_id) 
        REFERENCES proyecto_responsables(proyecto_id, responsable_id)
        ON DELETE SET NULL
);

-- Función genérica para actualizar el campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Función para actualizar presupuesto, avance y estado del proyecto
CREATE OR REPLACE FUNCTION fn_actualizar_estado_proyecto()
RETURNS TRIGGER AS $$
DECLARE
    target_proyecto_id INTEGER;
    total_partidas INTEGER;
    partidas_finalizadas INTEGER;
    presupuesto_gastado NUMERIC(15, 2); 
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_proyecto_id := OLD.proyecto_id;
    ELSE
        target_proyecto_id := NEW.proyecto_id;
    END IF;

    -- Contamos totales
    SELECT COUNT(*) INTO total_partidas FROM partidas WHERE proyecto_id = target_proyecto_id;
    SELECT COUNT(*) INTO partidas_finalizadas FROM partidas WHERE proyecto_id = target_proyecto_id AND fecha_final_real IS NOT NULL;
    
    -- Sumamos presupuesto de partidas terminadas
    SELECT COALESCE(SUM(monto_total), 0) INTO presupuesto_gastado FROM partidas WHERE proyecto_id = target_proyecto_id AND fecha_final_real IS NOT NULL;

    UPDATE proyectos 
    SET 
        porcentaje_avance = CASE WHEN total_partidas > 0 THEN (partidas_finalizadas::NUMERIC / total_partidas::NUMERIC) * 100 ELSE 0 END,
        estado = CASE WHEN total_partidas > 0 AND total_partidas = partidas_finalizadas THEN 'finalizada' ELSE 'ejecucion' END,
        fecha_final_real = CASE WHEN total_partidas > 0 AND total_partidas = partidas_finalizadas THEN CURRENT_DATE ELSE NULL END,
        presupuesto_usado = presupuesto_gastado
    WHERE id = target_proyecto_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_proyectos_modtime BEFORE UPDATE ON proyectos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_partidas_modtime BEFORE UPDATE ON partidas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_responsables_modtime BEFORE UPDATE ON responsables FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_proyecto_responsables_modtime BEFORE UPDATE ON proyecto_responsables FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON tm_user FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Trigger para avance de proyecto (se dispara al tocar partidas)
CREATE TRIGGER tr_update_proyecto_avance
AFTER INSERT OR UPDATE OR DELETE ON partidas
FOR EACH ROW EXECUTE PROCEDURE fn_actualizar_estado_proyecto();

-- Vista: Personal asignado a proyectos
CREATE OR REPLACE VIEW vista_proyecto_staff AS
SELECT 
    pr.proyecto_id,
    r.id AS responsable_id,
    r.nombre_completo,
    r.especialidad,
    r.email,
    pr.rol,
    pr.created_at AS asignado_el
FROM proyecto_responsables pr
JOIN responsables r ON pr.responsable_id = r.id;

-- Vista: Detalle de partidas con nombres
CREATE OR REPLACE VIEW vista_partidas AS
SELECT 
    p.id AS partida_id,
    proy.id AS proyecto_id,
    p.nombre_partida,
    proy.nombre AS nombre_proyecto,
    p.descripcion,
    r.nombre_completo AS nombre_responsable,
    p.monto_total AS presupuesto_partida,
    p.fecha_inicio,
    CASE WHEN p.fecha_final_real IS NULL THEN 'Pendiente' ELSE 'Finalizada' END AS estatus
FROM partidas p
JOIN proyectos proy ON p.proyecto_id = proy.id
LEFT JOIN responsables r ON p.responsable_id = r.id;

-- 1. Modificación
ALTER TABLE responsables 
ADD COLUMN id_user INTEGER;

-- 2. Creamos la llave foránea para asegurar la integridad
ALTER TABLE responsables 
ADD CONSTRAINT fk_responsable_usuario 
FOREIGN KEY (id_user) REFERENCES tm_user(id) ON DELETE CASCADE;

-- 3. Creamos un índice para que las búsquedas por usuario sean rápidas
CREATE INDEX idx_responsables_user ON responsables(id_user);

CREATE OR REPLACE VIEW vista_partidas AS
SELECT 
    p.id AS partida_id,
    p.proyecto_id,
    p.responsable_id,
    p.nombre_partida,
    pr.nombre AS nombre_proyecto,
    p.descripcion,
    COALESCE(r.nombre_completo, 'Sin asignar') AS nombre_responsable,
    COALESCE(r.especialidad, 'N/A') AS rol_responsable,
    p.monto_total AS presupuesto,
    p.fecha_inicio AS asignado_el, 
    p.fecha_final_estimada AS finaliza_en,
    CASE 
        WHEN p.fecha_final_real IS NOT NULL THEN 1 
        ELSE 0 
    END AS estatus 
FROM partidas p
INNER JOIN proyectos pr ON p.proyecto_id = pr.id
LEFT JOIN responsables r ON p.responsable_id = r.id;