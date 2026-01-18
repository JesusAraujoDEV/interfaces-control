document.addEventListener("DOMContentLoaded", function () {
  console.log("Login page script loaded.");

  const formLogin = document.getElementById("formLogin");
  const btnSubmit = document.getElementById("btn-submit");
  const inputEmail = document.getElementById("input-email");
  const inputPassword = document.getElementById("input-password");

  formLogin.addEventListener("submit", async function (event) {
    // Verifica si los required del formulario son válidos
    if (!formLogin.checkValidity()) {
      console.log("Formulario inválido.");
      return;
    }
    event.preventDefault();
    btnSubmit.disabled = true;
    btnSubmit.textContent = "Iniciando...";
    const email = inputEmail.value;
    const password = inputPassword.value;
    const urlApi = "/api/seguridad/login";

    const response = await fetch(urlApi, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email, password: password }),
    });
    if (response.ok) {
      const data = await response.json();
      const access_token = data.access_token;
      const user = data.user;
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("administrative_user", JSON.stringify(user));
      window.seguridad_notyf.success(
        "Inicio de sesión exitoso. Redirigiendo..."
      );
      // obtiene el parámetro redirect de la URL
      const urlParams = new URLSearchParams(window.location.search);
      const redirectUrl = urlParams.get("redirect");
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }
      window.location.href = "/shared/admin-home/index.html";
      
    } else {
      const errorData = await response.json();
      window.seguridad_notyf.error(
        errorData.message || "Error desconocido en el inicio de sesión."
      );
      console.error("Error en el inicio de sesión:", errorData);
    }

    btnSubmit.disabled = false;
    btnSubmit.textContent = "Iniciar sesión";
  });
});
