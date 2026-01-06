import { pool } from "../db.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { SECRET_KEY } from "../config.js";

const secretKey = SECRET_KEY;

// Crear un usuario
export const createUser = async(req, res) => {
    try {
        const {username, pass} = req.body;
        if (!username || !pass) {
            return res.status(404).json({ message: 'Los datos no fueron enviados de forma correcta' })
        }
        const isValid = await validarUser(username);
        const parsedUser = username.toLowerCase();
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(pass, salt);
        if (!isValid) {
            const { rows } = await pool.query(`INSERT INTO tm_user (username, pass) VALUES ($1, $2) RETURNING *`, [parsedUser, passwordHash]);
            return res.json({ message: 'Se ha creado el usuario con éxito', data: rows });
        }else {
            return res.json({ message: `El nombre de usuario ${username} ya está registrado` });
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({message: 'Error interno del servidor'});
    }
}

// Editar un usuario
export const editUser = async(req, res) => {
    try {
        const {username, pass} = req.body;
        if (!username || !pass) {
            return res.status(404).json({ message: 'Los datos no fueron enviados de forma correcta' })
        }
        const isValid = await validarUser(username);
        const parsedUser = username.toLowerCase();
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(pass, salt);
        if (!isValid) {
            const { rows } = await pool.query(`UPDATE tm_user SET username = COALESCE($1, username), pass = COALESCE($2, pass) RETURNING *`, [parsedUser, passwordHash]);
            return res.json({ message: 'Se ha creado el usuario con éxito', data: rows });
        }else {
            return res.json({ message: `El nombre de usuario ${username} ya está registrado` });
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({message: 'Error interno del servidor'});
    }
}

// Lógica de login 
export const loginUser = async(req, res) => {
    try {
        const {username, pass} = req.body;
        if (!username || !pass) {
            return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
        }
        const parsedUser = username.toLowerCase();
        const result = await pool.query('SELECT * FROM tm_user WHERE username = $1', [parsedUser]);
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        const userFound = result.rows[0];
        const isMatch = await bcrypt.compare(pass, userFound.pass);
        if (!isMatch) {
            return res.status(401).json({ message: 'Contraseña incorrecta' });
        }
        const token = jwt.sign({
            name: username
        }, secretKey, {
            expiresIn: '1h'
        })
        const { pass: _, ...userPublicData } = userFound;
        return res.status(200).json({ message: 'Login exitoso', user: userPublicData, token: token });
    } catch {
        res.status(500).json({message: 'Error interno del servidor'});
    }
}

// Validar si existe el usuario
export const validarUser = async (user) => {
    try {
        const parsedUser = user.toLowerCase();
        const { rows } = await pool.query(`SELECT COUNT(*) FROM tm_user WHERE username = $1`, [parsedUser]);
        const count = parseInt(rows[0].count, 10); 
        return count > 0;
    } catch (error) {
        res.status(500).json({message: 'Error interno del servidor'});
    }
}
