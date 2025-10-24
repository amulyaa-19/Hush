import './App.css'
import HomePage from './pages/HomePage'
import RoomPage from './pages/RoomPage'
import { Routes, Route } from "react-router-dom";

function App() {

  return (
    <div>
      <Routes>
        <Route path='/' element={<HomePage/>}/>
        <Route path='/room/:roomId' element={<RoomPage/>}/>
      </Routes>
    </div>
  )
}

export default App
