import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import proyectoRoutes from './routes/proyectos.route.js'
import responsableRoutes from './routes/responsable.route.js'
import partidasRoutes from './routes/partidas.route.js';
import { PORT } from './config.js';

const app = express();
app.use(cors());

app.use(express.json());
app.use(morgan('combined'));

// Rutas 
app.use('/api', proyectoRoutes);
app.use('/api', responsableRoutes);
app.use('/api', partidasRoutes);

app.listen(PORT, () => {
    console.log('Escuchando en puerto:', PORT);
});