import express from 'express';
import cors from 'cors';
import proyectoRoutes from './routes/proyectos.route.js'
import responsableRoutes from './routes/responsable.route.js'

const app = express();
app.use(cors());

app.use(express.json());

const PORT = 3000;

app.use('/api', proyectoRoutes);
app.use('/api', responsableRoutes);

app.listen(PORT, () => {
    console.log('Escuchando en puerto:', PORT);
});