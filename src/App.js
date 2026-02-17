import './App.css';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import Home from './components/Home';
import Chat from './components/Chat';
import Laheta from './components/Laheta';

function App() {
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="laheta" element={<Laheta />} />
    </Routes>
    </BrowserRouter>
  );
}

export default App;
