# Videogames Frontend

Cliente React para la API REST de videojuegos. Consume Videogames API, maneja autenticación JWT, y permite CRUD completo de la colección.

**URL en vivo:** https://mmoreno-byte.github.io/videogames-frontend/

## TL;DR

Frontend React que se comunica con Videogames API mediante Axios con interceptors para adjuntar el JWT automáticamente. Gestiona auth con Context API y almacena el token en localStorage.

## Arquitectura

```
┌─────────────────┐     HTTP (JWT Bearer)     ┌──────────────────┐
│   React App     │ ◀─────────────────────────▶ │  Videogames API  │
│  (Vite/React)  │                             │  (Spring Boot)   │
└─────────────────┘                             └──────────────────┘
        │
        ▼
  ┌──────────┐
  │localStorage│  ← JWT se guarda aquí
  └──────────┘
```

## Flujo de autenticación

### Login

```jsx
// services/api.js
import axios from 'axios';

const API_URL = 'https://videogames-api-production-16b1.up.railway.app';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor: añade JWT a cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### LoginPage.jsx

```jsx
const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/api/auth/login', { username, password });
      login(data.token);
      navigate('/games');
    } catch (error) {
      alert('Credenciales incorrectas');
    }
  };

  // ...
};
```

### AuthContext

```jsx
// context/AuthContext.jsx
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const login = (newToken) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

## Estructura de componentes

```
src/
├── components/
│   ├── GameCard.jsx       # Tarjeta individual de juego
│   └── GameForm.jsx      # Formulario crear/editar
├── context/
│   └── AuthContext.jsx   # Estado global de auth
├── pages/
│   ├── GamesPage.jsx     # Lista principal + búsqueda
│   └── LoginPage.jsx     # Login/Registro
├── services/
│   └── api.js            # Axios instance con interceptors
├── App.jsx
└── main.jsx
```

## CRUD completo

### Listar juegos

```jsx
// GamesPage.jsx
const GamesPage = () => {
  const [games, setGames] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchGames = async () => {
      const { data } = await api.get('/api/games');
      setGames(data);
    };
    fetchGames();
  }, []);

  return <div className="games-grid">{games.map(game => <GameCard key={game.id} game={game} />)}</div>;
};
```

### Crear juego

```jsx
// GameForm.jsx
const GameForm = ({ onSuccess }) => {
  const [form, setForm] = useState({ title: '', genre: '', platform: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/api/games', form);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" onChange={handleChange} required />
      <input name="genre" onChange={handleChange} />
      <input name="platform" onChange={handleChange} />
      <button type="submit">Guardar</button>
    </form>
  );
};
```

## Manejo de errores: token expirado

Este fue un problema que descubrí después de semanas: cuando el JWT expira, el usuario queda "atrapado" en una sesión que ya no funciona.

```jsx
// Interceptor de respuesta para detectar 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## Búsqueda y filtros

```jsx
const filteredGames = games.filter(game =>
  game.title.toLowerCase().includes(search.toLowerCase())
);
```

## Decisiones técnicas

### ¿Por qué Axios en vez de fetch?

Los **interceptors** de Axios valen el setup inicial. Añades el token una vez en la configuración, y cada petición lo incluye automáticamente. Con fetch, tendrías que manually añadir el header a cada llamada.

### ¿Por qué Context API para auth?

El estado de autenticación necesita estar disponible en toda la app. Context es la forma nativa de React para esto, sin necesidad de Redux u otras bibliotecas.

## Despliegue en GitHub Pages

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          build_dir: dist
```

El `base` en `vite.config.js` es necesario porque GitHub Pages sirve desde un subdirectorio:

```js
// vite.config.js
export default defineConfig({
  base: '/videogames-frontend/',
  // ...
});
```

## Lecciones aprendidas

1. **El token va en el header `Authorization`, no en el body**: al principio lo intentaba enviar como JSON normal. Los interceptors facilitan esto.

2. **GitHub Pages + API en Railway = CORS**: frontend y backend en dominios diferentes. Videogames API tiene que permitir explícitamente el origen del frontend.

3. **El logout debe limpiar todo**: localStorage, contexto, y redirigir. Un solo lugar donde hacer logout (el AuthContext) mantiene esto simple.

---

*Videogames Frontend me enseñó cómo estructurar una aplicación React con estado global, cómo integrar una API externa, y la importancia de manejar errores de red gracefully.*
