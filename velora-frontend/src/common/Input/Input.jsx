
function Input({ type, placeholder, value, onChange, readOnly, ...rest }) {
  return (
    <input
      className="input"
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      {...rest}
    />
  );
}

export default Input;