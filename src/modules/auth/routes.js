import { AuthLockScreen } from './components/lock-screen.js'; 

export const authRoutes = {
    '/auth/login': () => {
        // Creamos una instancia de nuestro componente
        return new AuthLockScreen();
    }
};