document.addEventListener("DOMContentLoaded", function () {
  console.log("Login page script loaded.");

  const formLogin = document.getElementById("formLogin");
  const btnSubmit = document.getElementById("btn-submit");
  const inputEmail = document.getElementById("input-email");
  const inputPassword = document.getElementById("input-password");

  // Toggle password visibility
  const togglePassword = document.getElementById("toggle-password");
  togglePassword.addEventListener("click", function () {
    const type = inputPassword.getAttribute("type") === "password" ? "text" : "password";
    inputPassword.setAttribute("type", type);
    // Change icon
    if (type === "password") {
      togglePassword.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.414 8.543 7.682 5 12 5c4.318 0 8.586 3.543 9.964 6.978a1.127 1.127 0 010 .644C20.586 15.457 16.318 19 12 19c-4.318 0-8.586-3.543-9.964-6.978z"/>
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
      `;
    } else {
      togglePassword.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0012 5c4.318 0 8.586 3.543 9.964 6.978a1.127 1.127 0 010 .644C20.586 15.457 16.318 19 12 19c-2.07 0-4.02-.57-5.764-1.577L3.98 8.223z"/>
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 9.879a3 3 0 004.242 4.242M9.879 9.879L3 3m6.879 6.879L21 21"/>
        </svg>
      `;
    }
  });
  
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
      window.location.href = "/admin";
      
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
