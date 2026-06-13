import "../styles/LoadingScreen.css";
import logo from '../img/gandersons-logo.png'

function LoadingScreen() {
    return (
        <div className="loading-overlay">

            <div className="loading-content">

                <img
                    src={logo}
                    alt="Logo"
                    className="loading-logo"
                />

                <h2>Cargando...</h2>

                <div className="spinner"></div>

            </div>

        </div>
    );
}

export default LoadingScreen;