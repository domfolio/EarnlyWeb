import { useEffect, useState } from "react";
import { subscribePending } from "../services/apiClient";

function TopProgressBar() {
  const [active, setActive] = useState(false);

  useEffect(() => subscribePending((count) => setActive(count > 0)), []);

  return (
    <div className={`top-progress ${active ? "top-progress--active" : ""}`} aria-hidden="true">
      <div className="top-progress__bar" />
    </div>
  );
}

export default TopProgressBar;
