CREATE TABLE proyectos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion VARCHAR(255),
    ubicacion VARCHAR(255), -- Dirección de la obra
    presupuesto NUMERIC(15, 2), -- Siempre usa NUMERIC para dinero, nunca FLOAT
    presupuesto_usado NUMERIC(15, 2), -- Siempre usa NUMERIC para dinero, nunca FLOAT
    estado VARCHAR(50) DEFAULT 'ejecucion', -- ejecucion, paralizada, finalizada
    porcentaje_avance NUMERIC(5, 2) DEFAULT 0, -- 0.00 a 100.00
    fecha_inicio DATE,
    fecha_final_estimada DATE,
    fecha_final_real DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE partidas (
    id SERIAL PRIMARY KEY,
    proyecto_id INTEGER REFERENCES proyectos(id) ON DELETE CASCADE,
    nombre_partida VARCHAR(100),
    descripcion VARCHAR(255) NOT NULL,
    monto_total NUMERIC(12, 2),
    fecha_inicio DATE,
    fecha_final_estimada DATE,
    fecha_final_real DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE responsables (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(255) NOT NULL,
    especialidad VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    telefono VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE proyecto_responsables (
    proyecto_id INTEGER REFERENCES proyectos(id) ON DELETE CASCADE,
    responsable_id INTEGER REFERENCES responsables(id) ON DELETE CASCADE,
    rol VARCHAR(100), -- Ej: Residente de obra, Inspector, Gerente
    PRIMARY KEY (proyecto_id, responsable_id), -- Evita que se duplique el mismo responsable en el mismo proyecto
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_proyectos_modtime BEFORE UPDATE ON proyectos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_partidas_modtime BEFORE UPDATE ON partidas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_responsables_modtime BEFORE UPDATE ON responsables FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_proyecto_responsables_modtime BEFORE UPDATE ON proyecto_responsables FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();