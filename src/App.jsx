import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Gamepage from './pages/Gamepage';
import Gamepage2 from './pages/Gamepage2';
import Offlinejackpot from './pages/Offlinejackpot';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Gamepage />} />
        <Route path="/offline" element={<Offlinejackpot />} />
        {/* Optional route if you want to use Gamepage2 later */}
        {/* <Route path="/gamepage2" element={<Gamepage2 />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
