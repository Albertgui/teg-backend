-- Creación
CREATE DATABASE teg_pg 
WITH ENCODING = 'UTF8' 
LC_COLLATE = 'Spanish_Venezuela.1252'
LC_CTYPE = 'Spanish_Venezuela.1252';

-- 1. Tabla de Usuarios
CREATE TABLE tm_user (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    pass VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Tabla de Responsables (Simplificada)
CREATE TABLE responsables (
    id SERIAL PRIMARY KEY,
    id_user INTEGER REFERENCES tm_user(id) ON DELETE CASCADE,
    cedula INTEGER UNIQUE NOT NULL CHECK (cedula > 0 AND cedula <= 99999999),
    nombre_completo VARCHAR(255) NOT NULL,
    especialidad VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    telefono VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Proyectos
CREATE TABLE proyectos (
    id SERIAL PRIMARY KEY,
    id_user INTEGER NOT NULL REFERENCES tm_user(id) ON DELETE CASCADE, 
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT, 
    ubicacion VARCHAR(255),
    monto_total_operacion NUMERIC(15, 2) DEFAULT 0,
    presupuesto_planificado NUMERIC(15, 2) DEFAULT 0,
    presupuesto_usado NUMERIC(15, 2) DEFAULT 0,
    estado VARCHAR(50) DEFAULT 'ejecucion',
    porcentaje_avance NUMERIC(5, 2) DEFAULT 0,
    fecha_inicio DATE,
    fecha_final_estimada DATE,
    fecha_final_real DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Partidas (Con porcentaje de completación)
CREATE TABLE partidas (
    id SERIAL PRIMARY KEY,
    proyecto_id INTEGER NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    responsable_id INTEGER REFERENCES responsables(id) ON DELETE SET NULL,
    nombre_partida VARCHAR(100),
    descripcion TEXT NOT NULL,
    monto_total NUMERIC(12, 2) DEFAULT 0, 
    porcentaje_avance NUMERIC(5, 2) DEFAULT 0 CHECK (porcentaje_avance >= 0 AND porcentaje_avance <= 100),
    fecha_inicio DATE,
    fecha_final_estimada DATE,
    fecha_final_real DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimización
CREATE INDEX idx_proyectos_user ON proyectos(id_user);
CREATE INDEX idx_responsables_user ON responsables(id_user);
CREATE INDEX idx_partidas_proyecto ON partidas(proyecto_id);

-- Función para actualizar el proyecto automáticamente
CREATE OR REPLACE FUNCTION fn_actualizar_estado_proyecto()
RETURNS TRIGGER AS $$
DECLARE
    target_proyecto_id INTEGER;
    total_partidas INTEGER;
    suma_avance NUMERIC(15,2);
    gasto_total NUMERIC(15, 2); 
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_proyecto_id := OLD.proyecto_id;
    ELSE
        target_proyecto_id := NEW.proyecto_id;
    END IF;
    SELECT 
        COUNT(*), 
        COALESCE(SUM(porcentaje_avance), 0),
        COALESCE(SUM(monto_total), 0)
    INTO 
        total_partidas, 
        suma_avance,
        gasto_total
    FROM partidas 
    WHERE proyecto_id = target_proyecto_id;
    UPDATE proyectos 
    SET 
        porcentaje_avance = CASE WHEN total_partidas > 0 THEN (suma_avance / total_partidas) ELSE 0 END,
        estado = CASE WHEN total_partidas > 0 AND (suma_avance / total_partidas) >= 100 THEN 'finalizada' ELSE 'ejecucion' END,
        fecha_final_real = CASE WHEN total_partidas > 0 AND (suma_avance / total_partidas) >= 100 THEN CURRENT_DATE ELSE NULL END,
        presupuesto_usado = gasto_total
    WHERE id = target_proyecto_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para partidas
CREATE TRIGGER tr_update_proyecto_avance
AFTER INSERT OR UPDATE OR DELETE ON partidas
FOR EACH ROW EXECUTE PROCEDURE fn_actualizar_estado_proyecto();

CREATE OR REPLACE VIEW vista_rentabilidad_proyectos AS
SELECT 
    id AS proyecto_id,
    nombre AS proyecto_nombre,
    monto_total_operacion AS precio_venta,
    presupuesto_usado AS costo_actual,
    (monto_total_operacion - presupuesto_usado) AS ganancia_actual,
    CASE 
        WHEN monto_total_operacion > 0 
        THEN ROUND(((monto_total_operacion - presupuesto_usado) / monto_total_operacion) * 100, 2)
        ELSE 0 
    END AS porcentaje_margen,
    porcentaje_avance,
    estado
FROM proyectos;

CREATE OR REPLACE VIEW vista_partidas AS
SELECT 
    p.id AS partida_id,
    p.proyecto_id,
    pr.id_user,
    p.responsable_id,
    p.nombre_partida,
    p.descripcion,
    COALESCE(r.nombre_completo, 'Sin asignar') AS nombre_responsable,
    COALESCE(r.especialidad, 'N/A') AS rol_responsable,
    p.monto_total AS presupuesto,
    p.porcentaje_avance,
    p.fecha_inicio AS asignado_el,
    p.fecha_final_estimada AS finaliza_en,
    CASE 
        WHEN p.fecha_final_real IS NOT NULL THEN 1 
        ELSE 0 
    END AS estatus
FROM partidas p
LEFT JOIN responsables r ON p.responsable_id = r.id
INNER JOIN proyectos pr ON p.proyecto_id = pr.id; 

ALTER TABLE proyectos 
ADD COLUMN margen_objetivo NUMERIC(5, 2) DEFAULT 0;