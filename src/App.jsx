import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './components/home';
import Welcome from './components/welcome';

function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home></Home>}></Route>
          <Route path='/welcome' element={<Welcome></Welcome>}></Route>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
