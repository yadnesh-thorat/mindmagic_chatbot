import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="theme-toggle"
            style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                width: '45px',
                height: '45px',
                borderRadius: '50%',
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                cursor: 'pointer',
                zIndex: 1000,
                boxShadow: 'var(--card-shadow)',
                padding: 0,
                margin: 0
            }}
        >
            {theme === 'light' ? '🌙' : '☀️'}
        </motion.button>
    );
}
