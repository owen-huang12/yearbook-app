import { useState } from 'react'

export default function Profile({ studentID, status, name, update }){
    return (
        <div className="profile">
            <p className="profile-name">{name}</p>
            <p className="profile-id">{studentID}</p>
            <select value={status} onChange={(e) => update(studentID, e.target.value)}>
                <option value="purchased">purchased</option>
                <option value="claimed">claimed</option>
            </select>
        </div>
    )
}