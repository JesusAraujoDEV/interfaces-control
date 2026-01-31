const MENU_DATA = {
  beef: {
    label: "Hamburguesas de res",
    icon: "🍔",
    items: [
      {
        name: "Cheesy Buffalo",
        price: "10,50$",
        description:
          "Pan brioche, carne de res casera 140g, queso, salsa de la casa, pepinillo, cebolla, tomate, lechuga",
        spiceLevel: 3,
        image: "./public/assets/Buffalo-Blue-Cheese-Burgers-2.jpg",
      },
      {
        name: "Angry Bull",
        price: "12,00$",
        description:
          "Pan brioche, carne de res casera 140g, queso, salsa chili cheese, jalapeño, pepinillo, cebolla, lechuga",
        spiceLevel: 3,
        image: "./public/assets/crispy-comte-cheesburgers-FT-RECIPE0921-6166c6552b7148e8a8561f7765ddf20b.jpg",
      },
      {
        name: "Smokie Beefy BBQ",
        price: "13,00$",
        description:
          "Pan brioche, carne de res casera 140g, queso, salsa de la casa, pepinillo, aros de cebolla, cebolla tostada, salsa BBQ, tomate, lechuga",
        spiceLevel: 3,
        image: "https://foodiewagon.de/burgers/beef/Smookie-Beefy-BBQ_13euros.webp",
      },
      {
        name: "Blazing Nacho Beef",
        price: "13,00$",
        description:
          "Pan brioche, carne de res casera 140g, queso, salsa de la casa, pepinillo, jalapeño, nachos, salsa sriracha, tomate, lechuga",
        spiceLevel: 3,
        image: "./public/assets/Paulig_Pro_Nacho_Burger.jpg",
      },
      {
        name: "Cheese Burger",
        price: "7,00$",
        description:
          "Pan brioche, carne de res casera 140g, queso, salsa de la casa, pepinillo, cebolla, tomate, lechuga",
        spiceLevel: 1,
        image: "./public/assets/cheese-burger.webp",
      },
    ],
  },
  chicken: {
    label: "Hamburguesas de pollo",
    icon: "🔥",
    items: [
      {
        name: "Crunchy Chicken",
        price: "8,50$",
        description: "Pan brioche, tiras de pollo, queso, salsa de la casa, lechuga",
        spiceLevel: 2,
        image: "./public/assets/Crispiest-buttermilk-fried-chicken-burgers-90854e5.jpg",
      },
      {
        name: "Loaded Crunchy",
        price: "9,00$",
        description: "Pan brioche, tiras de pollo, queso, salsa de la casa, tomate, cebolla, pepinillo, lechuga",
        spiceLevel: 2,
        image: "./public/assets/Crispy-Chicken-Burger-square-FS-4518.jpg",
      },
      {
        name: "Crispy Ringer",
        price: "10,00$",
        description: "Pan brioche, tiras de pollo, queso, salsa de la casa, aros de cebolla, cebolla, tomate, lechuga",
        spiceLevel: 2,
        image: "./public/assets/crispy_ringer.jpg",
      },
      {
        name: "Mexican Cracker",
        price: "11,00$",
        description:
          "Pan brioche, tiras de pollo, queso, salsa de la casa, jalapeño, pepinillo, nachos, salsa sriracha, cebolla, lechuga",
        spiceLevel: 2,
        image: "./public/assets/Mexican-Burger-with-Chorizo.webp",
      },
      {
        name: "Flip Chicken Burger",
        price: "6,00$",
        description: "Pan brioche, tiras de pollo, queso, salsa de la casa, lechuga",
        spiceLevel: 1,
        image: "./public/assets/flip_chicken_burger.webp",
      },
      {
        name: "Foodie Bomber",
        price: "13,00$",
        description:
          "Pan brioche, tiras de pollo, queso, nuggets chili cheese, salsa chili cheese, cebolla, jalapeño, lechuga",
        spiceLevel: 2,
        image: "./public/assets/foodie_bomber.jpg",
      },
    ],
  },
  veggie: {
    label: "Vegetariano",
    icon: "🥬",
    items: [
      {
        name: "Plant Power",
        price: "9,00$",
        description: "Pan brioche, falafel, queso, salsa de la casa, pepinillo, lechuga, cebolla, tomate",
        spiceLevel: 0,
        image: "./public/assets/plant_power.webp",
      },
      {
        name: "Veggie BBQ",
        price: "11,00$",
        description:
          "Pan brioche, falafel, queso, salsa de la casa, pepinillo, aros de cebolla, cebolla tostada, salsa BBQ, tomate, lechuga",
        spiceLevel: 0,
        image: "./public/assets/veggie_bbq.jpeg",
      },
    ],
  },
  drinks: {
    label: "Bebidas",
    icon: "🥤",
    items: [
      {
        name: "Coca Cola",
        price: "2,50$",
        description: "330ml Dose",
        image: "./public/assets/bebidas/coca_cola.jpeg",
      },
      {
        name: "Coca Cola Zero",
        price: "2,50$",
        description: "330ml Dose",
        image: "./public/assets/bebidas/coca_cola_zero.webp",
      },
      { name: "Fanta", price: "2,50$", description: "Lata 330ml", image: "./public/assets/bebidas/fanta.webp" },
      { name: "Sprite", price: "2,50$", description: "Lata 330ml", image: "./public/assets/bebidas/sprite.webp" },
      { name: "Capri Sonne", price: "1,50$", description: "200ml", image: "./public/assets/bebidas/capri_sun.png" },
      { name: "Agua", price: "2,00$", description: "500ml", image: "./public/assets/bebidas/agua.jpeg" },
      { name: "Mezzo Mix", price: "2,50$", description: "Lata 330ml", image: "./public/assets/bebidas/mezzo_mix.jpg" },
      { name: "Red Bull", price: "3,50$", description: "Lata 250ml", image: "./public/assets/bebidas/red_bull.webp" },
    ],
  },
}

function $(selector, root = document) {
  return root.querySelector(selector)
}

function $all(selector, root = document) {
  return Array.from(root.querySelectorAll(selector))
}

function initFooterYear() {
  const yearEl = document.querySelector("[data-year]")
  if (yearEl) yearEl.textContent = String(new Date().getFullYear())
}

function initMobileMenu() {
  const toggle = $("[data-menu-toggle]")
  const mobileNav = $("[data-mobile-nav]")
  if (!toggle || !mobileNav) return

  const closeLinks = $all("[data-close-menu]", mobileNav)

  const isOpen = () => toggle.getAttribute("aria-expanded") === "true"

  const setOpen = (open) => {
    toggle.classList.toggle("is-open", open)
    toggle.setAttribute("aria-expanded", open ? "true" : "false")
    mobileNav.hidden = !open
  }

  toggle.addEventListener("click", () => {
    setOpen(!isOpen())
  })

  closeLinks.forEach((link) => {
    link.addEventListener("click", () => setOpen(false))
  })

  // Fallback: close when clicking ANY link inside the mobile nav
  // (covers cases where data-close-menu is missing or markup changes)
  mobileNav.addEventListener("click", (e) => {
    const a = e.target?.closest?.("a")
    if (!a) return
    setOpen(false)
  })

  // Close when tapping/clicking outside the menu
  document.addEventListener("click", (e) => {
    if (!isOpen()) return
    const target = e.target
    if (toggle.contains(target)) return
    if (mobileNav.contains(target)) return
    setOpen(false)
  })

  // Close after hash navigation (e.g., #menu)
  window.addEventListener("hashchange", () => {
    if (isOpen()) setOpen(false)
  })

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false)
  })

  // Ensure mobile nav cannot remain open on desktop
  const BREAKPOINT = 900
  const handleResize = () => {
    if (window.innerWidth >= BREAKPOINT) {
      setOpen(false)
    }
  }
  window.addEventListener("resize", handleResize)
  handleResize()
}

function renderTabs(activeKey) {
  const tabsRoot = $("[data-menu-tabs]")
  if (!tabsRoot) return

  tabsRoot.innerHTML = ""

  Object.entries(MENU_DATA).forEach(([key, meta]) => {
    const btn = document.createElement("button")
    btn.type = "button"
    btn.className = "tab"
    btn.setAttribute("role", "tab")
    btn.setAttribute("aria-selected", key === activeKey ? "true" : "false")
    btn.dataset.key = key

    const icon = document.createElement("span")
    icon.className = "tab__icon"
    icon.textContent = meta.icon

    const label = document.createElement("span")
    label.textContent = meta.label

    btn.append(icon, label)

    btn.addEventListener("click", () => {
      setActiveCategory(key)
    })

    tabsRoot.appendChild(btn)
  })
}

function renderMenuItems(activeKey) {
  const grid = $("[data-menu-grid]")
  if (!grid) return

  const { items } = MENU_DATA[activeKey]
  grid.setAttribute("aria-busy", "true")
  grid.innerHTML = ""

  items.forEach((item) => {
    const article = document.createElement("article")
    article.className = "menu-item"

    const media = document.createElement("div")
    media.className = "menu-item__media"

    if (item.image) {
      const img = document.createElement("img")
      img.className = "menu-item__img"
      img.src = item.image
      img.alt = item.name
      img.loading = "lazy"
      media.appendChild(img)

      const price = document.createElement("div")
      price.className = "menu-item__price"
      price.textContent = item.price
      media.appendChild(price)

      const aura = document.createElement("img")
      aura.className = "menu-item__halal"
      aura.src = "./public/assets/burger_icon.webp"
      aura.alt = "100% aura"
      aura.loading = "lazy"
      media.appendChild(aura)
    } else {
      // show fallback image instead of placeholder text so cards keep consistent layout
      const img = document.createElement("img")
      img.className = "menu-item__img"
      img.src = "/assets/hamburguesa_menu.png"
      img.alt = item.name || "Imagen"
      img.loading = "lazy"
      img.dataset._fallbackApplied = "1"
      media.appendChild(img)

      const price = document.createElement("div")
      price.className = "menu-item__price"
      price.textContent = item.price
      media.appendChild(price)

      const aura = document.createElement("img")
      aura.className = "menu-item__halal"
      aura.src = "https://foodiewagon.de/graphics/aura%20logo.svg"
      aura.alt = "100% aura"
      aura.loading = "lazy"
      media.appendChild(aura)
    }

    const body = document.createElement("div")
    body.className = "menu-item__body"

    const name = document.createElement("h3")
    name.className = "menu-item__name"
    name.textContent = item.name

    const desc = document.createElement("p")
    desc.className = "menu-item__desc"
    desc.textContent = item.description

    body.append(name, desc)

    if (typeof item.spiceLevel === "number" && item.spiceLevel > 0) {
      const spice = document.createElement("div")
      spice.className = "menu-item__spice"

      for (let i = 0; i < 3; i += 1) {
        const flame = document.createElement("span")
        flame.className = "flame" + (i < item.spiceLevel ? " is-hot" : "")
        flame.textContent = "🔥"
        spice.appendChild(flame)
      }

      body.appendChild(spice)
    }

    article.append(media, body)
    grid.appendChild(article)
  })

  grid.setAttribute("aria-busy", "false")
}

let ACTIVE_CATEGORY = "beef"

function setActiveCategory(key) {
  ACTIVE_CATEGORY = key
  renderTabs(ACTIVE_CATEGORY)
  renderMenuItems(ACTIVE_CATEGORY)
}

function initStickyCTA() {
  const sticky = $("[data-sticky-cta]")
  if (!sticky) return

  const update = () => {
    const show = window.scrollY > 300
    sticky.classList.toggle("is-visible", show)
    sticky.setAttribute("aria-hidden", show ? "false" : "true")
  }

  window.addEventListener("scroll", update, { passive: true })
  update()
}

function initAnchorOffsets() {
  // Ensures fixed header doesn't cover anchored sections
  const header = $("[data-header]")
  if (!header) return

  const setOffset = () => {
    document.documentElement.style.scrollPaddingTop = `${header.offsetHeight + 12}px`
  }

  window.addEventListener("resize", setOffset)
  setOffset()
}

function init() {
  initFooterYear()
  initMobileMenu()
  initStickyCTA()
  initAnchorOffsets()

  setActiveCategory(ACTIVE_CATEGORY)
}

init()
