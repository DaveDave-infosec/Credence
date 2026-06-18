import { Routes, Route } from "react-router-dom"
import Header from "./components/layout/Header"
import Footer from "./components/layout/Footer"
import Home from "./pages/Home"
import Analyze from "./pages/Analyze"
import Result from "./pages/Result"
import Archive from "./pages/Archive"
import MyFiles from "./pages/MyFiles"

export default function App() {
  return (
    <>
      <Header />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analyze" element={<Analyze />} />
          <Route path="/result/:id" element={<Result />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/my-files" element={<MyFiles />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}
