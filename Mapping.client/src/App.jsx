import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MapComponent from './components/MapComponent';

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="*" element={<MapComponent />} />
            </Routes>
        </Router>
    );
};

export default App;
