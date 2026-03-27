import { useEffect } from "react";

export default function PopUp({ name, studentId, status, message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 1000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="popup-wrapper">
      <div className="popup-card">
        <p className="popup-name">{name}</p>
        <p className="popup-id">{studentId}</p>
        <p className={`popup-status ${status}`}>{message || status}</p>
      </div>
    </div>
  );
}
