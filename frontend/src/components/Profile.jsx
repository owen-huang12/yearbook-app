import React from 'react'

export default function Profile({ studentID, status, name, update }){
    return (
        <div className="profile">
            <p className="profile-name">{name}</p>
            <p className="profile-id">{studentID}</p>
            <select
                className={`statusSelect ${status === "CLAIMED" ? "claimed" : "purchased"}`}
                value={status}
                onChange={(e) => update(studentID, e.target.value)}
            >
                <option value="PURCHASED">purchased</option>
                <option value="CLAIMED">claimed</option>
            </select>
        </div>
    )
}