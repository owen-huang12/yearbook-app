import { useEffect, useRef } from "react";
import { animate } from "animejs";

export default function ErrorPopUp({ studentId, error, onClose }) {
  const cardRef = useRef(null);

  useEffect(() => {
    animate(cardRef.current, {
      translateY: ["-24px", "0px"],
      opacity: [0, 1],
      duration: 400,
      ease: "outCubic",
    });

    const timer = setTimeout(() => {
      onClose();
    }, 1000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="popup-wrapper">
      <div className="popup-card" ref={cardRef}>
        {/* <p className="popup-id">{studentId}</p>*/}
        <p className="popup-status error">Invalid Student ID</p>
      </div>
    </div>
  );
}
