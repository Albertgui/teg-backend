-- 1. TABLAS MAESTRAS
CREATE TABLE proyectos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion VARCHAR(255),
    ubicacion VARCHAR(255),
    presupuesto NUMERIC(15, 2),
    presupuesto_usado NUMERIC(15, 2) DEFAULT 0,
    estado VARCHAR(50) DEFAULT 'ejecucion',
    porcentaje_avance NUMERIC(5, 2) DEFAULT 0,
    fecha_inicio DATE,
    fecha_final_estimada DATE,
    fecha_final_real DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

-- 2. TABLA INTERMEDIA (EQUIPO)
CREATE TABLE proyecto_responsables (
    proyecto_id INTEGER REFERENCES proyectos(id) ON DELETE CASCADE,
    responsable_id INTEGER REFERENCES responsables(id) ON DELETE CASCADE,
    rol VARCHAR(100),
    PRIMARY KEY (proyecto_id, responsable_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABLA DE PARTIDAS (REFERENCIA A LA INTERMEDIA)
CREATE TABLE partidas (
    id SERIAL PRIMARY KEY,
    proyecto_id INTEGER NOT NULL,
    responsable_id INTEGER,
    nombre_partida VARCHAR(100),
    descripcion VARCHAR(255) NOT NULL,
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

--- FUNCIONES Y TRIGGERS ---

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION fn_actualizar_estado_proyecto()
RETURNS TRIGGER AS $$
DECLARE
    target_proyecto_id INTEGER;
    total_partidas INTEGER;
    partidas_finalizadas INTEGER;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_proyecto_id := OLD.proyecto_id;
    ELSE
        target_proyecto_id := NEW.proyecto_id;
    END IF;

    SELECT COUNT(*) INTO total_partidas FROM partidas WHERE proyecto_id = target_proyecto_id;
    SELECT COUNT(*) INTO partidas_finalizadas FROM partidas WHERE proyecto_id = target_proyecto_id AND fecha_final_real IS NOT NULL;

    UPDATE proyectos 
    SET 
        porcentaje_avance = CASE WHEN total_partidas > 0 THEN (partidas_finalizadas::NUMERIC / total_partidas::NUMERIC) * 100 ELSE 0 END,
        estado = CASE WHEN total_partidas > 0 AND total_partidas = partidas_finalizadas THEN 'finalizada' ELSE 'ejecucion' END,
        fecha_final_real = CASE WHEN total_partidas > 0 AND total_partidas = partidas_finalizadas THEN CURRENT_DATE ELSE NULL END
    WHERE id = target_proyecto_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_proyecto_avance
AFTER INSERT OR UPDATE OR DELETE ON partidas
FOR EACH ROW EXECUTE PROCEDURE fn_actualizar_estado_proyecto();

CREATE TRIGGER update_proyectos_modtime BEFORE UPDATE ON proyectos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_partidas_modtime BEFORE UPDATE ON partidas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_responsables_modtime BEFORE UPDATE ON responsables FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_proyecto_responsables_modtime BEFORE UPDATE ON proyecto_responsables FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- VISTAS --

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

CREATE OR REPLACE VIEW vista_partidas AS
SELECT 
    p.id AS partida_id,
    p.nombre_partida,
    pr.nombre AS nombre_proyecto,
    p.descripcion,
    r.nombre_completo AS nombre_responsable,
    prr.rol AS rol_responsable,
    p.monto_total AS presupuesto,
    p.created_at AS asignado_el,
    CASE 
        WHEN p.fecha_final_real IS NULL THEN 0 
        ELSE 1 
    END AS estatus
FROM partidas p
INNER JOIN proyectos pr ON p.proyecto_id = pr.id
LEFT JOIN proyecto_responsables prr ON p.proyecto_id = prr.proyecto_id 
    AND p.responsable_id = prr.responsable_id
LEFT JOIN responsables r ON prr.responsable_id = r.id;