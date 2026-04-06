import { useEffect } from "react";

export default function ErrorPopUp({ studentId, error, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 1000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="popup-wrapper">
      <div className="popup-card">
        {/* <p className="popup-id">{studentId}</p>*/}
        <p className="popup-status error">Invalid Student ID</p>
      </div>
    </div>
  );
}
