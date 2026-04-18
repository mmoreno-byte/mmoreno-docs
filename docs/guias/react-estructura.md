# Estructura de aplicaciones React

Patrones de organización para componentes React. Cómo estructurar código para que escale sin volverse un caos.

## Estructura de carpetas

Mi estructura actual para proyectos React:

```
src/
├── components/       # Componentes reutilizables
│   ├── Button.jsx
│   ├── Button.css
│   ├── Card.jsx
│   └── Card.css
├── pages/            # Vistas completas (rutas)
│   ├── HomePage.jsx
│   ├── HomePage.css
│   ├── LoginPage.jsx
│   └── LoginPage.css
├── context/           # Estado global
│   └── AuthContext.jsx
├── hooks/             # Lógica reutilizable
│   ├── useAuth.js
│   └── useFetch.js
├── services/          # Llamadas API
│   └── api.js
├── utils/             # Funciones auxiliares
│   └── formatDate.js
├── App.jsx
├── App.css
├── index.css
└── main.jsx
```

## Componentes presentacionales vs containers

**Presentacionales**: solo renderizan, no tienen lógica de negocio.

```jsx
// components/Button.jsx
const Button = ({ children, onClick, variant = 'primary' }) => {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {children}
    </button>
  );
};
```

**Containers**: conectan con datos, manejan estado.

```jsx
// containers/GameList.jsx
const GameList = () => {
  const [games, setGames] = useState([]);

  useEffect(() => {
    api.get('/games').then(setGames);
  }, []);

  return <div className="games-grid">{games.map(g => <GameCard key={g.id} game={g} />)}</div>;
};
```

## Custom Hooks para lógica reutilizable

Extraer lógica a hooks mantiene los componentes limpios.

### Ejemplo: useAuth

```javascript
// hooks/useAuth.js
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Uso en cualquier componente
const GameCard = ({ game }) => {
  const { user, logout } = useAuth();
  return <div>...</div>;
};
```

### Ejemplo: useFetch

```javascript
// hooks/useFetch.js
import { useState, useEffect } from 'react';

export const useFetch = (url) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network error');
        setData(await response.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [url]);

  return { data, loading, error };
};
```

## Props vs Context vs Estado local

| Cuándo usar | Ejemplo |
|-------------|---------|
| **Estado local** (`useState`) | Toggle de un modal, input de un formulario |
| **Props** | Datos que vienen del padre, callbacks |
| **Context** | Auth global, tema (dark/light), lenguaje |
| **Estado en URL** (`useParams`) | ID del recurso `/games/:id` |

**Regla general**: no uses Context para todo. Si solo un componente necesita un valor, props basta.

## Composición vs Prop drilling

### Prop drilling (evitar en casos profundos)

```jsx
// App.jsx
<UserProvider>
  <App>
    <Dashboard>
      <Sidebar>
        <UserAvatar />  // Solo para mostrar nombre del usuario
      </Sidebar>
    </Dashboard>
  </App>
</UserProvider>
```

### Composición (mejor)

```jsx
// Componente que recibe children
const Layout = ({ children }) => {
  return <div className="layout">{children}</div>;
};

// Uso: composición en vez de props innecesarios
<Layout>
  <Sidebar>
    <UserAvatar user={user} />
  </Sidebar>
</Layout>
```

## Servicios API centralizados

En vez de hacer fetch dispersos por toda la app:

```javascript
// services/api.js
const API_URL = import.meta.env.VITE_API_URL;

export const api = {
  get: (path) => fetch(`${API_URL}${path}`).then(r => r.json()),
  post: (path, body) => fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(r => r.json()),
  delete: (path) => fetch(`${API_URL}${path}`, { method: 'DELETE' }).then(r => r.ok)
};

// Uso
const games = await api.get('/games');
await api.post('/games', { title: 'New Game' });
```

## Patrones que evitar

### No: todo en App.jsx

```jsx
// ❌ NO
const App = () => {
  const [user, setUser] = useState(null);
  const [games, setGames] = useState([]);
  const [theme, setTheme] = useState('dark');
  // 500 líneas de lógica...
};
```

### Sí: separar responsabilidades

```jsx
// ✅ SÍ
const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            <Route path="/games" element={<GamesPage />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
};
```

## Archivos de barril (index.js)

Exportar todo desde un archivo central para imports limpios:

```javascript
// hooks/index.js
export { useAuth } from './useAuth';
export { useFetch } from './useFetch';

// Uso: un solo import
import { useAuth, useFetch } from '../hooks';
```

---

*La estructura de React no es dogma—adáptala a tu proyecto. Un proyecto de 3 componentes no necesita 6 carpetas. Pero cuando crece, una buena estructura paga dividends.*
