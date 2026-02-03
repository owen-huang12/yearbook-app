import { useState } from 'react'

export default function Profile({ studentID, status, name }){
    return (
        <div className="profile">
            <p className="profile-name">{name}</p>
            <p className="profile-id">{studentID}</p>
            <p className="profile-status">{status}</p>
        </div>
    )
}