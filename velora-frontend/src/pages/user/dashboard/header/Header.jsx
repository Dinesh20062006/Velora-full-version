function Header({ name }){
    return(
        <div className="header">
            <div className="header-content">
            <h1>Welcome Back{name ? `, ${name.split(" ")[0]}` : ""} </h1>
            <p>Stay alert, stay safe. Your safety dashboard is ready.</p>
            </div>
        </div>
    )
}
export default Header;
