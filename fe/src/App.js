import './App.css';
import AppRoutes from './routes/AppRoutes';
import ScrollToTop from './components/ScrollToTop';
import ChatWidget from './components/ChatWidget';

function App() {
  return (
    <>
      <ScrollToTop />
      <AppRoutes />
      <ChatWidget />
    </>
  );
}

export default App;
