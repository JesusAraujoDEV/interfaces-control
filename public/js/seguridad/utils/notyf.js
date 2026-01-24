document.addEventListener("DOMContentLoaded", () => {
  const notyf = new Notyf({
    duration: null,
    position: {
      x: "right",
      y: "bottom",
    },
    dismissible: true,
    ripple: false,
  });
  window.seguridad_notyf = notyf;
});
