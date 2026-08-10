
function Button({ text, onClick, type = "button", disabled = false }) {
  return (
    <button className="btn" type={type} onClick={onClick} disabled={disabled}>
      {text}
    </button>
  );
}

export default Button;