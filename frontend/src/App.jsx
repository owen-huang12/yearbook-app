import { useState, useEffect } from "react"
import Profile from "./components/Profile.jsx"

export default function App(){
  const [studentIDsearch, setStudentIDsearch] = useState("")
  const [response, setResponse] = useState("")
  const [studentDisplayInformation, setStudentDisplayInformation] = useState();

  useEffect(() => {
    fetch("http://localhost:3002/api/get")
      .then(res => res.json())
      .then(data => setStudentDisplayInformation(data.data))
  }, [])

  const fetchAllStudents = async () => {
    fetch("http://localhost:3002/api/get")
      .then(res => res.json())
      .then(data => setStudentDisplayInformation(data.data))
  }

  const updateStudentStatus = (studentID, newStatus) => {
    
    setStudentDisplayInformation(prev => {
      return prev.map(student => {
        return student.studentID.toString() === studentID.toString() 
          ? { ...student, status: newStatus }
          : student
      })
    })

    setResponse(`Student ${studentID} marked as ${newStatus}`)
    fetch("http://localhost:3002/api/edit-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentID, status: newStatus }),
    }).catch(error => {
      setResponse("ERROR SAVING - PLEASE REFRESH")
    })
  }

  const handleSubmit = (event) => {
    const idToUpdate = studentIDsearch

    event.preventDefault()
    updateStudentStatus(idToUpdate, "claimed")
    setStudentIDsearch("")
  }

  return (
    <>
      <header>
        <h1>Yearbook distribution app</h1>
      </header>
      <div className="handout-information-wrapper">
        <h3>HANDOUT YEARBOOK</h3>
        <form onSubmit={handleSubmit}>
          <input 
            type = "text"
            id = "student-id-field"
            onChange={(event) => {setStudentIDsearch(event.target.value)}}
            value={studentIDsearch}
          />
          <button type="submit">Submit</button>
        </form>
        <p>Enter the student ID of the student you are handing out the yearbook for either by scanning their ID bar with the scanner, or entering it manually.</p>
      </div>
      <div className="display-information-wrapper">
        <h3>DISTRIBUTION INFORMATION</h3>
        <div className="results-info">
          <p>{response}</p>
        </div>
        {studentDisplayInformation?.map((student) => (
          <Profile key={student.studentID} {...student} update={updateStudentStatus} />
        ))}
      </div>
      
    </>
  )
}