export default function Loader({ fullscreen = false }) {
  if (fullscreen) {
    return (
      <div className="loader-fullscreen">
        <div className="loader-spinner"></div>
      </div>
    );
  }
  
  return (
    <div className="loader-container">
      <div className="loader-spinner"></div>
    </div>
  );
}
